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

## CLI

```bash
npm run profile:css -- examples/profiles/classic-book.json dist/examples/classic-book.css
```

That command builds the TypeScript package and writes generated CSS to the requested output path.

## Programmatic API

```ts
import { layoutProfileToCss, type LayoutProfile } from "@oser/layout-profile";

const css = layoutProfileToCss(profile);
```

In this repository, imports should currently use package source paths until public package publishing is formalized.

## Current Limits

This package does not integrate with `render:html` or `render:pdf` yet. To test a generated profile manually, generate CSS and pass it to the existing renderer:

```bash
npm run profile:css -- examples/profiles/classic-book.json dist/examples/classic-book.css
npm run render:html -- examples/example.md dist/examples/profile-preview.html --style dist/examples/classic-book.css
```

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
