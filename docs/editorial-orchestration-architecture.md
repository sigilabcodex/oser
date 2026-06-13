# Editorial Orchestration Architecture

Date: 2026-06-13

## Summary

OSER is an editorial orchestration and validation platform for source-first publishing projects. Rendering remains important, but it is one capability layer inside a broader architecture for understanding projects, tracking assets, validating editorial structure, producing manifests, and coordinating native or external rendering engines.

OSER should not be treated as a universal renderer implemented from scratch. It should preserve a common editorial model, diagnostics layer, manifest system, semantic HTML preview path, and Studio/server contracts while delegating mature format conversion through explicit adapters when existing FLOSS tools are better suited.

## Architectural Position

Current OSER capabilities remain valid:

```text
TXT / Markdown
  -> importers
  -> OserDocument
  -> diagnostics
  -> semantic HTML
  -> editorial.css / print.css or generated LayoutProfile CSS
  -> experimental PDF through Playwright / Chromium
```

The official direction expands the system from a single-document render pipeline into a project-level orchestration platform:

```text
editorial project tree
  -> project scanner and asset graph (planned)
  -> document/project contracts and manifests
  -> diagnostics and validation
  -> native semantic HTML preview
  -> native or external renderer adapters
  -> render, inspection, and reproducibility manifests
```

The project scanner, project model, asset graph, external renderer adapters, visual inspection, and figure validation layers are planned architecture. They are not implemented yet unless a future change explicitly adds them.

## OSER Owns

OSER should own these contracts and orchestration layers:

- document contracts;
- project contracts;
- project manifests;
- asset graphs;
- diagnostics;
- layout profiles;
- render manifests;
- reproducibility manifests;
- semantic HTML previews;
- visual validation reports;
- figure validation reports;
- Studio/server contracts.

Some of these are already partially implemented, such as `OserDocument`, diagnostics, layout profiles, semantic HTML, PDF export, and render manifests. Others are the next architectural direction.

## Native Capabilities

Native OSER capabilities should focus on inspectable editorial infrastructure:

- TXT and Markdown import into `OserDocument`;
- semantic HTML preview and inspection output;
- basic print-oriented CSS;
- experimental Playwright/Chromium PDF export for prototypes and smoke tests;
- document diagnostics;
- layout profile CSS generation;
- render manifests.

Native renderers should remain useful, deterministic, and inspectable. They do not need to cover every production export format.

## Delegated Capabilities

Mature format conversion should be delegated through explicit adapters instead of reimplemented inside OSER core.

Planned adapter targets:

- Pandoc for DOCX, EPUB, and citation-aware exports.
- Optional Quarto for scholarly or technical publishing workflows.
- Playwright/Paged.js for custom HTML-to-PDF workflows.
- Astro for web or microsite publication.

Adapters should be visible parts of the pipeline. A render manifest should record which adapter was used, which inputs and settings were used, which outputs were produced, and what warnings or diagnostics were returned.

## Project Understanding Layer

The next implementation phase is project understanding:

```text
project-model + project-scanner + asset-graph
```

This phase should allow OSER to inspect an editorial repository and report what exists before rendering anything.

A future scanner should discover, at minimum:

- Markdown documents;
- source documents;
- SVG, PNG, JPEG, and PDF assets;
- CSV, JSON, YAML, and other data files;
- bibliography files;
- figure notes and sidecars;
- appendices, notes, logs, and generated outputs.

A future asset graph should connect source files, referenced assets, figure sidecars, generated outputs, and manifests. It should support stale-output checks, missing-reference checks, and reproducibility evidence.

## Figure Sidecars And Reproducibility

OSER should support figure sidecar groups as a first-class editorial pattern:

```text
figure.svg
figure.json
figure.csv
figure.md
```

The intended responsibilities are:

- JSON stores structured metadata and rendering specifications;
- CSV stores source data;
- Markdown stores editorial notes, assumptions, and review status;
- SVG or PNG stores the visual output;
- manifests record how the output was produced.

A future reproducibility manifest should make it possible to determine whether a generated figure can be reconstructed from source data, rendering specification, metadata, and a recorded toolchain.

## Radical Proportionality Validation

OSER should support editorial policy validation where the rules can be stated mechanically. Radical proportionality is the first important example: when a visual dimension represents a quantity, that dimension must be mathematically proportional to the quantity and must not be inflated for aesthetics.

This requires future figure validation infrastructure. A generic SVG inspection pass is not enough; OSER will need declared bindings between data fields and visual geometry so the validator can compare expected dimensions with actual rendered dimensions.

## Large Projects And Multi-Volume Work

OSER should grow beyond single-file rendering. The future project model should support:

- long documents;
- many Markdown files;
- multiple volumes;
- appendices;
- figure and table registries;
- bibliography collections;
- language variants;
- partial rebuilds;
- project-level diagnostics.

This should be implemented incrementally. OSER should first understand the project tree and its assets before attempting complex multi-volume rendering behavior.

## Studio Role

Studio should be a GUI surface over OSER contracts and adapters. It should not become the source of truth or hide rendering behavior behind GUI-only state.

Studio should eventually expose:

- project manifests;
- asset graphs;
- diagnostics;
- layout profiles;
- render targets;
- render history;
- visual inspection reports;
- figure validation reports;
- publication readiness.

The current Studio MVP remains a valid reference app around existing Core APIs.

## Roadmap Shape

The architectural roadmap is:

1. Project understanding: project model, scanner, asset graph, manifests, project diagnostics.
2. Renderer adapters: Pandoc, optional Quarto, Playwright/Paged.js, Astro, with explicit render manifests.
3. Studio and visual validation: GUI project surface, visual inspection, figure validation, publication readiness.

Each phase should preserve existing package capabilities and avoid forcing OSER core to depend on optional renderer or GUI tooling.
