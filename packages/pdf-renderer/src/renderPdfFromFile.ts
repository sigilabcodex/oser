import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { importMarkdownFile, importTxtFile } from "../../importers/src";
import { renderDocumentToHtml } from "../../html-renderer/src";

export type PdfPageFormat = "Letter" | "A4";

export type RenderPdfFromFileOptions = {
  inputPath: string;
  outputPath?: string;
  stylePath?: string;
  format?: PdfPageFormat;
  htmlOutputPath?: string;
};

export type RenderPdfFromFileResult = {
  inputPath: string;
  outputPath: string;
  htmlOutputPath: string;
  stylePath: string;
  format: PdfPageFormat;
};

const defaultStylePath = join("packages", "html-renderer", "styles", "print.css");

export async function renderPdfFromFile(options: RenderPdfFromFileOptions): Promise<RenderPdfFromFileResult> {
  const outputPath = options.outputPath ?? defaultOutputPath(options.inputPath);
  const htmlOutputPath = options.htmlOutputPath ?? temporaryHtmlPath(options.inputPath);
  const stylePath = options.stylePath ?? defaultStylePath;
  const format = options.format ?? "Letter";

  const result = await importByExtension(options.inputPath);
  const html = withPageFormatStyle(
    withBaseHref(
      renderDocumentToHtml(result.document, {
        stylesheetHref: pathToFileURL(resolve(stylePath)).href
      }),
      dirname(resolve(options.inputPath))
    ),
    format
  );

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

  return {
    inputPath: options.inputPath,
    outputPath,
    htmlOutputPath,
    stylePath,
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
