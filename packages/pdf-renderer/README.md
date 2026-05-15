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
```

The default stylesheet is:

```text
packages/html-renderer/styles/print.css
```

Generated temporary HTML is written under:

```text
dist/.tmp/pdf-renderer/
```

If Chromium is not installed for Playwright, run:

```bash
npx playwright install chromium
```
