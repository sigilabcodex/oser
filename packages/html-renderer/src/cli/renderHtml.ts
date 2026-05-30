import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { validateOserDocument } from "../../../diagnostics/src";
import { importMarkdownFile, importTxtFile } from "../../../importers/src";
import { writeLayoutProfileCss } from "../../../layout-profile/src/profileCssFile";
import { createRenderManifest, writeRenderManifest } from "../../../render-manifest/src";
import { renderDocumentToHtml } from "../renderDocumentToHtml";

const defaultEditorialStylePath = join("packages", "html-renderer", "styles", "editorial.css");

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

  const outputPath = args.outputPath ?? defaultOutputPath(args.inputPath);
  const result = await importByExtension(args.inputPath);
  const stylesheets = await stylesheetsForOutput(outputPath, args);
  const html = renderDocumentToHtml(result.document, { stylesheetHrefs: stylesheets.hrefs });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${html}\n`, "utf8");

  if (args.manifestPath) {
    const diagnostics = validateOserDocument(result.document);
    const manifest = createRenderManifest({
      inputPath: args.inputPath,
      target: "html",
      profilePath: args.profilePath,
      stylePath: stylesheets.stylePath,
      generatedCssPath: stylesheets.generatedCssPath,
      outputs: {
        htmlPath: outputPath,
        cssPaths: stylesheets.cssPaths,
        manifestPath: args.manifestPath
      },
      diagnostics: {
        summary: diagnostics.summary,
        items: diagnostics.diagnostics
      }
    });
    await writeRenderManifest(args.manifestPath, manifest);
  }

  process.stdout.write(`${outputPath}\n`);
}

type CliArgs = {
  inputPath?: string;
  outputPath?: string;
  style: string;
  styleExplicit: boolean;
  profilePath?: string;
  manifestPath?: string;
};

type StylesheetResult = {
  hrefs: string[];
  cssPaths: string[];
  stylePath?: string;
  generatedCssPath?: string;
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

function defaultOutputPath(inputPath: string): string {
  const extension = extname(inputPath);
  const name = extension ? basename(inputPath, extension) : basename(inputPath);
  return join(dirname(inputPath), `${name}.html`);
}

async function stylesheetsForOutput(outputPath: string, args: CliArgs): Promise<StylesheetResult> {
  if (args.profilePath) {
    const profileCss = await writeLayoutProfileCss({ profilePath: args.profilePath });
    const cssPaths = [defaultEditorialStylePath, profileCss.cssPath];
    return {
      hrefs: cssPaths.map((cssPath) => cssPathToHref(outputPath, cssPath)),
      cssPaths,
      stylePath: defaultEditorialStylePath,
      generatedCssPath: profileCss.cssPath
    };
  }

  const stylePath = stylesheetPath(args.style);
  return {
    hrefs: stylePath ? [cssPathToHref(outputPath, stylePath)] : [],
    cssPaths: stylePath ? [stylePath] : [],
    stylePath
  };
}

function stylesheetPath(style: string): string | undefined {
  if (style === "none") {
    return undefined;
  }

  if (style !== "editorial") {
    return style;
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

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
