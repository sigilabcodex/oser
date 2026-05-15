import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type {
  BlockNode,
  FigureNode,
  HeadingNode,
  InlineNode,
  ListItemNode,
  ListNode,
  OserDocument,
  ParagraphNode,
  SourceMapEntry,
  TableCellNode,
  TableNode,
  TableRowNode
} from "../../../document-model/src";
import type { ImportOptions, ImportResult, ImportWarning } from "../core/types";

const IMPORTER_VERSION = "0.1.0";

const markdown = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false
});

type ParseContext = {
  warnings: ImportWarning[];
  sourceMap: SourceMapEntry[];
};

export async function importMarkdownFile(
  filePath: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const value = await readFile(filePath, "utf8");
  return importMarkdown(value, {
    filename: options.filename ?? filePath
  });
}

export async function importMarkdown(
  value: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const warnings: ImportWarning[] = [];
  const sourceMap: SourceMapEntry[] = [];

  if (value.length > 0 && value.charCodeAt(0) === 0xfeff) {
    warnings.push({
      code: "markdown-bom-removed",
      severity: "info",
      message: "UTF-8 byte order mark was removed from the imported Markdown.",
      recoverable: true
    });
  }

  const tokens = markdown.parse(value.replace(/^\uFEFF/, ""), {});
  const context: ParseContext = { warnings, sourceMap };
  const children = parseBlocks(tokens, 0, tokens.length, context, "/children");

  if (children.length === 0) {
    warnings.push({
      code: "markdown-empty-document",
      severity: "warning",
      message: "The Markdown source did not contain importable document blocks.",
      recoverable: true
    });
  }

  const document: OserDocument = {
    type: "document",
    version: "0.1",
    metadata: {
      title: inferTitle(children, options.filename),
      sourceFormat: "markdown"
    },
    children,
    assets: [],
    sourceMap
  };

  return {
    document,
    source: {
      format: "markdown",
      filename: options.filename,
      encoding: "utf-8"
    },
    assets: [],
    warnings,
    manifest: {
      importer: "markdownImporter",
      importerVersion: IMPORTER_VERSION,
      importedAt: new Date().toISOString(),
      stats: {
        blocks: countBlocks(children),
        assets: 0,
        warnings: warnings.length
      }
    }
  };
}

function parseBlocks(
  tokens: Token[],
  start: number,
  end: number,
  context: ParseContext,
  nodePath: string
): BlockNode[] {
  const blocks: BlockNode[] = [];
  let index = start;

  while (index < end) {
    const token = tokens[index];
    const currentPath = `${nodePath}/${blocks.length}`;

    switch (token.type) {
      case "heading_open": {
        const inline = tokens[index + 1];
        const node: HeadingNode = {
          type: "heading",
          level: parseHeadingLevel(token.tag),
          children: inline?.type === "inline" ? parseInlineChildren(inline.children ?? [], context) : []
        };
        blocks.push(node);
        addSourceMap(context, currentPath, token);
        index += 3;
        break;
      }

      case "paragraph_open": {
        const inline = tokens[index + 1];
        const children = inline?.type === "inline" ? parseInlineChildren(inline.children ?? [], context) : [];
        const node = paragraphOrFigure(children);
        blocks.push(node);
        addSourceMap(context, currentPath, token);
        index += 3;
        break;
      }

      case "blockquote_open": {
        const closeIndex = findMatchingClose(tokens, index, "blockquote_open", "blockquote_close");
        blocks.push({
          type: "blockquote",
          children: parseBlocks(tokens, index + 1, closeIndex, context, `${currentPath}/children`)
        });
        addSourceMap(context, currentPath, token);
        index = closeIndex + 1;
        break;
      }

      case "bullet_list_open":
      case "ordered_list_open": {
        const closeType = token.type === "bullet_list_open" ? "bullet_list_close" : "ordered_list_close";
        const closeIndex = findMatchingClose(tokens, index, token.type, closeType);
        blocks.push(parseList(tokens, index, closeIndex, context, currentPath));
        addSourceMap(context, currentPath, token);
        index = closeIndex + 1;
        break;
      }

      case "fence":
      case "code_block":
        blocks.push({
          type: "codeBlock",
          value: token.content,
          language: token.info.trim() || undefined
        });
        addSourceMap(context, currentPath, token);
        index += 1;
        break;

      case "hr":
        blocks.push({ type: "horizontalRule" });
        addSourceMap(context, currentPath, token);
        index += 1;
        break;

      case "table_open": {
        const closeIndex = findMatchingClose(tokens, index, "table_open", "table_close");
        blocks.push(parseTable(tokens, index, closeIndex, context));
        addSourceMap(context, currentPath, token);
        index = closeIndex + 1;
        break;
      }

      case "html_block":
        context.warnings.push({
          code: "markdown-html-block-ignored",
          severity: "warning",
          message: "Raw HTML blocks are not imported in the initial Markdown importer.",
          location: lineLocation(token),
          recoverable: true
        });
        index += 1;
        break;

      default:
        index += 1;
        break;
    }
  }

  return blocks;
}

function paragraphOrFigure(children: InlineNode[]): ParagraphNode | FigureNode {
  if (children.length === 1 && children[0].type === "image") {
    return {
      type: "figure",
      children: [children[0]]
    };
  }

  return {
    type: "paragraph",
    children
  };
}

function parseList(
  tokens: Token[],
  openIndex: number,
  closeIndex: number,
  context: ParseContext,
  nodePath: string
): ListNode {
  const openToken = tokens[openIndex];
  const children: ListItemNode[] = [];
  let index = openIndex + 1;

  while (index < closeIndex) {
    const token = tokens[index];
    if (token.type !== "list_item_open") {
      index += 1;
      continue;
    }

    const itemCloseIndex = findMatchingClose(tokens, index, "list_item_open", "list_item_close");
    const itemPath = `${nodePath}/children/${children.length}`;
    children.push({
      type: "listItem",
      children: parseBlocks(tokens, index + 1, itemCloseIndex, context, `${itemPath}/children`)
    });
    addSourceMap(context, itemPath, token);
    index = itemCloseIndex + 1;
  }

  return {
    type: "list",
    ordered: openToken.type === "ordered_list_open",
    start: parseStart(openToken),
    children
  };
}

function parseTable(tokens: Token[], openIndex: number, closeIndex: number, context: ParseContext): TableNode {
  const rows: TableRowNode[] = [];
  let index = openIndex + 1;
  let expectedCellCount: number | undefined;

  while (index < closeIndex) {
    const token = tokens[index];

    if (token.type !== "tr_open") {
      index += 1;
      continue;
    }

    const rowCloseIndex = findMatchingClose(tokens, index, "tr_open", "tr_close");
    const row = parseTableRow(tokens, index, rowCloseIndex, context);
    if (expectedCellCount === undefined) {
      expectedCellCount = row.cells.length;
    } else if (row.cells.length !== expectedCellCount) {
      context.warnings.push({
        code: "markdown-table-irregular-row",
        severity: "warning",
        message: "A Markdown table row has a different number of cells than the first row.",
        location: lineLocation(token),
        recoverable: true
      });
    }
    rows.push(row);
    index = rowCloseIndex + 1;
  }

  return {
    type: "table",
    rows
  };
}

function parseTableRow(tokens: Token[], openIndex: number, closeIndex: number, context: ParseContext): TableRowNode {
  const cells: TableCellNode[] = [];
  let index = openIndex + 1;

  while (index < closeIndex) {
    const token = tokens[index];

    if (token.type !== "th_open" && token.type !== "td_open") {
      index += 1;
      continue;
    }

    const closeType = token.type === "th_open" ? "th_close" : "td_close";
    const cellCloseIndex = findMatchingClose(tokens, index, token.type, closeType);
    const inline = tokens[index + 1];
    const cellChildren = inline?.type === "inline" ? parseInlineChildren(inline.children ?? [], context) : [];
    cells.push({
      type: "tableCell",
      header: token.type === "th_open" || undefined,
      align: parseCellAlign(token),
      children: [
        {
          type: "paragraph",
          children: cellChildren
        }
      ]
    });
    index = cellCloseIndex + 1;
  }

  return {
    type: "tableRow",
    cells
  };
}

function parseInlineChildren(tokens: Token[], context: ParseContext): InlineNode[] {
  const nodes: InlineNode[] = [];
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];

    switch (token.type) {
      case "text":
        nodes.push({ type: "text", value: token.content });
        index += 1;
        break;

      case "code_inline":
        nodes.push({ type: "inlineCode", value: token.content });
        index += 1;
        break;

      case "softbreak":
      case "hardbreak":
        nodes.push({ type: "text", value: "\n" });
        index += 1;
        break;

      case "em_open": {
        const closeIndex = findInlineClose(tokens, index, "em_open", "em_close");
        nodes.push({
          type: "emphasis",
          children: parseInlineChildren(tokens.slice(index + 1, closeIndex), context)
        });
        index = closeIndex + 1;
        break;
      }

      case "strong_open": {
        const closeIndex = findInlineClose(tokens, index, "strong_open", "strong_close");
        nodes.push({
          type: "strong",
          children: parseInlineChildren(tokens.slice(index + 1, closeIndex), context)
        });
        index = closeIndex + 1;
        break;
      }

      case "link_open": {
        const closeIndex = findInlineClose(tokens, index, "link_open", "link_close");
        const href = token.attrGet("href");
        if (!href) {
          context.warnings.push({
            code: "markdown-link-missing-href",
            severity: "warning",
            message: "A Markdown link was found without an href.",
            recoverable: true
          });
        }

        nodes.push({
          type: "link",
          href: href ?? "",
          title: token.attrGet("title") ?? undefined,
          children: parseInlineChildren(tokens.slice(index + 1, closeIndex), context)
        });
        index = closeIndex + 1;
        break;
      }

      case "image": {
        const src = token.attrGet("src") ?? "";
        const alt = token.content;

        if (alt.trim().length === 0) {
          context.warnings.push({
            code: "markdown-image-missing-alt",
            severity: "warning",
            message: "A Markdown image is missing alt text.",
            recoverable: true
          });
        }

        if (src.trim().length === 0) {
          context.warnings.push({
            code: "markdown-image-empty-src",
            severity: "warning",
            message: "A Markdown image has an empty image source.",
            recoverable: true
          });
        }

        nodes.push({
          type: "image",
          src,
          alt,
          title: token.attrGet("title") ?? undefined
        });
        index += 1;
        break;
      }

      case "html_inline":
        context.warnings.push({
          code: "markdown-html-inline-ignored",
          severity: "warning",
          message: "Raw inline HTML is not imported in the initial Markdown importer.",
          recoverable: true
        });
        index += 1;
        break;

      default:
        index += 1;
        break;
    }
  }

  return nodes;
}

function parseCellAlign(token: Token): "left" | "center" | "right" | undefined {
  const style = token.attrGet("style");
  if (style === "text-align:left") {
    return "left";
  }

  if (style === "text-align:center") {
    return "center";
  }

  if (style === "text-align:right") {
    return "right";
  }

  return undefined;
}

function findMatchingClose(tokens: Token[], openIndex: number, openType: string, closeType: string): number {
  let depth = 0;

  for (let index = openIndex; index < tokens.length; index += 1) {
    if (tokens[index].type === openType) {
      depth += 1;
    }

    if (tokens[index].type === closeType) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return tokens.length - 1;
}

function findInlineClose(tokens: Token[], openIndex: number, openType: string, closeType: string): number {
  let depth = 0;

  for (let index = openIndex; index < tokens.length; index += 1) {
    if (tokens[index].type === openType) {
      depth += 1;
    }

    if (tokens[index].type === closeType) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return openIndex;
}

function parseHeadingLevel(tag: string): 1 | 2 | 3 | 4 | 5 | 6 {
  const level = Number(tag.replace(/^h/, ""));
  if (level >= 1 && level <= 6) {
    return level as 1 | 2 | 3 | 4 | 5 | 6;
  }
  return 1;
}

function parseStart(token: Token): number | undefined {
  const start = token.attrGet("start");
  if (!start) {
    return undefined;
  }

  const value = Number(start);
  return Number.isFinite(value) ? value : undefined;
}

function addSourceMap(context: ParseContext, nodePath: string, token: Token): void {
  context.sourceMap.push({
    nodePath,
    sourceFormat: "markdown",
    sourceLocation: lineLocation(token)
  });
}

function lineLocation(token: Token): { line?: number } | undefined {
  if (!token.map) {
    return undefined;
  }

  return {
    line: token.map[0] + 1
  };
}

function inferTitle(children: BlockNode[], filename?: string): string | undefined {
  const firstHeading = children.find((node): node is HeadingNode => node.type === "heading");
  const firstText = firstHeading?.children[0];

  if (firstText?.type === "text" && firstText.value.length > 0) {
    return firstText.value;
  }

  if (!filename) {
    return undefined;
  }

  return basename(filename).replace(/\.[^.]+$/, "");
}

function countBlocks(blocks: BlockNode[]): number {
  return blocks.reduce((count, block) => {
    if (block.type === "blockquote" || block.type === "section") {
      return count + 1 + countBlocks(block.children);
    }

    if (block.type === "list") {
      return (
        count +
        1 +
        block.children.reduce((itemCount, item) => itemCount + 1 + countBlocks(item.children), 0)
      );
    }

    return count + 1;
  }, 0);
}
