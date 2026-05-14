import type { OserDocument } from "../../../document-model/src";

export type ImportFormat = "txt" | "markdown" | "rtf" | "docx" | "html";

export type ImportResult = {
  document: OserDocument;
  source: ImportSource;
  assets: ImportAsset[];
  warnings: ImportWarning[];
  manifest: ImportManifest;
};

export type ImportSource = {
  format: ImportFormat;
  filename?: string;
  encoding?: string;
  checksum?: string;
};

export type ImportWarning = {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  sourcePath?: string;
  location?: {
    line?: number;
    paragraphIndex?: number;
    headingPath?: string[];
  };
  recoverable: boolean;
};

export type ImportAsset = {
  id: string;
  kind: "image" | "file";
  filename?: string;
  mediaType?: string;
  originalSource?: string;
  outputPath?: string;
  alt?: string;
};

export type ImportManifest = {
  importer: string;
  importerVersion: string;
  importedAt: string;
  stats: {
    blocks: number;
    assets: number;
    warnings: number;
  };
};

export type Importer<Input> = {
  format: ImportFormat;
  import(input: Input, options?: ImportOptions): Promise<ImportResult>;
};

export type ImportOptions = {
  filename?: string;
};
