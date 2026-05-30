# Principles

OSER is early-stage software with a working rendering pipeline. These principles keep the project focused as it grows from prototype toward reusable publishing infrastructure.

## Source First

Markdown, structured plain text, and future imported formats should remain inspectable and versionable. Source files are the canonical inputs. HTML, temporary files, PDFs, and other outputs are derived artifacts.

## Document Model First

OSER should preserve editorial structure in a portable `OserDocument` before rendering to a specific output.

The model should describe document meaning, not product UI, browser automation, or page geometry.

## Semantic HTML First

Semantic HTML is the central output layer before PDF, EPUB, paged preview, or web-specific integrations.

HTML should be meaningful, inspectable, and stable enough for downstream tools to style or transform.

## Keep Rendering Separate From UI

Rendering belongs in reusable packages and APIs. User interfaces, site integrations, product workflows, and deployment logic should call into OSER rather than embedding renderer logic.

OSER Studio, if implemented, should be an optional client of OSER Core. Core should not import Studio code, require Studio dependencies, or hide rendering behavior behind Studio-only state.

## Core First, UI Optional

The CLI and package APIs should remain usable without Studio.

Studio can make the pipeline easier to inspect and operate, but generated outputs must remain reproducible from source files, profiles, and Core commands. This keeps OSER useful for developers, automation, TRURL, diegomadero.com, and server-side editorial workflows.

## No WYSIWYG Initially

OSER should not begin as a visual editor. A future GUI can help inspect, preview, validate, and export documents, but the first priority is a reliable import/render/export pipeline.

## Honest Experimental Scope

OSER is not an InDesign replacement. It is an experimental publishing and rendering engine.

Advanced PDF layout, Paged.js preview, GUI workflows, EPUB export, DOCX import, and full asset management are future work unless explicitly implemented.

## Outputs Are Reproducible Artifacts

Generated outputs should be rebuildable from source content and renderer settings. This keeps repository workflows reviewable and reduces manual drift between source and output.

## Diagnostics Are Shared Infrastructure

Diagnostics should be reusable from the CLI, future GUI surfaces, CI, TRURL, and other integrations.

They should report structural and rendering-relevant issues without becoming a project-specific editorial style guide by default.

## Progressive Enhancement

OSER should remain useful at simple levels first:

```text
TXT / Markdown
  -> OserDocument
  -> semantic HTML
  -> diagnostics
  -> experimental PDF
```

Richer capabilities should build on stable lower layers rather than bypassing them.

## FLOSS-Oriented

OSER should be designed as open source infrastructure for publishing workflows. Dependencies, licenses, and architecture choices should be evaluated with that orientation in mind.
