# Bad Heading Hierarchy

This small stress test starts with a valid top-level heading and then intentionally uses suspicious heading jumps. It should remain readable, but diagnostics should help an editor find structural problems.

### Jumped Directly To H3

This heading skips H2 after the opening H1. The document still has normal prose so rendering should not fail.

- First observation
- Second observation
- Third observation

#### Jumped Again To H4

This section deepens the hierarchy before the missing H2 has appeared. It is useful for checking whether diagnostics report repeated heading jumps.

## Late H2 Section

This H2 arrives after lower-level headings. That may be technically valid in Markdown, but it is suspicious in an editorial outline and should be easy to review.

### Back To H3 Under Late H2

This section is properly nested under the late H2.

| Area | Expected Review | Notes |
| --- | --- | --- |
| Import | Should not crash | Markdown remains valid |
| Diagnostics | Should flag skipped heading levels | May miss outline-order concerns |
| Render | Should produce readable HTML | Layout is not the focus |

## Another H2

The ending returns to a normal heading level to confirm the renderer can continue after suspicious structure.
