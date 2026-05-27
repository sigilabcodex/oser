# Integration Targets

OSER is intended to serve as a shared rendering core for publishing projects and tools. Integrations should call into OSER packages rather than duplicating import, render, validation, or export behavior.

Current reusable pieces:

- `@oser/document-model`
- `@oser/importers`
- `@oser/html-renderer`
- `@oser/pdf-renderer`
- `@oser/diagnostics`

## TRURL

TRURL is a primary target for structured editorial rendering workflows.

Likely needs:

- render repository-backed content from Markdown or future import formats
- run diagnostics before preview or export
- generate semantic HTML for preview and product workflows
- generate experimental PDF output when appropriate
- support project-specific styles without changing OSER core
- keep TRURL product UI separate from OSER rendering logic

Open questions:

- where TRURL-owned metadata maps into `OserDocument`
- how TRURL should store generated artifacts
- whether TRURL needs a dedicated OSER adapter package

## diegomadero.com

diegomadero.com may use OSER for essays, notes, articles, and other web-published editorial material.

Likely needs:

- semantic HTML suitable for static site generation
- source-first Markdown workflows
- customizable editorial CSS
- diagnostics usable during local builds or CI
- compatibility with existing web publishing constraints

OSER should not own the site's visual identity, routing, deployment, or CMS behavior.

## editorial-ai-lab

editorial-ai-lab may use OSER as an experimental renderer for structured documents and AI-assisted editorial workflows.

Likely needs:

- inspectable document model output
- reproducible rendering from source files
- diagnostics that can be shown to users or agents
- stable enough APIs for experiments without coupling experiments to renderer internals

OSER should provide transparent intermediate artifacts so experiments can inspect and compare results.

## Future GUI

A future GUI should be a consumer of OSER packages, not a replacement for them.

Likely first scope:

- load a source document
- show import warnings
- show `OserDocument` structure
- show diagnostics
- preview generated HTML
- trigger HTML or PDF export

The GUI should not start as a WYSIWYG editor or visual page builder. It should begin as an inspection, preview, and export surface for the existing pipeline.

## DOCX And Import Workflows

DOCX import is not implemented yet, but it is an important future workflow.

Likely needs:

- DOCX-to-`OserDocument` mapping
- explicit handling of headings, paragraphs, inline styles, links, lists, tables, and images
- asset extraction and manifest behavior
- import warnings for unsupported or lossy conversions
- diagnostics after import

DOCX should enter the same pipeline as TXT and Markdown once imported.

## Astro And Web Publishing

Astro or other static site integrations may use OSER's semantic HTML layer.

Likely needs:

- render Markdown or `OserDocument` input into HTML compatible with site build pipelines
- allow project-level styling and layout
- keep OSER independent from framework internals

## CLI And Automation

The current CLI already supports import, render, PDF export, diagnostics, examples, and smoke tests.

Likely future needs:

- stable command contracts
- explicit input/output path behavior
- machine-readable diagnostics option
- CI-friendly validation and export workflows
- clear handling of generated artifacts

## Future Integrations

Future integrations should follow the same boundary:

```text
OSER owns import, document structure, rendering, diagnostics, and export adapters.
Downstream projects own product workflow, UI, deployment, and project-specific policy.
```
