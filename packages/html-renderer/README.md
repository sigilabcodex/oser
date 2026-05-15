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

## CLI Usage

Render a source file to semantic HTML:

```bash
npm run render:html -- examples/example.md examples/example.html
npm run render:html -- examples/example.md examples/plain.html --style none
npm run render:html -- examples/example.md examples/custom.html --style path/to/custom.css
```

The CLI currently supports `.txt`, `.md`, and `.markdown` inputs through the importers package.

By default, generated HTML links to:

```text
packages/html-renderer/styles/editorial.css
```

Use `--style none` to emit semantic HTML without a stylesheet link. Use `--style <path.css>` to link a project stylesheet instead. Relative CSS paths are converted to an href relative to the output HTML file.

The stylesheet is intentionally modest: readable typography, sensible measure, vertical rhythm, basic code/list/blockquote rules, and print-friendly defaults.
