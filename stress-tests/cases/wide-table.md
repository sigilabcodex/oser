# Wide Table Stress Test

This case checks how OSER handles a wide Markdown table in HTML, PDF, and future Studio preview surfaces. The table is intentionally compact in row count but broad in column count. It includes short labels, longer editorial notes, accented Spanish text, and brief bilingual content.

Before the table, this paragraph gives the renderer normal prose so the table can be evaluated in context. A good preview should keep the table inspectable without making the surrounding text unreadable.

| ID | País / Country | Tema | Año | Cifra principal | Fuente | Estado | Nota editorial breve | Longer English note | Riesgo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | México / Mexico | Justicia | 2024 | 92% impunidad estimada | Informe público | Revisar | Cifra sensible; verificar metodología. | This note is intentionally longer to stress column width and wrapping behavior in HTML and PDF output. | Alto |
| 02 | Colombia | Memoria | 2023 | 14 archivos consultados | Archivo regional | Confirmado | Incluye entrevistas y anexos. | Short English summary. | Medio |
| 03 | Perú / Peru | Contratación | 2022 | S/ 3.5 millones observados | Auditoría | Pendiente | Falta cotejar nombres propios y fechas. | Bilingual row with accents: corrupción, análisis, reparación. | Alto |
| 04 | Chile | Transparencia | 2021 | 8 solicitudes de información | Portal público | Parcial | Respuesta incompleta. | The table should remain legible even when cells contain mixed-length editorial notes. | Bajo |
| 05 | España / Spain | Archivo | 2020 | 120 expedientes | Biblioteca | Confirmado | Sirve como control multilingüe. | Accented characters should survive import, render, and PDF export. | Bajo |

After the table, this paragraph checks whether layout recovers normally. If the PDF clips columns or shrinks text beyond practical review, the result should be recorded as a layout limitation rather than fixed during the stress-test run.
