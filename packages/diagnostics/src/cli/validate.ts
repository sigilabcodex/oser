import { extname } from "node:path";
import type { ImportResult } from "../../../importers/src";
import { importMarkdownFile, importTxtFile } from "../../../importers/src";
import { validateOserDocument, type Diagnostic } from "../index";

async function main(): Promise<void> {
  const [, , inputPath] = process.argv;

  if (!inputPath) {
    console.error("Usage: npm run validate -- <input.txt|input.md>");
    process.exitCode = 1;
    return;
  }

  const result = await importByExtension(inputPath);
  const report = validateOserDocument(result.document);

  if (report.diagnostics.length === 0) {
    process.stdout.write(`No diagnostics found in ${inputPath}.\n`);
  } else {
    process.stdout.write(`Diagnostics for ${inputPath}:\n`);
    for (const diagnostic of report.diagnostics) {
      process.stdout.write(`${formatDiagnostic(diagnostic)}\n`);
    }
  }

  process.stdout.write(
    `Summary: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info.\n`
  );

  process.exitCode = report.summary.errors > 0 ? 1 : 0;
}

async function importByExtension(inputPath: string): Promise<ImportResult> {
  const extension = extname(inputPath).toLowerCase();

  if (extension === ".md" || extension === ".markdown") {
    return importMarkdownFile(inputPath);
  }

  if (extension === ".txt") {
    return importTxtFile(inputPath);
  }

  throw new Error("Unsupported input extension. Use .md, .markdown, or .txt.");
}

function formatDiagnostic(diagnostic: Diagnostic): string {
  const location = diagnostic.location?.nodePath ? ` ${diagnostic.location.nodePath}` : "";
  return `[${diagnostic.severity}] ${diagnostic.code}${location}: ${diagnostic.message}`;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
