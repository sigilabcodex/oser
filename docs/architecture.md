# Architecture

OSER is planned as a rendering pipeline that keeps source text, document structure, presentation, and exports separate.

## Conceptual Pipeline

```text
Markdown / structured text
  -> parser
  -> document model
  -> semantic HTML
  -> editorial CSS
  -> paged HTML / EPUB / PDF / Web
```

Each stage should have a clear contract. The parser should not need to know about PDF export details, and UI integrations should not need to duplicate rendering logic.

## Main Layers

### Source Input

The primary input is Markdown or Markdown-like structured text with explicit editorial conventions. Source files should remain readable, versionable, and reviewable in a normal repository workflow.

### Document Model

The document model is the intermediate representation between source text and output formats. It should describe editorial meaning: document metadata, sections, headings, paragraphs, figures, captions, notes, references, and other structural elements.

The model should avoid encoding output-specific layout decisions too early.

### Semantic HTML

HTML output should use meaningful elements and stable attributes. It should be suitable for web rendering, paged rendering, EPUB packaging, and downstream styling.

### Editorial CSS

CSS presets should handle typography, spacing, paged-media behavior, and common editorial patterns. Presets should be overrideable by projects that need their own visual system.

### Export Adapters

Export adapters should derive final artifacts from the semantic HTML and editorial CSS layers.

Potential adapters include:

- paged HTML preview
- PDF export through browser rendering
- EPUB packaging
- web output for static site workflows

## Boundaries

OSER core should stay separate from:

- WYSIWYG editing
- project-specific CMS behavior
- product UI
- hosting and deployment
- content authoring policy

Downstream projects can provide those layers while reusing OSER for rendering.
