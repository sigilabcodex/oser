import { importTxtFile } from "../txt/txtImporter";

async function main(): Promise<void> {
  const [, , filePath] = process.argv;

  if (!filePath) {
    console.error("Usage: npm run import:txt -- <file.txt>");
    process.exitCode = 1;
    return;
  }

  const result = await importTxtFile(filePath);
  process.stdout.write(`${JSON.stringify(result.document, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
