# OSER Stress Testing Protocol

Fecha: 2026-05-31

## Proposito

Este documento define un protocolo de stress testing para OSER y futuros consumidores como TRURL usando documentos editoriales reales o deliberadamente complejos.

El objetivo no es corregir todo durante el test. El objetivo es observar, registrar y priorizar fallas reales en importacion, modelo documental, diagnostics, preview HTML, PDF/export, assets, manifests, Studio UI y performance.

## Principios

- No modificar arquitectura durante una corrida de stress test.
- No mezclar fix e investigacion en el mismo paso.
- Preservar inputs originales.
- Preferir casos pequenos y versionables antes de grandes corpus privados.
- Registrar outputs, errores y severidad de forma reproducible.
- Mantener documentos reales sensibles fuera del repo publico.
- Separar casos versionables de outputs pesados o derivados.
- Evaluar OSER Core primero; Studio/TRURL son consumidores y superficies de observacion.

## Categorias de stress test

### 1. Markdown largo

Documento Markdown de muchas secciones, parrafos largos, citas, listas, imagenes y tablas. Sirve para medir estabilidad del importer Markdown, render HTML, PDF y manifests.

Riesgos esperados:

- render lento;
- memoria alta;
- headings demasiado profundos;
- PDF con cortes malos;
- Studio UI lenta al mostrar source grande.

### 2. Documento con muchas imagenes

Markdown con 10-50 imagenes locales, rutas repetidas, imagenes faltantes y alt text variado.

Riesgos esperados:

- assets no resueltos;
- imagenes sin alt;
- rutas relativas rotas en preview/PDF;
- PDF pesado;
- manifests sin inventario suficiente de assets.

### 3. Tablas anchas

Markdown con tablas de muchas columnas, contenido largo, numeros, celdas vacias y alineacion.

Riesgos esperados:

- overflow en HTML;
- PDF cortado horizontalmente;
- diagnosticos insuficientes;
- mala legibilidad editorial;
- necesidad futura de table cleaner.

### 4. Titulos mal jerarquizados

Documento con saltos de `h1` a `h4`, headings vacios, headings duplicados y secciones sin heading.

Riesgos esperados:

- diagnostics incompletos;
- estructura de documento confusa;
- navegacion futura deficiente;
- TOC o WebBook futuros incorrectos.

### 5. Listas anidadas

Documento con listas ordenadas y no ordenadas, varios niveles, listas dentro de blockquotes y listas mezcladas con parrafos.

Riesgos esperados:

- import incorrecto;
- HTML valido pero editorialmente pobre;
- PDF con indentacion irregular;
- Markdown source dificil de normalizar.

### 6. Notas al pie futuras

Documento con sintaxis futura o provisional de footnotes. Aunque OSER aun no soporte footnotes formalmente, conviene registrar comportamiento actual.

Riesgos esperados:

- footnotes tratadas como texto plano;
- links internos rotos;
- diagnostics sin advertencia;
- necesidad de extender `OserDocument`.

### 7. HTML inline

Markdown con HTML inline y bloques HTML. El importer actual ignora bloques HTML y debe reportarlo claramente.

Riesgos esperados:

- perdida silenciosa de contenido;
- warnings insuficientes;
- diferencia entre Markdown source y output renderizado;
- tension entre seguridad y compatibilidad.

### 8. Documentos multilingues

Documento con espanol, ingles y fragmentos en otros idiomas, acentos, comillas tipograficas, guiones, caracteres no latinos y posibles atributos de idioma futuros.

Riesgos esperados:

- metadata de idioma insuficiente;
- tipografia incorrecta;
- PDF con fuentes faltantes;
- normalizacion Unicode no documentada.

### 9. Documento importado desde DOCX/ODT en el futuro

Caso derivado de conversion externa provisional, por ejemplo Pandoc o LibreOffice. Debe conservar advertencias sobre origen y confianza.

Riesgos esperados:

- headings mal convertidos;
- footnotes perdidas;
- tablas degradadas;
- imagenes extraidas con rutas inestables;
- source maps ausentes.

### 10. Libro o ensayo de 20+ paginas

Documento suficientemente largo para simular ensayo, reporte o capitulo de libro.

Riesgos esperados:

- PDF con paginacion pobre;
- performance de render/export;
- manifest grande;
- Studio source panel pesado;
- necesidad de dividir manuscript en capitulos.

## Checklist de evaluacion

Cada stress test debe evaluarse contra estas areas.

### Importacion

- El comando termina sin crash.
- El formato es reconocido correctamente.
- Las advertencias son visibles y accionables.
- El contenido principal no desaparece silenciosamente.
- Se preserva el input original.

### OserDocument

- La estructura de bloques corresponde al source.
- Headings tienen niveles esperados.
- Parrafos, listas, tablas, citas y figuras estan representados.
- Inlines como links, emphasis, strong, code e images se preservan.
- `sourceMap` existe donde el importer pueda proveerlo.

### Diagnostics

- Reporta errores reales.
- No satura con falsos positivos triviales.
- Detecta headings vacios/saltados.
- Detecta tablas problematicas.
- Detecta assets o links faltantes cuando aplique.
- El summary coincide con items.

### Preview HTML

- El HTML es semantico y legible.
- CSS carga correctamente.
- Links e imagenes resuelven.
- Tablas no destruyen el layout.
- No hay contenido superpuesto.
- El output puede inspeccionarse sin Studio.

### PDF export

- El PDF se genera sin crash.
- Paginas tienen margenes razonables.
- Imagenes aparecen.
- Tablas no quedan inutilizables.
- Parrafos largos cortan aceptablemente.
- El tamano del archivo es razonable.

### Assets

- Rutas relativas funcionan en HTML preview.
- Rutas relativas funcionan en PDF si aplica.
- Assets faltantes generan diagnostics o warnings.
- No se sirve filesystem libre.
- Assets derivados pueden limpiarse/regenerarse.

### Manifest

- `RenderManifest` se escribe cuando se solicita.
- Incluye source, target, profile/style y outputs.
- Incluye diagnostics summary e items.
- Paths son reproducibles y entendibles.
- No depende de rutas absolutas innecesarias.

### Studio UI

- Carga source sin bloquear la UI.
- Carga perfiles.
- Validate funciona.
- Render HTML actualiza iframe.
- Export PDF genera link.
- Diagnostics panel muestra resultados utiles.
- Errores del server se muestran de forma clara.

### Performance

Registrar, aunque sea manualmente:

- tiempo de importacion;
- tiempo de diagnostics;
- tiempo de render HTML;
- tiempo de export PDF;
- tamano del input;
- tamano de outputs;
- comportamiento percibido de Studio.

## Registro de resultados

Cada corrida debe generar un registro humano. Formato recomendado: Markdown por caso.

````markdown
# Stress Test Result: <case-id>

Date:
Tester:
OSER commit:
Environment:

## Input

- Path:
- Format:
- Size:
- Description:
- Sensitive/private: yes/no

## Commands Used

```sh
npm run build
npm run validate -- <input>
npm run render:html -- <input> <output> --profile <profile> --manifest <manifest>
npm run render:pdf -- <input> <output> --profile <profile> --manifest <manifest>
```

## Outputs Generated

- HTML:
- PDF:
- Manifest:
- Diagnostics:
- Assets:

## Observed Failures

| Severity | Area | Failure | Possible Cause | Suggested Issue |
| --- | --- | --- | --- | --- |
| high | PDF | Wide table clipped | no table overflow strategy | Add print table diagnostics |

## Notes

- What looked good:
- What needs manual review:
- Follow-up files/screenshots:
````

### Severidad sugerida

- `critical`: crash, data loss, corrupt output, unsafe file access.
- `high`: output unusable for editorial review, major missing content.
- `medium`: degraded layout, incomplete diagnostics, workaround possible.
- `low`: polish, wording, minor visual issue.
- `info`: observation, future enhancement.

## Estructura propuesta

```text
stress-tests/
  README.md
  cases/
    markdown-long.md
    wide-tables.md
    bad-heading-hierarchy.md
  outputs/
    .gitkeep
  results/
    .gitkeep
```

### Versionar o no versionar outputs

Conviene versionar:

- casos pequenos en `stress-tests/cases/`;
- README y plantillas;
- resultados Markdown resumidos si no contienen datos privados;
- manifests pequenos cuando ayuden a regression review.

No conviene versionar por defecto:

- PDFs generados;
- HTML generado grande;
- screenshots;
- assets pesados;
- outputs de documentos reales privados;
- conversiones DOCX provisionales con material sensible.

Los outputs deben ser reproducibles desde comandos documentados.

## Tres stress tests iniciales pequenos y versionables

### A. `markdown-long.md`

Objetivo: simular ensayo largo sin archivo pesado.

Contenido sugerido:

- 8-12 secciones;
- parrafos largos;
- una imagen local usando `examples/assets/placeholder.svg` o copia fixture;
- una tabla pequena;
- una cita en bloque;
- una lista ordenada y una no ordenada;
- un code block.

Criterio de exito:

- import y render pasan;
- diagnostics no reporta errores;
- HTML legible;
- PDF genera varias paginas;
- manifest contiene paths esperados.

### B. `wide-tables.md`

Objetivo: forzar layout con tablas anchas.

Contenido sugerido:

- tabla con 10-14 columnas;
- headers largos;
- numeros y porcentajes;
- una fila con celdas vacias;
- parrafo antes y despues.

Criterio de exito:

- importer no rompe tabla;
- diagnostics reporta si detecta problemas;
- HTML mantiene tabla inspeccionable;
- PDF revela claramente limitacion actual sin crash.

### C. `bad-heading-hierarchy.md`

Objetivo: validar diagnostics estructurales.

Contenido sugerido:

- `#` inicial;
- salto a `####`;
- heading vacio;
- heading duplicado;
- lista anidada;
- HTML block deliberado.

Criterio de exito:

- diagnostics detecta salto de heading;
- importer advierte HTML block ignorado;
- render no crashea;
- resultado queda documentado como caso de regression.

## Outputs recomendados para `.gitignore`

Si se crea `stress-tests/`, agregar reglas como:

```gitignore
# Stress test generated outputs
stress-tests/outputs/**
!stress-tests/outputs/.gitkeep
stress-tests/results/**/*.png
stress-tests/results/**/*.pdf
stress-tests/results/**/*.html
stress-tests/results/**/*.epub
stress-tests/private/**
```

`dist/`, `*.pdf` y `*.epub` ya estan ignorados globalmente, pero conviene ignorar explicitamente outputs dentro de `stress-tests/` para evitar commits accidentales.

## Protocolo de corrida recomendado

1. Crear o seleccionar caso.
2. Confirmar si el input es publico o privado.
3. Registrar commit y entorno.
4. Ejecutar `npm run build`.
5. Ejecutar import/validate/render HTML/PDF.
6. Revisar HTML directamente.
7. Revisar PDF.
8. Si aplica, abrir Studio y probar flujo UI.
9. Registrar resultados en `stress-tests/results/<case-id>.md`.
10. Crear issues sugeridos; no corregir durante la corrida.

## Comandos base para Markdown actual

```bash
npm run build
npm run validate -- stress-tests/cases/markdown-long.md
npm run render:html -- stress-tests/cases/markdown-long.md stress-tests/outputs/markdown-long.html --profile examples/profiles/report.json --manifest stress-tests/outputs/markdown-long.manifest.json
npm run render:pdf -- stress-tests/cases/markdown-long.md stress-tests/outputs/markdown-long.pdf --profile examples/profiles/report.json --manifest stress-tests/outputs/markdown-long-pdf.manifest.json
```

Para Studio MVP, por ahora usar los fixtures allowlisted existentes. Cuando Studio acepte proyectos/casos, se podra apuntar a `stress-tests/cases/`.

## Consideraciones para TRURL

TRURL deberia consumir resultados de stress testing como evidencia de integracion:

- puede alojar inputs versionados;
- puede mostrar manifests;
- puede presentar diagnostics como checklists;
- puede convertir Git commits en checkpoints;
- puede asociar issues a fallas observadas;
- no debe requerir Studio para validar o renderizar.

Stress testing debe probar que OSER funciona como CLI/API reproducible antes de depender de UI.

## Primer stress test recomendado para manana

Ejecutar primero `bad-heading-hierarchy.md`.

Razon:

- es pequeno y facil de versionar;
- prueba importer Markdown, diagnostics, HTML render y manifest;
- no depende de assets ni PDF complejo;
- deberia revelar rapidamente si los diagnostics estructurales son utiles para documentos reales;
- produce issues accionables sin introducir DOCX todavia.

Segundo recomendado: `wide-tables.md`, porque probablemente exponga limitaciones reales de HTML/PDF sin requerir nuevas features.
