# Examples

This directory contains small source documents and rendering fixtures.

Current source examples include TXT, Markdown, an editorial sample, and local image assets.

Generated outputs are derived artifacts and should be written to `dist/examples/`, which is ignored by git.

Generate the current HTML examples:

```bash
npm run render:examples
```

Generate the current PDF examples:

```bash
npm run render:examples:pdf
```

Generated files are written under:

```text
dist/examples/
```

Example documents should stay focused and should demonstrate one concept at a time, such as:

- basic article structure
- Markdown tables
- Markdown images
- figures and captions
- print stylesheet input
- diagnostics-friendly source structure

EPUB-oriented metadata, DOCX imports, Paged.js previews, and GUI workflows are future concerns, not current example coverage.
