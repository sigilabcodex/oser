import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { validateOserDocument, type DiagnosticReport } from "../../diagnostics/src";
import { importMarkdownFile, importTxtFile } from "../../importers/src";
import { writeLayoutProfileCss } from "../../layout-profile/src/profileCssFile";
import {
  createRenderManifest,
  writeRenderManifest,
  type RenderManifest
} from "../../render-manifest/src";
import { renderDocumentToHtml } from "./renderDocumentToHtml";

export type RenderHtmlFromFileOptions = {
  inputPath: string;
  outputPath?: string;
  stylePath?: string;
  profilePath?: string;
  manifestPath?: string;
  baseStylePath?: string;
  generatedCssPath?: string;
};

export type RenderHtmlFromFileResult = {
  inputPath: string;
  outputPath: string;
  stylePath?: string;
  stylesheetPaths: string[];
  profilePath?: string;
  generatedCssPath?: string;
  manifestPath?: string;
  diagnostics: DiagnosticReport;
  manifest?: RenderManifest;
};

type StylesheetResult = {
  hrefs: string[];
  cssPaths: string[];
  stylePath?: string;
  generatedCssPath?: string;
};

export const defaultEditorialStylePath = join("packages", "html-renderer", "styles", "editorial.css");

export async function renderHtmlFromFile(
  options: RenderHtmlFromFileOptions
): Promise<RenderHtmlFromFileResult> {
  if (options.profilePath && options.stylePath) {
    throw new Error("Use either profilePath or stylePath, not both. A profile generates its own CSS on top of the default editorial stylesheet.");
  }

  const outputPath = options.outputPath ?? defaultOutputPath(options.inputPath);
  const result = await importByExtension(options.inputPath);
  const stylesheets = await stylesheetsForOutput(outputPath, options);
  const html = renderDocumentToHtml(result.document, { stylesheetHrefs: stylesheets.hrefs });
  const diagnostics = validateOserDocument(result.document);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${html}\n`, "utf8");

  const manifest = options.manifestPath
    ? createRenderManifest({
        inputPath: options.inputPath,
        target: "html",
        profilePath: options.profilePath,
        stylePath: stylesheets.stylePath,
        generatedCssPath: stylesheets.generatedCssPath,
        outputs: {
          htmlPath: outputPath,
          cssPaths: stylesheets.cssPaths,
          manifestPath: options.manifestPath
        },
        diagnostics: {
          summary: diagnostics.summary,
          items: diagnostics.diagnostics
        }
      })
    : undefined;

  if (options.manifestPath && manifest) {
    await writeRenderManifest(options.manifestPath, manifest);
  }

  return {
    inputPath: options.inputPath,
    outputPath,
    stylePath: stylesheets.stylePath,
    stylesheetPaths: stylesheets.cssPaths,
    profilePath: options.profilePath,
    generatedCssPath: stylesheets.generatedCssPath,
    manifestPath: options.manifestPath,
    diagnostics,
    manifest
  };
}

function defaultOutputPath(inputPath: string): string {
  const extension = extname(inputPath);
  const name = extension ? basename(inputPath, extension) : basename(inputPath);
  return join(dirname(inputPath), `${name}.html`);
}

async function stylesheetsForOutput(
  outputPath: string,
  options: RenderHtmlFromFileOptions
): Promise<StylesheetResult> {
  if (options.profilePath) {
    const baseStylePath = options.baseStylePath ?? defaultEditorialStylePath;
    const profileCss = await writeLayoutProfileCss({
      profilePath: options.profilePath,
      outputPath: options.generatedCssPath
    });
    const cssPaths = [baseStylePath, profileCss.cssPath];
    return {
      hrefs: cssPaths.map((cssPath) => cssPathToHref(outputPath, cssPath)),
      cssPaths,
      stylePath: baseStylePath,
      generatedCssPath: profileCss.cssPath
    };
  }

  const stylePath = stylesheetPath(options.stylePath ?? "editorial");
  return {
    hrefs: stylePath ? [cssPathToHref(outputPath, stylePath)] : [],
    cssPaths: stylePath ? [stylePath] : [],
    stylePath
  };
}

function stylesheetPath(stylePath: string): string | undefined {
  if (stylePath === "none") {
    return undefined;
  }

  if (stylePath !== "editorial") {
    return stylePath;
  }

  return defaultEditorialStylePath;
}

function cssPathToHref(outputPath: string, cssPath: string): string {
  if (isExternalHref(cssPath)) {
    return cssPath;
  }

  const absoluteCssPath = isAbsolute(cssPath) ? cssPath : resolve(cssPath);
  const absoluteOutputDir = resolve(dirname(outputPath));
  return normalizeHref(relative(absoluteOutputDir, absoluteCssPath));
}

function isExternalHref(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//");
}

function normalizeHref(value: string): string {
  return value.split("\\").join("/");
}

async function importByExtension(inputPath: string) {
  const extension = extname(inputPath).toLowerCase();

  if (extension === ".md" || extension === ".markdown") {
    return importMarkdownFile(inputPath);
  }

  return importTxtFile(inputPath);
}
