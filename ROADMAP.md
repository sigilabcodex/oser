# OSER Roadmap

This roadmap describes the current implementation state and likely next steps. It is not a release promise. OSER is an experimental editorial orchestration and validation platform with a working rendering prototype, not a finished desktop publishing system or universal renderer.

The official architectural direction is documented in `docs/editorial-orchestration-architecture.md`.

## Done

### Repository Foundation

- Initial project structure.
- TypeScript build pipeline.
- Basic documentation for architecture, principles, integration targets, packages, and examples.
- Reproducible generated outputs under `dist/`.

### Document Model

- `@oser/document-model` package.
- `OserDocument` version `0.1`.
- Metadata, block nodes, inline nodes, asset references, and source map hooks.
- Current block support includes headings, paragraphs, blockquotes, lists, code blocks, tables, figures, images, horizontal rules, and sections.

### TXT And Markdown Importers

- `@oser/importers` package.
- TXT importer for paragraphs and Markdown-style headings.
- Markdown importer built on `markdown-it`.
- Markdown support for headings, paragraphs, emphasis, strong, inline code, links, blockquotes, ordered and unordered lists, code blocks, horizontal rules, tables, and images.
- Import warnings for empty documents, BOM removal, ignored raw HTML, missing image alt text, empty image sources, missing link hrefs, and irregular table rows.

### Semantic HTML Renderer

- `@oser/html-renderer` package.
- Full HTML document output.
- Semantic rendering for the current document model nodes.
- HTML escaping for text and attributes.
- Deterministic indentation.
- Optional stylesheet linking.

### Editorial And Print CSS

- `packages/html-renderer/styles/editorial.css` for browser reading.
- `packages/html-renderer/styles/print.css` for experimental print/PDF workflows.
- Basic typography, spacing, table, figure, blockquote, code, and print behavior.

### Experimental PDF Export

- `@oser/pdf-renderer` package.
- CLI and reusable render API.
- Playwright / Chromium based PDF generation.
- Default `print.css` stylesheet.
- `Letter` and `A4` format option.
- Optional HTML output path for inspecting the intermediate print HTML.

### Diagnostics

- `@oser/diagnostics` package.
- CLI validation command.
- Initial document checks for title, empty headings and paragraphs, heading level jumps, image metadata, empty tables, table row consistency, missing link hrefs, and empty code blocks.

### Layout Profile

- `@oser/layout-profile` package.
- Experimental typed layout profile objects and CSS generation.
- Current profile CSS can be used by `render:html` and `render:pdf` without replacing existing CSS presets.

### Render Manifests

- `@oser/render-manifest` package.
- Optional JSON manifests for successful HTML and PDF render/export runs.
- Current manifests record source paths, render settings, generated outputs, profile CSS, and diagnostics.

### Studio MVP

- `packages/studio-server` optional local adapter.
- `apps/studio` Vite + React reference app.
- Current Studio flow can inspect a fixed source fixture, select a layout profile, validate, render HTML preview, and export PDF through existing OSER Core APIs.

### Commands And Examples

- `npm run build`
- `npm run import:markdown`
- `npm run import:txt`
- `npm run render:html`
- `npm run render:pdf`
- `npm run render:examples`
- `npm run render:examples:pdf`
- `npm run validate`
- `npm run test`
- Example source files in `examples/`.
- Generated examples in `dist/examples/`.

## In Progress

### Stabilizing The Current Pipeline

- Clarify package boundaries.
- Keep the document model independent from render and export concerns.
- Keep generated artifacts reproducible.
- Improve documentation so it matches the actual implementation.
- Preserve current TXT, Markdown, HTML, diagnostics, layout profile, manifest, Studio MVP, and experimental PDF capabilities.

### Reframing OSER As Orchestration Infrastructure

- Treat rendering as one capability layer rather than the entire architecture.
- Keep semantic HTML as OSER's native preview and inspection output.
- Define project understanding, manifests, validation, adapters, and Studio as separate layers.
- Avoid describing OSER as a universal renderer implemented from scratch.

## Next: Three-Phase Direction

### Phase 1: Project Understanding

Goal: OSER should understand an editorial repository before rendering it.

Planned work:

- project contracts;
- project manifests;
- project scanner;
- asset graph;
- project-level diagnostics;
- figure sidecar grouping;
- generated-output and stale-artifact checks;
- reproducibility metadata foundations.

This phase is the next implementation priority. It does not exist yet.

### Phase 2: Renderer Adapters

Goal: OSER should orchestrate mature renderers through explicit adapters instead of reimplementing every export format.

Planned adapter targets:

- Pandoc for DOCX, EPUB, and citation-aware exports.
- Optional Quarto for scholarly or technical publishing workflows.
- Playwright/Paged.js for custom HTML-to-PDF workflows.
- Astro for web or microsite publication.

Adapters should record renderer use, inputs, outputs, settings, warnings, diagnostics, and reproducibility details through manifests. These adapters do not exist yet.

### Phase 3: Studio And Visual Validation

Goal: Studio should become the GUI surface for project understanding, diagnostics, renderer orchestration, visual inspection, and publication readiness.

Planned work:

- project dashboard;
- asset graph browser;
- diagnostics by document, project, asset, figure, and render output;
- render target selection;
- render history;
- visual inspection reports;
- figure sidecar inspection;
- radical proportionality validation reports;
- publication readiness views.

The current Studio MVP remains valid, but these project-level and visual validation capabilities do not exist yet.

## Future Areas

### Advanced Editorial Structures

Future document and project contracts may need to represent:

- notes;
- citations;
- references;
- captions beyond the current minimal figure support;
- cross references;
- tables of contents;
- front matter and back matter;
- appendices;
- multi-volume projects;
- multilingual project variants.

### Visual And Figure Validation

Future validation should inspect generated and source visual assets where possible.

Possible capabilities:

- file inspection for SVG, PNG, JPEG, PDF, Markdown, CSV, and JSON;
- missing-image checks;
- SVG validity checks;
- unsafe SVG or HTML content warnings;
- rendered HTML/PDF visual smoke checks;
- figure sidecar validation;
- radical proportionality validation for declared quantitative figures.

### WebBook And Reading Exports

A future browser-based reading export may still be useful, but it should fit the orchestration architecture. It should not replace EPUB, Pandoc, Quarto, Astro, or the native semantic HTML preview layer.

### Package Publishing

- Decide whether and how packages should be published.
- Formalize public APIs before publishing.

## Not Currently Implemented

- Project model.
- Project scanner.
- Asset graph.
- Project manifests beyond current render manifests.
- Pandoc adapter.
- Quarto adapter.
- Astro adapter.
- Paged.js adapter.
- Visual inspection pipeline.
- Figure validation.
- Radical proportionality validation.
- DOCX importer.
- EPUB export.
- Advanced PDF layout.
- Full project-level GUI workflows.
- InDesign-style visual editing.
- Full editorial linting.
- Full asset pipeline.
