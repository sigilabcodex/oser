import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import type { StudioDocumentSummary, StudioProfile, StudioSourceFormat } from "./types";

export const studioHost = "127.0.0.1";
export const studioPort = 4317;

export const studioOutputDirectory = "dist/studio";
export const studioRendersDirectory = `${studioOutputDirectory}/renders`;
export const studioPreviewHtmlPath = "dist/studio/preview.html";
export const studioPreviewStylePath = "dist/studio/editorial.css";
export const studioPreviewAssetsDirectory = "dist/studio/assets";
export const studioPreviewManifestPath = "dist/studio/preview.manifest.json";
export const studioExportPdfPath = "dist/studio/export.pdf";
export const studioExportHtmlPath = "dist/studio/export.html";
export const studioExportManifestPath = "dist/studio/export.manifest.json";
export const studioDiagnosticsPath = "dist/studio/diagnostics.json";

const renderIdPattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-[a-f0-9]{6}$/;

const allowedSourceDocuments: StudioDocumentSummary[] = [
  {
    id: "editorial-sample",
    name: "Editorial sample",
    path: "examples/editorial-sample.md",
    format: "markdown"
  },
  {
    id: "bad-heading-hierarchy",
    name: "Bad heading hierarchy",
    path: "stress-tests/cases/bad-heading-hierarchy.md",
    format: "markdown"
  },
  {
    id: "wide-table",
    name: "Wide table",
    path: "stress-tests/cases/wide-table.md",
    format: "markdown"
  }
];

const allowedSources = new Map<string, string>(
  allowedSourceDocuments.flatMap((document) => [
    [document.id, document.path],
    [document.path, document.path]
  ])
);

const allowedProfiles = new Map<string, string>([
  ["classic-book", "examples/profiles/classic-book.json"],
  ["examples/profiles/classic-book.json", "examples/profiles/classic-book.json"],
  ["report", "examples/profiles/report.json"],
  ["examples/profiles/report.json", "examples/profiles/report.json"]
]);

const allowedServedFiles = new Map<string, string>([
  ["/preview/preview.html", studioPreviewHtmlPath],
  ["/preview/editorial.css", studioPreviewStylePath],
  ["/preview/profile-classic-book.css", `${studioOutputDirectory}/profile-classic-book.css`],
  ["/preview/profile-report.css", `${studioOutputDirectory}/profile-report.css`],
  ["/preview/assets/placeholder.svg", `${studioPreviewAssetsDirectory}/placeholder.svg`],
  ["/outputs/export.pdf", studioExportPdfPath]
]);

export type StudioRenderPaths = {
  renderId: string;
  directory: string;
  previewHtmlPath: string;
  previewManifestPath: string;
  previewStylePath: string;
  previewAssetsDirectory: string;
  exportPdfPath: string;
  exportHtmlPath: string;
  exportManifestPath: string;
};

export function defaultSourcePath(): string {
  return "examples/editorial-sample.md";
}

export function listDocuments(): StudioDocumentSummary[] {
  return allowedSourceDocuments;
}

export function resolveAllowedSourcePath(sourcePath?: string): string {
  return resolveAllowedPath(sourcePath ?? defaultSourcePath(), allowedSources, "sourcePath");
}

export function resolveAllowedProfilePath(profilePath?: string, profileId?: string): string {
  const requested = profilePath ?? profileId ?? "classic-book";
  return resolveAllowedPath(requested, allowedProfiles, "profilePath");
}

export function createRenderId(): string {
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "").replace(/:/g, "-");
  return `${timestamp}-${randomBytes(3).toString("hex")}`;
}

export function assertValidRenderId(renderId: string): string {
  if (!renderIdPattern.test(renderId)) {
    throw new StudioProjectError("render-id-not-allowed", "renderId is not allowed for the Studio server.");
  }

  return renderId;
}

export function renderPathsFor(renderId: string): StudioRenderPaths {
  const safeRenderId = assertValidRenderId(renderId);
  const directory = join(studioRendersDirectory, safeRenderId);

  return {
    renderId: safeRenderId,
    directory,
    previewHtmlPath: join(directory, "preview.html"),
    previewManifestPath: join(directory, "preview.manifest.json"),
    previewStylePath: join(directory, "editorial.css"),
    previewAssetsDirectory: join(directory, "assets"),
    exportPdfPath: join(directory, "export.pdf"),
    exportHtmlPath: join(directory, "export.html"),
    exportManifestPath: join(directory, "export.manifest.json")
  };
}

export async function ensureRenderDirectory(renderId: string): Promise<StudioRenderPaths> {
  const paths = renderPathsFor(renderId);
  await mkdir(paths.directory, { recursive: true });
  return paths;
}

export async function listRenderIds(): Promise<string[]> {
  try {
    const entries = await readdir(studioRendersDirectory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && renderIdPattern.test(entry.name))
      .map((entry) => entry.name)
      .sort()
      .reverse();
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function previewUrlForRender(renderId: string): string {
  return `/preview/renders/${assertValidRenderId(renderId)}/preview.html`;
}

export function pdfUrlForRender(renderId: string): string {
  return `/outputs/renders/${assertValidRenderId(renderId)}/export.pdf`;
}

export function resolveServedFilePath(urlPath: string): string | undefined {
  const renderFilePath = resolveRenderServedFilePath(urlPath);
  if (renderFilePath) {
    return renderFilePath;
  }

  const filePath = allowedServedFiles.get(urlPath);
  return filePath ? resolve(filePath) : undefined;
}

export function sourceFormatForPath(sourcePath: string): StudioSourceFormat {
  const extension = extname(sourcePath).toLowerCase();

  if (extension === ".md" || extension === ".markdown") {
    return "markdown";
  }

  if (extension === ".txt") {
    return "txt";
  }

  return "unknown";
}

export async function listProfiles(): Promise<StudioProfile[]> {
  const profilePaths = ["examples/profiles/classic-book.json", "examples/profiles/report.json"];
  return Promise.all(profilePaths.map(readProfile));
}

async function readProfile(profilePath: string): Promise<StudioProfile> {
  const profile = JSON.parse(await readFile(profilePath, "utf8")) as {
    id?: string;
    name?: string;
    description?: string;
  };

  return {
    id: profile.id ?? profilePath,
    name: profile.name ?? profile.id ?? profilePath,
    path: profilePath,
    description: profile.description
  };
}

function resolveRenderServedFilePath(urlPath: string): string | undefined {
  const previewMatch = urlPath.match(/^\/preview\/renders\/([^/]+)\/preview\.html$/);
  if (previewMatch) {
    return resolve(renderPathsFor(previewMatch[1]).previewHtmlPath);
  }

  const pdfMatch = urlPath.match(/^\/outputs\/renders\/([^/]+)\/export\.pdf$/);
  if (pdfMatch) {
    return resolve(renderPathsFor(pdfMatch[1]).exportPdfPath);
  }

  const assetMatch = urlPath.match(/^\/preview\/renders\/([^/]+)\/assets\/placeholder\.svg$/);
  if (assetMatch) {
    return resolve(join(renderPathsFor(assetMatch[1]).previewAssetsDirectory, "placeholder.svg"));
  }

  const cssMatch = urlPath.match(/^\/preview\/renders\/([^/]+)\/(editorial|profile-[a-z0-9-]+)\.css$/i);
  if (cssMatch) {
    return resolve(join(renderPathsFor(cssMatch[1]).directory, `${cssMatch[2]}.css`));
  }

  return undefined;
}

function resolveAllowedPath(value: string, allowlist: Map<string, string>, fieldName: string): string {
  const normalized = normalizeSlashes(normalize(value));
  const allowedPath = allowlist.get(normalized);

  if (!allowedPath) {
    throw new StudioProjectError(
      "path-not-allowed",
      `${fieldName} is not allowed for the Studio server MVP.`
    );
  }

  return allowedPath;
}

function normalizeSlashes(value: string): string {
  return value.split("\\").join("/");
}

export class StudioProjectError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "StudioProjectError";
    this.code = code;
  }
}
