# Architecture

OSER is an editorial orchestration and validation platform. Rendering remains important, but it is one capability layer inside a broader architecture for document and project contracts, manifests, asset relationships, diagnostics, layout profiles, semantic previews, renderer adapters, and future visual validation.

The current implementation is an early functional prototype. It can import TXT and Markdown, build an `OserDocument`, render semantic HTML, apply editorial or print CSS, run diagnostics, and produce experimental PDFs through Playwright and Chromium.

The official long-term direction is documented in `docs/editorial-orchestration-architecture.md`.

## Current Implemented Pipeline

```text
TXT / Markdown
  -> @oser/importers
  -> @oser/document-model
  -> @oser/diagnostics
  -> @oser/html-renderer
  -> editorial.css / print.css
  -> @oser/pdf-renderer
  -> Playwright / Chromium PDF
```

Diagnostics are optional and can run after import. PDF export currently composes the existing importer, document model, HTML renderer, print stylesheet, and browser automation layers.

This pipeline remains valid. The architectural change is that rendering is no longer treated as the whole system.

## Intended Orchestration Flow

Future OSER should grow toward this project-level flow:

```text
editorial project tree
  -> project scanner and asset graph (planned)
  -> document/project contracts and manifests
  -> diagnostics and validation
  -> native semantic HTML preview
  -> native or external renderer adapters
  -> render, inspection, and reproducibility manifests
```

The project model, project scanner, asset graph, external renderer adapters, visual inspection, and figure validation layers are planned architecture. They are not implemented yet.

## Package Boundaries

### `@oser/document-model`

Defines the shared TypeScript representation used between importers, renderers, diagnostics, and future integrations.

Current scope:

- document metadata
- block nodes
- inline nodes
- minimal asset references
- source map hooks

The document model should not encode browser, PDF, GUI, or paged-media implementation details.

### `@oser/importers`

Converts external source formats into `OserDocument` values.

Current scope:

- shared import contracts
- TXT importer
- Markdown importer
- import warnings
- import manifests

Current source formats are `.txt`, `.md`, and `.markdown`. DOCX, HTML, and RTF are possible future import targets but are not implemented yet.

### `@oser/html-renderer`

Converts `OserDocument` values into semantic HTML.

Current scope:

- full HTML document output
- semantic block and inline rendering
- text and attribute escaping
- deterministic formatting
- optional stylesheet links

The HTML renderer is OSER-native and should remain the primary preview and inspection output. It should not know about product UI, site deployment, or external renderer internals.

### CSS Presets

Current CSS lives in `packages/html-renderer/styles/`.

- `editorial.css`: default browser reading stylesheet.
- `print.css`: experimental print-oriented stylesheet for PDF and future paged-media workflows.

CSS presets should remain overrideable by downstream projects.

### `@oser/pdf-renderer`

Composes the import, HTML, CSS, and browser automation layers into PDF output.

Current scope:

- Playwright / Chromium PDF export
- default print stylesheet
- `Letter` and `A4` page format option
- optional intermediate HTML output

This package is experimental. It does not currently provide Paged.js, running headers, folios, advanced page furniture, generated contents, or book-grade layout control.

### `@oser/diagnostics`

Validates imported `OserDocument` values and returns structured diagnostics.

Current scope:

- missing document title
- empty headings and paragraphs
- suspicious heading jumps
- image metadata checks
- empty tables
- inconsistent table rows
- missing link hrefs
- empty code blocks

Diagnostics are intentionally separate from importers and renderers so the same report can be used by the CLI, future GUI surfaces, integrations, CI, or export workflows.

### Future Project Understanding Packages

The next implementation phase should add project understanding without renaming or removing current packages.

Planned responsibilities:

- project contracts;
- project manifests;
- project scanning;
- asset graph generation;
- project-level diagnostics;
- figure sidecar grouping;
- reproducibility metadata.

Package names and APIs should be designed when implementation begins.

### Future External Renderer Adapters

Mature format conversion should be delegated through explicit adapters where appropriate.

Planned adapter targets:

- Pandoc for DOCX, EPUB, and citation-aware exports.
- Optional Quarto for scholarly or technical publishing workflows.
- Playwright/Paged.js for custom HTML-to-PDF workflows.
- Astro for web or microsite publication.

Adapters should not become hidden dependencies of OSER core. They should record their use through render and reproducibility manifests.

## Data Flow

Source files should remain readable and versionable. OSER derives generated artifacts from those files.

Current single-document flow:

```text
source file
  -> imported document
  -> diagnostics report
  -> HTML
  -> optional PDF
```

Future project flow:

```text
project source tree
  -> project manifest
  -> asset graph
  -> diagnostics and validation reports
  -> native previews and/or external adapter outputs
  -> render and reproducibility manifests
```

Generated files under `dist/` are derived artifacts.

## Boundaries

OSER core should stay separate from:

- WYSIWYG editing
- project-specific CMS behavior
- product UI
- hosting and deployment
- project-specific editorial policy
- site-specific styling requirements
- mature conversion engines such as Pandoc, Quarto, Astro, or Paged.js

Downstream projects and optional adapters can provide those layers while reusing OSER for document contracts, project understanding, diagnostics, manifests, native previews, validation, and export orchestration.

## OSER Core And Studio

OSER Core must not depend on OSER Studio.

`apps/studio/` may live in this repository as an optional reference app or development surface. That placement should not make Studio part of the core package graph. Core packages should remain usable from CLIs, scripts, CI jobs, TRURL, diegomadero.com, static publishing workflows, and other integrations without running Studio.

`packages/studio-server/` is an optional adapter for the Studio app. It should call Core APIs, request `RenderManifest` output for render/export operations, and write Studio outputs under `dist/studio/`. Core importers, renderers, diagnostics, profiles, manifests, and exporters should not import from it.

The MVP adapter contract is documented in `docs/studio-server-contract.md`.

Studio can edit profiles, choose export settings, preview generated artifacts, and display diagnostics. Future Studio work should expose project manifests, asset graphs, renderer adapters, visual inspection, and figure validation. It should not become the rendering engine or the source of truth for outputs.

## Future Architecture Work

Near-term future layers:

- project model;
- project scanner;
- asset graph;
- project manifests;
- project-level diagnostics.

Later layers:

- Pandoc adapter;
- optional Quarto adapter;
- Playwright/Paged.js adapter;
- Astro adapter;
- visual inspection;
- figure validation;
- Studio surfaces for project understanding and validation.

These should build on the current contracts rather than bypassing them.
