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
  manifest: RenderManifest;
  previewUrl?: string;
  pdfUrl?: string;
};

export type StudioErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};
