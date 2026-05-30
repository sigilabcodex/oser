# OSER

Open Source Editorial Renderer.

OSER is an experimental publishing and rendering engine for turning structured source text into durable editorial outputs. It keeps source content, document structure, presentation, validation, and export steps separate so rendered artifacts can be regenerated from versioned source files.

Current status: early functional prototype. OSER can import TXT and Markdown, produce an internal document model, render semantic HTML, apply editorial or print-oriented CSS, run basic document diagnostics, and generate experimental PDFs through Playwright and Chromium.

It is not an InDesign replacement, WYSIWYG editor, CMS, or visual page builder.

## Current Pipeline

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

## Packages

The current repository contains these package boundaries:

- `@oser/document-model`: TypeScript contracts for the shared `OserDocument` representation.
- `@oser/importers`: TXT and Markdown importers that produce `OserDocument` values.
- `@oser/html-renderer`: semantic HTML renderer with optional stylesheet linking.
- `@oser/pdf-renderer`: experimental PDF export adapter using Playwright and Chromium.
- `@oser/diagnostics`: initial validation and diagnostics for imported documents.
- `@oser/layout-profile`: experimental typed layout profile objects and CSS generation for future Studio workflows.

## Supported Inputs

Current CLI input support:

- `.txt`
- `.md`
- `.markdown`

DOCX, EPUB, Paged.js preview, advanced PDF layout, and GUI workflows are planned or likely future work, but they do not exist yet.

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

Run the smoke test suite:

```bash
npm run test
```

The current test command builds the project, checks TXT and Markdown importers, renders HTML with different stylesheet options, validates a sample document, and verifies expected image, table, and stylesheet output.

## Experimental PDF Export

OSER has an experimental PDF adapter:

```bash
npm run render:pdf -- examples/example.md dist/examples/example.pdf
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample.pdf --format Letter
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample.pdf --html-output dist/examples/editorial-sample-print.html
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample-profile.pdf --profile examples/profiles/classic-book.json
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

OSER is focused on the rendering pipeline and the portable document representation beneath publishing outputs.

It should provide reusable infrastructure for downstream projects such as TRURL, diegomadero.com, editorial-ai-lab, and future GUI or publishing workflows. Those projects can own product UI, site generation, automation, deployment, and editorial policy.

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
