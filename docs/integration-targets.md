# Integration Targets

OSER is intended to serve as shared editorial orchestration and validation infrastructure for publishing projects and tools. Integrations should call into OSER packages rather than duplicating document contracts, project understanding, diagnostics, native previews, render manifests, validation, or export orchestration behavior.

Current reusable pieces:

- `@oser/document-model`
- `@oser/importers`
- `@oser/html-renderer`
- `@oser/pdf-renderer`
- `@oser/diagnostics`
- `@oser/layout-profile`
- `@oser/render-manifest`

Planned integration infrastructure:

- project model;
- project scanner;
- asset graph;
- project manifests;
- external renderer adapters;
- visual and figure validation;
- richer Studio/server contracts.

These planned pieces are not implemented yet.

## Integration Boundary

OSER should own:

- document and project contracts;
- project manifests;
- asset graphs;
- diagnostics;
- layout profiles;
- render and reproducibility manifests;
- semantic HTML previews;
- visual and figure validation reports;
- Studio/server contracts.

Downstream projects and external tools can own:

- product workflow;
- user-facing UI;
- routing;
- deployment;
- CMS behavior;
- project-specific editorial policy;
- mature format conversion where a dedicated tool is better suited.

## Renderer Adapter Targets

Mature format conversion should be delegated through explicit adapters when appropriate.

Planned targets:

- Pandoc for DOCX, EPUB, and citation-aware exports.
- Optional Quarto for scholarly or technical publishing workflows.
- Playwright/Paged.js for custom HTML-to-PDF workflows.
- Astro for web or microsite publication.

Adapters should be visible in manifests and should not become hidden dependencies of OSER core.

## TRURL

TRURL is a primary target for structured editorial workflows.

Likely needs:

- render repository-backed content from Markdown or future import formats;
- run diagnostics before preview or export;
- generate semantic HTML for preview and product workflows;
- generate experimental PDF output when appropriate;
- consume future project manifests and asset graphs;
- support project-specific styles without changing OSER core;
- keep TRURL product UI separate from OSER rendering and validation logic.

Open questions:

- where TRURL-owned metadata maps into `OserDocument` or future project contracts;
- how TRURL should store generated artifacts;
- whether TRURL needs a dedicated OSER adapter package.

## Cartografia-Style Editorial Projects

Large editorial projects with manuscripts, figures, sidecars, data, bibliography, appendices, notes, and logs are a strong fit for OSER's future orchestration layer.

Likely needs:

- project scanner;
- project manifest;
- asset graph;
- figure sidecar grouping;
- render and reproducibility manifests;
- radical proportionality validation for quantitative figures;
- Pandoc or Quarto adapters for citation-aware outputs;
- Astro adapter if web/microsite publication becomes central;
- Studio surface for diagnostics, render history, visual reports, and publication readiness.

These are architectural targets, not current implemented capabilities.

## diegomadero.com

diegomadero.com may use OSER for essays, notes, articles, and other web-published editorial material.

Likely needs:

- semantic HTML suitable for static site generation;
- source-first Markdown workflows;
- customizable editorial CSS;
- diagnostics usable during local builds or CI;
- compatibility with existing web publishing constraints;
- future project manifests or Astro adapter support if the site needs richer publication orchestration.

OSER should not own the site's visual identity, routing, deployment, or CMS behavior.

## editorial-ai-lab

editorial-ai-lab may use OSER as an experimental infrastructure layer for structured documents and AI-assisted editorial workflows.

Likely needs:

- inspectable document model output;
- reproducible rendering from source files;
- diagnostics that can be shown to users or agents;
- manifests that explain which sources, settings, tools, and outputs were involved;
- stable enough APIs for experiments without coupling experiments to renderer internals.

OSER should provide transparent intermediate artifacts so experiments can inspect and compare results.

## Future Studio GUI

Studio should be a consumer of OSER packages, not a replacement for them.

Current first scope:

- load a source document;
- show diagnostics;
- preview generated HTML;
- trigger PDF export through the current experimental pipeline;
- select layout profiles.

Future project-level scope:

- show project manifests;
- browse asset graphs;
- inspect figure sidecars;
- run renderer adapters;
- show visual inspection reports;
- show figure validation reports;
- show publication readiness.

The GUI should not start as a WYSIWYG editor or visual page builder. It should begin as an inspection, preview, validation, and export surface.

## DOCX And Import Workflows

DOCX import is not implemented yet. It remains a possible future workflow.

Likely needs:

- DOCX-to-`OserDocument` mapping;
- explicit handling of headings, paragraphs, inline styles, links, lists, tables, and images;
- asset extraction and manifest behavior;
- import warnings for unsupported or lossy conversions;
- diagnostics after import.

For DOCX export, OSER should prefer a future Pandoc adapter rather than implementing native DOCX generation from scratch.

## Astro And Web Publishing

Astro or other static site integrations may use OSER's semantic HTML, project manifests, asset graph, diagnostics, and future adapter outputs.

Likely needs:

- render Markdown or `OserDocument` input into HTML compatible with site build pipelines;
- consume project-level manifests or generated data files;
- allow project-level styling and layout;
- keep OSER independent from framework internals.

## CLI And Automation

The current CLI already supports import, render, PDF export, diagnostics, examples, and smoke tests.

Likely future needs:

- stable command contracts;
- explicit input/output path behavior;
- machine-readable diagnostics option;
- CI-friendly validation and export workflows;
- project manifest generation;
- asset graph generation;
- adapter availability checks;
- clear handling of generated artifacts.

## Future Integrations

Future integrations should follow this boundary:

```text
OSER owns document/project contracts, project understanding, diagnostics, manifests,
native previews, validation, and adapter orchestration.

Downstream projects own product workflow, UI, deployment, and project-specific policy.
External renderers own mature format conversion.
```
