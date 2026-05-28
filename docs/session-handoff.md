# OSER Session Handoff

Fecha de cierre: 2026-05-27

## 1. Estado actual del proyecto

OSER esta en estado de prototipo funcional temprano. El repositorio ya tiene una separacion clara entre modelo documental, importadores, renderers, diagnosticos, perfiles de layout y exportacion PDF experimental.

Paquetes existentes:

- `@oser/document-model`: contratos TypeScript para `OserDocument`.
- `@oser/importers`: importadores TXT y Markdown hacia `OserDocument`.
- `@oser/html-renderer`: render semantic HTML y enlace opcional a CSS.
- `@oser/pdf-renderer`: adaptador PDF experimental con Playwright / Chromium.
- `@oser/diagnostics`: validacion inicial de documentos importados.
- `@oser/layout-profile`: schema declarativo experimental y generacion CSS desde perfiles.

Comandos npm actuales:

- `npm run build`: compila TypeScript.
- `npm run import:markdown -- <input>`: importa Markdown a `OserDocument`.
- `npm run import:txt -- <input>`: importa TXT a `OserDocument`.
- `npm run render:html -- <input> <output> [--style <css|none>]`: renderiza HTML semantico.
- `npm run render:pdf -- <input> <output> [--format <format>] [--style <css>] [--html-output <path>]`: genera PDF experimental.
- `npm run render:examples`: genera ejemplos HTML en `dist/examples/`.
- `npm run render:examples:pdf`: genera PDFs de ejemplo en `dist/examples/`.
- `npm run validate -- <input>`: ejecuta diagnosticos.
- `npm run profile:css -- <profile.json> <output.css>`: genera CSS desde un `LayoutProfile`.
- `npm run test`: smoke test de build, importadores, HTML renderer y diagnosticos.

Que funciona hoy:

- Importar `.txt`, `.md` y `.markdown`.
- Producir `OserDocument` desde los importadores actuales.
- Renderizar semantic HTML reproducible.
- Usar `editorial.css`, `print.css` o `--style none` en HTML.
- Ejecutar diagnosticos basicos sobre documentos importados.
- Generar CSS desde perfiles declarativos JSON.
- Generar PDFs experimentales mediante Playwright / Chromium usando `print.css` por defecto.

## 2. Pipeline actual

```text
TXT / Markdown
  -> OserDocument
  -> diagnostics
  -> semantic HTML
  -> editorial.css / print.css / LayoutProfile CSS
  -> PDF experimental
```

El documento fuente sigue siendo el artefacto primario. HTML, CSS generado desde perfiles y PDF son artefactos derivados y deben poder regenerarse desde fuente, configuracion y renderer settings.

## 3. Hitos implementados hoy

- PDF renderer reusable: `@oser/pdf-renderer` compone importadores, HTML renderer, `print.css` y Playwright / Chromium.
- Diagnostics: `@oser/diagnostics` valida estructura basica y expone CLI con `npm run validate`.
- Documentacion actualizada: README principal, paquetes y docs de arquitectura/flujo reflejan el prototipo actual.
- OSER Studio UX docs: se documento Studio como superficie visual sobre OSER Core, no como motor.
- LayoutProfile schema: existe una capa typed/declarativa para expresar intencion de layout.
- `profile:css`: CLI para convertir perfiles JSON en CSS derivado.

## 4. Limitaciones actuales

- No hay import DOCX/RTF/ODT todavia.
- No hay EPUB todavia.
- No hay GUI todavia.
- No hay Paged.js todavia.
- No hay integracion TRURL real todavia.
- El PDF experimental no tiene folios ni running headers avanzados.
- `LayoutProfile` todavia no esta integrado directamente en `render:html` ni `render:pdf`.
- La validacion de perfiles aun no es un schema validator completo.

## 5. Decisiones arquitectonicas importantes

- La GUI no debe ser el motor. OSER Studio debe llamar a OSER Core, no duplicar importers, renderers, diagnostics o export adapters.
- `LayoutProfile` no es CSS crudo. Es una descripcion tipada de intencion editorial que puede compilar a CSS derivado.
- OSER Core debe seguir separado de OSER Studio. Core mantiene modelo, importadores, diagnosticos, renderers y export adapters.
- TRURL puede ser consumidor/host, no necesariamente el lugar final de Studio. Puede servir para spikes sin acoplar el producto final.
- Git debe traducirse como checkpoints/variants para usuarios no tecnicos. Commits y branches deben existir como detalle tecnico, no como lenguaje primario.

## 6. Proximos pasos recomendados

A. Integrar `--profile` en `render:html` y `render:pdf`.

B. Crear primer spike TRURL -> OSER CLI.

C. Disenar primer prototipo OSER Studio web-only.

D. Investigar DOCX importer con Mammoth.

E. Explorar Paged.js despues de estabilizar perfiles.

## 7. Recomendacion para el siguiente primer paso

Elegir A: integrar `--profile` en `render:html` y `render:pdf`.

Justificacion: ya existe el paquete `@oser/layout-profile`, ya existe `profile:css`, y el gap inmediato es conectar esa capacidad declarativa con los renderers existentes. Este paso valida la arquitectura actual sin introducir GUI, sin depender de TRURL y sin adelantar Paged.js. Tambien deja una ruta clara para Studio: la futura UI podria seleccionar perfiles y llamar al mismo pipeline CLI/API.

## 8. Comandos de verificacion para manana

```bash
npm run build
npm run test
npm run validate -- examples/example.md
npm run profile:css -- examples/profiles/classic-book.json dist/examples/classic-book.css
npm run render:examples:pdf
```
