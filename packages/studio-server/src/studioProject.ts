import { readFile } from "node:fs/promises";
import { extname, normalize, resolve } from "node:path";
import type { StudioProfile, StudioSourceFormat } from "./types";

export const studioHost = "127.0.0.1";
export const studioPort = 4317;

export const studioOutputDirectory = "dist/studio";
export const studioPreviewHtmlPath = "dist/studio/preview.html";
export const studioPreviewStylePath = "dist/studio/editorial.css";
export const studioPreviewAssetsDirectory = "dist/studio/assets";
export const studioPreviewManifestPath = "dist/studio/preview.manifest.json";
export const studioExportPdfPath = "dist/studio/export.pdf";
export const studioExportHtmlPath = "dist/studio/export.html";
export const studioExportManifestPath = "dist/studio/export.manifest.json";
export const studioDiagnosticsPath = "dist/studio/diagnostics.json";

const allowedSources = new Map<string, string>([
  ["editorial-sample", "examples/editorial-sample.md"],
  ["examples/editorial-sample.md", "examples/editorial-sample.md"]
]);

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

export function defaultSourcePath(): string {
  return "examples/editorial-sample.md";
}

export function resolveAllowedSourcePath(sourcePath?: string): string {
  return resolveAllowedPath(sourcePath ?? defaultSourcePath(), allowedSources, "sourcePath");
}

export function resolveAllowedProfilePath(profilePath?: string, profileId?: string): string {
  const requested = profilePath ?? profileId ?? "classic-book";
  return resolveAllowedPath(requested, allowedProfiles, "profilePath");
}

export function resolveServedFilePath(urlPath: string): string | undefined {
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
