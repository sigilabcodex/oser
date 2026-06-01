import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname } from "node:path";
import {
  exportStudioPdf,
  getStudioDocument,
  renderStudioHtml,
  validateStudioDocument
} from "./oserPipeline";
import { listDocuments, listProfiles, resolveServedFilePath, StudioProjectError } from "./studioProject";
import type { StudioErrorResponse } from "./types";

const maxBodyBytes = 64 * 1024;

export async function handleStudioRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    const method = request.method ?? "GET";
    const rawUrl = request.url ?? "/";
    const url = new URL(rawUrl, "http://127.0.0.1");

    if (method === "GET" && hasPathTraversal(rawUrl)) {
      sendJson(response, 403, errorResponse("path-not-allowed", "Path traversal is not allowed."));
      return;
    }

    if (method === "GET" && url.pathname === "/api/studio/documents") {
      sendJson(response, 200, { documents: listDocuments() });
      return;
    }

    if (method === "GET" && url.pathname === "/api/studio/document") {
      sendJson(response, 200, await getStudioDocument(url.searchParams.get("sourcePath") ?? undefined));
      return;
    }

    if (method === "GET" && url.pathname === "/api/studio/profiles") {
      sendJson(response, 200, { profiles: await listProfiles() });
      return;
    }

    if (method === "POST" && url.pathname === "/api/studio/validate") {
      sendJson(response, 200, await validateStudioDocument(await readJsonBody(request)));
      return;
    }

    if (method === "POST" && url.pathname === "/api/studio/render-html") {
      sendJson(response, 200, await renderStudioHtml(await readJsonBody(request)));
      return;
    }

    if (method === "POST" && url.pathname === "/api/studio/export-pdf") {
      sendJson(response, 200, await exportStudioPdf(await readJsonBody(request)));
      return;
    }

    if (method === "GET" && isAllowedStaticRoute(url.pathname)) {
      await serveAllowedFile(url.pathname, response);
      return;
    }

    sendJson(response, 404, errorResponse("not-found", "Route not found."));
  } catch (error) {
    const code = error instanceof StudioProjectError ? error.code : "studio-server-error";
    const message = error instanceof Error ? error.message : String(error);
    sendJson(response, code === "path-not-allowed" ? 403 : 500, errorResponse(code, message));
  }
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > maxBodyBytes) {
      throw new Error("Request body is too large.");
    }

    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  const value = Buffer.concat(chunks).toString("utf8").trim();
  if (value.length === 0) {
    return {};
  }

  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object request body.");
  }

  return parsed as Record<string, unknown>;
}

async function serveAllowedFile(urlPath: string, response: ServerResponse): Promise<void> {
  const filePath = resolveServedFilePath(urlPath);

  if (!filePath) {
    sendJson(response, 404, errorResponse("not-found", "File not found."));
    return;
  }

  await stat(filePath);
  response.statusCode = 200;
  response.setHeader("Content-Type", contentTypeForPath(filePath));
  response.setHeader("X-Content-Type-Options", "nosniff");
  createReadStream(filePath).pipe(response);
}

function hasPathTraversal(rawUrl: string): boolean {
  const rawPath = rawUrl.split("?")[0] ?? "";
  return rawPath.includes("..") || /%2e/i.test(rawPath);
}

function isAllowedStaticRoute(pathname: string): boolean {
  return pathname === "/preview/preview.html"
    || pathname === "/preview/editorial.css"
    || pathname === "/preview/profile-classic-book.css"
    || pathname === "/preview/profile-report.css"
    || pathname === "/preview/assets/placeholder.svg"
    || pathname === "/outputs/export.pdf";
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function errorResponse(code: string, message: string): StudioErrorResponse {
  return {
    error: {
      code,
      message
    }
  };
}

function contentTypeForPath(filePath: string): string {
  switch (extname(filePath).toLowerCase()) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".pdf":
      return "application/pdf";
    case ".css":
      return "text/css; charset=utf-8";
    case ".svg":
      return "image/svg+xml; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}
