# OSER Studio UX

OSER Studio is a proposed optional visual control surface for OSER's declarative editorial engine.

It is not OSER Core, not a required dependency, and not the first implementation target for the core rendering pipeline. It should not begin as a freeform WYSIWYG layout tool. The first useful version should help editors and designers inspect structure, choose layout rules, preview generated output, review diagnostics, and export reproducible artifacts.

For the Core/Studio boundary and MVP architecture, see [OSER Studio Architecture](studio-architecture.md).

## Vision

OSER Studio should make OSER's pipeline visible and controllable:

```text
source content
  -> OserDocument
  -> diagnostics
  -> layout profile and style preset
  -> paginated preview
  -> export target
```

The interface should expose editorial decisions without hiding the source-first model. Content, structure, layout rules, diagnostics, and exports remain separate concepts.

The initial Studio experience should prioritize:

- previewing rendered HTML output in an iframe
- selecting a known source fixture for the MVP
- selecting a declarative `LayoutProfile`
- reviewing diagnostics before export
- rendering HTML into `dist/studio/`
- exporting PDF into `dist/studio/`
- inspecting document structure when that view exists

It should not promise to replace InDesign, Scribus, or other page layout tools. OSER Studio can become useful for structured, reproducible editorial production without attempting pixel-perfect manual page composition in its first stages.

## Product Shape

OSER Studio is best understood as a local or web GUI around OSER packages.

The GUI should call OSER Core APIs and CLI-compatible workflows rather than duplicating importer, renderer, diagnostic, or export logic. OSER Core remains the engine; Studio is a product surface around the engine.

Possible future packaging models:

- local web app served by a small backend
- desktop shell around a local OSER process
- hosted web GUI for projects that opt into server-side processing
- embedded workflow inside a downstream product such as TRURL

The first design work should remain implementation-neutral.

## Core And Studio Boundary

OSER Core should remain a lightweight, modular, reusable engine. Studio is an optional app or reference client that consumes Core packages.

This boundary means:

- Core does not depend on Studio.
- Studio does not turn OSER into a monolithic app framework.
- CLI and API workflows remain usable without Studio.
- TRURL, diegomadero.com, CI jobs, static site workflows, and other tools can consume OSER Core directly.
- Generated outputs remain reproducible from source files, profiles, and Core commands.

If `apps/studio/` exists inside the repository, it should be treated as an optional reference app or development surface. If `packages/studio-server/` exists, it should be treated as a Studio adapter, not as an OSER Core package required by importers, renderers, diagnostics, or exporters.

## Core Concepts

### Project

A workspace containing source files, layout configuration, style presets, assets, diagnostics, checkpoints, variants, and generated exports.

### Document

A source-level editorial document such as a Markdown manuscript, imported TXT file, future DOCX import, or repository-backed content bundle.

### OserDocument

The normalized structured document model produced by OSER importers.

Studio can inspect an `OserDocument`, show headings and blocks, map diagnostics to structure, and send it to renderers. Users do not need to edit raw model JSON in the first version.

### LayoutProfile

A named set of layout rules for a class of output.

Examples:

- trade paperback manuscript
- print proof
- editorial review PDF
- web reading preview
- longform article

A layout profile should describe page size, margins, page flow, running element strategy, section behavior, image handling, and export constraints at a declarative level.

### StylePreset

A reusable typography and visual styling preset.

Style presets should remain distinct from layout profiles. A layout profile may define page behavior, while a style preset defines typography, color, spacing, and related CSS-level choices.

### MasterPage

A reusable page pattern for repeated page furniture.

Future master pages may describe headers, footers, folios, title pages, chapter openers, and section-specific page treatments. In early Studio versions, master pages should be inspectable and selectable rather than freely drawn.

### ExportTarget

A concrete output request such as HTML, PDF, EPUB, or intermediate print HTML.

An export target combines document input, layout profile, style preset, export format, output path, and warnings or diagnostics relevant to export readiness.

### Diagnostic

A structured issue produced by OSER diagnostics, import warnings, layout validation, or export preparation.

Diagnostics should remain actionable, filterable, and mappable back to document structure or configuration when possible.

### Checkpoint

An editorial save point for review.

In Git-backed projects, a checkpoint maps to a commit. In non-Git projects, Studio may eventually emulate the same concept with local snapshots, but the primary design language should remain reviewable editorial states.

### Variant

A parallel version of a project or document for editorial exploration.

In Git-backed projects, a variant maps to a branch. Studio should describe variants in editorial language first, with Git details available when useful.

## Proposed Interface

### Structure Panel

Left panel for project and document structure:

- project files
- document list
- heading outline
- section hierarchy
- assets when asset support exists
- current source path

The panel should support selection and navigation before it supports structural editing.

### Central Preview

Primary workspace for rendered preview.

Early modes:

- semantic HTML preview
- print HTML preview
- paginated PDF preview when available

The preview should show generated output, not become a freeform canvas. Selection in the preview can later sync with document structure and inspector details.

### Inspector

Right panel for selected document, block, layout profile, style preset, master page, or export target.

Early inspector controls should be conservative:

- choose layout profile
- choose style preset
- view page size and margins
- inspect selected block metadata
- inspect source mapping
- view renderer warnings

### Diagnostics Panel

Dedicated surface for issues and warnings:

- severity filters
- source path or document section
- import warnings
- structural diagnostics
- layout/export readiness warnings

Diagnostics should be visible before export, not hidden in logs.

### Checkpoints And History

Panel for editorial timeline:

- checkpoints
- variant names
- compare changes
- restore or switch variant
- publication tags

This panel should translate Git concepts into editorial language while keeping the underlying mapping inspectable.

### Export Panel

Task-oriented export controls:

- target format
- layout profile
- style preset
- output destination
- pre-export diagnostics
- generated artifact paths

Export should feel like a reproducible build step, not a manual screen capture.

## MVP Flow

The first functional Studio MVP should be deliberately narrow:

1. Use known fixtures such as `examples/example.md` or `examples/editorial-sample.md`.
2. Show source content in a read-only panel.
3. Select a known `LayoutProfile` from `examples/profiles/`.
4. Validate through OSER diagnostics.
5. Render semantic HTML with the selected profile.
6. Show generated HTML in an iframe preview.
7. Show diagnostics in a dedicated panel.
8. Export PDF through the experimental PDF renderer.
9. Write generated artifacts under `dist/studio/`.

The MVP should not include unrestricted filesystem browsing, real Git workflows, DOCX import, or freeform visual editing.

## What Studio Is Not

Studio is not required to use OSER.

Studio is not a replacement for the CLI.

Studio is not the source of truth for documents or outputs.

Studio is not an InDesign clone in the first phase.

Studio is not a dependency for server-side editorial pipelines.

Studio is not the rendering engine; it calls OSER Core.

## First Version Limits

The first Studio version should avoid:

- freeform visual editing
- complex drag-and-drop layout
- unrestricted filesystem access
- real Git workflow control
- DOCX import
- Tauri or Electron packaging
- multi-user collaboration
- pixel-perfect page composition
- full replacement of InDesign or Scribus
- project-specific editorial policy baked into OSER Core

These limits are product constraints, not failures. They keep Studio aligned with OSER's source-first architecture.

## Relationship With TRURL

TRURL can be the first practical host or consumer for OSER Studio ideas.

The boundary should remain clear:

- TRURL focuses on writing, manuscript structure, repository-backed editorial content, and project-specific workflow.
- OSER Studio focuses on layout selection, preview, diagnostics, checkpoints, variants, and export control.
- OSER Core owns importers, document model, diagnostics, renderers, and export adapters.

Studio may begin as embedded screens or experiments inside TRURL, but it should be designed so it can later become a separate app.
