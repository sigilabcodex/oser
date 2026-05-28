# OSER Studio Workflows

This document describes initial user workflows for a future OSER Studio GUI. It is design documentation only; it does not imply that a GUI has been implemented.

## Primary Workflow

The main Studio workflow should move from source content to reproducible export:

1. Create or open a project.
2. Import or write source content.
3. Review document structure.
4. Choose a layout profile.
5. Choose or adjust a style preset.
6. Review diagnostics.
7. Generate preview.
8. Create a checkpoint.
9. Export PDF, EPUB, or HTML.

The order can be flexible, but the interface should make the pipeline understandable. Users should know whether they are editing source, inspecting structure, configuring layout, previewing output, or exporting artifacts.

## Create Or Open Project

A project is the user's editorial workspace.

Opening a project should reveal:

- source documents
- current layout profile
- current style preset
- last diagnostics state
- recent checkpoints
- generated export targets

Creating a project should start with minimal required choices:

- project name
- source location
- default layout profile
- default style preset

The first version can assume local files. Repository awareness can be layered in through the Git-native workflow.

## Import Or Write Content

OSER Core currently supports TXT and Markdown import. Studio should treat import as a visible conversion step:

```text
source file -> OserDocument -> import warnings
```

The initial Studio design should support:

- opening Markdown or TXT files
- importing a source file into an `OserDocument`
- showing import warnings
- preserving source-first behavior

Studio should not initially become a full writing environment. If source editing is present, it should remain body/source editing, not freeform layout editing.

## Review Structure

After import, Studio should show document structure:

- title and metadata
- heading outline
- sections
- block types
- images, figures, and tables
- links and references when available

Structure review helps users understand what OSER will render. It also provides the anchor for diagnostics, preview selection, and future inspector behavior.

## Choose Layout Profile

The layout profile defines output structure and page behavior at a declarative level.

A user should be able to select a profile such as:

- editorial review
- print proof
- trade paperback
- web reading
- article

Changing layout profile should update preview and may trigger layout diagnostics. It should not mutate source content.

## Adjust Style Preset

Style presets define typography and visual treatment.

Initial controls should be limited and reversible:

- preset selection
- font scale or base size when supported
- spacing density when supported
- print or screen stylesheet choice

The first Studio version should not expose arbitrary CSS editing as the main path. Advanced stylesheet overrides can exist as project files outside the initial GUI.

## Review Diagnostics

Diagnostics should appear before export and remain accessible during preview.

Diagnostic sources may include:

- importer warnings
- document structure diagnostics
- layout profile validation
- missing asset checks
- export target readiness checks

Every diagnostic should answer:

- what is wrong or uncertain
- where it appears
- how severe it is
- whether export can continue

## Generate Preview

Preview should be generated from the current document, layout profile, and style preset.

Initial preview modes:

- semantic HTML preview
- print HTML preview
- PDF preview when PDF export is available

Preview is a generated artifact. It should not become the source of truth and should not silently alter source content.

## Create Checkpoint

A checkpoint records a reviewable editorial state.

In Git-backed projects, this maps to a commit. Studio should ask for editorial language:

- checkpoint title
- optional notes
- included files or generated artifacts if applicable

The user-facing goal is to make project state understandable without requiring Git vocabulary.

## Export

Export produces derived artifacts.

Export controls should include:

- export target format
- output location
- selected layout profile
- selected style preset
- diagnostics summary
- generated file paths

Export should be repeatable from source plus settings. Generated artifacts should be treated as outputs, not as manually edited master files.

## Supporting Workflows

### Compare Changes

Compare current work against a checkpoint or variant.

The UI should show editorial changes first:

- source text changes
- structure changes
- layout profile changes
- style preset changes
- export setting changes

Raw Git diff can be available for advanced users.

### Restore Or Switch Variant

Users should be able to restore a checkpoint or switch to a variant with clear warnings about unsaved work.

The language should be editorial:

- restore checkpoint
- switch variant
- incorporate changes

Git commands should remain implementation details unless the user asks to inspect them.

### Export Review Package

A future workflow may bundle:

- generated PDF
- semantic HTML
- diagnostics report
- source snapshot
- layout profile and style preset metadata

This should be designed as a reproducible review package, not a replacement for source control.

## Workflow Boundaries

Studio workflows should not initially include:

- drag-and-drop page layout
- unrestricted visual text editing
- collaborative real-time editing
- comments and approvals as a full review system
- full CMS functionality
- final publication hosting

Those may become downstream product concerns or later Studio phases.
