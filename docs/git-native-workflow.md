# Git-Native Editorial Workflow

OSER Studio should make Git-backed editorial work understandable without requiring users to think like software developers.

The design goal is not to hide Git completely. The goal is to translate common Git concepts into editorial language while preserving the benefits of versioned, reviewable, reproducible source files.

## Concept Mapping

| Git concept | Studio language | Editorial meaning |
| --- | --- | --- |
| commit | checkpoint | A saved editorial state with a title and notes. |
| branch | variant | A parallel editorial or layout direction. |
| diff | compare changes | A review of what changed between states. |
| checkout | restore or switch variant | Move the workspace to a prior checkpoint or another variant. |
| merge | incorporate variant | Bring changes from one variant into another. |
| tag | publication or release | Mark a stable published/exported state. |

## Checkpoints

A checkpoint should feel like an editorial save point:

- First print proof
- Post copyedit pass
- Layout profile test
- Publisher review PDF

Checkpoint UI should collect:

- title
- optional notes
- changed files summary
- diagnostics state
- export artifacts if included

Under the hood, a Git-backed checkpoint can be a commit. Studio should make the commit hash available, but it should not be the primary label.

## Variants

A variant is a named alternative direction.

Possible variants:

- shorter edition
- large-print layout
- web-first article version
- paperback trim test
- alternate chapter order

In Git, a variant maps naturally to a branch. Studio should present variant switching as a workspace action with clear dirty-state warnings.

## Compare Changes

Diff should become "compare changes."

A useful Studio compare view should separate:

- source content changes
- document structure changes
- layout profile changes
- style preset changes
- export setting changes
- generated artifact changes when tracked

The first version can show text-level diffs and file summaries. Later versions can add rendered preview comparison or diagnostics comparison.

## Restore Or Switch Variant

Checkout should become two different user-facing actions:

- restore checkpoint: return to a previous editorial state
- switch variant: move to a parallel working direction

Both actions need clear treatment of unsaved work:

- warn when local changes are not checkpointed
- allow cancel
- eventually allow temporary checkpoint before switching

Studio should not run destructive Git operations without explicit user confirmation.

## Incorporate Variant

Merge should become "incorporate variant."

The user intent is editorial:

- bring layout profile changes from print proof into main edition
- bring revised chapter text from copyedit variant into current project
- combine diagnostics fixes from another variant

Studio should report conflicts in terms of files, document sections, and settings when possible. Raw conflict markers are a fallback, not the desired primary experience.

## Publication And Release Tags

Tags should become publication or release markers.

Examples:

- `v0.1-review-pdf`
- `2026-05-print-proof`
- `first-public-web-release`

The UI can collect:

- publication label
- export target
- output paths
- diagnostics summary
- notes

Tags should mark reproducible states. They should not replace generated export metadata.

## Git Visibility Levels

Studio can support layers of Git detail.

### Editorial Mode

Default mode for most users:

- checkpoints
- variants
- compare changes
- restore
- incorporate
- publications

### Technical Details

Optional detail for advanced users:

- branch name
- commit hash
- changed files
- raw diff
- remote status if remote support exists

### Recovery Mode

Future advanced mode for unresolved Git states:

- conflicts
- detached states
- failed merges
- untracked files

Recovery mode should be explicit and conservative.

## Relationship To Generated Artifacts

OSER treats generated outputs as derived artifacts. A Git-native Studio workflow should make that clear.

Possible policies:

- track source and configuration only
- track selected release artifacts
- store generated exports outside the repo
- include export metadata but not binary output

Studio should let projects choose a policy, but the default should favor reproducibility from source plus settings.

## First Version Limits

The first Git-native Studio surface should not attempt to cover all Git operations.

Initial scope:

- show current state
- create checkpoint
- list checkpoints
- compare current work to a checkpoint
- create and switch variants

Deferred:

- remotes
- pull/push
- complex rebase flows
- multi-user conflict workflows
- hosted review approvals
