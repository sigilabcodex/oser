# OSER Visual File Inspection Pipeline

Fecha: 2026-06-13

## Resumen

Esta nota propone una capacidad modular para que OSER inspeccione archivos visuales y documentales usando herramientas FLOSS locales antes de importarlos, renderizarlos o pedir razonamiento a un LLM.

Nombre provisional de la capacidad:

```text
visual_file_inspection_pipeline
```

Nombre de paquete sugerido, si se implementa:

```text
@oser/file-inspection
```

El nombre `file-inspection` es más amplio que `visual_file_inspection_pipeline` y encaja mejor con OSER porque la capacidad cubriría imágenes, SVG, PDF, DOCX, Markdown con imágenes y HTML exportado. La inspección visual seguiría siendo uno de sus modos principales.

La salida debería ser un artefacto reproducible y machine-readable, no una interpretación editorial final. Ese artefacto puede alimentar diagnostics, importers futuros, Studio, TRURL, CI o agentes locales.

## Motivación

OSER ya separa fuente, modelo documental, diagnostics, render HTML, export PDF y manifest. Esa arquitectura permite agregar una fase previa de inspección sin mezclar responsabilidades.

Hoy OSER importa TXT y Markdown. DOCX, HTML, EPUB, asset pipeline, TRURL y Studio son áreas futuras o en progreso. Todas esas áreas se benefician de una capa de inspección que pueda responder preguntas básicas antes de convertir:

- Qué tipo de archivo es realmente.
- Qué dimensiones o metadatos técnicos tiene.
- Si contiene texto embebido.
- Si requiere OCR.
- Si contiene imágenes referenciadas o embebidas.
- Si parece corrupto, enorme, riesgoso o de baja confianza.
- Qué herramientas locales fueron usadas para producir evidencia.

Esta capa no debe depender de visión multimodal propietaria. Puede usar herramientas FLOSS locales cuando existan y degradar con claridad cuando no existan.

## Caso De Uso Observado

En el proyecto `cartografia-de-la-impunidad`, Codex detectó herramientas locales como:

- `chafa`
- `tesseract`
- `python3`
- `file`
- `find`
- `ripgrep`

Con ellas pudo:

- previsualizar imágenes desde terminal;
- extraer texto con OCR local;
- leer metadatos básicos;
- validar SVG/XML;
- validar JSON;
- inspeccionar imágenes y documentos sin depender únicamente de visión multimodal propietaria.

El aprendizaje para OSER es que esa lógica puede formalizarse como una capacidad reproducible: detección de herramientas, inspección por tipo de archivo, extracción de evidencia, warnings de confianza y salida estructurada.

## Encaje En La Arquitectura De OSER

La arquitectura actual separa:

```text
TXT / Markdown
  -> @oser/importers
  -> @oser/document-model
  -> @oser/diagnostics
  -> @oser/html-renderer
  -> @oser/pdf-renderer
  -> @oser/render-manifest
```

La inspección propuesta debería vivir antes o al lado de `@oser/importers`, no dentro de renderers ni Studio.

Arquitectura sugerida:

```text
source file / asset
  -> @oser/file-inspection
  -> FileInspectionReport
  -> importer / diagnostics / manifest / Studio / TRURL
```

Relación con paquetes existentes:

- `@oser/importers`: puede consumir reportes de inspección para tomar mejores decisiones, pero no debe depender obligatoriamente de todas las herramientas externas.
- `@oser/diagnostics`: puede incorporar hallazgos derivados del reporte, por ejemplo imagen sin dimensiones, OCR de baja confianza o PDF sin texto embebido.
- `@oser/render-manifest`: podría referenciar reportes de inspección como artefactos auxiliares, sin convertirlos en parte obligatoria del render.
- `packages/studio-server`: puede exponer reportes ya generados a Studio como adaptador opcional.
- TRURL: puede orquestar inspección de repositorios documentales, revisar assets y decidir conversiones.

Esta capacidad no debe modificar archivos originales, no debe ejecutar macros y no debe convertirse en una ruta oculta de importación.

## Nombre Y Límite Del Módulo

Nombre operativo:

```text
visual_file_inspection_pipeline
```

Nombre de paquete recomendado:

```text
packages/file-inspection
```

API conceptual futura:

```ts
inspectFile(inputPath, options) -> FileInspectionReport
inspectMany(inputPaths, options) -> FileInspectionReport[]
detectInspectionTools() -> ToolAvailabilityReport
```

CLI conceptual futura:

```bash
npm run inspect:file -- path/to/file.png --json dist/inspection/file.json
npm run inspect:file -- path/to/document.pdf --markdown dist/inspection/document.md
```

Esta nota no implementa esas APIs. Solo define el contrato conceptual.

## Herramientas FLOSS Candidatas

### Obligatorias

Estas deberían tener alternativas mínimas en sistemas POSIX o Node:

- `file`: detección MIME y tipo real del archivo.
- Node `fs`/`path`/`crypto`: tamaño, timestamps, checksum y rutas.
- parsers estándar cuando existan en la stack del paquete.

Si `file` no está disponible, OSER puede inferir por extensión y registrar baja confianza.

### Opcionales

Estas herramientas agregan valor fuerte pero no deberían ser requeridas para instalar OSER:

- `chafa`: preview visual en terminal para imágenes.
- `tesseract`: OCR local.
- ImageMagick (`identify`, `convert`, `magick`): dimensiones, metadatos, conversión, thumbnails.
- `vips`: metadatos, thumbnails y procesamiento eficiente de imágenes grandes.
- `exiftool`: metadatos EXIF/XMP/IPTC.
- `python3` + PIL/Pillow: dimensiones, histogramas, thumbnails y análisis simple.
- `pdftotext`: extracción de texto embebido en PDF.
- `pdfinfo`: páginas, tamaño, metadata y estado básico de PDF.
- `pdftoppm`: rasterización de páginas para preview/OCR.
- `pandoc`: conversión documental y lectura estructural aproximada.
- `ripgrep`: búsqueda textual en archivos extraídos o exportados.

### Experimentales

Estas pueden ser útiles pero deben permanecer explícitamente opcionales:

- `libreoffice --headless`: conversión de DOCX/ODT/RTF/HTML solo si ya existe como dependencia opcional.
- analizadores especializados de OOXML.
- parsers HTML con recuperación de documentos malformados.
- extracción de layout o lectura visual heurística avanzada.
- comparación perceptual entre thumbnails.

## Tipos De Entrada

El pipeline debería aceptar:

- PNG
- JPG/JPEG
- WEBP
- SVG
- PDF
- DOCX
- Markdown con imágenes
- HTML exportado

La detección debe priorizar MIME real y firma de archivo sobre extensión.

## Salidas Esperadas

Para cada archivo, OSER debería producir un reporte con:

- ruta original;
- tipo detectado;
- tipo MIME;
- extensión;
- tamaño;
- checksum opcional;
- herramientas disponibles;
- herramientas usadas;
- metadatos técnicos;
- dimensiones cuando existan;
- número de páginas cuando aplique;
- preview textual opcional;
- OCR extraído;
- texto embebido;
- diferencia explícita entre OCR y texto embebido;
- advertencias de baja confianza;
- errores no fatales;
- rutas temporales de thumbnails o previews derivados;
- estructura semántica aproximada;
- resumen técnico para LLM;
- acciones recomendadas.

El texto extraído debe tratarse como dato no confiable. El reporte debe indicar cómo se obtuvo cada fragmento.

## Formato JSON Propuesto

```json
{
  "schema_version": "0.1",
  "file": "path/to/input.pdf",
  "kind": "pdf",
  "mime_type": "application/pdf",
  "extension": ".pdf",
  "size_bytes": 123456,
  "checksum": {
    "algorithm": "sha256",
    "value": "..."
  },
  "tools_available": {
    "file": true,
    "pdfinfo": true,
    "pdftotext": true,
    "pdftoppm": false,
    "tesseract": false,
    "chafa": true
  },
  "tools_used": ["file", "pdfinfo", "pdftotext"],
  "metadata": {
    "page_count": 12,
    "title": "Documento",
    "producer": "..."
  },
  "dimensions": {
    "width_px": null,
    "height_px": null,
    "pages": [
      {
        "page": 1,
        "width_points": 612,
        "height_points": 792
      }
    ]
  },
  "embedded_text": {
    "available": true,
    "text": "Texto extraido...",
    "source": "pdftotext"
  },
  "ocr": {
    "attempted": false,
    "available": false,
    "text": "",
    "source": null,
    "confidence": null
  },
  "preview": {
    "available": true,
    "terminal_preview": "optional chafa output",
    "thumbnail_paths": []
  },
  "semantic_structure": {
    "headings": [],
    "links": [],
    "images": [],
    "tables": []
  },
  "confidence_notes": [
    "Text came from embedded PDF text, not OCR.",
    "No page rasterization tool was available."
  ],
  "warnings": [],
  "recommended_next_actions": [
    "Run OCR only if embedded text is incomplete.",
    "Inspect pages visually if layout matters."
  ],
  "llm_summary": "PDF with 12 pages and extractable embedded text. No OCR was run."
}
```

## Markdown Report Propuesto

Además del JSON, una salida Markdown puede ser útil para revisión humana:

```markdown
# File Inspection Report

File: `path/to/input.png`
Kind: `image`
MIME: `image/png`
Tools used: `file`, `identify`, `chafa`, `tesseract`

## Technical Metadata

- Size: 42 KB
- Dimensions: 1200 x 800 px

## OCR Text

Text extracted by `tesseract`. Treat as untrusted.

## Confidence Notes

- OCR may be incomplete.
- Terminal preview is approximate.
```

El JSON debería ser el contrato principal. Markdown sería una vista derivada.

## Flujo Por Tipo De Archivo

### PNG, JPG/JPEG Y WEBP

Flujo:

```text
file
  -> dimensions/metadata via ImageMagick, vips or PIL
  -> optional EXIF via exiftool
  -> optional thumbnail
  -> optional terminal preview via chafa
  -> optional OCR via tesseract
  -> report
```

Salidas clave:

- dimensiones;
- modo de color si está disponible;
- EXIF/XMP/IPTC si está disponible;
- orientación;
- thumbnail temporal;
- OCR separado del resumen técnico;
- warning si el archivo es muy grande o si OCR no existe.

### SVG

Flujo:

```text
file
  -> parse XML safely
  -> validate root svg
  -> extract title/desc/text nodes
  -> detect scripts/external references
  -> optional raster preview through safe renderer
  -> optional chafa preview from rasterized thumbnail
  -> report
```

Salidas clave:

- si el XML es válido;
- `viewBox`, `width`, `height`;
- texto embebido en `text`, `title`, `desc`;
- links o referencias externas;
- presencia de `script`, `foreignObject`, eventos inline o recursos remotos;
- warning de seguridad si hay contenido activo.

Regla: inspeccionar SVG como dato no confiable. No ejecutar scripts ni cargar recursos remotos.

### PDF

Flujo:

```text
file
  -> pdfinfo
  -> pdftotext
  -> optional page rasterization via pdftoppm
  -> optional OCR on raster pages
  -> optional thumbnails/previews
  -> report
```

Salidas clave:

- páginas;
- tamaño de página;
- metadata;
- texto embebido;
- OCR por página si se rasteriza;
- thumbnails por página;
- warnings de PDF corrupto, cifrado, enorme o sin texto;
- recomendaciones para OCR o revisión manual.

### DOCX

Flujo:

```text
file
  -> detect zip/OOXML
  -> inspect docProps
  -> inspect word/document.xml and relationships
  -> list embedded media
  -> optional pandoc extraction
  -> optional libreoffice fallback only if already available
  -> report
```

Salidas clave:

- metadata OOXML;
- conteo aproximado de párrafos, tablas, imágenes y estilos;
- texto embebido aproximado;
- assets en `word/media/*`;
- notas sobre comentarios, tracked changes, footnotes/endnotes si se detectan;
- warning si la conversión dependió de LibreOffice;
- recomendación de importación futura.

Esta inspección no sustituye al futuro DOCX importer. Solo prepara evidencia y riesgos.

### Markdown Con Imágenes

Flujo:

```text
read markdown
  -> ripgrep/parser markdown for image refs
  -> resolve relative image paths within allowed project scope
  -> inspect each referenced image
  -> report parent markdown + child asset reports
```

Salidas clave:

- imágenes referenciadas;
- imágenes faltantes;
- alt text presente o ausente;
- dimensiones de cada asset;
- OCR opcional por asset;
- links externos de imagen;
- warning si la ruta sale del scope permitido.

### HTML Exportado

Flujo:

```text
file
  -> parse HTML safely
  -> extract title/headings/text
  -> list img/video/object/embed references
  -> inspect local image refs within allowed scope
  -> optional pandoc conversion
  -> report
```

Salidas clave:

- título;
- headings;
- texto visible aproximado;
- imágenes referenciadas;
- scripts, iframes, forms y recursos remotos;
- warning si el HTML parece exportado desde Word, LibreOffice, Google Docs u otra herramienta;
- recomendación de importación o limpieza.

No se debe ejecutar JavaScript durante la inspección básica.

## Capacidades Obligatorias, Opcionales Y Experimentales

### Obligatorias

- detectar existencia del archivo;
- registrar tamaño y extensión;
- detectar tipo MIME con `file` o fallback por extensión;
- producir JSON válido;
- registrar herramientas disponibles y usadas;
- registrar errores no fatales;
- no modificar el archivo original;
- limitar rutas de salida a un directorio temporal o `dist/inspection/`;
- distinguir texto embebido, OCR y texto derivado;
- tratar todo contenido extraído como no confiable.

### Opcionales

- preview terminal con `chafa`;
- OCR con `tesseract`;
- metadata rica con ImageMagick, vips o exiftool;
- thumbnails;
- PDF text extraction con `pdftotext`;
- PDF page metadata con `pdfinfo`;
- PDF rasterization con `pdftoppm`;
- conversión documental con `pandoc`;
- búsqueda textual con `ripgrep`;
- análisis de dimensiones o histogramas con PIL.

### Experimentales

- LibreOffice headless como fallback de último recurso;
- inferencia de estructura visual;
- comparación perceptual de imágenes;
- extracción compleja de OOXML;
- heurísticas para detectar tablas visuales en imágenes;
- integración directa con agentes que decidan siguientes pasos automáticamente.

## Estrategia De Fallback

La inspección debe degradar sin fallar cuando una herramienta no existe.

Reglas:

- Si `tesseract` no existe, continuar sin OCR y registrar `ocr.available: false`.
- Si `chafa` no existe, continuar sin preview terminal.
- Si ImageMagick no existe, intentar `vips`.
- Si `vips` no existe, intentar PIL si `python3` y Pillow están disponibles.
- Si `exiftool` no existe, continuar con metadatos mínimos.
- Si `pdftotext` no existe, intentar `pandoc` para texto PDF solo si está disponible y es apropiado.
- Si `pdfinfo` no existe, registrar metadata PDF incompleta.
- Si `pdftoppm` no existe, continuar sin thumbnails de PDF.
- Si `pandoc` no existe, inspeccionar Markdown/HTML/DOCX con parsers básicos o reportar capacidad limitada.
- Si LibreOffice no existe, no intentar conversiones office fallback.
- Si nada existe, devolver tamaño, extensión, checksum opcional, inferencia por extensión y advertencia explícita.

Ejemplo de warning:

```json
{
  "code": "tool_missing",
  "severity": "info",
  "message": "tesseract was not available; OCR was skipped.",
  "tool": "tesseract"
}
```

## Riesgos

### OCR Incorrecto

El OCR puede omitir texto, confundir caracteres, alterar números o inventar separaciones. En documentos editoriales, esto puede contaminar análisis de citas, cifras o nombres propios.

Mitigación:

- separar `ocr.text` de `embedded_text.text`;
- registrar herramienta e idioma usado;
- agregar notas de confianza;
- conservar referencia a página, imagen o región cuando exista.

### Alucinación Por Texto Mal Reconocido

Un LLM puede tratar OCR defectuoso como verdad.

Mitigación:

- marcar OCR como dato no confiable;
- incluir `confidence_notes`;
- recomendar revisión humana cuando OCR contenga cifras, nombres propios o evidencia sensible.

### Imágenes Con Texto Sensible

OCR puede extraer datos personales o información privada.

Mitigación:

- no enviar texto extraído a servicios externos por defecto;
- permitir redacción o exclusión futura;
- registrar que OCR fue ejecutado;
- conservar salidas en directorios controlados.

### Archivos Enormes

Imágenes grandes, PDFs extensos o DOCX con muchos assets pueden consumir CPU, memoria y tiempo.

Mitigación:

- límites de tamaño;
- límites de páginas;
- límites de thumbnails;
- timeouts por herramienta;
- opción de inspección superficial.

### PDFs Corruptos O Cifrados

Herramientas PDF pueden fallar o colgarse.

Mitigación:

- ejecutar con timeout;
- capturar stderr;
- reportar error no fatal;
- no bloquear todo el pipeline por una página.

### Formatos Maliciosos

SVG, PDF, DOCX y HTML pueden contener scripts, recursos externos, macros o payloads raros.

Mitigación:

- no ejecutar macros;
- no ejecutar JavaScript;
- no cargar recursos remotos;
- parsear como datos;
- trabajar en directorios temporales;
- limitar procesos externos.

### Comandos Externos Inseguros

Pasar rutas o argumentos sin sanitizar a comandos externos puede abrir inyección de comandos.

Mitigación:

- usar `spawn`/APIs con arrays de argumentos, no shell strings;
- no interpolar rutas en comandos shell;
- allowlist de herramientas;
- registrar versiones cuando sea posible;
- timeouts y límites de salida.

### Contaminación Del Contexto Del LLM

El texto extraído puede incluir instrucciones maliciosas, prompts embebidos o contenido engañoso.

Mitigación:

- envolver texto extraído como datos citados/no confiables;
- separar resumen técnico de contenido;
- truncar salidas largas;
- no mezclar OCR directamente con instrucciones del sistema;
- preservar procedencia por archivo, página y herramienta.

## Reglas De Seguridad

Reglas iniciales:

- Nunca ejecutar macros.
- Nunca modificar archivos originales.
- Nunca ejecutar JavaScript de HTML o SVG durante inspección básica.
- Nunca cargar recursos remotos por defecto.
- Usar directorios temporales o `dist/inspection/` para derivados.
- Limitar tamaño de entrada.
- Limitar tiempo de ejecución por herramienta.
- Limitar número de páginas rasterizadas.
- Limitar tamaño de stdout/stderr capturado.
- Registrar herramientas usadas y, si es barato, sus versiones.
- Tratar todo texto extraído como dato no confiable.
- Distinguir texto OCR de texto embebido.
- Usar APIs de procesos con argumentos estructurados.
- Rechazar path traversal cuando se inspeccionen assets referenciados por Markdown o HTML.
- Permitir modo superficial cuando el archivo sea grande o las herramientas falten.

## Relación Con Diagnostics

`@oser/diagnostics` valida un `OserDocument` ya importado. La inspección propuesta opera sobre archivos antes de importar o sobre assets referenciados.

No deberían fusionarse inicialmente.

Relación futura:

```text
FileInspectionReport
  -> importer warnings
  -> OserDocument
  -> diagnostics
  -> RenderManifest
```

Ejemplos de diagnostics derivados:

- imagen referenciada sin dimensiones;
- imagen sin alt text en Markdown;
- PDF sin texto embebido;
- DOCX con tracked changes;
- SVG con scripts;
- OCR ejecutado con baja confianza;
- asset faltante.

## Relación Con Render Manifest

`@oser/render-manifest` registra resultados exitosos de render/export. Un reporte de inspección puede ser un artefacto anterior o auxiliar.

Opción futura:

```json
{
  "inspection_reports": [
    "dist/inspection/source.inspection.json",
    "dist/inspection/assets/photo.inspection.json"
  ]
}
```

Esto mantendría el manifest como handoff para Studio/TRURL sin inflar el `OserDocument`.

## Relación Con TRURL

TRURL podría usar esta capacidad como orquestador documental:

```text
repository files
  -> inspect files and assets
  -> generate inspection reports
  -> decide import/conversion path
  -> run OSER import/render/diagnostics
  -> expose reports to users or agents
```

La división propuesta mantiene OSER como infraestructura reusable y deja a TRURL la política de producto: qué archivos inspeccionar, cuándo pedir aprobación humana, qué texto mostrar y qué acciones automatizar.

## Preguntas Abiertas

- ¿El paquete debería llamarse `@oser/file-inspection`, `@oser/asset-inspection` o `@oser/source-inspection`?
- ¿Los reportes deben vivir por defecto en `dist/inspection/` o en un directorio temporal no versionado?
- ¿Debe existir un schema JSON formal desde la primera implementación?
- ¿Cómo versionar reportes cuando las herramientas locales cambian?
- ¿Debe OSER registrar versiones de herramientas siempre o solo en modo verbose?
- ¿Qué límites iniciales son razonables para tamaño de archivo, páginas PDF y duración de OCR?
- ¿Debe la inspección ser síncrona por archivo o diseñarse desde el inicio como cola/orquestación?
- ¿Cómo representar texto extraído por página, región o asset sin hacer el JSON demasiado pesado?
- ¿Qué parte debe ser Core y qué parte debe ser adaptador para Studio/TRURL?
- ¿Debe el futuro DOCX importer consumir inspección OOXML o mantener una ruta independiente?

## Pasos Siguientes

1. Definir el nombre final del paquete y del contrato JSON.
2. Crear un schema mínimo `FileInspectionReport`.
3. Implementar detección de herramientas sin instalar dependencias.
4. Implementar inspección mínima con `file`, tamaño, checksum y fallback por extensión.
5. Agregar módulos opcionales por tipo de archivo.
6. Agregar fixture tests con archivos pequeños y controlados.
7. Integrar reportes como artefactos opcionales de `RenderManifest`.
8. Exponer reportes en Studio solo después de estabilizar el contrato.
9. Diseñar una integración TRURL que orqueste inspecciones por repositorio.

## Conclusión

OSER puede incorporar esta capacidad sin romper su arquitectura si la trata como una capa de inspección previa y reproducible. La idea no es reemplazar importers, diagnostics ni visión humana, sino producir evidencia local, FLOSS, trazable y de baja fricción para que el resto del pipeline tome mejores decisiones.

