import type {
  BlockNode,
  BlockquoteNode,
  CodeBlockNode,
  EmphasisNode,
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
  StrongNode
} from "../../document-model/src";

export type RenderHtmlOptions = {
  title?: string;
};

export function renderDocumentToHtml(
  document: OserDocument,
  options: RenderHtmlOptions = {}
): string {
  const title = options.title ?? document.metadata.title ?? "Untitled document";
  const language = typeof document.metadata.language === "string" ? document.metadata.language : undefined;
  const htmlAttrs = language ? ` lang="${escapeAttribute(language)}"` : "";
  const body = renderBlocks(document.children, 3);

  return [
    "<!doctype html>",
    `<html${htmlAttrs}>`,
    "  <head>",
    "    <meta charset=\"utf-8\">",
    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    `    <title>${escapeText(title)}</title>`,
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
    case "figure":
      return `${indent(depth)}<!-- Unsupported OSER block: ${node.type} -->`;
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
