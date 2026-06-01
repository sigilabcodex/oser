# OSER Studio Server

`packages/studio-server` is an experimental, optional local adapter for a future OSER Studio GUI. It exposes a small HTTP API over reusable OSER Core operations without moving importer, diagnostics, HTML rendering, PDF rendering, layout profile, or render manifest logic into the server.

No React, Vite, Electron, Tauri, or GUI app is included in this MVP.

## Run

```sh
npm run studio:server
```

By default the server listens on:

```text
http://127.0.0.1:4317
```

`OSER_STUDIO_HOST` and `OSER_STUDIO_PORT` can override the default host and port.

## Fixed MVP Inputs

The server intentionally uses a closed allowlist.

Allowed source documents:

- `examples/editorial-sample.md`
- `stress-tests/cases/bad-heading-hierarchy.md`
- `stress-tests/cases/wide-table.md`

Allowed layout profiles:

- `examples/profiles/classic-book.json`
- `examples/profiles/report.json`

Generated files are written under `dist/studio/`.

## Endpoints

```text
GET  /api/studio/documents
GET  /api/studio/document?sourcePath=...
GET  /api/studio/profiles
POST /api/studio/validate
POST /api/studio/render-html
POST /api/studio/export-pdf
GET  /preview/preview.html
GET  /outputs/export.pdf
```

### `GET /api/studio/documents`

Returns the allowlisted source documents Studio can request.

### `GET /api/studio/document?sourcePath=...`

Returns an allowlisted source document. If `sourcePath` is omitted, the editorial sample is used.

```json
{
  "sourcePath": "examples/editorial-sample.md",
  "content": "...",
  "format": "markdown"
}
```

### `GET /api/studio/profiles`

Returns the allowlisted layout profiles from `examples/profiles/`.

### `POST /api/studio/validate`

Runs OSER diagnostics on an allowlisted `sourcePath`.

Example:

```sh
curl -X POST http://127.0.0.1:4317/api/studio/validate \
  -H 'content-type: application/json' \
  -d '{"sourcePath":"examples/editorial-sample.md"}'
```

### `POST /api/studio/render-html`

Renders HTML through `renderHtmlFromFile(...)` and writes:

- `dist/studio/preview.html`
- `dist/studio/preview.manifest.json`
- `dist/studio/editorial.css`
- `dist/studio/profile-*.css`
- `dist/studio/assets/placeholder.svg`

The response reads and returns the generated `RenderManifest`, plus `previewUrl`.

Example:

```sh
curl -X POST http://127.0.0.1:4317/api/studio/render-html \
  -H 'content-type: application/json' \
  -d '{"sourcePath":"examples/editorial-sample.md","profilePath":"examples/profiles/classic-book.json"}'
```

### `POST /api/studio/export-pdf`

Exports PDF through `renderPdfFromFile(...)` and writes:

- `dist/studio/export.pdf`
- `dist/studio/export.manifest.json`

The response reads and returns the generated `RenderManifest`, plus `pdfUrl`.

Example:

```sh
curl -X POST http://127.0.0.1:4317/api/studio/export-pdf \
  -H 'content-type: application/json' \
  -d '{"sourcePath":"examples/editorial-sample.md","profilePath":"examples/profiles/report.json","format":"A4"}'
```

### Preview and Output Files

`GET /preview/preview.html` serves the generated preview HTML. The preview may reference only allowlisted CSS files copied under `dist/studio/`.

`GET /outputs/export.pdf` serves only the generated PDF export.

The server does not expose a general filesystem browser. The MVP copies `examples/assets/placeholder.svg` to `dist/studio/assets/placeholder.svg` during HTML render and serves it as `/preview/assets/placeholder.svg`.

## Curl Smoke Test

With `npm run studio:server` running in one shell:

```sh
curl http://127.0.0.1:4317/api/studio/documents
curl 'http://127.0.0.1:4317/api/studio/document?sourcePath=stress-tests%2Fcases%2Fwide-table.md'
curl http://127.0.0.1:4317/api/studio/profiles
curl -X POST http://127.0.0.1:4317/api/studio/validate \
  -H 'content-type: application/json' \
  -d '{"sourcePath":"examples/editorial-sample.md"}'
curl -X POST http://127.0.0.1:4317/api/studio/render-html \
  -H 'content-type: application/json' \
  -d '{"sourcePath":"examples/editorial-sample.md","profilePath":"examples/profiles/classic-book.json"}'
curl http://127.0.0.1:4317/preview/preview.html
curl -X POST http://127.0.0.1:4317/api/studio/export-pdf \
  -H 'content-type: application/json' \
  -d '{"sourcePath":"examples/editorial-sample.md","profilePath":"examples/profiles/report.json","format":"A4"}'
curl -o /tmp/oser-studio-export.pdf http://127.0.0.1:4317/outputs/export.pdf
```

## Render Manifest Contract

Render endpoints request manifest generation through reusable Core APIs and then return the generated `RenderManifest`. The future GUI should treat `RenderManifest` as the contract for output paths, render target, profile metadata, generated CSS, and diagnostics.

## Limitations

- The server is local and experimental.
- Only the allowlisted MVP documents and two fixture profiles are allowed.
- There is no GUI, no file picker, no project persistence, and no live editing yet.
- The PDF endpoint requires the existing Playwright setup used by `packages/pdf-renderer`.
- The HTTP surface currently has no dedicated automated tests. Manual smoke test:

```sh
npm run studio:server
```

Then call the endpoints above from another shell.

## Future GUI

A future React app can consume the JSON endpoints for document content, profile selection, validation, HTML preview, and PDF export. The GUI should remain a consumer of this adapter; OSER Core should continue to own import, diagnostics, rendering, profiles, and manifest behavior.
