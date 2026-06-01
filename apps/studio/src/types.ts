export type StudioDocument = {
  sourcePath: string;
  content: string;
  format: "markdown" | "txt" | "unknown";
};

export type StudioDocumentSummary = {
  id: string;
  name: string;
  path: string;
  format: "markdown" | "txt" | "unknown";
};

export type StudioDocumentListResponse = {
  documents: StudioDocumentSummary[];
};

export type StudioProfile = {
  id: string;
  name: string;
  path: string;
  description?: string;
};

export type ProfileListResponse = {
  profiles: StudioProfile[];
};

export type DiagnosticSummary = {
  info: number;
  warnings: number;
  errors: number;
};

export type DiagnosticItem = {
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
  path?: string;
};

export type DiagnosticsPayload = {
  summary: DiagnosticSummary;
  items: DiagnosticItem[];
};

export type ValidateResponse = {
  sourcePath: string;
  diagnosticsPath: string;
  diagnostics: DiagnosticsPayload;
};

export type RenderManifest = {
  schemaVersion: "1";
  generatedAt: string;
  source: {
    inputPath: string;
    inputFormat: string;
  };
  render: {
    target: "html" | "pdf";
    profilePath?: string;
    stylePath?: string;
    generatedCssPath?: string;
    format?: string;
  };
  outputs: {
    htmlPath?: string;
    pdfPath?: string;
    cssPaths: string[];
    manifestPath?: string;
  };
  diagnostics: DiagnosticsPayload;
};

export type RenderHtmlResponse = {
  manifest: RenderManifest;
  previewUrl?: string;
};

export type ExportPdfResponse = {
  manifest: RenderManifest;
  pdfUrl?: string;
};
