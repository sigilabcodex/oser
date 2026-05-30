# @oser/html-renderer

Semantic HTML renderer for OSER documents.

This package converts `OserDocument` values into clean HTML. It does not handle PDF generation, paged rendering, or browser automation.

Current scope:

- full HTML document output
- semantic block rendering
- inline text, emphasis, and strong rendering
- HTML escaping for text and attributes
- deterministic indentation
- optional link to the basic editorial stylesheet
- optional generated `LayoutProfile` CSS through the CLI
- optional successful-render manifest JSON through `--manifest`

## CLI Usage

Render a source file to semantic HTML:

```bash
npm run render:html -- examples/example.md dist/examples/example.html
npm run render:html -- examples/example.md dist/examples/plain.html --style none
npm run render:html -- examples/example.md dist/examples/custom.html --style path/to/custom.css
npm run render:html -- examples/example.md dist/examples/example-print.html --style packages/html-renderer/styles/print.css
npm run render:html -- examples/editorial-sample.md dist/examples/editorial-sample-profile.html --profile examples/profiles/classic-book.json
npm run render:html -- examples/editorial-sample.md dist/examples/editorial.html --profile examples/profiles/classic-book.json --manifest dist/examples/editorial.manifest.json
```

The CLI currently supports `.txt`, `.md`, and `.markdown` inputs through the importers package.

Example sources live in `examples/`. Generated example outputs should go to `dist/examples/` because they are reproducible build artifacts and `dist/` is ignored by git.

By default, generated HTML links to:

```text
packages/html-renderer/styles/editorial.css
```

Use `--style none` to emit semantic HTML without a stylesheet link. Use `--style <path.css>` to link a project stylesheet instead. Relative CSS paths are converted to an href relative to the output HTML file.

Use `--profile <path.json>` to generate CSS from a `LayoutProfile` and link it after the default `editorial.css` base stylesheet. Generated profile CSS is written to `dist/.tmp/layout-profiles/<profile-name>.css`.

`--style` and `--profile` are mutually exclusive. Passing both fails with a clear error so a command does not silently mix two custom layout sources.

Use `--manifest <path.json>` to write a JSON manifest after a successful render. The manifest records source path, inferred input format, target, style/profile paths, generated CSS, HTML output, and diagnostics. If the render fails, no partial manifest is written.

## Stylesheets

`editorial.css` is the default browser reading stylesheet. It provides readable typography, a comfortable measure, vertical rhythm, and modest styles for editorial elements.

`print.css` is an experimental print stylesheet for future PDF/pagination workflows. It uses standard CSS print features such as `@page`, letter-sized pages, print margins, `break-*`, `widows`, and `orphans`. It does not add folios, running headers, Paged.js features, browser automation, or PDF generation.

For the experimental Playwright-based PDF adapter, see:

```bash
npm run render:pdf -- examples/example.md dist/examples/example.pdf
```
