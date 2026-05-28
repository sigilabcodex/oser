# Layout Profile UI

Layout profiles are the primary bridge between OSER's declarative rendering engine and a future visual Studio interface.

A layout profile should describe how a document flows into a target medium without turning the GUI into a freeform page layout canvas.

## Role In Studio

In OSER Studio, layout profiles should answer:

- what kind of output is this
- what page or viewport constraints apply
- how sections should begin
- how page furniture should behave
- which style preset is compatible
- which export targets are supported
- which diagnostics matter before export

Changing a layout profile should update preview and diagnostics. It should not rewrite source content.

## Relationship To Style Presets

Layout profiles and style presets are related but separate.

Layout profile:

- page size
- margins
- page flow
- section starts
- running headers and footers
- image placement rules
- export target compatibility

Style preset:

- type scale
- font family choices
- paragraph spacing
- heading treatment
- color tokens
- table and figure styling
- screen or print CSS choices

This separation lets one visual style be reused across multiple page profiles, and one layout profile be tested with multiple visual styles.

## Relationship To Master Pages

A master page is a reusable page pattern inside a layout profile.

Possible master page roles:

- title page
- chapter opener
- body page
- back matter page
- image plate page
- appendix page

Early Studio UI should show master pages as named rules or templates. It should not require users to draw page furniture manually.

## Proposed Inspector Sections

### Profile Summary

Read-only or high-level controls:

- profile name
- description
- intended output
- supported export targets
- compatible style presets

### Page Setup

Initial controls:

- page size: Letter, A4, custom future option
- orientation
- margin preset
- content width
- bleed and trim only when the renderer supports them

### Flow Rules

Controls for structural behavior:

- chapter starts: continuous, next page, recto
- section starts: continuous, next page
- page breaks before headings
- keep headings with following paragraph
- widow/orphan strategy when supported

### Running Elements

Future controls:

- folios
- running headers
- running footers
- section labels
- document title
- chapter title

Early versions can display unsupported items as planned capabilities rather than active controls.

### Images And Figures

Controls when asset handling exists:

- inline image behavior
- max image width
- figure caption placement
- full-page image policy
- missing image diagnostics

### Export Compatibility

Show whether the profile supports:

- HTML
- print HTML
- PDF
- EPUB

The UI should explain when a profile is preview-only or export-ready.

### Diagnostics Rules

Layout profiles can define warnings relevant to output:

- unsupported page size for target
- missing title
- heading jumps
- images too large
- tables likely to overflow
- missing alt text
- profile/export mismatch

These should complement OSER diagnostics rather than replace them.

## Preview Interaction

The preview should respond to layout profile changes.

Expected interactions:

- select profile and regenerate preview
- compare two profiles on the same document
- inspect which profile generated the current preview
- view diagnostics tied to the current profile

The preview should not allow arbitrary dragging of text boxes or manual page edits in early versions.

## Suggested Initial Profiles

Potential seed profiles:

- `editorial-review`: screen-first HTML review.
- `print-proof`: print CSS and PDF proofing.
- `trade-paperback-basic`: future paged-media book layout.
- `web-article`: semantic web output.
- `plain-structure`: unstyled structural inspection.

These are design targets. They should become real profiles only when the underlying renderer supports the required behavior.

## First Version Limits

Initial layout profile UI should avoid:

- arbitrary CSS editing as the default path
- manual text frame placement
- freeform drag-and-drop
- pixel-perfect page furniture editing
- unsupported controls pretending to work

The UI should be honest about renderer capability. If OSER Core cannot yet support a control, Studio should show it as planned or omit it.

## Open Design Questions

- Should layout profiles be JSON, TypeScript, CSS conventions, or a hybrid?
- How should profiles reference style presets?
- Which settings belong in OSER Core versus Studio project files?
- How should custom project profiles be validated?
- How should profile changes be represented in Git diffs?
- What is the smallest useful profile schema for Phase 1 preview?
