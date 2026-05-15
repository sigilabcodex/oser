import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { importMarkdownFile, importTxtFile } from "../../../importers/src";
import { renderDocumentToHtml } from "../renderDocumentToHtml";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.inputPath) {
    console.error("Usage: npm run render:html -- <input.txt|input.md> [output.html] [--style editorial|none|path/to/file.css]");
    process.exitCode = 1;
    return;
  }

  const outputPath = args.outputPath ?? defaultOutputPath(args.inputPath);
  const result = await importByExtension(args.inputPath);
  const stylesheetHref = stylesheetHrefForOutput(outputPath, args.style);
  const html = renderDocumentToHtml(result.document, { stylesheetHref });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${html}\n`, "utf8");
  process.stdout.write(`${outputPath}\n`);
}

type CliArgs = {
  inputPath?: string;
  outputPath?: string;
  style: string;
};

function parseArgs(args: string[]): CliArgs {
  const positional: string[] = [];
  let style = "editorial";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--style") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Missing value for --style. Use editorial, none, or a CSS path.");
      }
      style = value;
      index += 1;
      continue;
    }

    positional.push(arg);
  }

  return {
    inputPath: positional[0],
    outputPath: positional[1],
    style
  };
}

function defaultOutputPath(inputPath: string): string {
  const extension = extname(inputPath);
  const name = extension ? basename(inputPath, extension) : basename(inputPath);
  return join(dirname(inputPath), `${name}.html`);
}

function stylesheetHrefForOutput(outputPath: string, style: string): string | undefined {
  if (style === "none") {
    return undefined;
  }

  if (style !== "editorial") {
    return cssPathToHref(outputPath, style);
  }

  const stylesheetPath = join("packages", "html-renderer", "styles", "editorial.css");
  return normalizeHref(relative(dirname(outputPath), stylesheetPath));
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

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
