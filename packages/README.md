# Packages

This directory contains the current OSER package boundaries.

## Current Packages

### `document-model`

Core TypeScript contracts for `OserDocument`.

Used by importers, renderers, diagnostics, export adapters, and future integrations.

### `importers`

Import pipeline contracts and initial source importers.

Current importers:

- TXT
- Markdown

Planned future formats include DOCX, HTML, and RTF.

### `html-renderer`

Semantic HTML renderer and CSS presets.

Current styles:

- `styles/editorial.css`
- `styles/print.css`

### `layout-profile`

Experimental typed layout profile objects and CSS generation.

It provides a first declarative layer for future Studio layout controls without replacing `editorial.css`, `print.css`, or the current renderers.

### `render-manifest`

Optional JSON manifest helpers for successful render and export runs.

It records source paths, render settings, generated outputs, profile CSS, and diagnostics so future Studio, TRURL, and automation workflows can consume render results without scraping `dist/`.

### `pdf-renderer`

Experimental PDF export adapter.

It composes importers, the HTML renderer, `print.css`, and Playwright / Chromium. It does not currently provide Paged.js, running headers, folios, or advanced PDF layout features.

### `diagnostics`

Shared document validation and diagnostics.

Diagnostics are intentionally separate from importers and renderers so they can be reused by the CLI, future GUI surfaces, integrations, and CI.

## Future Package Areas

Possible future package boundaries:

- Paged.js preview support
- DOCX importer
- EPUB export adapter
- richer asset pipeline
- TRURL integration adapter
- GUI-facing API helpers

Package names and public APIs should remain flexible until the implementation stabilizes.
