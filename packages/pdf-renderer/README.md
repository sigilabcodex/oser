# @oser/pdf-renderer

Experimental PDF export adapter for OSER.

This package composes the existing pipeline:

```text
Markdown / TXT
  -> OserDocument
  -> semantic HTML
  -> print.css
  -> PDF through Playwright / Chromium
```

It does not add Paged.js, folios, running headers, GUI behavior, or document-model-specific PDF concepts.

## CLI Usage

```bash
npm run render:pdf -- examples/example.md dist/examples/example.pdf
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample.pdf --format Letter
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample.pdf --html-output dist/examples/editorial-sample-print.html
```

The default stylesheet is:

```text
packages/html-renderer/styles/print.css
```

Generated temporary HTML is written under:

```text
dist/.tmp/pdf-renderer/
```

Use a custom print stylesheet with:

```bash
npm run render:pdf -- examples/example.md dist/examples/example.pdf --style packages/html-renderer/styles/print.css
```

If Chromium is not installed for Playwright, run:

```bash
npx playwright install chromium
```
