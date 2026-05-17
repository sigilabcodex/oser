import type {
  BlockNode,
  CodeBlockNode,
  FigureNode,
  ImageNode,
  InlineNode,
  LinkNode,
  OserDocument,
  ParagraphNode,
  SectionNode,
  TableNode
} from "../../document-model/src";

export type DiagnosticSeverity = "info" | "warning" | "error";

export type DiagnosticLocation = {
  nodePath?: string;
  sourceLocation?: {
    line?: number;
    column?: number;
    offset?: number;
  };
};

export type Diagnostic = {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  location?: DiagnosticLocation;
};

export type DiagnosticReport = {
  diagnostics: Diagnostic[];
  summary: {
    info: number;
    warnings: number;
    errors: number;
  };
};

export type ValidateOserDocumentOptions = {
  includeInfo?: boolean;
};

export function validateOserDocument(
  document: OserDocument,
  _options: ValidateOserDocumentOptions = {}
): DiagnosticReport {
  const diagnostics: Diagnostic[] = [];

  if (!document.metadata.title || String(document.metadata.title).trim().length === 0) {
    diagnostics.push({
      code: "document-title-missing",
      severity: "warning",
      message: "Document metadata is missing a title.",
      location: { nodePath: "/metadata/title" }
    });
  }

  validateBlocks(document.children, "/children", diagnostics, { previousHeadingLevel: undefined });

  return {
    diagnostics,
    summary: summarize(diagnostics)
  };
}

type HeadingState = {
  previousHeadingLevel: number | undefined;
};

function validateBlocks(
  blocks: BlockNode[],
  nodePath: string,
  diagnostics: Diagnostic[],
  headingState: HeadingState
): void {
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const currentPath = `${nodePath}/${index}`;

    switch (block.type) {
      case "section":
        validateSection(block, currentPath, diagnostics, headingState);
        break;
      case "heading":
        if (inlineText(block.children).trim().length === 0) {
          diagnostics.push({
            code: "heading-empty",
            severity: "warning",
            message: "Heading is empty.",
            location: { nodePath: currentPath }
          });
        }
        if (headingState.previousHeadingLevel !== undefined && block.level > headingState.previousHeadingLevel + 1) {
          diagnostics.push({
            code: "heading-level-skipped",
            severity: "warning",
            message: `Heading level jumps from h${headingState.previousHeadingLevel} to h${block.level}.`,
            location: { nodePath: currentPath }
          });
        }
        headingState.previousHeadingLevel = block.level;
        validateInlines(block.children, `${currentPath}/children`, diagnostics);
        break;
      case "paragraph":
        validateParagraph(block, currentPath, diagnostics);
        break;
      case "blockquote":
        validateBlocks(block.children, `${currentPath}/children`, diagnostics, headingState);
        break;
      case "list":
        for (let itemIndex = 0; itemIndex < block.children.length; itemIndex += 1) {
          validateBlocks(
            block.children[itemIndex].children,
            `${currentPath}/children/${itemIndex}/children`,
            diagnostics,
            headingState
          );
        }
        break;
      case "codeBlock":
        validateCodeBlock(block, currentPath, diagnostics);
        break;
      case "table":
        validateTable(block, currentPath, diagnostics, headingState);
        break;
      case "figure":
        validateFigure(block, currentPath, diagnostics);
        break;
      case "horizontalRule":
        break;
    }
  }
}

function validateSection(
  section: SectionNode,
  nodePath: string,
  diagnostics: Diagnostic[],
  headingState: HeadingState
): void {
  validateBlocks(section.children, `${nodePath}/children`, diagnostics, headingState);
}

function validateParagraph(paragraph: ParagraphNode, nodePath: string, diagnostics: Diagnostic[]): void {
  if (inlineText(paragraph.children).trim().length === 0) {
    diagnostics.push({
      code: "paragraph-empty",
      severity: "warning",
      message: "Paragraph is empty.",
      location: { nodePath }
    });
  }

  validateInlines(paragraph.children, `${nodePath}/children`, diagnostics);
}

function validateFigure(figure: FigureNode, nodePath: string, diagnostics: Diagnostic[]): void {
  for (let index = 0; index < figure.children.length; index += 1) {
    const child = figure.children[index];
    const childPath = `${nodePath}/children/${index}`;

    if (child.type === "image") {
      validateImage(child, childPath, diagnostics);
    } else {
      validateParagraph(child, childPath, diagnostics);
    }
  }

  if (figure.caption) {
    validateParagraph(figure.caption, `${nodePath}/caption`, diagnostics);
  }
}

function validateTable(
  table: TableNode,
  nodePath: string,
  diagnostics: Diagnostic[],
  headingState: HeadingState
): void {
  if (table.rows.length === 0) {
    diagnostics.push({
      code: "table-empty",
      severity: "error",
      message: "Table has no rows.",
      location: { nodePath }
    });
    return;
  }

  const expectedCellCount = table.rows[0].cells.length;
  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex += 1) {
    const row = table.rows[rowIndex];
    const rowPath = `${nodePath}/rows/${rowIndex}`;

    if (row.cells.length !== expectedCellCount) {
      diagnostics.push({
        code: "table-row-cell-count-mismatch",
        severity: "error",
        message: `Table row has ${row.cells.length} cells; expected ${expectedCellCount}.`,
        location: { nodePath: rowPath }
      });
    }

    for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex += 1) {
      validateBlocks(
        row.cells[cellIndex].children,
        `${rowPath}/cells/${cellIndex}/children`,
        diagnostics,
        headingState
      );
    }
  }
}

function validateCodeBlock(codeBlock: CodeBlockNode, nodePath: string, diagnostics: Diagnostic[]): void {
  if (codeBlock.value.trim().length === 0) {
    diagnostics.push({
      code: "code-block-empty",
      severity: "warning",
      message: "Code block is empty.",
      location: { nodePath }
    });
  }
}

function validateInlines(inlines: InlineNode[], nodePath: string, diagnostics: Diagnostic[]): void {
  for (let index = 0; index < inlines.length; index += 1) {
    const inline = inlines[index];
    const currentPath = `${nodePath}/${index}`;

    switch (inline.type) {
      case "emphasis":
      case "strong":
        validateInlines(inline.children, `${currentPath}/children`, diagnostics);
        break;
      case "link":
        validateLink(inline, currentPath, diagnostics);
        validateInlines(inline.children, `${currentPath}/children`, diagnostics);
        break;
      case "image":
        validateImage(inline, currentPath, diagnostics);
        break;
      case "text":
      case "inlineCode":
        break;
    }
  }
}

function validateImage(image: ImageNode, nodePath: string, diagnostics: Diagnostic[]): void {
  if (image.src.trim().length === 0) {
    diagnostics.push({
      code: "image-src-missing",
      severity: "error",
      message: "Image is missing src.",
      location: { nodePath }
    });
  }

  if (!image.alt || image.alt.trim().length === 0) {
    diagnostics.push({
      code: "image-alt-missing",
      severity: "warning",
      message: "Image is missing alt text.",
      location: { nodePath }
    });
  }
}

function validateLink(link: LinkNode, nodePath: string, diagnostics: Diagnostic[]): void {
  if (link.href.trim().length === 0) {
    diagnostics.push({
      code: "link-href-missing",
      severity: "error",
      message: "Link is missing href.",
      location: { nodePath }
    });
  }
}

function inlineText(inlines: InlineNode[]): string {
  return inlines.map((inline) => {
    switch (inline.type) {
      case "text":
      case "inlineCode":
        return inline.value;
      case "emphasis":
      case "strong":
      case "link":
        return inlineText(inline.children);
      case "image":
        return inline.alt ?? "";
    }
  }).join("");
}

function summarize(diagnostics: Diagnostic[]): DiagnosticReport["summary"] {
  return diagnostics.reduce(
    (summary, diagnostic) => {
      if (diagnostic.severity === "info") {
        summary.info += 1;
      } else if (diagnostic.severity === "warning") {
        summary.warnings += 1;
      } else {
        summary.errors += 1;
      }
      return summary;
    },
    { info: 0, warnings: 0, errors: 0 }
  );
}
