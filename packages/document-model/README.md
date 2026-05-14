# @oser/document-model

Core TypeScript contracts for OSER documents.

This package defines the semantic document representation that importers and future renderers share. It intentionally avoids output-specific layout concerns such as pagination, PDF settings, browser rendering, and visual page geometry.

Current scope:

- document metadata
- block nodes
- inline nodes
- minimal asset references
- source map hooks for future import review workflows

