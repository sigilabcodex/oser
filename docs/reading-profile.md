# Reading Profile

`ReadingProfile` is a proposed declarative configuration layer for OSER WebBook reader behavior.

It is distinct from `LayoutProfile`. A layout profile describes how content should flow into an output medium. A reading profile describes how a browser-based reader should behave once the document has been generated.

This document is a product and technical design note. It does not define an implemented package yet.

## Purpose

A reading profile should make WebBook behavior explicit, reproducible, and inspectable.

It should answer:

- which reading modes are available
- which theme is used by default
- which themes are allowed
- how far users can adjust font size and reading width
- whether bookmarks are enabled
- whether annotations are enabled
- whether search is generated
- whether local persistence is allowed
- whether offline behavior is requested
- which accessibility constraints must be satisfied before export

The profile should be data, not UI. OSER Studio, TRURL, or a CLI can choose and validate a profile without owning the reader implementation.

## Proposed Package

Future package:

```text
packages/reading-profile/
```

Possible responsibilities:

- TypeScript types for reading profiles
- default reading profiles
- reading theme tokens
- profile validation
- compatibility checks for WebBook export options
- serialization helpers if profile JSON is supported

The package should not depend on DOM APIs, browser storage, service workers, or a frontend framework.

## Relationship To LayoutProfile

`LayoutProfile` and `ReadingProfile` should remain separate because they describe different layers.

`LayoutProfile`:

- page size
- margins
- page flow
- section starts
- running headers and footers
- figure and table layout rules
- print behavior
- PDF or paged-media constraints

`ReadingProfile`:

- scroll or paginated reader mode
- theme choices
- reader settings
- progress behavior
- bookmarks
- annotations
- search
- local persistence
- offline capability

Some exports may use both. For example, a WebBook may use a simple layout profile for generated CSS and a reading profile for browser controls. The contracts should still be independently validated.

## Relationship To WebBook Renderer

`packages/webbook-renderer/` should consume a `ReadingProfile`.

The renderer can use the profile to decide:

- which controls to include
- which CSS variables or theme tokens to emit
- which local state keys to use
- whether to generate search data
- whether bookmark or annotation code is included
- whether offline assets are generated
- which diagnostics to run before export

The renderer should treat unsupported profile features as diagnostics, not silently ignore them.

## Suggested Data Model

The exact schema should wait until implementation, but the first version can be small.

Conceptual shape:

```ts
type ReadingProfile = {
  version: "0.1";
  id: string;
  name: string;
  description?: string;
  modes: ReadingMode[];
  defaultMode: ReadingMode;
  themes: ReadingTheme[];
  defaultTheme: string;
  typography: ReadingTypographySettings;
  width: ReadingWidthSettings;
  persistence: ReadingPersistenceSettings;
  features: ReadingFeatureSettings;
  accessibility?: ReadingAccessibilitySettings;
};
```

Supporting concepts:

```ts
type ReadingMode = "scroll" | "paginated";

type ReadingTypographySettings = {
  defaultScale: number;
  minScale: number;
  maxScale: number;
  step: number;
};

type ReadingWidthSettings = {
  defaultMeasure: string;
  minMeasure?: string;
  maxMeasure?: string;
};

type ReadingPersistenceSettings = {
  storage: "none" | "localStorage";
  namespace?: string;
};

type ReadingFeatureSettings = {
  toc: boolean;
  progress: boolean;
  bookmarks: boolean;
  annotations: boolean;
  search: boolean;
  offline: "none" | "planned" | "pwa";
};
```

This is not a committed API. It is a starting point for package design.

## ReadingTheme

`ReadingTheme` should define token-level presentation, not arbitrary CSS.

Conceptual shape:

```ts
type ReadingTheme = {
  id: string;
  name: string;
  tokens: {
    background: string;
    text: string;
    mutedText: string;
    link: string;
    border: string;
    surface: string;
    codeBackground: string;
    selection: string;
    focusOutline: string;
  };
};
```

Initial theme IDs:

- `light`
- `dark`
- `sepia`
- `e-ink`

Themes should be validated for contrast and focus visibility. E-ink should be treated as a constrained mode, not just a grayscale color palette.

## ReaderState

`ReaderState` is runtime user state, not part of the reading profile.

Conceptual shape:

```ts
type ReaderState = {
  documentId: string;
  location?: string;
  mode: ReadingMode;
  themeId: string;
  fontScale: number;
  readingWidth: string;
  progress?: number;
  updatedAt: string;
};
```

The profile defines whether and how state may be stored. The state itself belongs to the reader environment.

## Bookmark

Bookmarks should attach to stable document locations.

Conceptual shape:

```ts
type Bookmark = {
  id: string;
  documentId: string;
  location: string;
  label?: string;
  createdAt: string;
};
```

Locations should prefer generated anchors, heading IDs, block IDs, or future source-map-backed references over viewport coordinates.

## Annotation

Annotations should be local by default and exportable.

Conceptual shape:

```ts
type Annotation = {
  id: string;
  documentId: string;
  location: string;
  range?: {
    start: string;
    end: string;
  };
  body: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
};
```

Annotation storage should be treated as sensitive. Sync, sharing, and account behavior belong to a host product such as TRURL, not to the base WebBook package.

## NavigationMap

`NavigationMap` should describe reading order and navigable structure.

Conceptual shape:

```ts
type NavigationMap = {
  documentId: string;
  title: string;
  items: NavigationItem[];
};

type NavigationItem = {
  id: string;
  title: string;
  href: string;
  level: number;
  children?: NavigationItem[];
};
```

The WebBook renderer can generate this from `OserDocument` headings and sections. Future document-model improvements may make navigation more precise.

## Validation

Reading profile validation should catch configuration errors before export.

Potential diagnostics:

- missing profile ID
- unsupported profile version
- default mode not listed in available modes
- default theme not listed in themes
- duplicate theme IDs
- invalid type scale range
- invalid reading width values
- annotations enabled while persistence is disabled
- search enabled without search-index generation support
- PWA requested for a single-file or local-file output
- theme contrast below required threshold

Validation should produce structured diagnostics compatible with OSER's existing diagnostic style.

## Storage Policy

The first storage target should be `localStorage`.

Reasons:

- simple browser support
- no server dependency
- works for hosted static WebBook outputs
- enough for settings, progress, bookmarks, and small annotations

Known limits:

- not durable archival storage
- origin-specific
- affected by private browsing and browser clearing
- quota-limited
- unreliable for long-term editorial notes

The design should support `storage: "none"` for privacy-sensitive exports and future export/import for annotations.

## Accessibility Requirements

A reading profile should be able to express accessibility expectations, even if enforcement starts small.

Potential constraints:

- minimum contrast ratio
- visible keyboard focus
- reduced motion behavior
- semantic navigation landmarks
- keyboard-accessible TOC
- keyboard-accessible search
- annotation controls reachable without pointer input
- no color-only state indicators

Reader controls should enhance semantic HTML instead of replacing it with inaccessible custom structures.

## Default Profiles

Possible seed profiles:

- `webbook-default`: scroll-first, light/dark/sepia themes, TOC, progress, local settings.
- `webbook-review`: bookmarks and annotations enabled, localStorage enabled, search enabled when supported.
- `webbook-eink`: e-ink theme default, reduced motion, simple controls, scroll-first unless pagination is tested.
- `webbook-private`: no persistence, no annotations, readable browser output only.

These should become real profiles only when the renderer supports them.

## Open Questions

- Should profiles be authored as TypeScript, JSON, or both?
- Should profile validation live in `packages/reading-profile/` or `packages/webbook-renderer/`?
- How stable should generated location references be across source edits?
- Should bookmarks and annotations reference source map data when available?
- How should annotation imports handle changed documents?
- Should search indexing be profile-driven or export-option-driven?
- Should WebBook support custom project themes in phase one?
- What is the smallest useful profile that can ship without creating a GUI?
