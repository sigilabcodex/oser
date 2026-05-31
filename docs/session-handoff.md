# OSER Session Handoff

Fecha de cierre: 2026-05-30

## 1. Estado actual del repo

### OSER Core

OSER Core esta en estado de prototipo funcional temprano. Ya cuenta con:

- importadores TXT/Markdown hacia `OserDocument`;
- `OserDocument` como modelo documental comun;
- diagnostics basicos;
- `html-renderer` con `renderDocumentToHtml(...)` y `renderHtmlFromFile(...)`;
- `pdf-renderer` con `renderPdfFromFile(...)`;
- `layout-profile` para compilar perfiles JSON a CSS;
- `render-manifest` como contrato de outputs, settings y diagnostics;
- CLIs `render:html`, `render:pdf`, `validate` y `profile:css`.

Core no depende de Studio, React, Vite ni `studio-server`.

### studio-server

`packages/studio-server` existe como adapter HTTP local, experimental y opcional. Usa Node HTTP nativo y consume APIs reutilizables de Core.

Endpoints actuales:

- `GET /api/studio/document`
- `GET /api/studio/profiles`
- `POST /api/studio/validate`
- `POST /api/studio/render-html`
- `POST /api/studio/export-pdf`
- `GET /preview/preview.html`
- `GET /preview/editorial.css`
- `GET /preview/profile-classic-book.css`
- `GET /preview/profile-report.css`
- `GET /preview/assets/placeholder.svg`
- `GET /outputs/export.pdf`

El server mantiene allowlists para fixtures conocidos y outputs bajo `dist/studio/`.

### apps/studio

`apps/studio` existe como app Vite + React + TypeScript minima. Consume `studio-server` mediante HTTP/proxy. No implementa render, diagnostics, export PDF ni logica editorial en el frontend.

## 2. Pipeline actual confirmado

```text
Markdown / TXT
  -> OserDocument
  -> diagnostics
  -> LayoutProfile
  -> HTML preview
  -> PDF export
  -> RenderManifest
```

HTML preview y PDF export escriben manifests. Studio consume esos manifests como contrato de outputs y diagnostics.

## 3. Que funciona en la GUI

- Carga source desde `GET /api/studio/document`.
- Carga perfiles desde `GET /api/studio/profiles`.
- Muestra Markdown read-only.
- Permite seleccionar perfil.
- `Validate` llama `POST /api/studio/validate`.
- `Render HTML` llama `POST /api/studio/render-html`.
- Muestra preview en iframe usando `previewUrl`.
- `Export PDF` llama `POST /api/studio/export-pdf`.
- Muestra link al PDF usando `pdfUrl`.
- Muestra diagnostics devueltos por el server.

## 4. Que se corrigio hoy

- Se creo `renderHtmlFromFile(...)` como API reusable de `html-renderer`.
- El CLI `renderHtml.ts` delega en `renderHtmlFromFile(...)` sin cambiar comportamiento publico.
- `studio-server` usa APIs reusables: `renderHtmlFromFile(...)` y `renderPdfFromFile(...)`.
- Se creo el frontend OSER Studio MVP en `apps/studio`.
- Se corrigio asset handling del preview: `examples/assets/placeholder.svg` se copia a `dist/studio/assets/placeholder.svg` y se sirve por allowlist como `/preview/assets/placeholder.svg`.
- Se endurecio el serving de assets para rechazar dot-segments y `%2e` en rutas GET.

## 5. Limitaciones actuales

- Source read-only.
- No hay edicion de `LayoutProfile` todavia.
- No hay Git/checkpoints reales.
- No hay DOCX/ODT/RTF.
- No hay WebBook.
- No hay Paged.js.
- No hay Tauri/Electron.
- Asset handling todavia es minimo y fixture-oriented.
- Preview no es todavia paginacion final avanzada.
- `studio-server` usa fixtures allowlisted; no hay file picker ni proyectos persistentes.

## 6. Proximos pasos recomendados

A. Editor JSON simple para `LayoutProfile`.

B. Refresh automatico del preview al cambiar perfil.

C. Mostrar `RenderManifest` completo en la UI.

D. Mejorar asset pipeline.

E. Preparar primer spike de Git checkpoints.

F. Luego pensar en DOCX importer.

## 7. Comandos para retomar manana

```bash
npm run build
npm run test
npm run studio:server
npm run studio
```

Para usar Studio MVP, correr `studio:server` y `studio` en dos terminales.
