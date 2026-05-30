# OSER Studio Architecture

OSER Studio is a proposed optional visual application around OSER Core. It should help users inspect source documents, select layout profiles, preview generated output, review diagnostics, and run exports.

Studio is not OSER Core. OSER Core must remain a lightweight, modular, reusable rendering engine that can be used from the CLI, scripts, server-side tools, static site pipelines, TRURL, diegomadero.com, and other projects without installing or running Studio.

## Core And Studio Separation

### OSER Core

OSER Core is the engine layer.

Current and near-term core responsibilities:

- document model contracts
- TXT and Markdown importers
- semantic HTML rendering
- diagnostics
- CSS presets such as `editorial.css` and `print.css`
- `LayoutProfile` schema and CSS generation
- experimental PDF export through Playwright
- CLI and programmatic APIs for import, render, validate, profile CSS, and export

Core should stay small and composable. It should not depend on React, Vite, browser UI state, Studio project screens, desktop shells, or product-specific workflows.

### OSER Studio

OSER Studio is an optional visual client.

Studio may provide:

- source/document panel
- HTML preview in an iframe
- LayoutProfile selector
- diagnostics panel
- Render HTML button
- Export PDF button
- generated outputs under `dist/studio/`

Studio calls OSER Core. It does not become the renderer, importer, diagnostic engine, PDF engine, or source of truth.

### Other Consumers

Studio is only one possible consumer of OSER Core.

Other projects should be able to use OSER Core directly:

- TRURL can call OSER packages for repository-backed manuscript preview and export.
- diegomadero.com can use OSER for static editorial rendering.
- automation scripts can run CLI commands without a GUI.
- CI pipelines can validate or render documents without Studio.
- future publishing adapters can integrate OSER without adopting Studio's UI model.

This means Core APIs and CLI commands must remain useful without Studio.

## Repository Placement Options

There are several valid futures for Studio. The architecture should not force one too early.

### A. Studio Inside The Monorepo As A Reference App

Possible shape:

```text
apps/studio/
packages/studio-server/
```

In this model, `apps/studio/` is a local reference app and development surface. It demonstrates how to compose OSER Core packages, but Core does not import from it.

If `packages/studio-server/` exists, it is an optional adapter for the Studio app. It can expose local HTTP endpoints around existing OSER APIs, but it must not become a required layer for CLI, renderers, importers, diagnostics, or downstream integrations.

### B. Studio As A Separate Repository

Studio could move to its own repository when it grows beyond a reference app.

This keeps OSER Core focused and lets Studio have its own release cadence, UI dependencies, design system, and product roadmap. In this model, Studio consumes OSER packages the same way TRURL or another app would.

### C. Studio As An Independent Product Or App

Studio could eventually become a standalone local app, hosted app, or desktop app that consumes published OSER packages.

This model is appropriate only after OSER Core APIs are stable enough to publish. Studio may then package a backend, local server, desktop shell, or hosted service around OSER, but the rendering engine remains in OSER Core packages.

## Recommended MVP Shape

For the first MVP, prefer a monorepo reference app because it reduces packaging friction while preserving boundaries.

Proposed structure:

```text
apps/
  studio/
    src/
      main.tsx
      App.tsx
      components/
        AppShell.tsx
        SourcePanel.tsx
        PreviewPanel.tsx
        ProfilePanel.tsx
        DiagnosticsPanel.tsx
        ExportPanel.tsx

packages/
  studio-server/
    src/
      index.ts
      routes.ts
      oserPipeline.ts

dist/
  studio/
    preview.html
    preview-profile.css
    export.pdf
    diagnostics.json
```

`packages/studio-server/` is not Core. It is a local adapter used by `apps/studio/` to call Core packages and write generated artifacts. If another project wants to call Core directly, it should not need this package.

## Proposed Stack

Initial stack:

- Vite
- React
- TypeScript
- local Node server
- iframe preview

The stack belongs to Studio only. Adding Vite or React for Studio must not make OSER Core a React or Vite framework. Core packages should remain usable from Node scripts, CLIs, tests, and downstream projects without Studio dependencies.

## MVP Workflow

The first Studio workflow should use known fixtures and generated outputs.

1. Load a known source fixture such as `examples/example.md` or `examples/editorial-sample.md`.
2. Show the source in a read-only source panel.
3. List known profiles from `examples/profiles/`.
4. Select a `LayoutProfile` such as `classic-book.json` or `report.json`.
5. Run validation through OSER diagnostics.
6. Render semantic HTML with the selected profile.
7. Write generated preview artifacts to `dist/studio/`.
8. Show the preview in an iframe.
9. Show diagnostics in a dedicated panel.
10. Export PDF through the existing PDF renderer.
11. Write PDF output to `dist/studio/export.pdf`.

The MVP should not require arbitrary filesystem access. It should use fixtures and known output paths until the app boundary is stable.

## Minimal Backend Endpoints

Possible local server endpoints:

```text
GET  /api/studio/document
GET  /api/studio/profiles
POST /api/studio/validate
POST /api/studio/render-html
POST /api/studio/export-pdf
GET  /preview/preview.html
GET  /outputs/export.pdf
```

The backend should call existing OSER APIs or CLI-equivalent functions. It should avoid duplicating importer, renderer, diagnostic, layout profile, or PDF behavior.

Example payload shape:

```ts
type StudioRenderRequest = {
  sourcePath: string;
  profilePath?: string;
};

type StudioRenderResponse = {
  previewUrl: string;
  htmlPath: string;
  generatedCssPath?: string;
  diagnostics: unknown[];
};
```

Exact types can be refined when implementation begins.

## Minimal Frontend Components

### AppShell

Owns the page layout, selected fixture, selected profile, loading state, and current artifact URLs.

### SourcePanel

Shows the current source fixture. In phase one this should be read-only.

### PreviewPanel

Shows generated HTML in an iframe. Refresh should be explicit after rendering and may use cache-busting query strings.

### ProfilePanel

Lists available `LayoutProfile` fixtures and shows basic metadata such as name, description, page size, and margins.

### DiagnosticsPanel

Shows diagnostics returned by the backend. It should be useful even before preview or export.

### ExportPanel

Contains actions such as Validate, Render HTML, and Export PDF. It should show generated output paths under `dist/studio/`.

## Principles

### Core First

Core package APIs and CLIs remain the primary contract. Studio is a client of those contracts.

### UI Optional

A user or downstream project must be able to import, validate, render, generate profile CSS, and export without Studio.

### No Hidden Coupling

Core packages should not import from `apps/studio/` or `packages/studio-server/`. Studio-specific state, routes, components, and project behavior stay outside Core.

### CLI And API Usable Without Studio

Every Studio action should correspond to a CLI or programmatic Core operation that can be run independently.

### Studio Does Not Become The Engine

Studio edits profiles, chooses export settings, previews generated HTML, displays diagnostics, and starts exports. It does not implement rendering logic itself.

### Outputs Remain Reproducible Without Studio

Generated HTML, CSS, diagnostics, and PDF artifacts should be reproducible from source files, profiles, and Core commands. Studio should make that pipeline visible, not create hidden state required to rebuild outputs.

## What Studio Is Not

Studio is not required to use OSER.

Studio is not a replacement for the CLI.

Studio is not the source of truth. Source files, profiles, and explicit settings remain canonical inputs.

Studio is not an InDesign clone in the first phase.

Studio is not a dependency for server-side editorial pipelines.

Studio is not a full WYSIWYG editor.

Studio is not a freeform filesystem browser in the MVP.

Studio is not a Git client in the MVP.

Studio is not a DOCX importer.

Studio is not a reason to make OSER Core a heavy monolithic app framework.

## Why This Separation Matters

Keeping Studio separate keeps OSER lightweight.

It makes OSER useful for developers who want a rendering engine, CLI, package API, or CI workflow without adopting a GUI.

It allows TRURL and other tools to integrate OSER Core directly while owning their own product surfaces.

It lets Studio evolve independently as a reference client, local app, or product without forcing UI decisions into Core.

It avoids premature product coupling. OSER can stabilize import, model, diagnostics, rendering, layout profiles, and export contracts before committing to a single app shape.

## Incremental Plan

### Phase 1: Static Demo With Known Fixture

- Use `examples/example.md` or `examples/editorial-sample.md`.
- Show source read-only.
- Show known profiles.
- Display an iframe preview generated from known output.
- Write outputs under `dist/studio/`.
- No free filesystem access.
- No source editing.
- No Git.

### Phase 2: Connect Render, Validate, And PDF

- Add local endpoints for validate, render HTML, and export PDF.
- Run OSER diagnostics and show results.
- Render HTML with selected `LayoutProfile`.
- Export PDF through the experimental PDF renderer.
- Keep all artifacts reproducible through Core commands.

### Phase 3: Edit LayoutProfile JSON And Refresh Preview

- Add a textual JSON editor for the selected profile.
- Write temporary edited profile data under `dist/studio/`.
- Validate profile shape enough to avoid silent failures.
- Regenerate profile CSS and refresh iframe preview.
- Treat this as a bridge toward future safe visual controls, not as arbitrary page editing.
