# Architecture

OSER is a rendering pipeline that keeps source text, document structure, presentation, diagnostics, and export adapters separate.

The current implementation is an early functional prototype. It can import TXT and Markdown, build an `OserDocument`, render semantic HTML, apply editorial or print CSS, run diagnostics, and produce experimental PDFs through Playwright and Chromium.

## Current Pipeline

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

The HTML renderer should not know about product UI, site deployment, or PDF automation.

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

## Data Flow

Source files should remain readable and versionable. OSER derives generated artifacts from those files:

```text
source file
  -> imported document
  -> diagnostics report
  -> HTML
  -> optional PDF
```

Generated files under `dist/` are derived artifacts.

## Boundaries

OSER core should stay separate from:

- WYSIWYG editing
- project-specific CMS behavior
- product UI
- hosting and deployment
- editorial policy
- site-specific styling requirements

Downstream projects can provide those layers while reusing OSER for document import, rendering, diagnostics, and export.

## OSER Core And Studio

OSER Core must not depend on OSER Studio.

A future `apps/studio/` directory may live in this repository as an optional reference app or development surface. That placement should not make Studio part of the core package graph. Core packages should remain usable from CLIs, scripts, CI jobs, TRURL, diegomadero.com, static publishing workflows, and other integrations without running Studio.

If a `packages/studio-server/` package exists, it should be an optional adapter for the Studio app. It should call Core APIs and write Studio outputs, but Core importers, renderers, diagnostics, profiles, and exporters should not import from it.

Studio can edit profiles, choose export settings, preview generated artifacts, and display diagnostics. It should not become the rendering engine or the source of truth for outputs.

## Future Architecture Work

Likely future layers include:

- GUI preview and inspection surface
- Paged.js preview adapter
- DOCX importer
- EPUB exporter
- richer asset pipeline
- web publishing adapters
- TRURL-specific integration package or adapter

These should build on the current contracts rather than bypassing them.
