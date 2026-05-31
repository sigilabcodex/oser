import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { validateOserDocument } from "../../diagnostics/src";
import { defaultEditorialStylePath, renderHtmlFromFile } from "../../html-renderer/src";
import { importMarkdownFile, importTxtFile } from "../../importers/src";
import { renderPdfFromFile, type PdfPageFormat } from "../../pdf-renderer/src/renderPdfFromFile";
import { type RenderManifest, type RenderManifestDiagnosticItem } from "../../render-manifest/src";
import {
  resolveAllowedProfilePath,
  resolveAllowedSourcePath,
  sourceFormatForPath,
  studioDiagnosticsPath,
  studioExportHtmlPath,
  studioExportManifestPath,
  studioExportPdfPath,
  studioOutputDirectory,
  studioPreviewHtmlPath,
  studioPreviewManifestPath,
  studioPreviewStylePath
} from "./studioProject";
import type {
  StudioDocumentResponse,
  StudioExportPdfRequest,
  StudioRenderManifestResponse,
  StudioRenderRequest,
  StudioValidateResponse
} from "./types";

export async function getStudioDocument(sourcePath?: string): Promise<StudioDocumentResponse> {
  const resolvedSourcePath = resolveAllowedSourcePath(sourcePath);
  return {
    sourcePath: resolvedSourcePath,
    content: await readFile(resolvedSourcePath, "utf8"),
    format: sourceFormatForPath(resolvedSourcePath)
  };
}

export async function validateStudioDocument(request: StudioRenderRequest = {}): Promise<StudioValidateResponse> {
  const sourcePath = resolveAllowedSourcePath(request.sourcePath);
  const importResult = await importByExtension(sourcePath);
  const report = validateOserDocument(importResult.document);
  const diagnostics = {
    summary: report.summary,
    items: report.diagnostics.map((diagnostic): RenderManifestDiagnosticItem => ({
      severity: diagnostic.severity,
      code: diagnostic.code,
      message: diagnostic.message,
      path: diagnostic.location?.nodePath
    }))
  };

  await mkdir(dirname(studioDiagnosticsPath), { recursive: true });
  await writeFile(
    studioDiagnosticsPath,
    `${JSON.stringify({ sourcePath, diagnostics }, null, 2)}\n`,
    "utf8"
  );

  return {
    sourcePath,
    diagnosticsPath: studioDiagnosticsPath,
    diagnostics
  };
}

export async function renderStudioHtml(request: StudioRenderRequest = {}): Promise<StudioRenderManifestResponse> {
  const sourcePath = resolveAllowedSourcePath(request.sourcePath);
  const profilePath = resolveAllowedProfilePath(request.profilePath, request.profileId);

  await mkdir(studioOutputDirectory, { recursive: true });
  await copyFile(defaultEditorialStylePath, studioPreviewStylePath);

  const result = await renderHtmlFromFile({
    inputPath: sourcePath,
    outputPath: studioPreviewHtmlPath,
    profilePath,
    manifestPath: studioPreviewManifestPath,
    baseStylePath: studioPreviewStylePath,
    generatedCssPath: `${studioOutputDirectory}/${profileCssFileName(profilePath)}`
  });

  return {
    manifest: result.manifest ?? await readRenderManifest(studioPreviewManifestPath),
    previewUrl: "/preview/preview.html"
  };
}

export async function exportStudioPdf(request: StudioExportPdfRequest = {}): Promise<StudioRenderManifestResponse> {
  const sourcePath = resolveAllowedSourcePath(request.sourcePath);
  const profilePath = resolveAllowedProfilePath(request.profilePath, request.profileId);
  const format = pdfFormat(request.format);

  await renderPdfFromFile({
    inputPath: sourcePath,
    outputPath: studioExportPdfPath,
    profilePath,
    format,
    htmlOutputPath: studioExportHtmlPath,
    manifestPath: studioExportManifestPath
  });

  return {
    manifest: await readRenderManifest(studioExportManifestPath),
    pdfUrl: "/outputs/export.pdf"
  };
}

async function readRenderManifest(manifestPath: string): Promise<RenderManifest> {
  return JSON.parse(await readFile(manifestPath, "utf8")) as RenderManifest;
}

async function importByExtension(inputPath: string) {
  const format = sourceFormatForPath(inputPath);

  if (format === "markdown") {
    return importMarkdownFile(inputPath);
  }

  return importTxtFile(inputPath);
}

function profileCssFileName(profilePath: string): string {
  return `profile-${profilePath.split("/").pop()?.replace(/\.json$/i, "") ?? "layout"}.css`;
}

function pdfFormat(format: StudioExportPdfRequest["format"]): PdfPageFormat {
  if (!format) {
    return "Letter";
  }

  if (format === "Letter" || format === "A4") {
    return format;
  }

  throw new Error("Invalid PDF format. Use Letter or A4.");
}
