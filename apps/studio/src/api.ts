import type {
  ExportPdfResponse,
  ProfileListResponse,
  RenderHtmlResponse,
  StudioDocument,
  StudioDocumentListResponse,
  StudioDocumentSummary,
  StudioProfile,
  StudioRenderHistoryItem,
  StudioRenderHistoryResponse,
  ValidateResponse
} from "./types";

export async function fetchDocuments(): Promise<StudioDocumentSummary[]> {
  const response = await requestJson<StudioDocumentListResponse>("/api/studio/documents");
  return response.documents;
}

export async function fetchDocument(sourcePath?: string): Promise<StudioDocument> {
  const query = sourcePath ? `?sourcePath=${encodeURIComponent(sourcePath)}` : "";
  return requestJson<StudioDocument>(`/api/studio/document${query}`);
}

export async function fetchProfiles(): Promise<StudioProfile[]> {
  const response = await requestJson<ProfileListResponse>("/api/studio/profiles");
  return response.profiles;
}

export async function validateDocument(sourcePath: string): Promise<ValidateResponse> {
  return requestJson<ValidateResponse>("/api/studio/validate", {
    method: "POST",
    body: JSON.stringify({ sourcePath })
  });
}

export async function renderHtml(sourcePath: string, profilePath: string): Promise<RenderHtmlResponse> {
  return requestJson<RenderHtmlResponse>("/api/studio/render-html", {
    method: "POST",
    body: JSON.stringify({ sourcePath, profilePath })
  });
}

export async function exportPdf(
  sourcePath: string,
  profilePath: string,
  renderId?: string
): Promise<ExportPdfResponse> {
  return requestJson<ExportPdfResponse>("/api/studio/export-pdf", {
    method: "POST",
    body: JSON.stringify({ sourcePath, profilePath, renderId })
  });
}

export async function fetchRenderHistory(): Promise<StudioRenderHistoryItem[]> {
  const response = await requestJson<StudioRenderHistoryResponse>("/api/studio/renders");
  return response.renders;
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers
    }
  });

  const payload = await response.json() as T | { error?: { message?: string } };
  if (!response.ok) {
    const message = "error" in payload && payload.error?.message ? payload.error.message : response.statusText;
    throw new Error(message);
  }

  return payload as T;
}
