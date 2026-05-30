import type {
  BlockNode,
  BlockquoteNode,
  CodeBlockNode,
  EmphasisNode,
  FigureNode,
  HeadingNode,
  HorizontalRuleNode,
  ImageNode,
  InlineCodeNode,
  InlineNode,
  LinkNode,
  ListItemNode,
  ListNode,
  OserDocument,
  ParagraphNode,
  SectionNode,
  StrongNode,
  TableCellNode,
  TableNode,
  TableRowNode
} from "../../document-model/src";

export type RenderHtmlOptions = {
  title?: string;
  stylesheetHref?: string;
  stylesheetHrefs?: string[];
};

export function renderDocumentToHtml(
  document: OserDocument,
  options: RenderHtmlOptions = {}
): string {
  const title = options.title ?? document.metadata.title ?? "Untitled document";
  const language = typeof document.metadata.language === "string" ? document.metadata.language : undefined;
  const htmlAttrs = language ? ` lang="${escapeAttribute(language)}"` : "";
  const stylesheetHrefs = options.stylesheetHrefs ?? (options.stylesheetHref ? [options.stylesheetHref] : []);
  const stylesheetLinks = stylesheetHrefs
    .map((href) => `    <link rel="stylesheet" href="${escapeAttribute(href)}">`)
    .join("\n");
  const body = renderBlocks(document.children, 3);

  return [
    "<!doctype html>",
    `<html${htmlAttrs}>`,
    "  <head>",
    "    <meta charset=\"utf-8\">",
    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    `    <title>${escapeText(title)}</title>`,
    stylesheetLinks,
    "  </head>",
    "  <body>",
    "    <main>",
    body,
    "    </main>",
    "  </body>",
    "</html>"
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

function renderBlocks(nodes: BlockNode[], depth: number): string {
  return nodes.map((node) => renderBlock(node, depth)).join("\n");
}

function renderBlock(node: BlockNode, depth: number): string {
  switch (node.type) {
    case "section":
      return renderSection(node, depth);
    case "heading":
      return renderHeading(node, depth);
    case "paragraph":
      return renderParagraph(node, depth);
    case "horizontalRule":
      return renderHorizontalRule(node, depth);
    case "blockquote":
      return renderBlockquote(node, depth);
    case "list":
      return renderList(node, depth);
    case "codeBlock":
      return renderCodeBlock(node, depth);
    case "table":
      return renderTable(node, depth);
    case "figure":
      return renderFigure(node, depth);
  }
}

function renderSection(node: SectionNode, depth: number): string {
  const attrs = node.id ? ` id="${escapeAttribute(node.id)}"` : "";
  const inner = renderBlocks(node.children, depth + 1);

  if (inner.length === 0) {
    return `${indent(depth)}<section${attrs}></section>`;
  }

  return [`${indent(depth)}<section${attrs}>`, inner, `${indent(depth)}</section>`].join("\n");
}

function renderHeading(node: HeadingNode, depth: number): string {
  const tagName = `h${node.level}`;
  return `${indent(depth)}<${tagName}>${renderInlines(node.children)}</${tagName}>`;
}

function renderParagraph(node: ParagraphNode, depth: number): string {
  return `${indent(depth)}<p>${renderInlines(node.children)}</p>`;
}

function renderHorizontalRule(_node: HorizontalRuleNode, depth: number): string {
  return `${indent(depth)}<hr>`;
}

function renderBlockquote(node: BlockquoteNode, depth: number): string {
  const inner = renderBlocks(node.children, depth + 1);

  if (inner.length === 0) {
    return `${indent(depth)}<blockquote></blockquote>`;
  }

  return [`${indent(depth)}<blockquote>`, inner, `${indent(depth)}</blockquote>`].join("\n");
}

function renderList(node: ListNode, depth: number): string {
  const tagName = node.ordered ? "ol" : "ul";
  const start = node.ordered && node.start && node.start !== 1 ? ` start="${node.start}"` : "";
  const items = node.children.map((item) => renderListItem(item, depth + 1)).join("\n");

  if (items.length === 0) {
    return `${indent(depth)}<${tagName}${start}></${tagName}>`;
  }

  return [`${indent(depth)}<${tagName}${start}>`, items, `${indent(depth)}</${tagName}>`].join("\n");
}

function renderListItem(node: ListItemNode, depth: number): string {
  const inner = renderBlocks(node.children, depth + 1);

  if (inner.length === 0) {
    return `${indent(depth)}<li></li>`;
  }

  return [`${indent(depth)}<li>`, inner, `${indent(depth)}</li>`].join("\n");
}

function renderCodeBlock(node: CodeBlockNode, depth: number): string {
  const language = node.language ? ` class="language-${escapeAttribute(node.language)}"` : "";
  return `${indent(depth)}<pre><code${language}>${escapeText(node.value)}</code></pre>`;
}

function renderTable(node: TableNode, depth: number): string {
  const firstBodyRowIndex = node.rows.findIndex((row) => !isHeaderRow(row));
  const headerRows = firstBodyRowIndex === -1 ? node.rows : node.rows.slice(0, firstBodyRowIndex);
  const bodyRows = firstBodyRowIndex === -1 ? [] : node.rows.slice(firstBodyRowIndex);
  const lines = [`${indent(depth)}<table>`];

  if (headerRows.length > 0) {
    lines.push(`${indent(depth + 1)}<thead>`);
    lines.push(headerRows.map((row) => renderTableRow(row, depth + 2)).join("\n"));
    lines.push(`${indent(depth + 1)}</thead>`);
  }

  if (bodyRows.length > 0) {
    lines.push(`${indent(depth + 1)}<tbody>`);
    lines.push(bodyRows.map((row) => renderTableRow(row, depth + 2)).join("\n"));
    lines.push(`${indent(depth + 1)}</tbody>`);
  }

  lines.push(`${indent(depth)}</table>`);
  return lines.join("\n");
}

function isHeaderRow(row: TableRowNode): boolean {
  return row.cells.length > 0 && row.cells.every((cell) => cell.header);
}

function renderTableRow(node: TableRowNode, depth: number): string {
  if (node.cells.length === 0) {
    return `${indent(depth)}<tr></tr>`;
  }

  return [
    `${indent(depth)}<tr>`,
    node.cells.map((cell) => renderTableCell(cell, depth + 1)).join("\n"),
    `${indent(depth)}</tr>`
  ].join("\n");
}

function renderTableCell(node: TableCellNode, depth: number): string {
  const tagName = node.header ? "th" : "td";
  const align = node.align ? ` data-align="${escapeAttribute(node.align)}"` : "";
  const inner = renderBlocks(node.children, depth + 1);

  if (inner.length === 0) {
    return `${indent(depth)}<${tagName}${align}></${tagName}>`;
  }

  return [`${indent(depth)}<${tagName}${align}>`, inner, `${indent(depth)}</${tagName}>`].join("\n");
}

function renderFigure(node: FigureNode, depth: number): string {
  const children = node.children.map((child) => {
    if (child.type === "image") {
      return `${indent(depth + 1)}${renderImage(child)}`;
    }

    return renderParagraph(child, depth + 1);
  });

  if (node.caption) {
    children.push(`${indent(depth + 1)}<figcaption>${renderInlines(node.caption.children)}</figcaption>`);
  }

  if (children.length === 0) {
    return `${indent(depth)}<figure></figure>`;
  }

  return [`${indent(depth)}<figure>`, children.join("\n"), `${indent(depth)}</figure>`].join("\n");
}

function renderInlines(nodes: InlineNode[]): string {
  return nodes.map(renderInline).join("");
}

function renderInline(node: InlineNode): string {
  switch (node.type) {
    case "text":
      return escapeText(node.value);
    case "emphasis":
      return renderEmphasis(node);
    case "strong":
      return renderStrong(node);
    case "inlineCode":
      return renderInlineCode(node);
    case "link":
      return renderLink(node);
    case "image":
      return renderImage(node);
  }
}

function renderEmphasis(node: EmphasisNode): string {
  return `<em>${renderInlines(node.children)}</em>`;
}

function renderStrong(node: StrongNode): string {
  return `<strong>${renderInlines(node.children)}</strong>`;
}

function renderInlineCode(node: InlineCodeNode): string {
  return `<code>${escapeText(node.value)}</code>`;
}

function renderLink(node: LinkNode): string {
  const title = node.title ? ` title="${escapeAttribute(node.title)}"` : "";
  return `<a href="${escapeAttribute(node.href)}"${title}>${renderInlines(node.children)}</a>`;
}

function renderImage(node: ImageNode): string {
  const title = node.title ? ` title="${escapeAttribute(node.title)}"` : "";
  return `<img src="${escapeAttribute(node.src)}" alt="${escapeAttribute(node.alt ?? "")}"${title}>`;
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function indent(depth: number): string {
  return "  ".repeat(depth);
}
