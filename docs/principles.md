# Principles

OSER is early-stage software with a working rendering pipeline. These principles keep the project focused as it grows from prototype toward reusable editorial orchestration and validation infrastructure.

## Source First

Markdown, structured plain text, project data, figures, sidecars, and future imported formats should remain inspectable and versionable. Source files are the canonical inputs. HTML, temporary files, PDFs, DOCX, EPUB, static sites, inspection reports, and other outputs are derived artifacts.

## Editorial Orchestration First

OSER is not a universal renderer implemented from scratch. OSER should coordinate source files, document and project contracts, assets, diagnostics, layout profiles, renderer adapters, and manifests so publishing workflows remain reproducible and inspectable.

Rendering remains important, but it is one capability layer rather than the entire architecture.

## Document And Project Contracts First

OSER should preserve editorial structure in portable contracts before rendering to a specific output.

The current `OserDocument` contract describes single-document structure. Future project contracts should describe multi-file and multi-volume editorial projects, including manifests, assets, figures, bibliography files, appendices, notes, logs, and generated outputs.

These contracts should describe editorial meaning and relationships, not product UI, browser automation, or page geometry.

## Semantic HTML Preview First

Semantic HTML is OSER's native preview and inspection layer. It should remain meaningful, inspectable, and stable enough for downstream tools, diagnostics, Studio, and renderer adapters to consume.

Semantic HTML is not the only possible final output. DOCX, EPUB, scholarly PDF, and microsite publication can be delegated through explicit adapters where mature tools are better suited.

## Delegate Mature Format Conversion

OSER should not reimplement mature FLOSS conversion systems without a strong reason.

Planned delegated targets:

- Pandoc for DOCX, EPUB, and citation-aware exports.
- Optional Quarto for scholarly or technical publishing workflows.
- Playwright/Paged.js for custom HTML-to-PDF workflows.
- Astro for web or microsite publication.

Adapters should be explicit, optional where appropriate, and recorded in render or reproducibility manifests.

## Keep Rendering Separate From UI

Rendering and adapter orchestration belong in reusable packages and APIs. User interfaces, site integrations, product workflows, and deployment logic should call into OSER rather than embedding renderer logic.

OSER Studio should be an optional client of OSER Core. Core should not import Studio code, require Studio dependencies, or hide rendering behavior behind Studio-only state.

## Core First, UI Optional

The CLI and package APIs should remain usable without Studio.

Studio can make the pipeline easier to inspect and operate, but generated outputs must remain reproducible from source files, profiles, manifests, and Core or adapter commands. This keeps OSER useful for developers, automation, TRURL, diegomadero.com, and server-side editorial workflows.

## Project Understanding Before Complex Publishing

The next implementation phase should help OSER understand editorial repositories before expanding export ambition.

Priority future work:

```text
project-model + project-scanner + asset-graph
```

A project understanding layer should make missing assets, stale generated files, figure sidecars, data dependencies, and project-level diagnostics visible before any renderer is invoked.

## No WYSIWYG Initially

OSER should not begin as a visual editor. Studio can help inspect, preview, validate, render, and export documents, but the priority is reliable orchestration, validation, and reproducibility.

## Honest Experimental Scope

OSER is not an InDesign replacement. It is an experimental editorial orchestration and rendering platform.

Project scanning, asset graphs, Pandoc adapters, Quarto adapters, Astro adapters, Paged.js workflows, visual inspection, figure validation, and full project-level publishing are future work unless explicitly implemented.

## Outputs Are Reproducible Artifacts

Generated outputs should be rebuildable from source content, project data, renderer settings, profiles, and recorded toolchain metadata. This keeps repository workflows reviewable and reduces manual drift between source and output.

## Diagnostics Are Shared Infrastructure

Diagnostics should be reusable from the CLI, future GUI surfaces, CI, TRURL, renderer adapters, and other integrations.

They should report structural, project, asset, rendering, and reproducibility issues without becoming a project-specific editorial style guide by default.

Project-specific editorial rules can still be expressed as explicit validation policies. Radical proportionality for quantitative figures is one future example.

## Progressive Enhancement

OSER should remain useful at simple levels first:

```text
TXT / Markdown
  -> OserDocument
  -> semantic HTML
  -> diagnostics
  -> experimental PDF
```

Richer capabilities should build on stable lower layers rather than bypassing them:

```text
project tree
  -> project manifest and asset graph
  -> diagnostics and validation
  -> native preview or external adapter
  -> render and reproducibility manifests
```

## FLOSS-Oriented

OSER should be designed as open source infrastructure for publishing workflows. Dependencies, licenses, and architecture choices should be evaluated with that orientation in mind.
