# OSER

Open Source Editorial Renderer.

OSER is an experimental editorial orchestration and validation platform for source-first publishing projects. Rendering remains an important capability, but it is one layer in a larger architecture that keeps source content, document and project structure, assets, diagnostics, layout settings, render manifests, and reproducibility evidence separate.

Current status: early functional prototype. OSER can import TXT and Markdown, produce an internal document model, render semantic HTML, apply editorial or print-oriented CSS, run basic document diagnostics, and generate experimental PDFs through Playwright and Chromium.

It is not an InDesign replacement, WYSIWYG editor, CMS, or visual page builder.

OSER should not be understood as a universal renderer implemented from scratch. The official direction is to provide a common editorial model, diagnostics layer, manifest system, semantic preview path, and future Studio/server contracts while delegating mature format conversion through explicit adapters where that is the better engineering choice.

## Current Pipeline

The current implemented pipeline remains valid:

```text
TXT / Markdown
  -> importers
  -> OserDocument
  -> diagnostics
  -> semantic HTML
  -> editorial.css / print.css or generated LayoutProfile CSS
  -> experimental PDF through Playwright / Chromium
```

The source document remains the primary artifact. Generated HTML, temporary HTML, and PDFs are derived artifacts and should be reproducible from the source plus renderer settings.

The intended architecture expands this into a project-level orchestration flow:

```text
editorial project tree
  -> project scanner and asset graph (planned)
  -> document/project contracts and manifests
  -> diagnostics and validation
  -> native semantic HTML preview
  -> native or external render adapters
  -> render, inspection, and reproducibility manifests
```

The next implementation phase is project understanding: project-model, project-scanner, and asset-graph work. These do not exist yet.

## Packages

The current repository contains these package boundaries:

- `@oser/document-model`: TypeScript contracts for the shared `OserDocument` representation.
- `@oser/importers`: TXT and Markdown importers that produce `OserDocument` values.
- `@oser/html-renderer`: semantic HTML renderer with optional stylesheet linking.
- `@oser/pdf-renderer`: experimental PDF export adapter using Playwright and Chromium.
- `@oser/diagnostics`: initial validation and diagnostics for imported documents.
- `@oser/layout-profile`: experimental typed layout profile objects and CSS generation for future Studio workflows.
- `@oser/render-manifest`: optional JSON manifests for successful render/export runs.

## Supported Inputs

Current CLI input support:

- `.txt`
- `.md`
- `.markdown`

DOCX, EPUB, Paged.js preview, advanced PDF layout, project scanning, asset graphs, external renderer adapters, visual inspection, and richer GUI workflows are planned or likely future work, but they do not exist yet.

Mature format conversion should be delegated through explicit adapters where appropriate:

- Pandoc for DOCX, EPUB, and citation-aware exports.
- Optional Quarto for scholarly or technical publishing workflows.
- Playwright/Paged.js for custom HTML-to-PDF workflows.
- Astro for web or microsite publication.

These adapters are architectural targets, not current package capabilities.

## Commands

Install dependencies first:

```bash
npm install
```

Build TypeScript:

```bash
npm run build
```

Import Markdown or TXT into the document model:

```bash
npm run import:markdown -- examples/example.md
npm run import:txt -- examples/example.txt
```

Render HTML:

```bash
npm run render:html -- examples/example.md dist/examples/example.html
npm run render:html -- examples/example.md dist/examples/plain.html --style none
npm run render:html -- examples/example.md dist/examples/example-print.html --style packages/html-renderer/styles/print.css
npm run render:html -- examples/editorial-sample.md dist/examples/editorial-sample-profile.html --profile examples/profiles/classic-book.json
npm run render:html -- examples/editorial-sample.md dist/examples/editorial.html --profile examples/profiles/classic-book.json --manifest dist/examples/editorial.manifest.json
```

Generate the HTML examples:

```bash
npm run render:examples
```

That writes reproducible generated files under:

```text
dist/examples/
```

Run diagnostics:

```bash
npm run validate -- examples/example.md
```

Generate CSS from an experimental layout profile:

```bash
npm run profile:css -- examples/profiles/classic-book.json dist/examples/classic-book.css
```

The generated CSS is also used automatically when `render:html` or `render:pdf` receives `--profile`. Generated profile CSS is written under `dist/.tmp/layout-profiles/` unless a command asks for an explicit output path.

Render commands can also write an optional successful-run manifest with `--manifest <path.json>`. The manifest records source, render settings, generated outputs, profile CSS, and diagnostics without changing the document model or making manifests mandatory.

Run the smoke test suite:

```bash
npm run test
```

The current test command builds the project, checks TXT and Markdown importers, renders HTML with different stylesheet options, validates a sample document, and verifies expected image, table, stylesheet, and manifest output.

## OSER Studio MVP

The optional Studio MVP lives in `apps/studio/` and consumes `packages/studio-server/`. It is a Vite + React + TypeScript reference app for inspecting the fixed Studio fixture, selecting a layout profile, validating, rendering HTML preview, and exporting PDF.

Run it with two terminals:

```bash
npm run studio:server
```

```bash
npm run studio
```

The frontend runs at `http://127.0.0.1:5173` and proxies Studio API/output requests to the local server on `http://127.0.0.1:4317`. Studio remains outside OSER Core; the flow is `apps/studio -> packages/studio-server -> OSER Core APIs`.

## Experimental PDF Export

OSER has an experimental PDF adapter:

```bash
npm run render:pdf -- examples/example.md dist/examples/example.pdf
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample.pdf --format Letter
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample.pdf --html-output dist/examples/editorial-sample-print.html
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample-profile.pdf --profile examples/profiles/classic-book.json
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial.pdf --profile examples/profiles/classic-book.json --manifest dist/examples/editorial-pdf.manifest.json
```

The PDF pipeline currently uses:

```text
Markdown / TXT
  -> OserDocument
  -> semantic HTML
  -> packages/html-renderer/styles/print.css
  -> optional generated LayoutProfile CSS
  -> Playwright / Chromium PDF
```

If Chromium is not installed for Playwright, run:

```bash
npx playwright install chromium
```

Current PDF limitations:

- no Paged.js integration
- no folios
- no running headers
- no advanced page furniture
- no generated table of contents
- no cross-reference system
- no advanced asset pipeline

## Scope

OSER is focused on editorial orchestration and validation: the portable document/project contracts beneath publishing outputs, the diagnostics and manifest layers around those outputs, and the native preview path used to inspect them.

OSER owns document and project contracts, project manifests, asset graphs, diagnostics, layout profiles, render and reproducibility manifests, semantic HTML previews, visual and figure validation, and Studio/server contracts. Some of these are implemented today; others are planned architecture.

Downstream projects and external tools can own product UI, site generation, automation, deployment, mature format conversion, and project-specific editorial policy.

See `docs/editorial-orchestration-architecture.md` for the official architectural direction.

## Repository Layout

```text
docs/
  architecture.md
  principles.md
  integration-targets.md
examples/
  README.md
packages/
  README.md
ROADMAP.md
```

Generated outputs are written to `dist/`, which is ignored by git.

## License

OSER is intended to be FLOSS-oriented. See `LICENSE` for the current repository license.
