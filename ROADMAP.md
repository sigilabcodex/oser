# OSER Roadmap

This roadmap describes the intended sequence for the seed phase and early implementation work. It is not a release promise; it is a planning document for keeping scope clear.

## 1. Semantic Markdown Renderer

Define the first supported Markdown profile and the editorial structures OSER expects to recognize.

Expected work:

- choose the initial Markdown feature set
- define conventions for headings, sections, notes, figures, captions, citations, and metadata
- document unsupported syntax explicitly
- produce an initial semantic HTML proof of concept later, after the seed phase

## 2. Document Model

Introduce an internal document model that can represent editorial structure independently from any single output format.

Expected work:

- define document, section, block, inline, asset, and metadata concepts
- make the model serializable enough for tests and integrations
- keep rendering decisions separate from parsing concerns

## 3. Editorial HTML

Render the document model into semantic HTML that is usable for web, print, and ebook pipelines.

Expected work:

- define stable HTML conventions
- prefer meaningful elements and attributes over presentation-specific markup
- keep generated HTML inspectable and portable

## 4. Print CSS Presets

Create CSS presets for editorial and print-oriented layouts.

Expected work:

- define baseline typography, spacing, and page styles
- support common article, essay, book, and report needs
- keep presets overrideable by downstream projects

## 5. Paged.js Preview

Add a paginated HTML preview workflow for print-oriented documents.

Expected work:

- provide preview templates for paged rendering
- document browser-based preview expectations
- separate preview support from final export logic

## 6. Playwright PDF Export

Add a reproducible PDF export path using browser rendering.

Expected work:

- define export input and output contracts
- support deterministic export settings where possible
- keep generated PDFs as derived artifacts

## 7. EPUB Export

Add EPUB generation from the same document model and semantic HTML layer.

Expected work:

- define EPUB packaging requirements
- map metadata and assets into the EPUB structure
- validate generated EPUB output with standard tools when appropriate

## 8. Integrations: TRURL / Astro / CLI

Expose OSER through integration points that can be used by downstream projects.

Expected work:

- TRURL integration for editorial rendering workflows
- Astro integration for web publishing
- CLI entry points for local rendering and automation
- clear boundaries between OSER core and project-specific UI

## Current Phase

Seed repository: documentation, principles, architecture notes, and minimal directory structure. No renderer implementation or runtime dependencies are part of this phase.
