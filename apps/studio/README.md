# OSER Studio MVP

`apps/studio` is a small Vite + React + TypeScript reference app for the optional OSER Studio MVP. It consumes `packages/studio-server`; it does not import OSER Core packages directly and does not implement rendering, diagnostics, PDF export, or editorial logic in the browser.

## Run

Use two terminals for the MVP:

```sh
npm run studio:server
```

```sh
npm run studio
```

The frontend runs at `http://127.0.0.1:5173` and proxies `/api`, `/preview`, and `/outputs` to `http://127.0.0.1:4317`.

## What It Does

- loads `GET /api/studio/documents` and `GET /api/studio/document?sourcePath=...`
- loads `GET /api/studio/profiles`
- shows the Markdown source read-only
- selects an allowlisted layout profile
- validates through `POST /api/studio/validate`
- renders HTML through `POST /api/studio/render-html`
- previews generated HTML in an iframe
- exports PDF through `POST /api/studio/export-pdf`, reusing the current `renderId` when available
- links to the generated PDF
- displays RenderManifest/output summaries
- lists recent renders from `GET /api/studio/renders`
- loads previous previews from render history
- displays diagnostics returned by the server
- loads preview images through server allowlisted render URLs

## Boundary

The flow remains:

```text
apps/studio -> packages/studio-server -> OSER Core APIs
```

Studio is optional UI. Core remains usable from CLI commands, scripts, tests, and other integrations without React or Vite.

## Limitations

- read-only source panel
- fixed server fixtures and allowlisted paths
- preview asset handling is limited to known files under `examples/assets/`
- no WYSIWYG editor
- no project persistence beyond local render history under `dist/studio/renders/`
- no Git/checkpoint workflow
- no Tauri/Electron shell
- no standalone production serving path yet
