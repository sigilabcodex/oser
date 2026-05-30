import { writeLayoutProfileCss } from "../profileCssFile";

async function main(): Promise<void> {
  const [, , inputPath, outputPath] = process.argv;

  if (!inputPath || !outputPath) {
    console.error("Usage: npm run profile:css -- <profile.json> <output.css>");
    process.exitCode = 1;
    return;
  }

  const result = await writeLayoutProfileCss({ profilePath: inputPath, outputPath });
  process.stdout.write(`${result.cssPath}
`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
