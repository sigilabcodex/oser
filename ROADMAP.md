# OSER Roadmap

This roadmap describes the current implementation state and likely next steps. It is not a release promise. OSER is an experimental publishing and rendering engine, not a finished desktop publishing system.

## Done

### Repository Foundation

- Initial project structure.
- TypeScript build pipeline.
- Basic documentation for architecture, principles, integration targets, packages, and examples.
- Reproducible generated outputs under `dist/`.

### Document Model

- `@oser/document-model` package.
- `OserDocument` version `0.1`.
- Metadata, block nodes, inline nodes, asset references, and source map hooks.
- Current block support includes headings, paragraphs, blockquotes, lists, code blocks, tables, figures, images, horizontal rules, and sections.

### TXT And Markdown Importers

- `@oser/importers` package.
- TXT importer for paragraphs and Markdown-style headings.
- Markdown importer built on `markdown-it`.
- Markdown support for headings, paragraphs, emphasis, strong, inline code, links, blockquotes, ordered and unordered lists, code blocks, horizontal rules, tables, and images.
- Import warnings for empty documents, BOM removal, ignored raw HTML, missing image alt text, empty image sources, missing link hrefs, and irregular table rows.

### Semantic HTML Renderer

- `@oser/html-renderer` package.
- Full HTML document output.
- Semantic rendering for the current document model nodes.
- HTML escaping for text and attributes.
- Deterministic indentation.
- Optional stylesheet linking.

### Editorial And Print CSS

- `packages/html-renderer/styles/editorial.css` for browser reading.
- `packages/html-renderer/styles/print.css` for experimental print/PDF workflows.
- Basic typography, spacing, table, figure, blockquote, code, and print behavior.

### Experimental PDF Export

- `@oser/pdf-renderer` package.
- CLI and reusable render API.
- Playwright / Chromium based PDF generation.
- Default `print.css` stylesheet.
- `Letter` and `A4` format option.
- Optional HTML output path for inspecting the intermediate print HTML.

### Diagnostics

- `@oser/diagnostics` package.
- CLI validation command.
- Initial document checks for title, empty headings and paragraphs, heading level jumps, image metadata, empty tables, table row consistency, missing link hrefs, and empty code blocks.

### Commands And Examples

- `npm run build`
- `npm run import:markdown`
- `npm run import:txt`
- `npm run render:html`
- `npm run render:pdf`
- `npm run render:examples`
- `npm run render:examples:pdf`
- `npm run validate`
- `npm run test`
- Example source files in `examples/`.
- Generated examples in `dist/examples/`.

## In Progress

### Stabilizing The Core Pipeline

- Clarify package boundaries.
- Keep the document model independent from render and export concerns.
- Keep generated artifacts reproducible.
- Improve documentation so it matches the actual implementation.

### HTML And CSS Contracts

- Continue making semantic HTML conventions stable and inspectable.
- Keep default CSS useful but overrideable by downstream projects.
- Treat print CSS as a foundation for later paged-media work, not as a complete book layout system.

### Diagnostics

- Expand diagnostics carefully without turning them into project-specific editorial policy.
- Keep diagnostics reusable from CLI, future GUI surfaces, integrations, and CI.

## Next

### OSER Studio Design Line

- Document a future Studio UX without implementing a GUI yet.
- Define Studio as a visual control surface for OSER Core, not as a replacement for the core packages.
- Keep the first Studio concept focused on structure inspection, diagnostics, paginated preview, checkpoints, variants, and export control.
- Avoid promising freeform WYSIWYG, pixel-perfect page layout, or a total InDesign/Scribus replacement.
- Treat TRURL as a possible first host or consumer while keeping Studio separable as a future app.

Phased Studio direction:

- Phase 0: UX documentation and conceptual architecture.
- Phase 1: local HTML/PDF preview surface around existing OSER commands.
- Phase 2: layout profile inspector and style preset selection.
- Phase 3: diagnostics UI for import, structure, layout, and export readiness.
- Phase 4: Git checkpoints and variants expressed in editorial language.
- Phase 5: export panel for PDF, EPUB, HTML, and generated artifact metadata.
- Phase 6: limited visual editing for supported declarative controls only.
- Phase 7: AI-assisted layout exploration with transparent diagnostics and user approval.

### GUI Preview Surface

- Add a lightweight inspection GUI or app surface around the existing pipeline.
- Initial GUI should likely load source files, show diagnostics, preview generated HTML, and trigger export commands.
- It should call OSER packages rather than duplicating rendering logic.
- It should not begin as a WYSIWYG editor.

### TRURL Integration

- Define the integration contract between TRURL and OSER.
- Support repository-backed editorial content, preview, diagnostics, and export workflows.
- Keep TRURL product behavior separate from OSER rendering behavior.

### DOCX Import Workflow

- Design a DOCX-to-`OserDocument` mapping before implementation.
- Start with headings, paragraphs, emphasis, strong, links, lists, tables, and images.
- Define asset extraction and warning behavior.
- Preserve conversion uncertainty through diagnostics or import warnings.

### Paged.js Preview

- Add a browser-based paginated preview path.
- Keep Paged.js preview separate from the basic HTML renderer and the current PDF adapter.
- Define explicit conventions for page breaks, running elements, and print-only layout features.

### Advanced PDF Work

- Build on semantic HTML, print CSS, and eventual Paged.js support.
- Add support for folios, running headers, front matter, generated contents, and more deterministic page behavior.
- Add visual or artifact-level regression fixtures before expanding PDF behavior too far.

## Future

### EPUB Export

- Generate EPUB from the same document model and semantic HTML layer.
- Define packaging, metadata, asset, and validation requirements.

### Astro And Web Publishing Integrations

- Provide integration points for static site workflows.
- Keep web publishing adapters separate from OSER core.

### Richer Asset Pipeline

- Track imported assets.
- Copy, resolve, and optionally fingerprint images or linked files.
- Keep asset manifests inspectable.

### Advanced Editorial Structures

- Notes.
- Citations.
- References.
- Captions beyond the current minimal figure support.
- Cross references.
- Tables of contents.
- Front matter and back matter.

### Package Publishing

- Decide whether and how packages should be published.
- Formalize public APIs before publishing.

## Not Currently Implemented

- GUI.
- DOCX importer.
- EPUB export.
- Paged.js preview.
- Advanced PDF layout.
- InDesign-style visual editing.
- Full editorial linting.
- Full asset pipeline.
