# OSER Data Visualization Integration

Date: 2026-06-13

## Summary

OSER should support data visualizations as first-class publication assets, but it should not become a chart-generation framework. The correct role is a visualization orchestration and validation layer that can discover figure bundles, connect source data to generated outputs, validate accessibility and reproducibility, select the right representation for each export target, and record provenance.

This layer should work with visualizations produced by native SVG generators, Python, R, Vega/Vega-Lite, Observable-style HTML exports, static PNG/JPEG fallbacks, maps, and future JavaScript charting systems. OSER should not install or execute those systems by default. It should understand their declared inputs and outputs, validate them, and optionally run explicit, reproducible generation commands when a project opts in.

## Current Architecture Fit

The current implemented OSER pipeline supports TXT/Markdown import, `OserDocument`, diagnostics, semantic HTML, layout profiles, render manifests, and experimental PDF. The newer architectural direction adds planned project scanning, asset graphs, file inspection, visual validation, figure validation, and external renderer adapters.

The visualization layer should sit across those planned areas:

```text
figure bundle
  -> project scanner
  -> asset graph
  -> VisualizationAsset manifest
  -> file inspection reports
  -> visualization diagnostics
  -> export target selection
  -> render/reproducibility manifest
```

This document is design only. It does not claim that these packages or APIs already exist.

## Final Recommendation

OSER should become option 2: a visualization orchestration and validation layer.

It should not become a chart-generation framework. Python, R, Vega/Vega-Lite, Observable, D3, MapLibre, Plot, ggplot2, matplotlib, and other FLOSS ecosystems already cover generation better than OSER should. OSER should also not remain only a passive asset renderer, because publication-grade figures require asset relationships, accessibility, provenance, export fallbacks, freshness checks, and validation.

The right division is:

- external tools generate charts;
- OSER discovers, validates, records, and integrates them;
- OSER-native generators can exist for simple or project-specific SVGs, but they are not the center of the architecture.

## Asset Model

OSER should define a visualization asset contract in the future project model or asset graph layer. `VisualizationAsset` is a good name conceptually, but it should be more explicit than a loose figure object.

Recommended conceptual shape:

```ts
type VisualizationAsset = {
  schemaVersion: "0.1"
  id: string
  kind: "visualization"
  title: string
  description?: string
  status: "draft" | "preliminary" | "review" | "verified" | "published" | "archived"
  language?: string

  bundle: {
    root: string
    convention?: "basename" | "manifest" | "registry"
  }

  sourceData: VisualizationSourceRef[]
  sourceCode: VisualizationSourceRef[]
  specifications: VisualizationSourceRef[]
  notes?: VisualizationSourceRef[]

  renderedAssets: {
    svg?: VisualizationRenderedRef
    png?: VisualizationRenderedRef
    jpeg?: VisualizationRenderedRef
    html?: VisualizationRenderedRef
    pdf?: VisualizationRenderedRef
  }

  accessibility: {
    altText: string
    longDescription?: string
    dataTable?: string
    ariaLabel?: string
    titleElementRequired?: boolean
    descElementRequired?: boolean
  }

  editorial: {
    caption?: string
    credit?: string
    sourceNote?: string
    methodology?: string
    factCheckKeys?: string[]
    rights?: string
  }

  layout: {
    defaultPlacement?: "inline" | "text-width" | "full-width" | "wide" | "bleed"
    aspectRatio?: string
    minReadableWidthPx?: number
    keepWithCaption?: boolean
    pageBreakBefore?: "auto" | "avoid" | "always"
    pageBreakAfter?: "auto" | "avoid" | "always"
    groupId?: string
  }

  preferredOutput: {
    html?: "svg" | "html" | "png" | "jpeg"
    pdf?: "svg" | "pdf" | "png" | "jpeg"
    docx?: "png" | "jpeg" | "svg"
    epub?: "svg" | "png" | "jpeg"
  }

  generation?: VisualizationGeneration
  provenance: VisualizationProvenance
  validation?: VisualizationValidationSummary
}
```

Supporting conceptual references:

```ts
type VisualizationSourceRef = {
  path: string
  role: "data" | "code" | "spec" | "notes" | "metadata" | "methodology"
  mediaType?: string
  checksum?: string
  required?: boolean
}

type VisualizationRenderedRef = {
  path: string
  mediaType: string
  widthPx?: number
  heightPx?: number
  checksum?: string
  generatedAt?: string
  fallbackFor?: string[]
}

type VisualizationGeneration = {
  mode: "manual" | "external-command" | "native" | "unknown"
  command?: string[]
  workingDirectory?: string
  expectedOutputs?: string[]
  environment?: Record<string, string>
  deterministic?: boolean
  requiresNetwork?: boolean
}

type VisualizationProvenance = {
  createdAt?: string
  updatedAt?: string
  generatedAt?: string
  generator?: {
    name: string
    version?: string
    runtime?: string
    runtimeVersion?: string
  }
  sourceChecksums?: Record<string, string>
  outputChecksums?: Record<string, string>
  commandDigest?: string
}

type VisualizationValidationSummary = {
  status: "unknown" | "pass" | "warning" | "fail"
  checkedAt?: string
  diagnostics?: string[]
}
```

Improvements over the initial sketch:

- separate source data, code, specs, notes, rendered outputs, accessibility, layout, generation, provenance, and validation;
- allow many source files and many rendered fallbacks;
- record status beyond draft/preliminary/verified;
- describe export preference without making it mandatory;
- support data tables and long descriptions for accessibility;
- support generated, manual, and unknown provenance honestly;
- make reproducibility explicit instead of implied.

## Discovery

OSER should support several discovery mechanisms, but one should be canonical.

Recommended canonical approach: bundle-level manifest.

Example:

```text
figures/figure-01/
  visualization.json
  figure-01.csv
  figure-01.svg
  figure-01-notes.md
```

The manifest should be the source of truth for the bundle. It can declare IDs, titles, source data, source code/specs, rendered assets, preferred output formats, accessibility text, provenance, and validation rules.

Filename conventions should be supported as a fallback and migration path:

```text
figure-01.svg
figure-01.csv
figure-01.json
figure-01-notes.md
```

A project-level registry should be optional but useful for large projects:

```text
figures/visualizations.json
```

Recommended discovery order:

1. Explicit project-level registry, if present.
2. Bundle-level manifest, if present.
3. Filename convention fallback.
4. Markdown references, placeholders, or front matter as weak hints.

Why not front matter as canonical? Figure bundles often include multiple files that are not Markdown. A standalone manifest is easier for tooling, validation, and asset graph construction.

## External Generators

OSER should never execute arbitrary visualization code by default.

Generation should require explicit opt-in through a manifest or command-line flag. The first scanner should only discover and validate declared relationships.

### Python Scripts

OSER should treat Python as an external generator:

- source code path is declared;
- command is declared as an argument array, not a shell string;
- expected outputs are declared;
- runtime and package versions are captured where possible;
- stdout, stderr, exit code, duration, and output checksums are captured;
- execution is skipped unless explicitly requested.

OSER should not install Python packages.

### R Scripts

R should follow the same model as Python:

- declared script path;
- declared command;
- captured version and output checksums;
- no execution by default;
- no package installation by OSER.

### Vega/Vega-Lite Specs

Vega/Vega-Lite are good adapter candidates because specs are declarative.

OSER should:

- validate that the spec file exists and parses as JSON;
- distinguish spec validation from rendering;
- optionally delegate rendering to a FLOSS CLI or JS library in a future adapter;
- capture generated SVG/PNG/HTML outputs and tool versions;
- preserve the original spec as a source asset.

### Static SVG

Static SVG is a first-class rendered asset.

OSER should inspect it for:

- valid XML;
- root `<svg>`;
- `viewBox`, `width`, and `height`;
- `<title>` and `<desc>` where required;
- embedded text;
- scripts, event handlers, `foreignObject`, remote references, and active content;
- geometry against viewBox where deterministic checks are possible.

### Pre-Rendered HTML Visualizations

HTML visualizations may be interactive, but they are risky as canonical publication assets because they may depend on JavaScript, external resources, or browser runtime state.

OSER should:

- inspect HTML as untrusted content;
- detect scripts, iframes, forms, remote resources, and data dependencies;
- require a static fallback for PDF, DOCX, and EPUB;
- prefer self-contained HTML only for web targets;
- record whether the HTML is interactive and whether it needs network access.

### Future JavaScript Charting Systems

Future systems should fit the same adapter pattern:

```text
source data + code/spec + declared command
  -> explicit opt-in generation
  -> captured provenance
  -> rendered SVG/HTML/PNG/PDF
  -> validation reports
```

OSER should not special-case every library in core.

## Execution Safety

Generation commands should have a conservative execution model:

- no arbitrary execution by default;
- explicit opt-in per run;
- use subprocess argument arrays, not shell interpolation;
- fixed working directory inside the project;
- allowed output paths;
- timeout;
- output size limits;
- captured stdout/stderr;
- captured exit code;
- optional network-disabled mode;
- optional environment allowlist;
- no package installation;
- no hidden mutation outside declared outputs.

If sandboxing is available, OSER should use it. If not, it should clearly report that execution was not sandboxed.

## Validation

Validation should be split into deterministic checks and heuristic visual checks.

### Deterministic Checks

These can be implemented reliably:

- referenced files exist;
- manifest JSON parses;
- CSV/JSON source data files parse when supported;
- SVG/XML parses;
- SVG has root `<svg>`;
- SVG has `viewBox` or explicit dimensions;
- PNG/JPEG dimensions are readable;
- raster dimensions are non-zero;
- output files are not empty;
- alt text exists;
- caption exists when policy requires it;
- expected rendered assets exist;
- checksums match recorded provenance;
- generated asset is newer than source data/code as a warning-level freshness check;
- declared output media type matches detected type;
- preferred output target has an available asset;
- active SVG/HTML content is detected;
- remote references are detected;
- declared source files are inside the allowed project scope;
- vector asset is available for HTML/PDF when the target policy requires vector.

### Mostly Deterministic With Parsers

These are feasible but need more parsing work:

- no SVG text or shape extends outside the viewBox for simple elements;
- declared aspect ratio matches rendered dimensions;
- SVG title/desc correspond to accessibility metadata;
- Vega/Vega-Lite spec references declared data;
- figure manifest references all bundle files;
- stale output based on checksums rather than mtime;
- radical proportionality checks for declared data-to-geometry bindings.

### Heuristic Visual Checks

These require browser rendering, rasterization, or layout heuristics:

- clipped labels caused by font differences;
- overlapping text;
- unreadable small labels;
- bad contrast;
- distorted aspect ratios in final layout;
- missing map tiles or external resources;
- tooltips unavailable in static fallback;
- PDF page-break problems;
- caption separation from figure;
- figure too small in target layout.

Heuristic checks should produce warnings and evidence, not pretend to be definitive.

## Layout Integration

Visualizations should enter an OSER document through a figure reference rather than by blindly embedding whatever file appears in Markdown.

Possible source notation can remain simple initially:

```markdown
![Embudo de la impunidad](figures/figure-01.svg)
```

Future project-aware notation could reference the visualization ID:

```markdown
[FIGURE: figure-01]
```

The project scanner can resolve the ID to a `VisualizationAsset` and choose the best rendered asset for the target output.

Supported layout intents:

- inline figure;
- text-width figure;
- full-width figure;
- wide figure;
- bleed figure;
- grouped figure;
- figure with caption;
- figure with expandable methodology/data for HTML;
- keep-with-caption behavior;
- page-break before/after/avoid rules.

These layout intents should live in metadata or layout profiles, not hard-coded in renderers.

A figure group should have its own ID and may contain multiple visualization assets:

```text
figure-group-07
  -> figure-07-a
  -> figure-07-b
  -> figure-07-c
```

## Export Strategy

OSER should preserve vector output whenever possible and generate raster fallbacks only when needed. It should never silently rasterize at low resolution.

### HTML / WebBook

Preferred order:

1. interactive HTML if target allows scripts and a static fallback exists;
2. inline or linked SVG for static vector charts;
3. PNG/JPEG fallback only when vector/HTML is unavailable.

HTML should expose alt text, caption, long description, data download, and methodology links where available.

### PDF

Preferred order:

1. SVG/vector when the PDF path preserves vector output;
2. PDF figure asset when available and supported;
3. high-resolution PNG fallback.

If using browser-based PDF, SVG should generally be preferred for static charts. Interactive HTML must have a static fallback.

### DOCX

Preferred order:

1. PNG/JPEG fallback at sufficient resolution;
2. SVG only when the selected DOCX pipeline supports it reliably;
3. never use interactive HTML.

Pandoc-based DOCX export may require target-specific testing before SVG is allowed as the default.

### EPUB

Preferred order:

1. SVG for static vector charts when compatible with the EPUB target profile;
2. PNG fallback;
3. never rely on JavaScript interactions for essential meaning.

EPUB should include alt text and long descriptions where available.

## Raster Fallback Rules

Minimum raster fallback policy:

- declare intended physical width per target, for example text width or full page width;
- generate raster fallback at no less than 300 DPI for print-oriented targets;
- use 150 to 200 DPI minimum for screen-only fallbacks unless project policy requires more;
- never upscale a low-resolution raster and call it valid;
- warn when fallback width is below required target width;
- record pixel dimensions, target physical width, implied DPI, and checksum;
- prefer transparent PNG for charts with text and line art;
- use JPEG only for photographic or continuous-tone imagery.

Example calculation:

```text
6 inch print figure at 300 DPI -> minimum width 1800 px
```

If the only fallback is 900 px wide, OSER should warn or fail depending on publication policy.

## Complex And Interactive Visualizations

Interactive visualizations should be allowed for HTML targets but must not be the only representation.

### Vega And Vega-Lite

- Source spec is canonical when declared.
- HTML may be interactive.
- Static SVG or PNG fallback is required for PDF, DOCX, and EPUB.
- Tooltips and filters should be summarized in methodology or long description if they carry essential meaning.

### Observable-Style HTML

- Treat exported HTML as an external rendered asset.
- Detect scripts and remote resources.
- Require a static fallback.
- Prefer self-contained exports for archive stability.

### Maps

Maps need special handling because static fallbacks can lose scale, labels, or tile provenance.

OSER should require:

- data sources;
- projection or map library information;
- tile/source attribution;
- static fallback;
- captured viewport/bounds;
- note if external tiles or network access are required.

### Animations

Animations should have:

- poster frame;
- static summary figure;
- optional video/GIF only for HTML targets;
- description of temporal meaning;
- fallback for print and EPUB.

### Tooltips And Filters

Tooltips and filters are acceptable enhancement, not primary evidence. If essential data exists only in a tooltip, OSER should warn unless the same data is available in a data table, caption, annotation, or long description.

## Provenance And Reproducibility Manifest

Every figure should have enough metadata to answer:

- What source data was used?
- What code or spec generated the output?
- What command was run?
- Which tool versions were used?
- What outputs were produced?
- What are the checksums of inputs and outputs?
- Was the output validated?
- Is the output stale relative to the inputs?

Recommended manifest fields:

```json
{
  "schema_version": "0.1",
  "id": "figure-01",
  "kind": "visualization",
  "title": "Embudo de la impunidad",
  "status": "preliminary",
  "source_data": [],
  "source_code": [],
  "specifications": [],
  "rendered_assets": {},
  "accessibility": {},
  "editorial": {},
  "layout": {},
  "preferred_output": {},
  "generation": {},
  "provenance": {},
  "validation": {}
}
```

A concrete example is provided in `docs/examples/visualization-manifest.example.json`.

## Relationship With File Inspection

The visualization layer should consume future `@oser/file-inspection` reports rather than duplicate low-level file probing.

`@oser/file-inspection` should provide evidence such as:

- detected MIME type;
- file size;
- checksum;
- SVG validity;
- SVG dimensions and viewBox;
- SVG title/desc/text extraction;
- active SVG or HTML content detection;
- PNG/JPEG dimensions;
- PDF page count and dimensions;
- embedded text extraction;
- thumbnail or preview paths;
- warnings about low confidence or unsupported inspection.

The visualization validation layer should interpret that evidence in publication context:

- is this fallback large enough for print?
- is SVG acceptable for the selected export target?
- is active HTML allowed for this output?
- is alt text present and aligned with the asset?
- is the generated asset stale compared to its sources?
- does the selected target have a valid representation?

This keeps file inspection generic and visualization validation editorially aware.

## Minimal Implementation Roadmap

### Immediate Foundation

Target: 10 to 20 Codex-assisted prompts.

1. Add documentation and example manifest. Done by this design step.
2. Define a minimal JSON schema or TypeScript contract for visualization manifests.
3. Add project scanner support for discovering bundle-level `visualization.json` files.
4. Add filename-convention discovery for existing sidecars like `figure-01.svg`, `figure-01.csv`, `figure-01.json`, `figure-01-notes.md`.
5. Add asset graph edges between source data, source code/specs, rendered outputs, notes, and Markdown references.
6. Add deterministic validation for existence, non-empty outputs, JSON parse, CSV presence, SVG parse, dimensions, alt text, caption policy, and stale mtime warning.
7. Add render-manifest links to visualization assets used in an output.
8. Add target selection logic for choosing SVG/HTML/PNG per export target without changing renderers yet.

### Moderate Extension

9. Add `@oser/file-inspection` or equivalent low-level reports for SVG, PNG/JPEG, PDF, and HTML.
10. Add checksum-based freshness checks.
11. Add raster fallback DPI validation.
12. Add active content detection for SVG and HTML.
13. Add declared generation command records with no execution by default.
14. Add explicit opt-in generation execution with timeouts, captured stdout/stderr, exit code, expected outputs, and checksums.
15. Add Vega/Vega-Lite spec discovery and static fallback validation.
16. Add figure group support and layout metadata integration.

### Future Advanced Capability

17. Add browser-based visual checks for HTML/SVG bounding boxes, label overflow, and clipping evidence.
18. Add PDF raster inspection for page-break and figure placement checks.
19. Add radical proportionality validation for declared data-to-geometry bindings.
20. Add Studio panels for visualization manifests, asset graph, validation reports, generation logs, and publication readiness.

## What OSER Should Delegate

OSER should delegate chart generation to specialized tools:

- Python plotting libraries;
- R and ggplot2;
- Vega/Vega-Lite renderers;
- Observable or JavaScript charting systems;
- GIS/map rendering tools;
- image conversion/rasterization utilities;
- PDF and EPUB conversion backends.

OSER should own the editorial contract around those tools:

- declared inputs;
- declared outputs;
- metadata;
- accessibility;
- provenance;
- validation;
- fallbacks;
- target-specific integration.

## Risks

### Overbuilding A Chart Framework

If OSER starts implementing chart grammars, scales, and plotting APIs, it will compete with mature ecosystems and lose focus. Native generators should remain optional and narrow.

### Unsafe Execution

Python, R, and JavaScript can execute arbitrary code. OSER should never run them by default and should make execution opt-in, logged, constrained, and reproducible.

### False Validation Confidence

Visual overlap, clipping, and readability can be hard to prove. OSER should distinguish deterministic failures from heuristic warnings.

### Raster Degradation

DOCX and EPUB fallbacks can silently degrade figures. OSER should record DPI, dimensions, and selected fallbacks, and should fail or warn when raster assets are too small.

### Interactive Meaning Loss

Interactive charts can hide essential data in tooltips or filters. Static outputs need summaries, annotations, data tables, or long descriptions so meaning survives print and archival formats.

## Conclusion

OSER should be a visualization orchestration and validation layer.

It should treat visualizations as publication assets with source data, code or specifications, rendered outputs, metadata, accessibility text, provenance, validation status, and export fallbacks. It should integrate those assets into HTML, PDF, DOCX, and EPUB workflows through target-aware selection and explicit manifests.

It should not become a general chart-generation framework, and it should not remain a passive renderer that blindly embeds files. The value OSER can add is editorial reliability: knowing what a figure is, where it came from, whether it is valid for a target output, and whether it can be reconstructed.
