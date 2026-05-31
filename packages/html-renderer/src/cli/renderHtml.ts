import { renderHtmlFromFile } from "../renderHtmlFromFile";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.inputPath) {
    console.error("Usage: npm run render:html -- <input.txt|input.md> [output.html] [--style editorial|none|path/to/file.css] [--profile path/to/profile.json] [--manifest path/to/manifest.json]");
    process.exitCode = 1;
    return;
  }

  if (args.profilePath && args.styleExplicit) {
    throw new Error("Use either --profile or --style, not both. A profile generates its own CSS on top of the default editorial stylesheet.");
  }

  const result = await renderHtmlFromFile({
    inputPath: args.inputPath,
    outputPath: args.outputPath,
    stylePath: args.styleExplicit ? args.style : undefined,
    profilePath: args.profilePath,
    manifestPath: args.manifestPath
  });

  process.stdout.write(`${result.outputPath}\n`);
}

type CliArgs = {
  inputPath?: string;
  outputPath?: string;
  style: string;
  styleExplicit: boolean;
  profilePath?: string;
  manifestPath?: string;
};

function parseArgs(args: string[]): CliArgs {
  const positional: string[] = [];
  let style = "editorial";
  let styleExplicit = false;
  let profilePath: string | undefined;
  let manifestPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--style") {
      const value = readOptionValue(args, index, "--style");
      style = value;
      styleExplicit = true;
      index += 1;
      continue;
    }

    if (arg === "--profile") {
      profilePath = readOptionValue(args, index, "--profile");
      index += 1;
      continue;
    }

    if (arg === "--manifest") {
      manifestPath = readOptionValue(args, index, "--manifest");
      index += 1;
      continue;
    }

    positional.push(arg);
  }

  return {
    inputPath: positional[0],
    outputPath: positional[1],
    style,
    styleExplicit,
    profilePath,
    manifestPath
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
