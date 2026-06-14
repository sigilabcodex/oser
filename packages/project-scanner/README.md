# Project Scanner

Read-only project scanner for OSER Phase 1 project understanding.

The scanner walks an editorial project root, classifies recognized files, computes sizes and SHA-256 checksums, extracts basic Markdown image references, infers candidate sidecar groups, and emits project diagnostics.

It does not execute project scripts, render charts, call external visualization tools, modify scanned projects, or depend on Studio.
