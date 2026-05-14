import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type {
  BlockNode,
  HeadingNode,
  OserDocument,
  ParagraphNode,
  SourceMapEntry,
  TextNode
} from "../../../document-model/src";
import type { ImportOptions, ImportResult, ImportWarning } from "../core/types";

const IMPORTER_VERSION = "0.1.0";

type ParagraphChunk = {
  value: string;
  startLine: number;
};

export async function importTxtFile(
  filePath: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const value = await readFile(filePath, "utf8");
  return importTxt(value, {
    filename: options.filename ?? filePath
  });
}

export async function importTxt(
  value: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const warnings: ImportWarning[] = [];
  const normalized = normalizeLineEndings(value);

  if (value.length > 0 && value.charCodeAt(0) === 0xfeff) {
    warnings.push({
      code: "txt-bom-removed",
      severity: "info",
      message: "UTF-8 byte order mark was removed from the imported text.",
      recoverable: true
    });
  }

  const chunks = splitParagraphs(normalized.replace(/^\uFEFF/, ""));

  if (chunks.length === 0) {
    warnings.push({
      code: "txt-empty-document",
      severity: "warning",
      message: "The TXT source did not contain importable text.",
      recoverable: true
    });
  }

  const children: BlockNode[] = [];
  const sourceMap: SourceMapEntry[] = [];

  chunks.forEach((chunk, index) => {
    const node = parseTxtChunk(chunk, warnings);
    children.push(node);
    sourceMap.push({
      nodePath: `/children/${index}`,
      sourceFormat: "txt",
      sourceLocation: {
        line: chunk.startLine
      }
    });
  });

  const document: OserDocument = {
    type: "document",
    version: "0.1",
    metadata: {
      title: inferTitle(children, options.filename),
      sourceFormat: "txt"
    },
    children,
    assets: [],
    sourceMap
  };

  return {
    document,
    source: {
      format: "txt",
      filename: options.filename,
      encoding: "utf-8"
    },
    assets: [],
    warnings,
    manifest: {
      importer: "txtImporter",
      importerVersion: IMPORTER_VERSION,
      importedAt: new Date().toISOString(),
      stats: {
        blocks: children.length,
        assets: 0,
        warnings: warnings.length
      }
    }
  };
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function splitParagraphs(value: string): ParagraphChunk[] {
  const lines = value.split("\n");
  const chunks: ParagraphChunk[] = [];
  let current: string[] = [];
  let startLine = 1;

  lines.forEach((line, index) => {
    if (line.trim().length === 0) {
      if (current.length > 0) {
        chunks.push({
          value: current.join("\n").trim(),
          startLine
        });
        current = [];
      }
      startLine = index + 2;
      return;
    }

    if (current.length === 0) {
      startLine = index + 1;
    }
    current.push(line);
  });

  if (current.length > 0) {
    chunks.push({
      value: current.join("\n").trim(),
      startLine
    });
  }

  return chunks;
}

function parseTxtChunk(
  chunk: ParagraphChunk,
  warnings: ImportWarning[]
): HeadingNode | ParagraphNode {
  const heading = parseHeading(chunk.value);

  if (heading) {
    if (heading.text.length === 0) {
      warnings.push({
        code: "txt-empty-heading",
        severity: "warning",
        message: "A heading marker was found without heading text.",
        location: { line: chunk.startLine },
        recoverable: true
      });
    }

    return {
      type: "heading",
      level: heading.level,
      children: [text(heading.text)]
    };
  }

  return {
    type: "paragraph",
    children: [text(chunk.value)]
  };
}

function parseHeading(value: string): { level: 1 | 2 | 3 | 4 | 5 | 6; text: string } | undefined {
  const match = /^(#{1,6})[ \t]+(.+?)#*[ \t]*$/.exec(value);
  if (!match) {
    return undefined;
  }

  return {
    level: match[1].length as 1 | 2 | 3 | 4 | 5 | 6,
    text: match[2].trim()
  };
}

function text(value: string): TextNode {
  return {
    type: "text",
    value
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
