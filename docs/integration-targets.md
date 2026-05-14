# Integration Targets

OSER is intended to serve as a shared rendering core for multiple publishing projects. Integrations should call into OSER rather than duplicating rendering behavior.

## TRURL

TRURL is expected to use OSER for structured editorial rendering. OSER should provide the document model, semantic HTML, and export-oriented rendering pieces that TRURL can compose into its own product workflow.

Likely needs:

- document rendering from repository-backed content
- preview and export flows
- stable HTML and CSS contracts
- clear separation between renderer and product UI

## diegomadero.com

diegomadero.com may use OSER for essays, articles, notes, and other web-published editorial material.

Likely needs:

- semantic HTML suitable for static site generation
- editorial CSS that can be customized for the site
- source-first content workflows
- compatibility with web publishing constraints

## editorial-ai-lab

editorial-ai-lab may use OSER as an experimental publishing renderer for structured documents and AI-assisted editorial workflows.

Likely needs:

- transparent document structure
- reproducible rendering from source files
- inspectable intermediate outputs
- enough separation for experiments without destabilizing OSER core

## Astro

An Astro integration is a likely target for web publishing.

Likely needs:

- render Markdown or document model input into Astro-compatible HTML
- allow project-level styling
- avoid coupling OSER core to Astro internals

## CLI

A CLI can provide local rendering and automation without requiring a full application.

Likely needs:

- render source documents to selected output formats
- expose predictable input/output paths
- support CI and repository workflows
- keep generated artifacts explicit

## Future Integrations

Future integrations should be evaluated against the same boundary: OSER owns document rendering; downstream tools own product workflow, UI, deployment, and project-specific policy.
