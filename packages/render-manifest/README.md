# @oser/render-manifest

Optional render/export manifest helpers for OSER.

A `RenderManifest` describes a successful render run as JSON. It is a derived artifact for integrations and automation; it is not part of `OserDocument` and is not required for normal rendering.

Current scope:

- schema version and generation timestamp
- source path and inferred input format
- render target (`html` or `pdf`)
- style/profile paths used by the render
- generated profile CSS path when applicable
- generated output paths
- document diagnostics summary and basic items

## CLI Usage

Render commands write a manifest only when `--manifest <path.json>` is provided:

```bash
npm run render:html -- examples/editorial-sample.md dist/examples/editorial.html \
  --profile examples/profiles/classic-book.json \
  --manifest dist/examples/editorial.manifest.json

npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial.pdf \
  --profile examples/profiles/classic-book.json \
  --manifest dist/examples/editorial-pdf.manifest.json
```

If the render fails, this first version does not write a partial failure manifest.

## Programmatic API

```ts
import { createRenderManifest, writeRenderManifest } from "@oser/render-manifest";

const manifest = createRenderManifest({
  inputPath: "examples/example.md",
  target: "html",
  stylePath: "packages/html-renderer/styles/editorial.css",
  outputs: {
    htmlPath: "dist/examples/example.html",
    cssPaths: ["packages/html-renderer/styles/editorial.css"]
  },
  diagnostics: {
    summary: { info: 0, warnings: 0, errors: 0 },
    items: []
  }
});

await writeRenderManifest("dist/examples/example.manifest.json", manifest);
```

In this repository, imports should currently use package source paths until public package publishing is formalized.

## Integration Notes

Studio, TRURL, or other host applications can treat the manifest as a stable handoff file after a successful render. They can read it to locate the generated HTML/PDF/CSS, show diagnostics, display the selected profile, or decide whether a rendered artifact is current enough for downstream workflows.

This package does not implement Studio, GUI behavior, render orchestration, or failed-run manifests.
