import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname } from "node:path";
import type { Diagnostic } from "../../diagnostics/src";

export type RenderManifestTarget = "html" | "pdf";

export type RenderManifestInputFormat = "txt" | "markdown" | "unknown";

export type RenderManifestOutput = {
  htmlPath?: string;
  pdfPath?: string;
  cssPaths: string[];
  manifestPath?: string;
};

export type RenderManifestDiagnosticsSummary = {
  info: number;
  warnings: number;
  errors: number;
};

export type RenderManifestDiagnosticItem = {
  severity: Diagnostic["severity"];
  code: string;
  message: string;
  path?: string;
};

export type RenderManifest = {
  schemaVersion: "1";
  generatedAt: string;
  source: {
    inputPath: string;
    inputFormat: RenderManifestInputFormat;
  };
  render: {
    target: RenderManifestTarget;
    profilePath?: string;
    stylePath?: string;
    generatedCssPath?: string;
    format?: string;
  };
  outputs: RenderManifestOutput;
  diagnostics: {
    summary: RenderManifestDiagnosticsSummary;
    items: RenderManifestDiagnosticItem[];
  };
};

export type CreateRenderManifestOptions = {
  inputPath: string;
  inputFormat?: RenderManifestInputFormat;
  target: RenderManifestTarget;
  profilePath?: string;
  stylePath?: string;
  generatedCssPath?: string;
  format?: string;
  outputs: RenderManifestOutput;
  diagnostics: {
    summary: RenderManifestDiagnosticsSummary;
    items: Diagnostic[];
  };
  generatedAt?: Date;
};

export async function writeRenderManifest(manifestPath: string, manifest: RenderManifest): Promise<void> {
  const manifestWithPath: RenderManifest = {
    ...manifest,
    outputs: {
      ...manifest.outputs,
      manifestPath
    }
  };

  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifestWithPath, null, 2)}\n`, "utf8");
}

export function createRenderManifest(options: CreateRenderManifestOptions): RenderManifest {
  return {
    schemaVersion: "1",
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    source: {
      inputPath: options.inputPath,
      inputFormat: options.inputFormat ?? inferRenderManifestInputFormat(options.inputPath)
    },
    render: compactRenderMetadata({
      target: options.target,
      profilePath: options.profilePath,
      stylePath: options.stylePath,
      generatedCssPath: options.generatedCssPath,
      format: options.format
    }),
    outputs: options.outputs,
    diagnostics: {
      summary: options.diagnostics.summary,
      items: options.diagnostics.items.map(toManifestDiagnosticItem)
    }
  };
}

function inferRenderManifestInputFormat(inputPath: string): RenderManifestInputFormat {
  const extension = extname(inputPath).toLowerCase();

  if (extension === ".md" || extension === ".markdown") {
    return "markdown";
  }

  if (extension === ".txt") {
    return "txt";
  }

  return "unknown";
}

function toManifestDiagnosticItem(diagnostic: Diagnostic): RenderManifestDiagnosticItem {
  return {
    severity: diagnostic.severity,
    code: diagnostic.code,
    message: diagnostic.message,
    path: diagnostic.location?.nodePath
  };
}

function compactRenderMetadata(metadata: RenderManifest["render"]): RenderManifest["render"] {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  ) as RenderManifest["render"];
}
