import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { scanProject } from "../index";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.rootPath) {
    console.error("Usage: npm run scan:project -- <project-root> [--output path/to/project-manifest.json] [--config path/to/oser.project.json] [--ignore pattern]");
    process.exitCode = 1;
    return;
  }

  const manifest = await scanProject({
    rootPath: args.rootPath,
    ignorePatterns: args.ignorePatterns,
    configPath: args.configPath
  });
  const output = `${JSON.stringify(manifest, null, 2)}\n`;

  if (args.outputPath) {
    await mkdir(dirname(args.outputPath), { recursive: true });
    await writeFile(args.outputPath, output, "utf8");
    process.stdout.write(`${args.outputPath}\n`);
    return;
  }

  process.stdout.write(output);
}

type CliArgs = {
  rootPath?: string;
  outputPath?: string;
  configPath?: string;
  ignorePatterns: string[];
};

function parseArgs(args: string[]): CliArgs {
  const positional: string[] = [];
  const ignorePatterns: string[] = [];
  let outputPath: string | undefined;
  let configPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--output") {
      outputPath = readOptionValue(args, index, "--output");
      index += 1;
      continue;
    }

    if (arg === "--config") {
      configPath = readOptionValue(args, index, "--config");
      index += 1;
      continue;
    }

    if (arg === "--ignore") {
      ignorePatterns.push(readOptionValue(args, index, "--ignore"));
      index += 1;
      continue;
    }

    positional.push(arg);
  }

  return {
    rootPath: positional[0],
    outputPath,
    configPath,
    ignorePatterns
  };
}

function readOptionValue(args: string[], index: number, optionName: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${optionName}.`);
  }
  return value;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
