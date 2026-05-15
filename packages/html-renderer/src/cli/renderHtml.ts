import { writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";
import { importMarkdownFile, importTxtFile } from "../../../importers/src";
import { renderDocumentToHtml } from "../renderDocumentToHtml";

async function main(): Promise<void> {
  const [, , inputPath, outputPathArg] = process.argv;

  if (!inputPath) {
    console.error("Usage: npm run render:html -- <input.txt> [output.html]");
    process.exitCode = 1;
    return;
  }

  const outputPath = outputPathArg ?? defaultOutputPath(inputPath);
  const result = await importByExtension(inputPath);
  const html = renderDocumentToHtml(result.document, {
    stylesheetHref: stylesheetHrefForOutput(outputPath)
  });

  await writeFile(outputPath, `${html}\n`, "utf8");
  process.stdout.write(`${outputPath}\n`);
}

function defaultOutputPath(inputPath: string): string {
  const extension = extname(inputPath);
  const name = extension ? basename(inputPath, extension) : basename(inputPath);
  return join(dirname(inputPath), `${name}.html`);
}

function stylesheetHrefForOutput(outputPath: string): string {
  const stylesheetPath = join("packages", "html-renderer", "styles", "editorial.css");
  return normalizeHref(relative(dirname(outputPath), stylesheetPath));
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

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
