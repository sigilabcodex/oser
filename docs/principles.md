# Principles

OSER is early-stage software. These principles are meant to keep the project focused as implementation begins.

## Markdown First

Markdown or structured plain text should be the primary authoring format. Documents should be readable without a specialized editor.

## Repo First

Publishing workflows should work naturally in a repository: versioned files, reviewable changes, reproducible builds, and derived outputs that can be regenerated.

## Semantic HTML First

OSER should prefer semantic HTML as the central output layer before generating PDF, EPUB, or web-specific artifacts.

## No WYSIWYG Initially

The project should not begin by building a visual editor. Editing interfaces can exist later, but the first priority is a reliable renderer and document model.

## Outputs Are Derived Artifacts

PDF, EPUB, paginated HTML, and web output should be generated from source content and rendering rules. They should not become the canonical source of truth.

## Keep Rendering Separate From UI

Rendering should live in reusable packages and APIs. User interfaces, site integrations, and product-specific workflows should call into the renderer rather than containing renderer logic directly.

## Open Source / FLOSS Oriented

OSER should be designed as open source infrastructure for publishing workflows. Dependencies, licenses, and architecture choices should be evaluated with that orientation in mind.

## Progressive Enhancement

The system should be useful at simple levels first: structured Markdown to semantic HTML, then richer styling, preview, export, and integrations. Advanced features should build on stable lower layers.
