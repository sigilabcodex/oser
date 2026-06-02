# OSER Project Package

This document proposes a future OSER Project Package format and its relationship to WebBook, EPUB, PDF, HTML, OSER Studio, Git, and local application packaging.

It is conceptual and technical design documentation only. It does not define an implemented package format yet.

## Product Definition

An OSER Project Package is an editable working container for an OSER publication project.

It should contain the source material, assets, profiles, overrides, render history, manifests, and optional version-control data needed to keep an editorial project reproducible and portable. It is a workspace, not the final publication artifact.

The package should preserve OSER's separation of concerns:

```text
source + profiles + assets + overrides
  -> OSER Core
  -> renders + manifests
  -> publication exports
```

OSER Studio can open, inspect, render, and eventually edit this package through `studio-server` or a local desktop shell. OSER Core should not become a project-file manager.

## 1. Project Package Versus Outputs

### OSER Project Package

The OSER Project Package is editable and source-first.

It is the working project container. It may include source documents, assets, project metadata, layout profiles, reading profiles, local overrides, render outputs, manifests, diagnostics, and optional Git history.

It answers:

- What are the canonical project inputs?
- Which profiles and overrides belong to this publication?
- Which renders were generated from which inputs?
- Which checkpoints or variants exist?
- Can Studio reopen and continue work later?

It should not be treated as the published book itself.

### WebBook

A WebBook is a final or reviewable browser-readable publication output.

It may be a folder, ZIP/package, single-file HTML, or future offline/PWA bundle. It is generated from an OSER project or standalone OSER inputs. It may contain reader UI, navigation, reading themes, search data, bookmarks/notes support, and offline behavior.

It answers:

- How should this book be read interactively in a browser?
- What reader profile and assets are included?
- Can this output be hosted or opened as a static publication?

A WebBook should be reproducible from project inputs and export settings. It is not the main editable project package.

### EPUB

EPUB is a standards-based eBook export.

It should follow EPUB ecosystem requirements, validation rules, metadata expectations, device constraints, and distribution workflows. OSER may eventually export EPUB, but EPUB should remain a standards output, not an OSER project format.

### PDF

PDF is a fixed-form output for print, proofing, and page-accurate distribution.

It is appropriate when pagination, page size, margins, line breaks, print CSS, and page fidelity are part of the artifact contract. PDF is an output, not a project workspace.

### HTML

HTML is a simple semantic web export.

It should remain a clean generated document or static output. It is useful for inspection, web publishing, and as a foundation for WebBook, but it is not the project package.

## 2. Extension Options

Possible extensions:

- `.oser`
- `.oserproj`
- `.osp`
- `.oserbook`
- `.owb`

### Recommended Extension For Editable Projects

Use `.oserproj` for editable OSER projects.

Reasons:

- It clearly communicates project/workspace rather than final publication.
- It is less likely to be confused with a generated book output.
- It leaves `.oser` available for a broader future bundle or brand-level file type if needed.
- It is readable enough for non-technical users.

Avoid `.osp` for the primary project format. It is short, but ambiguous.

### Recommended Extension For Publication Packages

Use `.oserbook` for an OSER-native WebBook-style publication package, if OSER later needs a zipped package for browser reading.

Use `.owb` only if a shorter final-publication extension becomes valuable. It is compact, but less self-explanatory.

### Recommended Extension Reserved For Later

Reserve `.oser`.

It may be useful later as a generic OSER bundle extension, but it is too broad for the first serious project/package split. Using `.oserproj` and `.oserbook` first keeps intent clearer.

### Practical Warning

Do not expect operating systems, browsers, Kindles, e-readers, app stores, or publishing platforms to recognize OSER extensions natively. OSER-specific extensions are for Studio, OSER tooling, and user clarity. Standard exports such as EPUB, PDF, and HTML remain necessary for distribution.

## 3. Proposed Internal Structure

Start with a folder-based project. A ZIP/package can be added later as an import/export transport.

Proposed folder shape:

```text
my-book.oserproj/
  oser-project.json
  source/
    manuscript.md
  assets/
    images/
    fonts/
  profiles/
    layout/
    reading/
    publication/
  overrides/
    local-overrides.json
  renders/
    <renderId>/
      preview.html
      export.pdf
      diagnostics.json
      manifest.json
      assets/
  manifests/
    project-manifest.json
  .git/
```

### `oser-project.json`

The project descriptor and primary metadata file.

Possible responsibilities:

- project ID
- schema version
- title and description
- default source document
- default layout profile
- default reading profile
- source allowlist or project file rules
- asset roots
- output/render settings
- profile resolution order
- current checkpoint or variant metadata
- compatibility information

### `source/`

Canonical editable source files.

Initial supported inputs should be Markdown and TXT. Future imports such as DOCX, ODT, and RTF may produce normalized Markdown, source snapshots, or import records, but the project should keep source-first behavior explicit.

### `assets/`

Project-owned images, fonts, and other referenced files.

The project should support missing asset diagnostics. Asset paths should be relative to the project root or declared asset roots. No renderer should need unrestricted filesystem access to resolve assets.

### `profiles/`

Project-owned profile files.

Suggested structure:

```text
profiles/
  layout/
    classic-book.variant.json
  reading/
    comfortable-web.json
  publication/
    print-proof.json
```

Profiles are editable project data. Built-in profiles should not be copied into every project unless the user duplicates them or pins a version.

### `overrides/`

Structured local overrides.

Overrides should be declarative data, not generated HTML edits. They may include block-level layout hints, table/image strategies, editorial roles, or future WYSIWYG-ish structured selections.

### `renders/`

Generated render outputs, grouped by `renderId`.

Each render directory should be disposable unless explicitly pinned. It should contain enough metadata to inspect what was generated, but canonical inputs remain `source/`, `profiles/`, `assets/`, and `overrides/`.

### `manifests/`

Project-level manifests, indexes, or summaries.

Per-render manifests should live inside their render directory. The project-level manifest can index current/latest/pinned renders and provide quick lookup for Studio.

### `.git/` Optional

Git may live inside the project folder if the project folder is the repository root. It may also live outside or above the package if the project is part of a larger repository.

The package design should support both.

## 4. Profile Model

OSER should distinguish profile source and profile scope.

### Built-In Profiles

Built-in profiles ship with OSER.

Examples:

- `classic-book`
- `report`
- `compact`
- `screen/web`

They are defaults and examples, not automatically mutable project files.

### User Profiles

User profiles belong to the user's Studio environment.

They can be reused across projects, but should not be required for reproducibility unless copied, pinned, or referenced with a stable version. If a project depends on a user profile, Studio should warn before export/package.

### Project Profiles

Project profiles live under `profiles/` inside the project.

They are the safest default for reproducible work because they travel with the project and can be versioned with it.

### Publication Profiles

Publication profiles are export-target-specific combinations or presets.

A publication profile may reference:

- layout profile
- reading profile
- style preset
- export target
- output constraints
- validation rules

Example publication profiles:

- print proof PDF
- final paperback PDF
- web review HTML
- WebBook release

### Local Overrides

Local overrides are document/block-specific changes layered on top of global profiles.

They should be explicit, inspectable, and resettable. Studio must show whether a change comes from a built-in profile, user profile, project profile, publication profile, or local override.

### Suggested Resolution Order

From lowest to highest precedence:

1. OSER built-in defaults.
2. Built-in profile selected by project.
3. User profile, if explicitly referenced.
4. Project profile.
5. Publication profile.
6. Local overrides.
7. Temporary Studio session changes.

Temporary session changes should never be required for reproducible export unless saved into project data.

## 5. Relationship With Git

Git should be translated into editorial UX, not exposed raw by default.

User-facing mapping:

- checkpoint -> commit
- variant -> branch
- compare -> diff
- restore -> checkout or restore
- publish/release -> tag
- incorporate variant -> merge or cherry-pick

### Git Inside The Project

A project can be a Git repository:

```text
my-book.oserproj/
  .git/
  oser-project.json
  source/
  profiles/
```

Benefits:

- easy portability as one folder
- clear project root
- Studio can reason about project state locally

Risks:

- ZIP/package export must decide whether to include `.git/`
- users may accidentally share full history
- large renders/assets can bloat repository history

### Git Beside Or Above The Project

A project can live inside a larger repository:

```text
publishing-repo/
  .git/
  books/
    my-book.oserproj/
```

Benefits:

- works for multi-book repositories
- aligns with developer workflows
- avoids nested Git complexity

Risks:

- Studio must detect repository root separately from project root
- checkpoint scope must be clear
- restore operations may affect files outside the project if not constrained

### Recommendation

Support both models conceptually, but begin with project folder as the operating boundary. Studio should detect Git root and clearly show whether checkpoints apply only to the project or to a larger repository.

Generated renders should be ignored by default unless pinned or explicitly included in a release package.

## 6. Relationship With Tauri

### Why The Web MVP Is Enough Now

The current web MVP is enough for fixtures, allowlisted documents, preview, export, diagnostics, and manifest inspection. It keeps iteration fast and avoids premature desktop packaging decisions.

### Why Tauri May Fit Real Local Projects

Tauri may become appropriate once Studio needs polished local project access.

It can unlock:

- native file/folder picker
- explicit filesystem permissions
- local project opening
- safer output-folder operations
- opening generated files or folders
- persistent app preferences
- bundled local server or command runner
- better desktop integration with smaller footprint than Electron

### Risks Tauri Adds

- packaging complexity
- platform-specific behavior
- security model decisions
- update/distribution workflow
- coupling between Studio UX and desktop shell APIs
- more test matrix surface

### Recommendation

Do not move to Tauri for the fixture MVP. Revisit Tauri when the project model requires real local filesystem workflows and when `oser-project.json` and safe path rules are already defined.

## 7. Browser-Only Mode

Browser-only project workflows may be possible through File System Access API or OPFS.

### File System Access API

Potential benefits:

- native-ish folder/file access from browser
- explicit user permission prompts
- no desktop shell required

Limitations:

- browser compatibility is uneven
- permission persistence can be confusing
- not ideal for all users or organizations
- harder to integrate with existing CLI/Git workflows

### OPFS

Origin Private File System may support local browser-managed project storage.

Potential benefits:

- sandboxed storage
- no direct filesystem exposure
- useful for demos or browser-only experiments

Limitations:

- data is tied to browser origin
- less transparent to users
- portability requires import/export flows
- Git integration is not natural

### Recommendation

Do not depend only on pure browser storage for the first serious version. It can support demo mode, import/export experiments, or hosted workflows later. Real local publishing projects need clearer filesystem and version-control behavior.

## 8. Relationship With WebBook

WebBook is an output family generated from an OSER project or standalone OSER inputs.

### WebBook Folder

A folder output is the most transparent early target:

```text
webbook-output/
  index.html
  assets/
  styles/
  scripts/
  webbook-manifest.json
  search-index.json
```

Benefits:

- easy to inspect
- static-hosting friendly
- easy to diff
- compatible with local preview servers

### WebBook ZIP/Package

A ZIP/package can be a portable distribution format.

Possible extension: `.oserbook`.

Benefits:

- one file to share
- can contain assets and metadata
- future Studio can open/import it for inspection

Limitations:

- browsers do not run ZIP packages directly as websites
- needs extraction or a reader app
- still not an e-reader standard like EPUB

### Single-File HTML

Single-file HTML is useful for review and easy sharing.

Benefits:

- simple to open
- easy to attach or host
- no asset path issues if fully embedded

Limitations:

- large file size
- harder incremental caching
- less natural for large media
- service worker/offline behavior is limited

### Offline / PWA Future

A WebBook folder can later become PWA-capable.

This may include:

- service worker
- offline asset caching
- reading state persistence
- installable app metadata

Offline/PWA should be optional and controlled by `ReadingProfile` or export settings. It should not be required for a basic WebBook.

## 9. Recommended Decisions

### Start With A Project Folder, Not ZIP

The first serious OSER Project Package should be a normal folder with a project extension or naming convention, such as `my-book.oserproj/`.

Reasons:

- easier development
- easier Git integration
- easier debugging
- easier asset handling
- easier incremental renders
- transparent to users

### Add Package/Export Later

Add ZIP/package behavior after the folder model is stable.

Packaging can support:

- sharing a project snapshot
- archiving a release state
- importing into Studio
- sending a review package

### Keep EPUB/PDF/HTML As Separate Outputs

Do not collapse standard outputs into the OSER project package.

The project package is editable state. EPUB/PDF/HTML/WebBook are generated artifacts with different distribution semantics.

### Do Not Expect Native Extension Recognition

OSER extensions help OSER Studio and OSER tooling. They should not replace standard publication formats.

### Keep Render Outputs Disposable By Default

Renders should be reproducible from inputs. Store render history for product usefulness, but do not make generated output the canonical source.

## 10. Next Steps

### Design `oser-project.json`

Define a minimal schema for project metadata.

Initial fields should likely include:

- schema version
- project ID
- title
- default source path
- default layout profile
- default reading profile
- source roots
- asset roots
- profile resolution rules
- render output directory

### Define Profile Resolution

Specify how Studio and `studio-server` resolve built-in, user, project, publication, override, and temporary profiles.

This should happen before implementing LayoutProfile editing.

### Define Render Output Directories By `renderId`

Move from shared `dist/studio` outputs toward per-render output directories.

This enables:

- render history
- output comparison
- concurrent-safe renders
- pinned outputs
- multiple open documents

### Define How Studio Opens A Real Project

Design the first project-open flow before implementing it.

Questions:

- Is the first real project opened by `studio-server` path allowlist?
- Does Studio choose a folder through a desktop shell later?
- What happens if source files reference assets outside the project?
- How does Studio show project trust and permissions?

## Open Questions

- Should `.oserproj` be a folder only, or can it also be a ZIP with the same extension later?
- Should `.oserbook` be OSER's WebBook package extension, or should WebBook remain folder/single-file HTML only for longer?
- Should render outputs be committed to Git when pinned, or stored outside Git by default?
- How should user profiles be referenced in a project without harming reproducibility?
- Should publication profiles become their own first-class package before WebBook export?
- What minimum source mapping is needed before overrides can be portable across source edits?

## Risks

### Format Confusion

Users may confuse editable project packages with final publication outputs. The UI and extensions must keep this distinction clear.

### Premature ZIP Packaging

Starting with ZIP too early can slow development, complicate Git, and make renders/assets harder to inspect. A folder-first model reduces this risk.

### Filesystem Security

Real projects require path resolution, asset access, and output writes. Unsafe path handling would create trust problems. Project roots and allowlists are mandatory.

### Git History Bloat

Large renders and assets can bloat repositories. Renders should be ignored by default and pinned intentionally.

### Profile Reproducibility

User-level profiles can make a project non-portable. Project packages need profile pinning or warnings.

### Extension Expectations

Custom OSER extensions will not make files readable by browsers, e-readers, or stores. Standard exports remain essential.

### Tauri Timing

Moving too early to desktop packaging can distract from core project semantics. Moving too late can block real local workflows. The project model should drive the timing.

## Recommended Technical Next Step

Design `oser-project.json` as a minimal schema and write example project folders under `examples/` or `docs/examples/` before implementing project opening.

The schema should be small enough to support the next Studio milestone:

- open a project folder
- list source files from safe roots
- resolve project profiles
- render to a `renderId` directory
- show manifests and diagnostics per render

Once that schema is reviewed, implement project opening through `studio-server` while keeping OSER Core unchanged.
