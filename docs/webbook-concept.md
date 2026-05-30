# OSER WebBook Concept

OSER WebBook is a proposed digital export line for enriched browser reading.

It is not a replacement for EPUB, PDF, or the current semantic HTML renderer. It should be designed as a future export adapter that consumes `OserDocument` and produces either a self-contained HTML file or a portable static folder with the assets, styles, metadata, and lightweight reader behavior needed for a book-like experience in a browser.

The first implementation target should be documentation and architecture only. No GUI, framework, renderer replacement, or EPUB replacement is implied by this concept.

## Product Definition

A WebBook is a portable browser-readable book package.

Possible output shapes:

- single-file HTML containing document markup, CSS, metadata, and reader script
- static folder containing `index.html`, assets, styles, scripts, search data, and optional manifest files
- web-published microsite that can be hosted on static infrastructure
- local archive that can be opened from disk when browser security rules allow the required features

The intended experience is richer than a plain document page:

- navigable table of contents
- reader controls
- persistent reading state
- bookmarks
- annotations
- search
- optional offline behavior in a later phase

WebBook should remain source-first. The package is generated from source content through OSER's document model and render pipeline. Users should be able to regenerate it reproducibly from the same source, profile, and export settings.

## Difference From Existing Formats

### PDF

PDF is a fixed-form output target for print, proofing, and page-accurate distribution.

PDF should remain the right target when page size, pagination, line breaks, margins, folios, and print behavior are part of the artifact contract. OSER's PDF path can continue to evolve around print CSS, paged-media preview, and browser PDF generation.

WebBook should not promise fixed pagination or print-grade page fidelity. It may support a paginated reading mode, but that mode is a reader interaction, not a print contract.

### EPUB

EPUB is an eBook ecosystem format with packaging, metadata, validation, reading system expectations, store distribution paths, and device compatibility concerns.

EPUB should remain the right target for eBook distribution. A future EPUB exporter should follow EPUB packaging and validation requirements rather than adopting WebBook behavior.

WebBook can borrow reader concepts from eBooks, but it is not an EPUB container. It targets browsers, static hosting, local archives, and controlled microsite-style distribution.

### Simple HTML

Simple HTML is a semantic document rendering.

The current `@oser/html-renderer` should continue to produce clean semantic HTML without product UI assumptions, reader state, local persistence, or deployment concerns.

WebBook builds on semantic HTML but wraps it in a reader shell. The shell may add navigation, settings, state, annotations, and search while keeping the underlying document structure inspectable.

### WebBook

WebBook is an interactive reading experience generated from OSER content.

It should answer a different question from PDF, EPUB, and plain HTML:

- PDF: what should this look like as fixed pages?
- EPUB: how should this enter the eBook ecosystem?
- HTML: what is the semantic web document?
- WebBook: how should this book be read interactively in a browser?

## Initial Feature Set

The initial product scope should stay small enough to be implemented without changing current renderers.

Proposed early features:

- navigable table of contents
- scroll reading mode
- paginated reading mode as a browser interaction
- light, dark, sepia, and e-ink themes
- font size control
- reading width control
- reading progress indicator
- bookmarks
- notes or annotations
- document search
- local persistence through `localStorage`
- offline or PWA support in a later phase

The first implementation should prefer progressive enhancement. A WebBook should remain readable if scripts are disabled or local storage is unavailable, even if advanced controls stop working.

## Proposed Concepts

### ReadingProfile

A `ReadingProfile` describes the reader experience for a WebBook.

Possible fields:

- profile name and version
- default reading mode
- available themes
- default theme
- type scale limits
- reading width limits
- storage policy
- search availability
- annotation availability
- offline support level
- accessibility constraints

`ReadingProfile` should be separate from `LayoutProfile`. A layout profile describes page or output layout rules. A reading profile describes browser reader behavior, preferences, state, and interaction constraints.

### ReaderState

`ReaderState` describes a user's current local reading position and preferences.

Possible fields:

- document identifier
- current location
- reading mode
- selected theme
- font scale
- reading width
- progress
- last opened timestamp
- expanded or collapsed navigation state

Reader state is user-local by default. OSER should not assume account sync, server persistence, or analytics.

### Bookmark

A `Bookmark` is a saved location inside the generated book.

Possible fields:

- stable location reference
- label or generated excerpt
- created timestamp
- optional color or category

Bookmark locations should use stable document anchors where possible. They should not depend only on pixel offsets, because offsets change across themes, viewport widths, and reading modes.

### Annotation

An `Annotation` is a user-created note attached to a location or range.

Possible fields:

- stable location reference
- optional text range
- note body
- created and updated timestamps
- optional color or tag
- local export identifier

Annotations raise stronger privacy and persistence concerns than bookmarks. The default design should make local-only storage explicit and should support export or deletion before adding any sync behavior.

### ReadingTheme

A `ReadingTheme` defines visual tokens for browser reading.

Possible themes:

- light
- dark
- sepia
- e-ink

Theme fields should stay token-based:

- background
- text color
- muted text color
- link color
- selection color
- border color
- code background
- focus outline

Themes should respect accessibility requirements. Dark mode and sepia are preferences, not substitutes for contrast checks. E-ink should avoid heavy animation, subtle contrast, and color-only signals.

### NavigationMap

A `NavigationMap` describes the readable structure of the WebBook.

Possible fields:

- title
- sections
- heading hierarchy
- stable anchors
- reading order
- landmarks
- optional front matter and back matter regions

The navigation map can be generated from `OserDocument` headings and sections. It may later support richer structures such as generated contents, notes, appendices, and cross references.

## Proposed Architecture

Future package shape:

```text
packages/webbook-renderer/
packages/reading-profile/
examples/webbook/
```

### `packages/webbook-renderer/`

Proposed responsibility:

- accept `OserDocument` input
- accept a `ReadingProfile`
- call or reuse semantic HTML rendering
- generate a WebBook shell
- include reader CSS and lightweight script
- generate navigation data
- optionally generate search data
- emit either single-file HTML or static folder output

The package should not replace `@oser/html-renderer`. It should compose it or share lower-level rendering contracts when those exist.

### `packages/reading-profile/`

Proposed responsibility:

- define `ReadingProfile`
- define `ReadingTheme`
- define reader setting constraints
- validate profile compatibility with WebBook export
- provide default reading profiles

This package should not know about browser DOM implementation details. It should define declarative reader behavior and validation.

### `examples/webbook/`

Proposed responsibility:

- contain source fixtures for WebBook export
- demonstrate scroll and paginated reader modes
- demonstrate themes and navigation
- provide generated artifacts for inspection when the feature exists

Examples should remain reproducible and should not become a product demo that hides the source pipeline.

## Relationship With Existing OSER Concepts

### OserDocument

`OserDocument` remains the source of document structure.

WebBook should derive body content, headings, sections, metadata, links, images, figures, tables, and source mapping from the existing document model. If WebBook needs richer anchors or reading-order metadata, those additions should be considered as document-model extensions only when they are useful beyond WebBook.

### LayoutProfile

`LayoutProfile` describes output layout rules, especially for print and page-oriented rendering.

`ReadingProfile` should describe reader behavior. The two may be used together for some targets, but they should not be merged:

- `LayoutProfile`: page size, margins, section starts, print behavior, layout constraints
- `ReadingProfile`: reader mode, themes, font scale, persistence, annotations, navigation behavior

### Diagnostics

Existing diagnostics should run before WebBook export.

WebBook-specific diagnostics may later warn about:

- missing document title
- missing or duplicate heading anchors
- broken internal links
- missing image alt text
- oversized embedded assets
- local storage disabled or unavailable
- unavailable search index
- profile/export incompatibility
- accessibility issues in theme tokens

These should complement structural diagnostics rather than become project-specific editorial policy.

### OSER Studio

OSER Studio can eventually expose WebBook export settings as another export target.

Studio should not need to implement reader behavior itself. It should select a reading profile, preview a generated WebBook, inspect diagnostics, and trigger export through OSER packages.

Possible Studio controls:

- export target: WebBook
- output shape: single HTML or static folder
- reading profile
- default theme
- allowed themes
- search enabled
- bookmarks and annotations enabled
- offline mode when supported

### TRURL

TRURL can be an early consumer of WebBook output for repository-backed manuscripts and portable reading previews.

The boundary should remain clear:

- TRURL owns product workflow, project metadata, account behavior, and editorial experience.
- OSER owns document import, structure, diagnostics, rendering, profiles, and export adapters.
- WebBook owns generated browser reading artifacts, not TRURL's application UI.

TRURL may later add sync or collaboration around annotations, but that should not be assumed by OSER's local WebBook design.

## Limitations And Risks

### Privacy Of Notes

Annotations can contain sensitive reader thoughts, editorial comments, or unpublished manuscript feedback.

Default behavior should be local-only. Any sync, sharing, analytics, or remote storage should be explicit and owned by a host product, not silently added to WebBook.

### Local Persistence

`localStorage` is simple and portable, but it is not durable storage.

Risks:

- browser clearing policies
- storage quota limits
- origin differences between hosted and local files
- private browsing behavior
- inability to share state across devices

The design should support export/import of annotations before treating local state as reliable.

### Offline Compatibility

Offline behavior depends on output shape and hosting context.

A static folder hosted over HTTPS can use service workers in ways that a local `file://` single HTML cannot always support. Offline/PWA support should be a later phase, not part of the first shell.

### Accessibility

WebBook must preserve semantic structure and keyboard navigation.

Risks:

- custom pagination trapping focus
- inaccessible annotation controls
- insufficient theme contrast
- hidden headings or broken landmarks
- search result navigation that is not announced correctly

Accessibility should be validated as part of the reader shell, not left to themes alone.

### E-Ink

E-ink devices often have slower refresh, limited browser support, unusual contrast behavior, and weaker JavaScript performance.

The e-ink theme should avoid animation, low-contrast borders, hover-only controls, and color-dependent cues. Paginated mode should be tested separately on e-ink-class browsers before being presented as supported.

### Printing From WebBook

Printing a WebBook from the browser is not the same as exporting PDF through OSER's PDF pipeline.

WebBook may include print CSS for convenience, but print-grade output should remain the responsibility of print HTML, `LayoutProfile`, paged-media work, and PDF export.

### Local File Security

Browser behavior for `file://` pages is inconsistent.

Risks:

- blocked fetch requests
- unavailable service workers
- origin-specific local storage behavior
- restricted asset loading
- search index loading failures

Single-file HTML reduces some local-file risks at the cost of artifact size.

### Single-File HTML Size

Embedding all CSS, JavaScript, images, fonts, and search data into one file can produce a large artifact.

The renderer should support both single-file and static-folder modes so projects can choose portability or inspectable asset boundaries.

## Roadmap

### Phase 1: Static WebBook Shell

Generate a readable WebBook wrapper around semantic HTML.

Scope:

- no framework
- static CSS and lightweight script
- generated navigation anchors
- single-file or folder output decision documented
- graceful readable fallback without JavaScript

### Phase 2: TOC And Reader Settings

Add table of contents and basic reader controls.

Scope:

- navigable TOC
- scroll mode
- experimental paginated mode
- theme selection
- font size control
- reading width control
- persisted reader settings

### Phase 3: Bookmarks And Notes

Add local reading state.

Scope:

- bookmarks
- annotations
- `localStorage` persistence
- clear local data control
- privacy notes in generated metadata or documentation

### Phase 4: Search

Add client-side document search.

Scope:

- generated search index
- result navigation
- keyboard-accessible search UI
- diagnostics for missing or stale index data

### Phase 5: Offline And PWA

Add offline behavior for compatible static-folder deployments.

Scope:

- optional manifest
- optional service worker
- asset cache strategy
- explicit limits for `file://` use

### Phase 6: Export And Import Annotations

Make local annotations portable.

Scope:

- export annotations to JSON
- import annotations from JSON
- stable annotation location references
- conflict and document-version warnings

### Phase 7: Studio Integration

Expose WebBook as a future Studio export target.

Scope:

- select `ReadingProfile`
- preview generated WebBook
- inspect WebBook diagnostics
- choose single-file or static-folder output
- run export through OSER packages

## Non-Goals

Initial WebBook design should not:

- replace EPUB
- replace PDF
- replace `@oser/html-renderer`
- introduce a frontend framework
- create OSER Studio
- add account sync
- add server-side annotation storage
- promise PWA support for local files
- promise print-grade pagination
