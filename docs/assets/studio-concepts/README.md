# OSER Studio Concept Assets

Reference visuals for OSER Studio product and UX direction.

These files are **conceptual design references**, not production UI assets. They are intended to help future agents, contributors, and designers understand the direction of OSER Studio without coupling the visual app to OSER Core.

## Files

- `oser-studio-workflow.svg` — high-level workflow diagram: imports, semantic recovery, layout profiles, manual overrides, exports.
- `oser-studio-gui-concept.svg` — staged GUI concept: import, review/diagnostics, design/preview, export/versioning.

## Architectural note

OSER Studio is an optional app/client that consumes OSER Core. These visuals should not imply that Studio is required to use OSER. Core must remain usable through CLI/API workflows, TRURL, websites, CI/CD, and other integrations.

## How to use these references

Use them when designing or reviewing:

- `apps/studio`
- `packages/studio-server`
- LayoutProfile UX
- diagnostics UI
- future Git-native checkpoints/variants
- product/investor-oriented presentations

Avoid treating them as exact UI requirements. They describe product direction and interaction concepts.
