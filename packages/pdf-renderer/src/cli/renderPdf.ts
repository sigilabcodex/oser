import { renderPdfFromFile, type PdfPageFormat } from "../renderPdfFromFile";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.inputPath) {
    console.error("Usage: npm run render:pdf -- <input.txt|input.md> [output.pdf] [--style path/to/file.css] [--format Letter|A4] [--html-output path/to/file.html]");
    process.exitCode = 1;
    return;
  }

  const result = await renderPdfFromFile({
    inputPath: args.inputPath,
    outputPath: args.outputPath,
    stylePath: args.stylePath,
    format: args.format,
    htmlOutputPath: args.htmlOutputPath
  });

  process.stdout.write(`${result.outputPath}\n`);
}

type CliArgs = {
  inputPath?: string;
  outputPath?: string;
  stylePath?: string;
  format?: PdfPageFormat;
  htmlOutputPath?: string;
};

function parseArgs(args: string[]): CliArgs {
  const positional: string[] = [];
  const parsed: CliArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--style") {
      parsed.stylePath = readOptionValue(args, index, "--style");
      index += 1;
      continue;
    }

    if (arg === "--format") {
      parsed.format = parseFormat(readOptionValue(args, index, "--format"));
      index += 1;
      continue;
    }

    if (arg === "--html-output") {
      parsed.htmlOutputPath = readOptionValue(args, index, "--html-output");
      index += 1;
      continue;
    }

    positional.push(arg);
  }

  return {
    ...parsed,
    inputPath: positional[0],
    outputPath: positional[1]
  };
}

function readOptionValue(args: string[], index: number, optionName: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${optionName}.`);
  }
  return value;
}

function parseFormat(value: string): PdfPageFormat {
  if (value === "Letter" || value === "A4") {
    return value;
  }

  throw new Error("Invalid value for --format. Use Letter or A4.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
