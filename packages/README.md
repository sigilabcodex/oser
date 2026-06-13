# Packages

This directory contains the current OSER package boundaries.

OSER's official direction is editorial orchestration and validation. The current packages remain valid: they provide the working single-document import, diagnostics, semantic HTML, layout profile, manifest, Studio, and experimental PDF capabilities. Future packages should add project understanding, asset graphs, renderer adapters, visual inspection, and figure validation without renaming or removing the existing packages by default.

## Current Packages

### `document-model`

Core TypeScript contracts for `OserDocument`.

Used by importers, renderers, diagnostics, export adapters, manifests, and future integrations.

### `importers`

Import pipeline contracts and initial source importers.

Current importers:

- TXT
- Markdown

Planned future formats may include DOCX, HTML, and RTF. For mature DOCX export, OSER should prefer a future Pandoc adapter instead of native DOCX generation from scratch.

### `html-renderer`

Semantic HTML renderer and CSS presets.

Current styles:

- `styles/editorial.css`
- `styles/print.css`

Semantic HTML is OSER's native preview and inspection output. It should remain useful even when production exports are delegated to external renderer adapters.

### `layout-profile`

Experimental typed layout profile objects and CSS generation.

It provides a first declarative layer for future Studio layout controls without replacing `editorial.css`, `print.css`, or the current renderers. Future adapter work may map layout profile settings into adapter-specific configuration where feasible.

### `render-manifest`

Optional JSON manifest helpers for successful render and export runs.

It records source paths, render settings, generated outputs, profile CSS, and diagnostics so future Studio, TRURL, and automation workflows can consume render results without scraping `dist/`.

Future work should expand the manifest family toward project manifests and reproducibility manifests.

### `pdf-renderer`

Experimental PDF export adapter.

It composes importers, the HTML renderer, `print.css`, and Playwright / Chromium. It does not currently provide Paged.js, running headers, folios, or advanced PDF layout features.

This package remains valid as a native experimental PDF path. Future Playwright/Paged.js work should be explicit about whether it extends this package or becomes a separate adapter boundary.

### `diagnostics`

Shared document validation and diagnostics.

Diagnostics are intentionally separate from importers and renderers so they can be reused by the CLI, future GUI surfaces, integrations, CI, project scanning, visual validation, and renderer adapters.

### `studio-server`

Optional local server adapter for the Studio MVP.

It should call OSER Core APIs and should not become a dependency of core packages.

## Future Package Areas

The next implementation phase should focus on project understanding:

- project model;
- project scanner;
- asset graph;
- project manifests;
- project-level diagnostics;
- figure sidecar grouping;
- reproducibility metadata.

Later package areas may include explicit renderer adapters:

- Pandoc adapter for DOCX, EPUB, and citation-aware exports;
- optional Quarto adapter for scholarly or technical publishing workflows;
- Playwright/Paged.js adapter for custom HTML-to-PDF workflows;
- Astro adapter for web or microsite publication.

Additional future areas:

- visual inspection;
- figure validation;
- radical proportionality validation;
- Studio-facing project APIs;
- richer asset pipeline;
- TRURL integration adapter.

Package names and public APIs should remain flexible until each implementation area stabilizes.
