# Examples

This directory contains small source documents and rendering fixtures.

Generated outputs should be treated as derived artifacts unless a specific fixture is needed for tests. To regenerate the current HTML examples, run:

```bash
npm run render:examples
```

That writes generated HTML to:

```text
dist/examples/
```

Examples should stay focused and should demonstrate one concept at a time, such as:

- basic article structure
- figures and captions
- notes and references
- print preview input
- EPUB-oriented document metadata
