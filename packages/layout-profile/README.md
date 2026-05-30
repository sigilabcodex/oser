# `@oser/layout-profile`

Experimental declarative layout profile package for OSER.

A `LayoutProfile` is not raw CSS. It is a typed description of editorial layout intent that can be converted into CSS for preview and export workflows. The generated CSS is a derived artifact, similar to rendered HTML or PDF output.

Current scope:

- page size and margins
- body typography
- heading scale and spacing
- paragraph, list, blockquote, and scene break spacing
- figure and image defaults
- table defaults
- basic print behavior
- CLI for generating CSS from a profile JSON file
- shared helper for render commands that need generated profile CSS

## CLI

```bash
npm run profile:css -- examples/profiles/classic-book.json dist/examples/classic-book.css
```

That command builds the TypeScript package and writes generated CSS to the requested output path. When `render:html` or `render:pdf` uses `--profile`, generated CSS is written automatically under `dist/.tmp/layout-profiles/`.

## Programmatic API

```ts
import { layoutProfileToCss, writeLayoutProfileCss, type LayoutProfile } from "@oser/layout-profile";

const css = layoutProfileToCss(profile);
const result = await writeLayoutProfileCss({ profilePath: "examples/profiles/classic-book.json" });
```

In this repository, imports should currently use package source paths until public package publishing is formalized.

## Current Limits

`render:html` and `render:pdf` can consume a profile directly:

```bash
npm run render:html -- examples/editorial-sample.md dist/examples/editorial-sample-profile.html --profile examples/profiles/classic-book.json
npm run render:pdf -- examples/editorial-sample.md dist/examples/editorial-sample-profile.pdf --profile examples/profiles/classic-book.json
```

The direct `--profile` path keeps the renderer base stylesheet (`editorial.css` for HTML, `print.css` for PDF) and links generated profile CSS after it.

The package does not implement:

- OSER Studio GUI
- Paged.js
- master pages
- running headers or folios
- complex page furniture
- visual editing
- full schema validation
- replacement of `editorial.css` or `print.css`

Those features can build on this typed profile layer later.
