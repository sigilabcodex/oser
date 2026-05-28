import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { layoutProfileToCss, type LayoutProfile } from "../index";

async function main(): Promise<void> {
  const [, , inputPath, outputPath] = process.argv;

  if (!inputPath || !outputPath) {
    console.error("Usage: npm run profile:css -- <profile.json> <output.css>");
    process.exitCode = 1;
    return;
  }

  const profile = JSON.parse(await readFile(inputPath, "utf8")) as LayoutProfile;
  const css = layoutProfileToCss(profile);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${css}\n`, "utf8");
  process.stdout.write(`${outputPath}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
