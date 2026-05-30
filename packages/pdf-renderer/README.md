# @oser/pdf-renderer

Experimental PDF export adapter for OSER.

This package composes the existing pipeline:

```text
Markdown / TXT
  -> OserDocument
  -> semantic HTML
  -> print.css
  -> optional generated LayoutProfile CSS
  -> PDF through Playwright / Chromium
```

It does not add Paged.js, folios, running headers, GUI behavior, or document-model-specific PDF concepts.

## CLI Usage

```bash
npm run render:pdf -- examples/example.md dist/examples/example.pdf
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample.pdf --format Letter
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample.pdf --html-output dist/examples/editorial-sample-print.html
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample-profile.pdf --profile examples/profiles/classic-book.json
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial.pdf --profile examples/profiles/classic-book.json --manifest dist/examples/editorial-pdf.manifest.json
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

Use a `LayoutProfile` with:

```bash
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample-profile.pdf --profile examples/profiles/classic-book.json
```

When `--profile` is used, the PDF renderer keeps `print.css` as the base stylesheet and links generated profile CSS after it in the temporary HTML. Generated profile CSS is written under `dist/.tmp/layout-profiles/`.

`--style` and `--profile` are mutually exclusive. Passing both fails instead of choosing a silent priority.

Use `--manifest <path.json>` to write a JSON manifest after a successful PDF render. The manifest records source path, inferred input format, target, format, style/profile paths, generated CSS, temporary HTML, PDF output, and diagnostics. If PDF generation fails, no partial manifest is written.

If Chromium is not installed for Playwright, run:

```bash
npx playwright install chromium
```
