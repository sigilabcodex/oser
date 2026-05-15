# Editorial Sample

This sample document is intentionally longer than the minimal OSER example. It is designed to exercise the experimental print pipeline with a realistic editorial rhythm: sections, long paragraphs, quotes, lists, a figure, a table, code, and a horizontal rule. The content is placeholder editorial prose, but the structure is meant to resemble the kinds of essays, reports, and publishing notes that OSER should eventually render consistently across web, print, and ebook outputs.

The first requirement of a rendering system is not decoration. It is trust. A source document should be readable in plain text, stable in version control, and capable of producing repeatable outputs without depending on a visual editor as the canonical artifact. OSER starts from that premise and treats HTML, print stylesheets, and PDFs as derived layers rather than places where editorial meaning is invented after the fact.

## Editorial Structure

A document often carries more information than its visible typography suggests. A heading is not merely large text; it marks a section boundary. A blockquote is not merely indented text; it signals a different editorial voice. A table is not just a grid; it expresses a relationship among pieces of information. The early OSER model is deliberately small, but it already separates those concerns from the final presentation layer.

Long paragraphs are useful in a print test because they reveal whether line length, leading, margins, and page breaks are working together. This paragraph continues with enough text to create a realistic measure on the page. When the PDF export is driven by Chromium and a simple print stylesheet, the output will not yet have professional book typography. Still, it should be legible, predictable, and close enough to identify the next problems worth solving.

### Source First

The source-first workflow gives editors and developers a shared artifact. Markdown is not a complete publishing model, but it is an effective human-facing entry point. The importer converts that syntax into an OSER document model, and the renderer converts the model into semantic HTML. From there, browser stylesheets and PDF export can be evaluated without changing the source document.

This separation matters when a project needs review. A reviewer should be able to ask whether a heading level is correct, whether a list should be ordered, whether an image has useful alt text, or whether a table belongs in the document at all. Those are editorial questions, not browser layout questions.

> A practical publishing pipeline should make the document structure visible before it makes the final artifact beautiful. If the source, model, and HTML are coherent, the visual layers can evolve without forcing the editor to rewrite the document every time the output target changes. This is especially important for projects that need web, PDF, and EPUB outputs from the same canonical source.

## Media And Data

The figure below uses a local SVG placeholder. In a future asset pipeline, OSER may copy assets into an output directory, validate missing files, or collect image metadata. For now, the Markdown importer preserves the image source and alt text, while the PDF renderer uses a base URL so local relative image paths can resolve from the source document location.

![OSER placeholder](assets/placeholder.svg "Placeholder image")

Tables are another useful stress test for the current print stylesheet. They should remain readable, avoid awkward internal page breaks where possible, and keep header rows visually distinct. The initial model is intentionally basic and does not yet support merged cells, table captions, or advanced column controls.

| Document Element | Current Support | Notes |
| --- | --- | --- |
| Headings | Initial | Levels one through six are represented in the model. |
| Paragraphs | Initial | Long prose is preserved as semantic text blocks. |
| Images | Initial | Markdown images become image nodes, or figures when alone. |
| Tables | Initial | Basic rows and cells are supported. |
| PDF | Experimental | Chromium exports HTML with print.css. |

## Lists And Procedures

Editorial documents frequently include procedural lists. Ordered lists can represent a sequence of operations, while unordered lists can collect related observations without implying chronology.

1. Import the source document into the OSER document model.
2. Render the model as semantic HTML.
3. Apply an editorial or print stylesheet.
4. Export a derived artifact, such as HTML or an experimental PDF.

The same section can also contain unordered notes:

- The source remains the canonical artifact.
- The HTML renderer stays independent of PDF concerns.
- The PDF adapter is experimental and can be replaced or improved.
- Print-specific CSS belongs in a separate stylesheet.

These lists should not be visually elaborate. In a sober editorial layout, their main job is to be readable, aligned, and spaced well enough that adjacent paragraphs do not collapse into them.

### Code As Editorial Material

Some OSER documents will discuss implementation details. A code block must stay legible in both the browser and the PDF. It also needs to avoid excessive styling, since syntax highlighting is not part of this phase.

```ts
type EditorialPipeline = {
  source: "markdown" | "txt";
  model: "OserDocument";
  html: "semantic";
  style: "editorial.css" | "print.css";
  output: "html" | "pdf";
};
```

The code above is short, but it still tests the current monospace treatment, block padding, border, and print wrapping behavior. Longer code blocks will need more deliberate handling later, especially when line wrapping changes the perceived structure of the code.

---

## Print Observations

This final section exists to push the document across multiple pages and expose page-break behavior. The current print stylesheet uses standard CSS features such as `@page`, `break-inside`, `break-after`, `widows`, and `orphans`. Those features are useful, but they are not a full pagination engine. They help avoid the worst breaks while still leaving layout decisions to Chromium.

The likely next layer is not to make the stylesheet decorative. The next useful step is to inspect where headings land, whether blockquotes or tables create awkward whitespace, whether images resize predictably, and whether long sections need explicit page-break controls. Each of those observations can inform the eventual Paged.js phase without forcing OSER to adopt Paged.js prematurely.

For now, this sample should be good enough to check that the experimental PDF path is wired correctly. If it produces a readable two-to-four-page PDF, the pipeline is doing its first job: taking structured source content through the OSER model, rendering semantic HTML, applying print CSS, and producing a derived artifact that can be reviewed.
