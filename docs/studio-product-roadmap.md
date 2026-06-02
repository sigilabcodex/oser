# OSER Studio Product Roadmap

OSER Studio is the optional product surface for OSER's declarative editorial engine. It should make the OSER pipeline visible, inspectable, adjustable, and reproducible without turning OSER Core into a GUI framework or moving editorial logic into React.

The boundary remains:

```text
OSER Core -> studio-server -> apps/studio
```

OSER Core owns import, document modeling, diagnostics, layout profiles, rendering, PDF export, manifests, and CLI/API contracts. `studio-server` is an optional local adapter that exposes safe project operations over Core. `apps/studio` is the GUI that presents those operations to editors, designers, and technical users.

## 1. Product Vision

OSER Studio should be a visual interface for a declarative editorial engine.

It is not a freeform InDesign clone in the first stage. It should not promise absolute WYSIWYG, pixel-level manual composition, or arbitrary canvas editing before OSER has a mature declarative layout model. The first serious product stage should instead help users understand what OSER generated, why it generated it, what rules were used, what problems were found, and how to reproduce the same result.

Studio should become a tool for:

- inspecting source documents and normalized document structure
- selecting and adjusting declarative layout profiles
- previewing generated HTML and PDF outputs
- reviewing diagnostics and export readiness
- comparing outputs and render manifests
- managing editorial checkpoints and variants in human language
- producing reproducible publication artifacts

The long-term opportunity is not to hide OSER's pipeline. It is to make the pipeline understandable enough that non-programmers can use it confidently while technical users can still inspect the underlying files, commands, manifests, and version history.

## 2. UX Principles

### Source-First

Source files remain canonical. Studio can preview, inspect, validate, and eventually apply structured changes, but generated output is not the source of truth.

### Preview Immediate

The primary feedback loop should be document -> settings -> render -> preview. Users should quickly see what changed, whether the result is stale, and which inputs produced the current output.

### Diagnostics Actionable

Diagnostics should explain what happened, where it happened, why it matters, and what the user can do next. The UI should avoid burying warnings in logs or manifests.

### Declarative Profiles, Not Raw CSS As The Main Interface

`LayoutProfile` should be the main layout control surface. Raw CSS can remain an advanced escape hatch, but first-class UX should expose page size, margins, flow, typography scale, table strategy, image strategy, and related editorial rules as structured settings.

### Human Control Over Automatic Rules

OSER can suggest and automate, but users must be able to inspect, override, reset, and understand layout decisions. Automatic behavior should be visible rather than magical.

### Reproducible Design

A Studio output should be reproducible from source files, profiles, assets, export settings, and the render manifest. Hidden UI state must not be required to rebuild a publication.

### Git In Editorial Language

When version control enters Studio, the user-facing language should be editorial: checkpoint, variant, compare, restore, incorporate, publication. Git details can remain inspectable for advanced users.

### Local And Explicit Security

Studio must avoid unrestricted filesystem access by default. Projects, allowlists, output directories, and external operations should be explicit and understandable.

### Progressive Disclosure

The first screen should be simple: source, profile, preview, diagnostics, output. Advanced controls should appear when they are needed, not as a wall of settings.

## 3. Stage 1: Inspection Tool

Stage 1 turns the current MVP into a serious inspection tool.

Flow:

```text
document -> render -> output -> manifest -> visual diagnosis
```

### Goals

- Make every generated artifact visible and explainable.
- Make stale states impossible to miss.
- Make stress tests easy to select and compare.
- Keep document content read-only.
- Keep filesystem access allowlisted.

### Features

- Document selector for allowlisted sources.
- Layout profile selector.
- HTML preview in an iframe.
- PDF export action and generated PDF link.
- Diagnostics panel with severity summary and item details.
- RenderManifest summary panel.
- Links to generated HTML/PDF artifacts.
- Render state: `idle`, `stale`, `rendering`, `rendered`, `error`.
- Export state: `idle`, `stale`, `exporting`, `exported`, `error`.
- Basic comparison between outputs, starting with manifest-level comparison:
  - source path
  - profile path
  - target
  - generated paths
  - diagnostics summary
  - generated time
- Stress test support through allowlisted documents.

### Package Ownership

- Core: no new product behavior unless a missing manifest/diagnostic field is required generically.
- `studio-server`: safe endpoints for document/profile lists, render, validate, export, and output metadata.
- `apps/studio`: visual states, panels, user workflow, stale indicators, comparison UI.

## 4. Stage 2: LayoutProfile UX

Stage 2 gives users a structured way to adjust layout without making CSS the only interface.

### Goals

- Let users understand and change layout rules safely.
- Keep `LayoutProfile` declarative and serializable.
- Validate profiles before rendering.
- Preserve reproducibility.

### Features

- JSON editor for `LayoutProfile`.
- Profile validation with clear errors and warnings.
- Preview after applying profile changes.
- Simple visual controls for:
  - page size
  - margins
  - base typography
  - line height
  - heading scale
  - columns
  - table strategy
  - image strategy
- Presets:
  - `classic-book`
  - `report`
  - `compact`
  - `screen/web`
- Save temporary profile.
- Duplicate profile as variant.
- Show diff between original profile and edited profile.
- Reset profile changes.

### Product Notes

The JSON editor should be an advanced panel, not the only path. The primary UX should be constrained controls backed by a profile schema. Users should know whether a setting changes global layout rules or only the current preview session.

### Package Ownership

- Core: profile schema, profile validation, CSS generation, preset contracts.
- `studio-server`: temporary profile storage, profile validation endpoint, render with temporary profile.
- `apps/studio`: form controls, JSON editor, profile diff, apply/reset/save interactions.

## 5. Stage 3: WYSIWYG-Ish / Structured Visual Editing

WYSIWYG-ish in OSER means visual selection and structured overrides, not freeform page drawing.

It should mean:

- selecting elements in the preview
- inspecting the selected block
- applying structured overrides
- seeing whether a decision is global or local
- persisting changes as declarative data

It should not mean:

- editing arbitrary pixels
- dragging boxes freely on a canvas
- changing generated HTML as the source of truth
- bypassing the document model

### Features

- Click heading, paragraph, table, or figure in preview.
- Inspector for selected block:
  - source path or block identifier
  - block type
  - heading level or role
  - diagnostics attached to the block
  - applied profile rules
  - local overrides
- Local overrides:
  - break before/after
  - keep with next
  - table strategy
  - image sizing
  - editorial class/role
- Show global vs local changes clearly.
- Reset override.
- Preview with overrides.
- Persist overrides as declarative data outside generated output.

### Package Ownership

- Core: stable block identifiers, source mapping, override schema, renderer support for structured overrides.
- `studio-server`: apply/read/write override data, render with overrides.
- `apps/studio`: preview selection, inspector, override controls, reset UI.

## 6. Stage 4: Upload / File Picker / Projects

Stage 4 moves beyond fixtures and allowlisted stress tests into real local projects.

### Goals

- Open real projects without unrestricted filesystem browsing.
- Keep file operations explicit and secure.
- Support source, profile, asset, and output organization.
- Prepare for future importers without overbuilding them now.

### Features

- Open local project.
- Select source file within a project allowlist.
- Import Markdown/TXT initially.
- Prepare future DOCX/ODT/RTF import surfaces.
- Basic asset browser.
- Missing asset report.
- Safe path handling.
- Explicit project root and output directory.
- No free filesystem access without explicit consent.

### Shell Decision

This stage should include a packaging decision:

- Continue with local Node server if project access is simple and developer-focused.
- Use File System Access API if browser support and permission UX are acceptable.
- Consider Tauri if OSER needs a polished local desktop app with filesystem permissions and smaller footprint.
- Consider Electron only if ecosystem needs outweigh bundle size and operational complexity.

The decision should be made from product constraints, not preference. The key question is: what filesystem permission model gives users confidence while keeping OSER portable?

### Package Ownership

- Core: importers and reusable project-agnostic file processing only.
- `studio-server`: project root, allowlist, safe path resolution, import orchestration, asset discovery.
- `apps/studio`: project picker UX, document browser, asset browser, missing files UI.

## 7. Stage 5: Git / Checkpoints

Stage 5 translates version control into editorial workflow.

### Vocabulary

- commit -> checkpoint
- branch -> variant
- diff -> compare
- checkout -> restore/switch
- merge -> incorporate variant
- tag -> publication/release

### Features

- Create checkpoint.
- View history.
- Compare changes in:
  - source
  - layout profile
  - overrides
  - assets
  - output manifest
- Create variant.
- Restore checkpoint.
- Switch variant.
- Mark publication/release.
- Inspect raw Git details only when needed.
- Warn about uncommitted changes in editorial language.

### Package Ownership

- Core: no Git dependency.
- `studio-server`: Git adapter, checkpoint operations, diff summaries, safety checks.
- `apps/studio`: checkpoint timeline, compare UI, variant switcher, release labels.

## 8. Stage 6: Preview / Export History And Concurrency

The current MVP writes shared outputs under `dist/studio`. That is acceptable for a fixture MVP but insufficient for a serious product.

### Current Problem

- Outputs are shared in `dist/studio`.
- There is no stable render identity.
- Renders are not concurrent-safe.
- A new render can overwrite the previous preview/export.
- Multiple documents cannot remain open with independent outputs.

### Target Design

Introduce `renderId` and per-render output directories.

Possible shape:

```text
dist/studio/renders/
  <renderId>/
    preview.html
    export.pdf
    manifest.json
    diagnostics.json
    assets/
```

`renderId` should be generated by `studio-server` and recorded in responses and manifests. It can include document/profile identity and timestamp, but the external contract should treat it as an opaque ID.

### Features

- `renderId` per render/export.
- Output directory per document/profile/timestamp or opaque render ID.
- Render history list.
- Manifest per render.
- Cleanup policy for old renders.
- Compare renders.
- Multiple documents open.
- Concurrent-safe states.
- Ability to pin or keep a render.

### Package Ownership

- Core: manifests should remain render-output metadata, but Core should not manage Studio history.
- `studio-server`: render IDs, output directory allocation, history index, cleanup, concurrent job tracking.
- `apps/studio`: history UI, render selection, comparison, stale/current state display.

## 9. Stage 7: Quality Of Life

These features should be added after the core product loop is stable, not before it.

### Candidates

- Keyboard shortcuts.
- Command palette.
- Autosave of UI state.
- Recent projects.
- Recent documents.
- Toast notifications.
- Better loading states.
- Error recovery actions.
- Collapsible panels.
- Resizable panels.
- Dark mode.
- Preview zoom.
- Open output folder.
- Copy output path.
- Copy command used.
- Accessibility pass.
- Responsive layout hardening.
- Onboarding/demo mode.
- Sample documents.

### Package Ownership

Most quality-of-life features belong in `apps/studio`. `studio-server` should support only operations that require local system access, such as opening folders or persisting recent projects. Core should not change for UI convenience unless a reusable API is missing.

## 10. Stage 8: AI-Assisted Studio

AI should assist OSER users, not become the rendering engine or hidden layout authority.

### Principles

- AI suggestions should be inspectable and reversible.
- AI output should become explicit source/profile/override data before it affects rendering.
- Users should see what changed.
- Core rendering remains deterministic.

### Possible Uses

- Suggest a `LayoutProfile` based on document type and target output.
- Explain diagnostics in plain language.
- Suggest editorial fixes for heading hierarchy, table complexity, or missing metadata.
- Convert messy source into cleaner structure.
- Summarize layout problems after a render.
- Generate design variants as candidate profiles.
- Assist complex DOCX import mapping.

### Package Ownership

- Core: deterministic schemas, diagnostics, import/render APIs.
- `studio-server`: optional AI adapter if local credentials/project context are needed.
- `apps/studio`: AI suggestion UI, accept/reject flows, diff preview.

## 11. Stage 9: WebBook / Enriched Digital Publication

Studio should eventually connect OSER's print/export workflow to enriched digital reading.

### Related Concepts

- `ReadingProfile`
- WebBook export
- reading themes
- navigation
- future bookmarks/notes
- self-contained HTML

### Features

- WebBook export target.
- ReadingProfile selector.
- Theme preview.
- Navigation preview.
- Table of contents inspection.
- Self-contained HTML output.
- Future bookmark/note data model inspection.

### Package Ownership

- Core: ReadingProfile, WebBook renderer/exporter, deterministic HTML output.
- `studio-server`: WebBook export endpoint and output serving.
- `apps/studio`: reading preview, theme controls, navigation inspector.

## 12. Prioritization Roadmap

Difficulty: Low, Medium, High. Risk: Low, Medium, High.

| Phase | Feature | User value | Difficulty | Dependency | Risk | Package |
| --- | --- | --- | --- | --- | --- | --- |
| Now | Harden render/export states | Users trust what is current vs stale | Low | Existing Studio state | Low | apps/studio |
| Now | Manifest summary polish | Users understand generated artifacts | Low | RenderManifest already exists | Low | apps/studio |
| Now | Diagnostics actionability pass | Users can act on warnings | Medium | Diagnostics metadata | Medium | Core, apps/studio |
| Now | Stress test browsing | Designers can inspect edge cases | Low | Allowlisted docs | Low | studio-server, apps/studio |
| Now | Basic manifest comparison | Users see what changed between outputs | Medium | Stable manifests | Medium | apps/studio |
| Next | Profile validation endpoint | Prevent invalid layout previews | Medium | LayoutProfile schema | Medium | Core, studio-server |
| Next | LayoutProfile form controls | Non-programmers can adjust layout | Medium | Profile validation | Medium | apps/studio |
| Next | Temporary profile render | Safe experimentation | Medium | Profile storage contract | Medium | studio-server, apps/studio |
| Next | Duplicate profile variant | Designers can branch profile ideas | Medium | Project/profile storage | Medium | studio-server, apps/studio |
| Next | Render IDs | Prevent output overwrites | High | Output contract update | High | studio-server, apps/studio |
| Later | Preview element selection | Bridge preview and structure | High | Source mapping/block IDs | High | Core, studio-server, apps/studio |
| Later | Structured overrides | Controlled WYSIWYG-ish behavior | High | Override schema/render support | High | Core, studio-server, apps/studio |
| Later | Project open flow | Real user documents | High | Filesystem strategy | High | studio-server, apps/studio |
| Later | Asset browser | Real publication readiness | Medium | Project model | Medium | studio-server, apps/studio |
| Later | Checkpoints | Editorial history and review | High | Project model, Git adapter | High | studio-server, apps/studio |
| Later | Render history | Compare outputs and restore context | High | Render IDs | Medium | studio-server, apps/studio |
| Research | Desktop shell choice | Safer project filesystem UX | High | Product packaging decision | High | apps/studio, studio-server |
| Research | AI assistant | Faster fixes and profile ideation | High | Stable data contracts | High | studio-server, apps/studio |
| Research | WebBook export | Digital publishing path | High | ReadingProfile/WebBook Core | Medium | Core, studio-server, apps/studio |

## 13. First Serious 0.1 MVP

A usable `0.1` for testing with real designers should include:

- Read-only document selection from a safe project or expanded allowlist.
- Layout profile selection.
- Profile summary with page size, margins, type scale, and strategy fields.
- HTML preview with stale/current/error states.
- PDF export with generated path and timestamp.
- Diagnostics panel with severity, location, and suggested next action where possible.
- RenderManifest summary and generated artifact links.
- Basic manifest comparison between the latest two renders.
- Stress test gallery or filter.
- Clear no-WYSIWYG messaging through product behavior, not warning copy.
- Reproducibility display: source + profile + target + output paths + generated time.
- No unrestricted filesystem access.
- No source editing.
- No hidden mutations to Core inputs.

The `0.1` should be judged by whether a designer can answer:

- What document am I looking at?
- Which layout rules were used?
- Is the preview current?
- What did OSER generate?
- What warnings should I care about?
- Can I reproduce this output?

## 14. Main Risks

### UI Complexity

Studio can become a crowded control panel. Mitigation: progressive disclosure, strong panel hierarchy, and task-focused modes.

### Accidental Core Coupling

Product needs may tempt Studio-specific state into Core. Mitigation: keep Core APIs generic and push project/session behavior into `studio-server`.

### Filesystem And Security

Real projects require filesystem access. Mitigation: explicit project roots, allowlists, safe path normalization, and clear consent for broader access.

### Concurrent Renders

Shared outputs will fail once multiple documents or render histories exist. Mitigation: introduce render IDs before multi-document work.

### Performance With Long Documents

Large Markdown, huge tables, or many images may make preview and diagnostics slow. Mitigation: measure stress cases, add loading states, and design incremental rendering only after evidence.

### False WYSIWYG Expectations

Users may expect drag-and-drop page layout. Mitigation: present Studio as structured layout control and preview, then add WYSIWYG-ish selection carefully.

### Complex Importers

DOCX/ODT/RTF import will introduce ambiguous structure and assets. Mitigation: make import warnings first-class and keep import mapping explicit.

### Asset Handling

Missing images, relative paths, and bundled exports can become messy quickly. Mitigation: project model, asset browser, and missing asset diagnostics.

### PDF Print Fidelity

PDF output quality depends on browser rendering, CSS, pagination behavior, and print settings. Mitigation: dedicated print stress tests, manifest metadata, and explicit support matrix.

## 15. Recommendation: Next 5 Tasks

1. Define the Stage 1 output contract precisely.
   - Justification: render state, manifest summary, output links, comparison, and stale behavior need one shared vocabulary across server and GUI.
   - Package: docs, then `studio-server` and `apps/studio`.

2. Add manifest-level comparison for the latest two renders.
   - Justification: comparison is high-value for designers and technically achievable without WYSIWYG or project storage.
   - Package: `apps/studio`, possibly `studio-server` if comparison should be server-derived.

3. Improve diagnostics metadata and presentation.
   - Justification: diagnostics are one of OSER Studio's strongest differentiators over a plain preview tool.
   - Package: Core if new generic fields are needed; otherwise `apps/studio`.

4. Design the LayoutProfile validation and temporary profile contract.
   - Justification: Stage 2 depends on safe profile experimentation, and the API boundary should be clear before adding controls.
   - Package: docs, Core validation if missing, `studio-server` endpoint design.

5. Design render IDs and per-render output directories before adding real projects.
   - Justification: output history and concurrency are foundational; delaying this will make project support harder to retrofit.
   - Package: `studio-server` contract and `apps/studio` state model.

## Open Questions

- Should the first serious project model remain a Node local server, or should Studio move toward Tauri/File System Access API before real project opening?
- Should profile edits be stored as temporary server state, local browser state, or project files from the beginning?
- What source mapping is required for preview selection before structured overrides can be useful?
- How much diagnostics guidance belongs in Core versus Studio copy and UI logic?
- Should render comparison be purely manifest-based first, or include visual preview comparison early?
- Which stress tests should become product fixtures for designer review?
