# @oser/diagnostics

Shared diagnostics and validation for OSER documents.

This package validates an already imported `OserDocument`. It is intentionally separate from importers and renderers so the same report can be used from the CLI, future GUI surfaces, TRURL integrations, CI checks, or export workflows.

## CLI Usage

```bash
npm run validate -- examples/example.md
```

The CLI imports `.md`, `.markdown`, or `.txt`, runs `validateOserDocument`, prints readable diagnostics, and exits with code `1` only when the report contains errors.

## Initial Scope

The first validation layer checks for missing document title, empty headings and paragraphs, suspicious heading jumps, missing image metadata, empty tables, inconsistent table rows, missing link hrefs, and empty code blocks.

This is not a complete editorial linting system yet.
