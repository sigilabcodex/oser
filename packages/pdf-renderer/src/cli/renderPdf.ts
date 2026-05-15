import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { importMarkdownFile, importTxtFile } from "../../../importers/src";
import { renderDocumentToHtml } from "../../../html-renderer/src";

async function main(): Promise<void> {
  const [, , inputPath, outputPathArg] = process.argv;

  if (!inputPath) {
    console.error("Usage: npm run render:pdf -- <input.txt|input.md> [output.pdf]");
    process.exitCode = 1;
    return;
  }

  const outputPath = outputPathArg ?? defaultOutputPath(inputPath);
  const result = await importByExtension(inputPath);
  const htmlPath = temporaryHtmlPath(inputPath);
  const html = withBaseHref(
    renderDocumentToHtml(result.document, {
      stylesheetHref: pathToFileURL(resolve("packages/html-renderer/styles/print.css")).href
    }),
    dirname(resolve(inputPath))
  );

  await mkdir(dirname(htmlPath), { recursive: true });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(htmlPath, `${html}\n`, "utf8");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(resolve(htmlPath)).href, {
      waitUntil: "networkidle"
    });
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: outputPath,
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true
    });
  } finally {
    await browser.close();
  }

  process.stdout.write(`${outputPath}\n`);
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

async function importByExtension(inputPath: string) {
  const extension = extname(inputPath).toLowerCase();

  if (extension === ".md" || extension === ".markdown") {
    return importMarkdownFile(inputPath);
  }

  return importTxtFile(inputPath);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
