# OSER DOCX Importer And Commercial-Grade Editorial Workflow Plan

Fecha: 2026-05-31

## Proposito

Este documento propone como convertir OSER en una herramienta FLOSS minimalista, pero suficientemente robusta para flujos editoriales reales de importacion, estructuracion y publicacion de documentos complejos.

El caso que motiva este plan es un proyecto editorial real, `Cartografia de la Impunidad`, construido desde cinco DOCX largos. Varias tareas se resolvieron manualmente: preservar originales, detectar herramientas instaladas, convertir DOCX provisionalmente, crear Markdown, armar documento maestro, extraer cifras, mapear fuentes, proponer estructura y documentar incertidumbre. OSER deberia poder automatizar buena parte de ese flujo sin abandonar su filosofia: reproducible, local-first, legible por humanos, Git-friendly y sin dependencia obligatoria de servicios externos.

## Estado actual del repo OSER

### OSER Core

El repo ya tiene una base correcta para crecer hacia DOCX:

- `packages/document-model`: `OserDocument` con bloques, inlines, tablas, figuras, imagenes, assets y source maps iniciales.
- `packages/importers`: importadores TXT y Markdown, tipos `ImportResult`, `ImportWarning`, `ImportAsset`, `ImportManifest` y soporte tipado para formatos futuros como `docx`, `rtf` y `html`.
- `packages/diagnostics`: validacion basica de estructura, encabezados, imagenes, links y tablas.
- `packages/html-renderer`: render semantico y `renderHtmlFromFile(...)`.
- `packages/pdf-renderer`: `renderPdfFromFile(...)` con Playwright/Chromium.
- `packages/layout-profile`: perfiles JSON compilados a CSS.
- `packages/render-manifest`: manifest reproducible de source, settings, outputs y diagnostics.

Limitacion clave: el modelo actual no representa todavia notas al pie, bibliografia/citas como entidades, anexos, comentarios, tracked changes, relaciones OOXML complejas, tabla de contenidos ni metadata editorial rica.

### studio-server

`packages/studio-server` existe como adapter HTTP local y opcional. Consume APIs reusables de Core, mantiene allowlists y escribe outputs bajo `dist/studio/`. No debe convertirse en dependencia de Core.

### apps/studio

`apps/studio` existe como app Vite + React + TypeScript minima. Carga source, perfiles, diagnostics, preview HTML y PDF export via `studio-server`. No debe implementar importacion DOCX ni logica editorial.

## Pipeline objetivo

```text
DOCX / Markdown / TXT
  -> core importer
  -> OserDocument + ImportManifest + SourceMap
  -> normalizer
  -> diagnostics + uncertainty reports
  -> LayoutProfile
  -> HTML preview
  -> PDF / print export
  -> EPUB export
  -> RenderManifest
```

Para proyectos complejos tambien debe existir un pipeline de proyecto:

```text
original-docx/
  -> inspect
  -> extract assets + metadata
  -> convert to canonical Markdown/OserDocument
  -> normalize structure
  -> extract key figures / source map / bibliography candidates
  -> validate manuscript
  -> render outputs
```

## 1. Funcionalidades necesarias para importar DOCX seriamente

### Encabezados

OSER debe distinguir entre:

- estilos Word (`Heading 1`, `Titulo 1`, estilos personalizados);
- encabezados detectados por formato visual cuando el estilo es incorrecto;
- numeracion de secciones (`1.`, `1.1`, `Capitulo`, `Anexo A`);
- falsos encabezados en tablas o cajas de texto.

Salida minima: `heading` con nivel, texto, source map y warning si el nivel fue inferido por heuristica.

### Parrafos y estilos

Debe preservar parrafos, enfasis, negritas, cursivas, codigo inline si aparece, small caps si es relevante, citas en bloque, alineacion solo como metadata de importacion cuando afecte significado, no como CSS final obligatorio.

Regla: el importer no debe convertir Word visual en layout final; debe convertir estructura editorial.

### Tablas

Debe importar tablas con:

- filas y celdas;
- celdas header si se detectan;
- colspan/rowspan como extension futura del modelo;
- contenido multilinea dentro de celdas;
- tablas usadas como layout con warning;
- tablas con cifras para extraccion posterior.

El modelo actual `TableNode` no soporta colspan/rowspan. Fase 1 puede degradar con warnings; fase 2 deberia extender el modelo.

### Notas al pie y notas finales

Necesarias para flujos editoriales serios. El modelo debe agregar:

- `FootnoteRefNode` inline;
- `FootnoteNode` o `document.notes`;
- source map desde `word/footnotes.xml` y `word/endnotes.xml`;
- opcion de render como notas al pie, notas finales o seccion bibliografica.

Sin esto, OSER no puede competir en no ficcion, investigacion o periodismo largo.

### Referencias y citas

DOCX puede contener citas como texto plano, campos Word, Zotero/Mendeley field codes o bibliografia pegada. OSER debe detectar candidatos, no prometer verdad semantica inmediata.

Salida minima:

- `citationCandidates` en reporte;
- `source-map.md` legible;
- opcional `references.yaml` o `bibliography.bib` mas adelante;
- warnings de baja confianza.

### Imagenes

Debe extraer assets desde `word/media/*` y relaciones OOXML:

- conservar archivo original;
- copiar a `assets/imported/<doc-id>/...`;
- generar nombres estables;
- registrar media type, checksum, dimensiones si se puede;
- mantener alt/title si existe;
- advertir imagenes sin alt.

### Listas

Debe resolver `numbering.xml`:

- listas ordenadas y no ordenadas;
- listas anidadas;
- start number;
- numeracion legal o editorial;
- detectar listas simuladas como texto (`-`, `*`, `1.`) con warnings.

### Hipervinculos

Debe preservar links externos, anchors internos y relaciones. Links rotos o vacios deben generar diagnostics.

### Metadatos

Extraer de `docProps/core.xml`, `docProps/app.xml`, custom properties y del propio contenido:

- titulo;
- autor;
- fecha;
- idioma;
- revision;
- conteo de palabras;
- origen del archivo;
- checksum;
- herramienta/importer usado.

### Citas en bloque

Detectar por estilo (`Quote`, `Block Text`, `Cita`) y por patrones visuales. Si no hay estilo, usar heuristicas con baja confianza: sangria, comillas largas, parrafos precedidos por dos puntos, etc.

### Anexos

Detectar secciones de anexos por encabezados y patrones (`Anexo`, `Appendix`, `Annex`). Deben poder mapearse a archivos separados o nodos `section` con metadata `sectionKind: appendix`.

### Comentarios, tracked changes y campos

Fase 1 puede reportarlos sin incorporarlos:

- comentarios presentes;
- tracked changes presentes;
- campos Word presentes;
- objetos no soportados.

En documentos reales esto es critico: si OSER ignora cambios controlados sin avisar, pierde confianza.

## 2. Stack FLOSS recomendado

### Pandoc

Uso recomendado: backend principal opcional para conversion DOCX -> AST/Markdown cuando este instalado.

Ventajas:

- robusto con DOCX complejo;
- soporta footnotes, tables, links, images, metadata parcial;
- puede emitir JSON AST, Markdown, HTML;
- buen ecosistema para citas y CSL.

Riesgos:

- dependencia binaria externa;
- algunas decisiones de conversion son opacas;
- estilos Word personalizados pueden perderse si no se inspeccionan aparte;
- output Markdown puede necesitar normalizacion fuerte.

Decision: usar Pandoc como ruta preferida si esta disponible, pero no como unica fuente de verdad. Combinar con inspeccion OOXML para manifest, assets y warnings.

### python-docx

Uso recomendado: inspector/metadata extractor, no importer principal.

Ventajas:

- facil para leer parrafos, runs, tablas, estilos y propiedades;
- bueno para reportes de inspeccion;
- FLOSS y comun.

Riesgos:

- footnotes/endnotes y relaciones complejas requieren trabajo extra;
- no reproduce toda la semantica OOXML;
- introduce runtime Python.

Decision: util si OSER acepta subcomandos via Python helper, pero no imprescindible para Fase 1 si se prefiere TypeScript + unzip/OOXML.

### Mammoth

Uso recomendado: alternativa ligera para DOCX -> HTML semantico cuando el objetivo sea HTML limpio.

Ventajas:

- orientado a HTML limpio;
- mapea estilos Word a elementos;
- usable desde Node.

Riesgos:

- no es pipeline editorial completo;
- menos adecuado para source maps, manifests ricos, tablas complejas y citas;
- puede ocultar detalles necesarios para diagnostics.

Decision: candidato para prototipo rapido o fallback, pero no suficiente solo para importacion comercial-grade.

### LibreOffice headless

Uso recomendado: fallback de ultimo recurso y herramienta de inspeccion/conversion provisional.

Ventajas:

- abre formatos variados;
- puede convertir DOCX/ODT/RTF a HTML, TXT, PDF;
- disponible en muchos sistemas FLOSS.

Riesgos:

- output HTML/TXT puede ser ruidoso;
- conversion no siempre reproducible entre versiones;
- dificil preservar trazabilidad fina;
- pesado.

Decision: fallback explicitamente marcado como provisional. El importer debe reportar que uso LibreOffice y bajar confianza.

### unzip + parsing directo de OOXML

Uso recomendado: capa minima propia para inspeccion, assets, relationships, footnotes y metadata.

Ventajas:

- control total;
- reproducible;
- no depende de servicios externos;
- permite source maps y warnings precisos;
- facilita preserve-originals.

Riesgos:

- OOXML es grande y lleno de edge cases;
- implementar todo desde cero seria caro;
- se necesita scope estricto.

Decision: implementar parser OOXML minimal para inspeccion y extraccion critica, no para replicar Word completo.

### citeproc / CSL

Uso recomendado: fase de citas y bibliografia cuando existan datos estructurados.

Ventajas:

- estandar editorial;
- compatible con CSL JSON/BibTeX/Zotero;
- habilita renders bibliograficos consistentes.

Riesgos:

- detectar citas desde texto plano sigue siendo dificil;
- requiere modelos propios para citation keys y bibliography entries.

Decision: incluir en roadmap, no en Fase 1 core importer salvo como `citationCandidates`.

### YAML/JSON frontmatter

Uso recomendado: formato humano y Git-friendly para metadata de proyecto, key figures, source map y perfiles editoriales.

Decision: usar YAML para archivos editables por humanos (`project.yaml`, `key-figures.yaml`) y JSON para manifests estrictos (`import-manifest.json`, `render-manifest.json`).

### markdown-it / unified / remark

Estado actual: OSER usa `markdown-it` para Markdown importer.

Recomendacion:

- mantener `markdown-it` mientras el pipeline sea pequeno;
- evaluar `unified/remark` cuando se necesite AST Markdown transformable, plugins de footnotes, directives, MDX-like syntax o linting editorial avanzado.

Decision: no migrar ahora. Para DOCX, convertir a `OserDocument` directamente o via Pandoc JSON; Markdown convertido es artefacto humano, no unica verdad interna.

### Playwright / Puppeteer

Estado actual: OSER usa Playwright.

Recomendacion: mantener Playwright para HTML/PDF experimental y futuro preview automatizado. Puppeteer no aporta suficiente ventaja para cambiar ahora.

## 3. Arquitectura minimalista propuesta

### Nuevos paquetes

```text
packages/docx-importer/
  src/index.ts
  src/importDocxFromFile.ts
  src/inspectDocx.ts
  src/ooxmlPackage.ts
  src/pandocAdapter.ts
  src/mammothAdapter.ts
  src/libreOfficeAdapter.ts
  src/docxNormalizer.ts
  src/docxWarnings.ts
  src/assetExtractor.ts
  src/types.ts

packages/editorial-project/
  src/initProject.ts
  src/projectManifest.ts
  src/sourceMapWriter.ts
  src/keyFigureExtractor.ts
  src/sourceMapper.ts
  src/types.ts

packages/citation-mapper/
  src/extractCitationCandidates.ts
  src/citationPatterns.ts
  src/types.ts

packages/table-cleaner/
  src/inspectTables.ts
  src/normalizeTables.ts
  src/types.ts
```

No todos deben crearse a la vez. Fase 1 puede empezar con `docx-importer` y un CLI pequeno.

### Core importer

Responsabilidades:

- aceptar DOCX como archivo o directorio;
- preservar original;
- calcular checksum;
- detectar herramientas disponibles;
- extraer metadata OOXML;
- extraer assets;
- convertir contenido a `OserDocument`;
- emitir `ImportManifest` e `ImportWarning[]`;
- escribir Markdown provisional opcional.

### Normalizer

Responsabilidades:

- corregir niveles de heading cuando sea seguro;
- convertir estilos conocidos a nodos semanticos;
- normalizar listas;
- limpiar espacios, guiones, comillas, saltos y parrafos vacios;
- separar anexos;
- registrar cada cambio como transform reproducible.

Salida sugerida:

```text
manuscript/.oser/normalization-report.json
```

### Metadata extractor

Responsabilidades:

- leer propiedades DOCX;
- inferir titulo si falta;
- detectar idioma;
- generar `project.yaml` inicial;
- reportar conflictos entre metadata del archivo y metadata del contenido.

### Citation mapper

Responsabilidades:

- detectar candidatos de citas y bibliografia;
- separar URLs, referencias tipo APA/Chicago, leyes, expedientes, entrevistas, informes;
- crear `manuscript/bibliography/source-map.md`;
- asignar IDs estables pero editables.

### Table cleaner

Responsabilidades:

- detectar tablas de datos vs tablas de layout;
- normalizar celdas vacias;
- reportar filas con conteos inconsistentes;
- exportar tablas candidatas a CSV/YAML si se solicita;
- marcar tablas con cifras clave.

### Asset extractor

Responsabilidades:

- extraer imagenes de DOCX;
- nombrar assets de forma estable;
- registrar checksum/media type/origen;
- preservar alt text;
- reportar imagenes no soportadas o sin metadata.

### Project initializer

Responsabilidades:

- crear estructura editorial;
- copiar originales;
- crear `project.yaml`;
- crear `manuscript/`, `sources/`, `assets/`, `reports/`, `dist/`;
- generar `.gitignore` apropiado;
- no destruir archivos existentes.

Estructura sugerida:

```text
editorial-project/
  project.yaml
  sources/
    original-docx/
    converted-md/
  manuscript/
    chapters/
    data/
    bibliography/
    assets/
  reports/
    import/
    validation/
  dist/
    html/
    print/
    epub/
```

### Export pipeline

Debe reutilizar lo existente:

- `renderHtmlFromFile(...)` para HTML;
- `renderPdfFromFile(...)` para PDF/print;
- futuro `renderEpubFromProject(...)` para EPUB;
- `RenderManifest` como contrato de outputs.

### Validation reports

Nuevos diagnostics necesarios:

- import confidence;
- unsupported DOCX features;
- missing assets;
- unresolved citations;
- suspicious headings;
- table-layout warnings;
- footnote/endnote mismatch;
- duplicate source IDs;
- original checksum mismatch;
- conversion engine and version.

## 4. CLI propuesto

### Proyecto

```bash
oser init editorial-project
oser init editorial-project --template investigative-report
oser init editorial-project --from ./sources/original-docx
```

### Inspeccion

```bash
oser inspect ./sources/original-docx
oser inspect ./sources/original-docx --out reports/import/docx-inspection.json
oser inspect ./sources/original-docx --format markdown
```

### Importacion DOCX

```bash
oser import docx ./sources/original-docx --out ./sources/converted-md
oser import docx ./sources/original-docx --project .
oser import docx ./sources/original-docx --engine pandoc
oser import docx ./sources/original-docx --engine libreoffice --provisional
oser import docx ./sources/original-docx --preserve-originals
```

### Extraccion editorial

```bash
oser extract key-figures ./sources/converted-md --out manuscript/data/key-figures.yaml
oser map sources ./sources/converted-md --out manuscript/bibliography/source-map.md
oser extract tables manuscript/ --out manuscript/data/tables
oser extract assets ./sources/original-docx --out manuscript/assets/imported
```

### Validacion

```bash
oser validate manuscript/
oser validate manuscript/ --strict
oser validate manuscript/ --report reports/validation/report.json
```

### Render

```bash
oser render html manuscript/
oser render html manuscript/ --profile examples/profiles/report.json
oser render print manuscript/
oser render pdf manuscript/ --profile examples/profiles/classic-book.json
oser render epub manuscript/
```

### Diagnostico de herramientas

```bash
oser doctor
oser doctor --json
```

Debe reportar presencia/version de `pandoc`, `libreoffice`, `python`, Playwright browsers y dependencias opcionales.

## 5. Conversion inteligente sin IA

OSER puede ser mucho mas inteligente sin usar IA si combina reglas, heuristicas y reportes de incertidumbre.

### Heuristicas utiles

- Mapear estilos Word conocidos a estructuras (`Heading 1`, `Titulo 1`, `Quote`, `Caption`).
- Inferir encabezados por patrones (`Capitulo`, `Anexo`, numeracion legal, mayusculas cortas).
- Detectar tablas de layout por muchas celdas vacias, una sola fila, o contenido visual repetitivo.
- Detectar tablas de datos por densidad numerica, headers y unidades.
- Detectar cifras clave con patrones numericos: porcentajes, moneda, cantidades, fechas, rangos.
- Detectar citas por patrones APA/Chicago, URLs, DOI, comillas, parentesis autor-fecha.
- Normalizar titulos con reglas configurables, no con creatividad.
- Detectar anexos por encabezados y numeracion.

### Reglas configurables

Cada proyecto deberia poder incluir:

```yaml
import:
  headingStyles:
    Titulo 1: 1
    Titulo 2: 2
  quoteStyles:
    - Cita
    - Block Quote
  appendixPatterns:
    - '^Anexo [A-Z0-9]+'
  citationPatterns:
    - 'doi:'
    - 'https?://'
```

### Trazabilidad

Cada transform debe dejar rastro:

- archivo origen;
- checksum;
- engine usado;
- version del engine;
- source location aproximada;
- regla aplicada;
- confianza;
- warning si hubo perdida.

### Reportes de incertidumbre

En vez de ocultar problemas, OSER debe generar reportes como:

```text
reports/import/uncertainty.md
reports/import/unsupported-features.json
reports/validation/editorial-diagnostics.json
```

Esto es comercialmente importante: los equipos aceptan conversion imperfecta si saben exactamente donde revisar.

## 6. Que requeriria IA opcionalmente

IA no debe ser requisito para importar ni renderizar. Puede ser capa opcional para tareas editoriales de mayor abstraccion:

- sintesis editorial de documentos largos;
- propuesta de capitulos;
- extraccion semantica de tesis y argumentos;
- clasificacion de fuentes;
- generacion de resumenes;
- sugerencias de visualizaciones;
- deteccion de contradicciones;
- agrupacion de documentos por tema;
- renombrado sugerido de capitulos.

Regla: IA debe producir sugerencias, no reemplazar manifests, source maps ni validacion determinista. Toda salida IA debe ser revisable y descartable.

## 7. Ruta de desarrollo por fases

### Fase 1: importacion DOCX confiable

Objetivo: importar DOCX reales con preservacion de originales, assets, metadata, warnings y Markdown/OserDocument util.

Entregables:

- `packages/docx-importer`;
- `oser doctor`;
- `oser inspect`;
- `oser import docx`;
- extraction de assets basica;
- import manifests y warnings;
- fixtures DOCX pequenos con tablas, imagenes, links, footnotes y listas.

Dependencias minimas sugeridas:

- `fast-xml-parser` o parser XML equivalente para OOXML;
- `adm-zip` o unzip equivalente;
- deteccion opcional de binarios `pandoc` y `libreoffice` sin dependencia obligatoria.

### Fase 2: proyecto editorial estructurado

Objetivo: pasar de archivos sueltos a proyecto reproducible.

Entregables:

- `packages/editorial-project`;
- `oser init`;
- `project.yaml`;
- estructura `sources/`, `manuscript/`, `reports/`, `dist/`;
- preservacion de originales;
- documento maestro inicial;
- convenciones Git-friendly.

### Fase 3: validacion y reportes

Objetivo: que OSER sea confiable para equipos.

Entregables:

- diagnostics de importacion;
- reportes de incertidumbre;
- source map humano;
- checks de assets;
- checks de citas;
- checks de tablas;
- reportes Markdown y JSON.

### Fase 4: integracion con TRURL

Objetivo: que TRURL pueda alojar proyectos, checkpoints y previews sin acoplar OSER Core.

Entregables:

- adapter TRURL -> OSER CLI/API;
- checkpoints Git como UX;
- preview/render server reusable;
- mapping de manifests a UI.

### Fase 5: exportacion profesional HTML/PDF/EPUB

Objetivo: salidas editoriales publicables.

Entregables:

- HTML multipagina o WebBook;
- PDF con Paged.js o estrategia paged-media avanzada;
- EPUB exporter;
- citation rendering con CSL;
- assets pipeline completo;
- manifests de publicacion.

### Fase 6: asistencia inteligente opcional

Objetivo: agregar ayuda editorial sin volverla dependencia.

Entregables:

- comandos `oser suggest ...`;
- resumenes;
- propuestas de estructura;
- clasificacion de fuentes;
- extraccion semantica;
- UI en Studio para aceptar/rechazar sugerencias.

## 8. Cambios propuestos en arquitectura del repo

### Nuevos modulos

Prioridad alta:

- `packages/docx-importer`
- `packages/editorial-project`
- `packages/validation-report`

Prioridad media:

- `packages/citation-mapper`
- `packages/table-cleaner`
- `packages/asset-pipeline`

Prioridad futura:

- `packages/epub-renderer`
- `packages/paged-renderer`
- `packages/trurl-adapter`
- `packages/ai-assist` opcional

### Archivos a crear primero

```text
packages/docx-importer/README.md
packages/docx-importer/src/index.ts
packages/docx-importer/src/importDocxFromFile.ts
packages/docx-importer/src/inspectDocx.ts
packages/docx-importer/src/ooxmlPackage.ts
packages/docx-importer/src/assetExtractor.ts
packages/docx-importer/src/types.ts
packages/docx-importer/fixtures/simple.docx
packages/docx-importer/fixtures/with-footnotes.docx
packages/docx-importer/fixtures/with-tables-images-links.docx
```

CLI inicial:

```text
packages/docx-importer/src/cli/inspectDocx.ts
packages/docx-importer/src/cli/importDocx.ts
packages/cli/src/index.ts   # futuro unificador `oser ...`
```

Hoy el repo usa scripts npm por paquete. Para comandos `oser ...` reales conviene introducir un CLI unificado despues de Fase 1 inicial.

### Cambios al document model

Agregar gradualmente:

- footnotes/endnotes;
- captions como estructura mas explicita;
- table colspan/rowspan;
- citation refs;
- bibliography entries;
- block metadata opcional;
- section metadata (`appendix`, `chapter`, `frontmatter`, `backmatter`);
- asset metadata mas rica.

Mantener compatibilidad: no romper nodos existentes sin migracion.

### Tests necesarios

Unit tests:

- abrir DOCX como ZIP;
- leer `document.xml`;
- leer relationships;
- extraer metadata;
- extraer imagenes;
- mapear estilos a headings;
- importar tablas;
- importar footnotes;
- warnings por features no soportadas.

Golden tests:

- DOCX fixture -> `OserDocument` JSON esperado;
- DOCX fixture -> Markdown esperado;
- manifest esperado;
- assets copiados con checksum esperado;
- uncertainty report esperado.

Integration tests:

- `oser inspect` sobre carpeta;
- `oser import docx` preserva originales;
- render HTML/PDF desde resultado importado;
- validate reporta warnings correctos.

Regression corpus:

- documentos con estilos en espanol;
- documentos con estilos en ingles;
- tablas largas;
- imagenes;
- footnotes;
- listas anidadas;
- documentos con tracked changes.

### Dependencias minimas

Fase 1 deberia evitar dependencia obligatoria de servicios externos. Dependencias Node razonables:

- XML parser para OOXML;
- ZIP reader;
- checksum/hash via Node crypto;
- opcional: wrapper de procesos para detectar `pandoc` y `libreoffice`.

No agregar de entrada:

- frameworks server pesados;
- motores IA obligatorios;
- bases de datos;
- Electron/Tauri;
- procesadores de publishing cerrados.

### Riesgos

- DOCX no es un formato simple; intentar cubrir todo desde cero puede absorber el proyecto.
- Pandoc puede resolver mucho, pero no reemplaza manifests y diagnostics propios.
- LibreOffice headless puede variar por version y sistema operativo.
- Footnotes, tracked changes y field codes son necesarios para confianza editorial.
- Asset naming y rutas son fuente comun de bugs.
- Si el modelo documental no crece cuidadosamente, se llenara de hacks especificos de DOCX.
- Si Studio empieza a corregir importaciones en UI sin persistencia Git-friendly, se rompe la reproducibilidad.

## 9. Producto comercial viable sin abandonar FLOSS

OSER puede competir si se posiciona como herramienta editorial local-first y transparente, no como clon de Word/InDesign.

Valor comercial real:

- convertir caos DOCX a proyecto editorial versionable;
- preservar originales y trazabilidad;
- reportar incertidumbre en vez de ocultarla;
- generar HTML/PDF/EPUB reproducibles;
- servir a equipos pequenos sin infraestructura pesada;
- integrarse con TRURL para checkpoints, colaboracion y publicacion.

El minimalismo no significa quedarse corto. Significa elegir contratos fuertes:

- `OserDocument` para estructura;
- manifests para reproducibilidad;
- reports para confianza;
- Markdown/YAML para revision humana;
- CLI para automatizacion;
- Studio/TRURL como capas opcionales.

## 10. Recomendacion inmediata

No empezar por IA ni por una GUI mas compleja. El siguiente incremento con mayor retorno es:

1. `oser doctor` para detectar `pandoc`, `libreoffice` y entorno.
2. `packages/docx-importer` con `inspectDocx(...)` y fixtures pequenos.
3. Extraccion OOXML minima: metadata, relationships, media, footnotes presence, styles list.
4. Import DOCX via Pandoc si esta disponible, con fallback explicitamente provisional.
5. Manifest y uncertainty report desde el primer dia.
6. Tests golden con documentos pequenos pero representativos.

Con eso OSER deja de ser solo renderer y empieza a ser una herramienta editorial FLOSS de conversion y estructuracion con potencial comercial real.
