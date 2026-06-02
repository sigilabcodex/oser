import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { validateOserDocument } from "../../diagnostics/src";
import { defaultEditorialStylePath, renderHtmlFromFile } from "../../html-renderer/src";
import { importMarkdownFile, importTxtFile } from "../../importers/src";
import { renderPdfFromFile, type PdfPageFormat } from "../../pdf-renderer/src/renderPdfFromFile";
import { type RenderManifest, type RenderManifestDiagnosticItem } from "../../render-manifest/src";
import {
  createRenderId,
  ensureRenderDirectory,
  listRenderIds,
  pdfUrlForRender,
  previewUrlForRender,
  renderPathsFor,
  resolveAllowedProfilePath,
  resolveAllowedSourcePath,
  sourceFormatForPath,
  studioDiagnosticsPath,
  studioOutputDirectory
} from "./studioProject";
import type {
  StudioDocumentResponse,
  StudioExportPdfRequest,
  StudioRenderHistoryItem,
  StudioRenderHistoryResponse,
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
    `${JSON.stringify({ sourcePath, diagnostics }, null, 2)}
`,
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
  const renderId = request.renderId ?? createRenderId();
  const paths = await ensureRenderDirectory(renderId);

  await mkdir(studioOutputDirectory, { recursive: true });
  await copyFile(defaultEditorialStylePath, paths.previewStylePath);
  await copyPreviewAssets(paths.previewAssetsDirectory);

  const result = await renderHtmlFromFile({
    inputPath: sourcePath,
    outputPath: paths.previewHtmlPath,
    profilePath,
    manifestPath: paths.previewManifestPath,
    baseStylePath: paths.previewStylePath,
    generatedCssPath: join(paths.directory, profileCssFileName(profilePath))
  });

  return {
    renderId,
    manifest: result.manifest ?? await readRenderManifest(paths.previewManifestPath),
    previewUrl: previewUrlForRender(renderId)
  };
}

export async function exportStudioPdf(request: StudioExportPdfRequest = {}): Promise<StudioRenderManifestResponse> {
  const sourcePath = resolveAllowedSourcePath(request.sourcePath);
  const profilePath = resolveAllowedProfilePath(request.profilePath, request.profileId);
  const format = pdfFormat(request.format);
  const renderId = request.renderId ?? createRenderId();
  const paths = await ensureRenderDirectory(renderId);

  await renderPdfFromFile({
    inputPath: sourcePath,
    outputPath: paths.exportPdfPath,
    profilePath,
    format,
    htmlOutputPath: paths.exportHtmlPath,
    manifestPath: paths.exportManifestPath
  });

  return {
    renderId,
    manifest: await readRenderManifest(paths.exportManifestPath),
    pdfUrl: pdfUrlForRender(renderId)
  };
}

export async function listStudioRenders(): Promise<StudioRenderHistoryResponse> {
  const renderIds = await listRenderIds();
  const renders = await Promise.all(renderIds.map(readRenderHistoryItem));
  return {
    renders: renders.filter((render): render is StudioRenderHistoryItem => Boolean(render))
  };
}

async function readRenderHistoryItem(renderId: string): Promise<StudioRenderHistoryItem | undefined> {
  const paths = renderPathsFor(renderId);
  const [htmlManifest, pdfManifest] = await Promise.all([
    readOptionalRenderManifest(paths.previewManifestPath),
    readOptionalRenderManifest(paths.exportManifestPath)
  ]);
  const manifest = pdfManifest ?? htmlManifest;

  if (!manifest) {
    return undefined;
  }

  const [hasHtml, hasPdf] = await Promise.all([
    fileExists(paths.previewHtmlPath),
    fileExists(paths.exportPdfPath)
  ]);

  return {
    renderId,
    sourcePath: manifest.source.inputPath,
    profilePath: manifest.render.profilePath,
    generatedAt: manifest.generatedAt,
    hasHtml,
    hasPdf,
    previewUrl: hasHtml ? previewUrlForRender(renderId) : undefined,
    pdfUrl: hasPdf ? pdfUrlForRender(renderId) : undefined,
    diagnostics: {
      summary: manifest.diagnostics.summary
    },
    htmlManifest,
    pdfManifest
  };
}

async function readRenderManifest(manifestPath: string): Promise<RenderManifest> {
  return JSON.parse(await readFile(manifestPath, "utf8")) as RenderManifest;
}

async function readOptionalRenderManifest(manifestPath: string): Promise<RenderManifest | undefined> {
  try {
    return await readRenderManifest(manifestPath);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function importByExtension(inputPath: string) {
  const format = sourceFormatForPath(inputPath);

  if (format === "markdown") {
    return importMarkdownFile(inputPath);
  }

  return importTxtFile(inputPath);
}

async function copyPreviewAssets(targetAssetsDirectory: string): Promise<void> {
  await mkdir(targetAssetsDirectory, { recursive: true });
  await copyFile(
    join("examples", "assets", "placeholder.svg"),
    join(targetAssetsDirectory, "placeholder.svg")
  );
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
