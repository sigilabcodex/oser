import type {
  RenderManifest,
  RenderManifestDiagnosticItem,
  RenderManifestDiagnosticsSummary
} from "../../render-manifest/src";

export type StudioSourceFormat = "markdown" | "txt" | "unknown";

export type StudioDocumentResponse = {
  sourcePath: string;
  content: string;
  format: StudioSourceFormat;
};

export type StudioDocumentSummary = {
  id: string;
  name: string;
  path: string;
  format: StudioSourceFormat;
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

export type StudioRenderRequest = {
  sourcePath?: string;
  profilePath?: string;
  profileId?: string;
  renderId?: string;
};

export type StudioExportPdfRequest = StudioRenderRequest & {
  format?: "Letter" | "A4";
};

export type StudioValidateResponse = {
  sourcePath: string;
  diagnosticsPath: string;
  diagnostics: {
    summary: RenderManifestDiagnosticsSummary;
    items: RenderManifestDiagnosticItem[];
  };
};

export type StudioRenderManifestResponse = {
  renderId: string;
  manifest: RenderManifest;
  previewUrl?: string;
  pdfUrl?: string;
};

export type StudioRenderHistoryItem = {
  renderId: string;
  sourcePath: string;
  profilePath?: string;
  generatedAt: string;
  hasHtml: boolean;
  hasPdf: boolean;
  previewUrl?: string;
  pdfUrl?: string;
  diagnostics?: {
    summary: RenderManifestDiagnosticsSummary;
  };
  htmlManifest?: RenderManifest;
  pdfManifest?: RenderManifest;
};

export type StudioRenderHistoryResponse = {
  renders: StudioRenderHistoryItem[];
};

export type StudioErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};
