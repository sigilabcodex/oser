import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { validateOserDocument } from "../../diagnostics/src";
import { importMarkdownFile, importTxtFile } from "../../importers/src";
import { renderDocumentToHtml } from "../../html-renderer/src";
import { writeLayoutProfileCss } from "../../layout-profile/src/profileCssFile";
import { createRenderManifest, writeRenderManifest } from "../../render-manifest/src";

export type PdfPageFormat = "Letter" | "A4";

export type RenderPdfFromFileOptions = {
  inputPath: string;
  outputPath?: string;
  stylePath?: string;
  profilePath?: string;
  generatedCssPath?: string;
  format?: PdfPageFormat;
  htmlOutputPath?: string;
  manifestPath?: string;
};

export type RenderPdfFromFileResult = {
  inputPath: string;
  outputPath: string;
  htmlOutputPath: string;
  stylePath: string;
  stylesheetPaths: string[];
  profilePath?: string;
  generatedCssPath?: string;
  manifestPath?: string;
  format: PdfPageFormat;
};

const defaultStylePath = join("packages", "html-renderer", "styles", "print.css");

export async function renderPdfFromFile(options: RenderPdfFromFileOptions): Promise<RenderPdfFromFileResult> {
  if (options.profilePath && options.stylePath) {
    throw new Error("Use either profilePath or stylePath, not both. A profile generates CSS on top of the default print stylesheet.");
  }

  const outputPath = options.outputPath ?? defaultOutputPath(options.inputPath);
  const htmlOutputPath = options.htmlOutputPath ?? temporaryHtmlPath(options.inputPath);
  const format = options.format ?? "Letter";
  const profileCss = options.profilePath
    ? await writeLayoutProfileCss({ profilePath: options.profilePath, outputPath: options.generatedCssPath })
    : undefined;
  const baseStylePath = options.stylePath ?? defaultStylePath;
  const stylesheetPaths = profileCss
    ? [defaultStylePath, profileCss.cssPath]
    : [baseStylePath];

  const result = await importByExtension(options.inputPath);
  const renderedHtml = renderDocumentToHtml(result.document, {
    stylesheetHrefs: stylesheetPaths.map((stylePath) => pathToFileURL(resolve(stylePath)).href)
  });
  const htmlWithBase = withBaseHref(renderedHtml, dirname(resolve(options.inputPath)));
  const html = profileCss ? htmlWithBase : withPageFormatStyle(htmlWithBase, format);

  await mkdir(dirname(htmlOutputPath), { recursive: true });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(htmlOutputPath, `${html}\n`, "utf8");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(resolve(htmlOutputPath)).href, {
      waitUntil: "networkidle"
    });
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: outputPath,
      format,
      printBackground: true,
      preferCSSPageSize: true
    });
  } finally {
    await browser.close();
  }

  if (options.manifestPath) {
    const diagnostics = validateOserDocument(result.document);
    const manifest = createRenderManifest({
      inputPath: options.inputPath,
      target: "pdf",
      profilePath: options.profilePath,
      stylePath: profileCss ? defaultStylePath : baseStylePath,
      generatedCssPath: profileCss?.cssPath,
      format,
      outputs: {
        htmlPath: htmlOutputPath,
        pdfPath: outputPath,
        cssPaths: stylesheetPaths,
        manifestPath: options.manifestPath
      },
      diagnostics: {
        summary: diagnostics.summary,
        items: diagnostics.diagnostics
      }
    });
    await writeRenderManifest(options.manifestPath, manifest);
  }

  return {
    inputPath: options.inputPath,
    outputPath,
    htmlOutputPath,
    stylePath: stylesheetPaths[stylesheetPaths.length - 1],
    stylesheetPaths,
    profilePath: options.profilePath,
    generatedCssPath: profileCss?.cssPath,
    manifestPath: options.manifestPath,
    format
  };
}

function defaultOutputPath(inputPath: string): string {
  const extension = extname(inputPath);
  const name = extension ? basename(inputPath, extension) : basename(inputPath);
  return join("dist", "examples", `${name}.pdf`);
}

function temporaryHtmlPath(inputPath: string): string {
  const extension = extname(inputPath);
  const name = extension ? basename(inputPath, extension) : basename(inputPath);
  return join("dist", ".tmp", "pdf-renderer", `${name}.html`);
}

function withBaseHref(html: string, sourceDir: string): string {
  const baseHref = pathToFileURL(`${sourceDir}/`).href;
  return html.replace("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">", [
    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    `    <base href="${baseHref}">`
  ].join("\n"));
}

function withPageFormatStyle(html: string, format: PdfPageFormat): string {
  const pageSize = format === "A4" ? "A4" : "letter";
  return html.replace("  </head>", [
    `    <style>@page { size: ${pageSize}; }</style>`,
    "  </head>"
  ].join("\n"));
}

async function importByExtension(inputPath: string) {
  const extension = extname(inputPath).toLowerCase();

  if (extension === ".md" || extension === ".markdown") {
    return importMarkdownFile(inputPath);
  }

  return importTxtFile(inputPath);
}
