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

Generated render files are written under `dist/studio/renders/<renderId>/`. Legacy single-output paths may still exist during transition, but Studio uses render-scoped outputs.

## Endpoints

```text
GET  /api/studio/documents
GET  /api/studio/document?sourcePath=...
GET  /api/studio/profiles
POST /api/studio/validate
POST /api/studio/render-html
POST /api/studio/export-pdf
GET  /api/studio/renders
GET  /preview/renders/:renderId/preview.html
GET  /outputs/renders/:renderId/export.pdf
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

Renders HTML through `renderHtmlFromFile(...)`, creates a `renderId`, and writes:

- `dist/studio/renders/<renderId>/preview.html`
- `dist/studio/renders/<renderId>/preview.manifest.json`
- `dist/studio/renders/<renderId>/editorial.css`
- `dist/studio/renders/<renderId>/profile-*.css`
- `dist/studio/renders/<renderId>/assets/placeholder.svg`

The response reads and returns the generated `RenderManifest`, plus `renderId` and `previewUrl`.

Example:

```sh
curl -X POST http://127.0.0.1:4317/api/studio/render-html \
  -H 'content-type: application/json' \
  -d '{"sourcePath":"examples/editorial-sample.md","profilePath":"examples/profiles/classic-book.json"}'
```

### `POST /api/studio/export-pdf`

Exports PDF through `renderPdfFromFile(...)`. If the request includes an allowed `renderId`, the PDF is written into that render directory; otherwise a new `renderId` is created.

- `dist/studio/renders/<renderId>/export.pdf`
- `dist/studio/renders/<renderId>/export.html`
- `dist/studio/renders/<renderId>/export.manifest.json`

The response reads and returns the generated `RenderManifest`, plus `renderId` and `pdfUrl`.

Example:

```sh
curl -X POST http://127.0.0.1:4317/api/studio/export-pdf \
  -H 'content-type: application/json' \
  -d '{"sourcePath":"examples/editorial-sample.md","profilePath":"examples/profiles/report.json","format":"A4"}'
```

### `GET /api/studio/renders`

Lists render directories under `dist/studio/renders/` whose `renderId` matches the strict server pattern. Each item includes `renderId`, source/profile paths from the manifest, generation time, HTML/PDF availability, output URLs, and diagnostics summary.

### Preview and Output Files

`GET /preview/renders/:renderId/preview.html` serves generated preview HTML for a validated render ID.

`GET /outputs/renders/:renderId/export.pdf` serves generated PDF for a validated render ID.

The server does not expose a general filesystem browser. Render IDs must match `YYYY-MM-DDTHH-MM-SS-abcdef`, and served files are restricted to known filenames inside `dist/studio/renders/<renderId>/`. The MVP copies `examples/assets/placeholder.svg` into the render directory during HTML render and serves only that known asset path.

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
curl http://127.0.0.1:4317/api/studio/renders
curl -X POST http://127.0.0.1:4317/api/studio/export-pdf \
  -H 'content-type: application/json' \
  -d '{"sourcePath":"examples/editorial-sample.md","profilePath":"examples/profiles/report.json","format":"A4","renderId":"<renderId-from-render-html>"}'
curl -o /tmp/oser-studio-export.pdf http://127.0.0.1:4317/outputs/renders/<renderId>/export.pdf
```

## Render Manifest Contract

Render endpoints request manifest generation through reusable Core APIs and then return the generated `RenderManifest`. The future GUI should treat `RenderManifest` as the contract for output paths, render target, profile metadata, generated CSS, and diagnostics.

## Limitations

- The server is local and experimental.
- Only the allowlisted MVP documents and two fixture profiles are allowed.
- There is no file picker, no project persistence, and no live editing yet.
- The PDF endpoint requires the existing Playwright setup used by `packages/pdf-renderer`.
- The HTTP surface currently has no dedicated automated tests. Manual smoke test:

```sh
npm run studio:server
```

Then call the endpoints above from another shell.

## Future GUI

A future React app can consume the JSON endpoints for document content, profile selection, validation, HTML preview, and PDF export. The GUI should remain a consumer of this adapter; OSER Core should continue to own import, diagnostics, rendering, profiles, and manifest behavior.
