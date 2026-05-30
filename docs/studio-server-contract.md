# OSER Studio Server Contract

This document defines the proposed MVP contract for `packages/studio-server` as an optional adapter between a future OSER Studio GUI and OSER Core.

It is a design contract only. It does not implement Studio, a GUI, or the server package.

## Purpose

`studio-server` is an optional adapter. It exists to translate a small local HTTP API into OSER Core operations for a future Studio UI.

OSER Core does not depend on Studio or `studio-server`. Core remains usable from CLI commands, scripts, tests, CI, TRURL, static publishing workflows, and other applications without starting a Studio server.

Studio and `studio-server` consume OSER Core. They should call existing Core APIs for import, diagnostics, profile CSS generation, HTML rendering, PDF export, and render manifests. They must not move rendering, importing, diagnostics, or export logic out of Core.

## Proposed Architecture

```text
packages/studio-server/
  src/index.ts
  src/routes.ts
  src/studioProject.ts
  src/oserPipeline.ts
  README.md
```

`packages/studio-server` is not a core package dependency. It is an optional integration layer that may be used by a future `apps/studio` or by local integration experiments.

No React, Vite, Tauri, Electron, or GUI framework is part of this contract.

## File Responsibilities

### `src/index.ts`

Starts the optional local Node server.

Responsibilities:

- read host/port configuration
- create the HTTP server
- attach route handling from `routes.ts`
- avoid importing UI code
- expose a small programmatic start function if useful

### `src/routes.ts`

Owns HTTP routing and request/response serialization.

Responsibilities:

- parse JSON request bodies
- route the MVP endpoints
- call `oserPipeline.ts`
- return JSON responses
- serve allowlisted preview/output files
- normalize errors into `StudioErrorResponse`
- reject unknown routes and methods

It should not implement import, render, profile, diagnostics, or PDF behavior itself.

### `src/studioProject.ts`

Defines the closed MVP project scope.

Responsibilities:

- define the fixed MVP source document
- define the profiles directory
- define output paths under `dist/studio/`
- map `profileId` to an allowlisted profile JSON path
- prevent arbitrary filesystem access
- provide URL mapping for generated preview/output files

For the first MVP, this module should be intentionally small and fixture-oriented.

### `src/oserPipeline.ts`

Composes OSER Core APIs for Studio operations.

Responsibilities:

- import the fixed source document
- run diagnostics
- render HTML through OSER Core
- export PDF through OSER Core
- request `RenderManifest` generation
- read `manifest.json` after successful renders
- shape pipeline results for `routes.ts`

This module is an adapter. It should not fork or duplicate renderer behavior.

### `README.md`

Documents how to run the optional server when it exists.

Responsibilities:

- explain that the server is optional
- list endpoints and payloads
- document fixed MVP paths
- document security limits
- document known limitations
- show example curl commands

## MVP Endpoints

```text
GET  /api/studio/document
GET  /api/studio/profiles
POST /api/studio/render-html
POST /api/studio/export-pdf
POST /api/studio/validate
GET  /preview/:file
GET  /outputs/:file
```

### `GET /api/studio/document`

Returns metadata for the fixed MVP document.

### `GET /api/studio/profiles`

Returns allowlisted profiles from `examples/profiles/*.json`.

### `POST /api/studio/render-html`

Renders the fixed MVP document to HTML under `dist/studio/`, writes `manifest.json`, reads the manifest, and returns paths, URLs, and diagnostics to the GUI.

### `POST /api/studio/export-pdf`

Exports the fixed MVP document to PDF under `dist/studio/`, writes `manifest.json`, reads the manifest, and returns paths, URLs, and diagnostics to the GUI.

### `POST /api/studio/validate`

Runs OSER diagnostics for the fixed MVP document and writes `dist/studio/diagnostics.json`.

### `GET /preview/:file`

Serves allowlisted preview files from `dist/studio/`.

The MVP should allow only known preview files such as `preview.html` and `preview.css`. It must reject path traversal and arbitrary file reads.

### `GET /outputs/:file`

Serves allowlisted output files from `dist/studio/`.

The MVP should allow only known output files such as `export.pdf`, `manifest.json`, and `diagnostics.json`. It must reject path traversal and arbitrary file reads.

## Request And Response Types

These types describe the minimum contract between a future Studio UI and `studio-server`.

```ts
export type StudioDocument = {
  id: string;
  title: string;
  inputPath: string;
  inputFormat: "markdown" | "txt" | "unknown";
  diagnostics?: {
    summary: RenderManifestDiagnosticsSummary;
  };
};

export type StudioProfile = {
  id: string;
  name: string;
  path: string;
  description?: string;
};

export type RenderHtmlRequest = {
  profileId?: string;
  style?: "editorial" | "none";
};

export type RenderHtmlResponse = {
  htmlPath: string;
  previewUrl: string;
  manifestPath: string;
  manifestUrl: string;
  cssPaths: string[];
  diagnostics: {
    summary: RenderManifestDiagnosticsSummary;
    items: RenderManifestDiagnosticItem[];
  };
};

export type ExportPdfRequest = {
  profileId?: string;
  format?: "Letter" | "A4";
};

export type ExportPdfResponse = {
  pdfPath: string;
  pdfUrl: string;
  htmlPath: string;
  manifestPath: string;
  manifestUrl: string;
  cssPaths: string[];
  diagnostics: {
    summary: RenderManifestDiagnosticsSummary;
    items: RenderManifestDiagnosticItem[];
  };
};

export type ValidateResponse = {
  diagnosticsPath: string;
  diagnosticsUrl: string;
  diagnostics: {
    summary: RenderManifestDiagnosticsSummary;
    items: RenderManifestDiagnosticItem[];
  };
};

export type StudioErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};
```

`RenderManifestDiagnosticsSummary` and `RenderManifestDiagnosticItem` should come from `@oser/render-manifest` or matching source imports until package publishing is formalized.

## Expected Outputs

The MVP uses fixed output paths:

```text
dist/studio/
  preview.html
  preview.css
  export.pdf
  manifest.json
  diagnostics.json
```

`manifest.json` represents the most recent successful render or export operation. The MVP may overwrite it. If concurrent operations become relevant, later versions should split it into operation-specific manifests such as `preview.manifest.json` and `export.manifest.json`.

## RenderManifest Usage

`studio-server` must not guess generated outputs.

For render and export operations, `oserPipeline.ts` should request a manifest from OSER Core by passing the equivalent of:

```text
--manifest dist/studio/manifest.json
```

After a successful operation, `studio-server` should read `dist/studio/manifest.json` and derive its HTTP response from the manifest:

- HTML path from `manifest.outputs.htmlPath`
- PDF path from `manifest.outputs.pdfPath`
- CSS paths from `manifest.outputs.cssPaths`
- selected profile from `manifest.render.profilePath`
- selected style from `manifest.render.stylePath`
- generated profile CSS from `manifest.render.generatedCssPath`
- format from `manifest.render.format`
- diagnostics from `manifest.diagnostics`
- timestamp from `manifest.generatedAt`

This keeps Studio from hardcoding assumptions about where CSS, temporary HTML, PDF files, or diagnostics were written.

## Closed MVP Scope

The first MVP is deliberately constrained:

- fixed document: `examples/editorial-sample.md`
- profiles: `examples/profiles/*.json`
- outputs: `dist/studio/`
- no free filesystem browsing
- no arbitrary source file selection
- no real Git integration
- no content editing
- no DOCX
- no GUI yet
- no React/Vite/Tauri/Electron requirement
- no WebBook integration

The goal is to validate the adapter contract before expanding product scope.

## Risks

### Route Security

`GET /preview/:file` and `GET /outputs/:file` must reject path traversal and must serve only allowlisted files from `dist/studio/`.

### Relative Paths

Core manifests currently use simple paths. The server must decide how to map those paths to local URLs without rewriting Core semantics.

### Assets

Rendered HTML may reference images or CSS outside `dist/studio/`. The MVP should either use fixture-safe assets or document which paths are served.

### Playwright And Chromium

PDF export depends on Playwright and Chromium. The server should treat PDF export as potentially slow and failure-prone.

### Concurrency

Fixed output names can collide if multiple requests run at the same time. The MVP can serialize operations or document single-user assumptions.

### Cleanup

`dist/studio/` may accumulate derived artifacts. Cleanup policy should be explicit before wider usage.

### CORS And Local Server Behavior

A future GUI may run on a separate dev server. CORS should stay local and restrictive by default.

### Core/Studio Separation

The server must not become required by Core. Core packages must not import from `packages/studio-server`.

## Incremental Plan

### Phase 1: Documented Contract

- keep this document as the source of truth
- do not create `packages/studio-server` yet unless implementation begins
- confirm endpoint shapes with the future Studio UI needs
- confirm output path conventions

### Phase 2: Minimal Node Server With Fixtures

- create `packages/studio-server`
- use Node built-in HTTP APIs unless a framework becomes necessary
- implement fixed project configuration in `studioProject.ts`
- implement `GET /api/studio/document`
- implement `GET /api/studio/profiles`
- implement allowlisted static serving for `dist/studio/`

### Phase 3: Connect Render HTML And Validate

- implement `POST /api/studio/validate`
- implement `POST /api/studio/render-html`
- write `dist/studio/diagnostics.json`
- write `dist/studio/preview.html`
- write and read `dist/studio/manifest.json`
- derive responses from `RenderManifest`

### Phase 4: Connect Export PDF

- implement `POST /api/studio/export-pdf`
- call the existing PDF pipeline
- write `dist/studio/export.pdf`
- write and read `dist/studio/manifest.json`
- document Playwright/Chromium prerequisites

### Phase 5: First React App Consuming Endpoints

- create a separate optional app only after the server contract is validated
- call `studio-server` endpoints from the UI
- render `previewUrl` in an iframe
- show diagnostics from responses
- trigger PDF export through the server

## Relationship To OSER Studio

OSER Studio UI calls `studio-server`.

`studio-server` calls OSER Core.

OSER Core remains usable by CLI and API without Studio.

```text
Future Studio UI
  -> studio-server HTTP contract
  -> OSER Core packages
  -> generated artifacts and RenderManifest
  -> studio-server response
  -> Future Studio UI
```

This keeps Studio as a client and adapter layer rather than a rendering engine.
