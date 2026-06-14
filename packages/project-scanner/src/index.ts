import { createHash } from "node:crypto";
import { access, readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type {
  CandidateSidecarFile,
  CandidateSidecarGroup,
  CandidateSidecarRole,
  CandidateSidecarRoles,
  OserProjectConfig,
  OserProjectConfigSummary,
  OserProjectManifest,
  ProjectAssetRelationship,
  ProjectDiagnostic,
  ProjectFileDeclaration,
  ProjectFileEntry,
  ProjectFileKind,
  ProjectFileReference,
  VisualizationDeclaredRole,
  VisualizationManifestSummary
} from "../../project-model/src";

const SCANNER_VERSION = "0.1.0";
const DEFAULT_PROJECT_CONFIG_PATH = "oser.project.json";

export const defaultProjectIgnorePatterns = [
  ".git",
  "node_modules",
  "dist",
  "build",
  "cache",
  ".cache",
  "temp",
  "tmp"
];

export type ScanProjectOptions = {
  rootPath: string;
  ignorePatterns?: string[];
  configPath?: string;
};

type FileRecord = {
  absolutePath: string;
  relativePath: string;
};

type JsonClassification = {
  kind: ProjectFileKind;
  malformed: boolean;
};

type LoadedProjectConfig = {
  path: string;
  summary?: OserProjectConfigSummary;
  config?: OserProjectConfig;
  ignorePatterns: string[];
};

type VisualizationManifest = {
  path: string;
  summary: VisualizationManifestSummary;
};

export async function scanProject(options: ScanProjectOptions): Promise<OserProjectManifest> {
  const startedAt = new Date();
  const rootPath = resolve(options.rootPath);
  const diagnostics: ProjectDiagnostic[] = [];
  const loadedConfig = await loadProjectConfig(rootPath, options.configPath, diagnostics);
  const ignorePatterns = [
    ...defaultProjectIgnorePatterns,
    ...loadedConfig.ignorePatterns,
    ...(options.ignorePatterns ?? [])
  ];
  const records = await walkProject(rootPath, ignorePatterns, diagnostics);
  const normalizedPathCounts = new Map<string, number>();

  for (const record of records) {
    normalizedPathCounts.set(record.relativePath, (normalizedPathCounts.get(record.relativePath) ?? 0) + 1);
  }

  for (const [path, count] of normalizedPathCounts) {
    if (count > 1) {
      diagnostics.push({
        code: "duplicate-normalized-path",
        severity: "error",
        message: `Duplicate normalized project-relative path encountered: ${path}.`,
        path,
        details: { count }
      });
    }
  }

  const fileEntries = await Promise.all(records.map((record) => inspectFile(rootPath, record, diagnostics)));
  const files = fileEntries.filter((file): file is ProjectFileEntry => Boolean(file));
  files.sort((a, b) => a.path.localeCompare(b.path));

  const fileMap = new Map(files.map((file) => [file.path, file]));
  const relationships: ProjectAssetRelationship[] = [];

  for (const file of files) {
    if (file.kind !== "markdown") {
      continue;
    }

    const absolutePath = join(rootPath, fromPosixPath(file.path));
    const references = await extractMarkdownImageReferences(rootPath, file.path, absolutePath, fileMap, diagnostics);
    file.references = references;

    for (const reference of references) {
      if (reference.status !== "resolved" || !reference.normalizedTarget) {
        continue;
      }

      const target = fileMap.get(reference.normalizedTarget);
      if (!target) {
        continue;
      }

      target.referencedBy.push({
        sourcePath: file.path,
        kind: "markdown-image"
      });
      relationships.push({
        kind: "markdown-image",
        sourcePath: file.path,
        targetPath: reference.normalizedTarget,
        provenance: "observed",
        observed: true,
        declared: false,
        inferred: false,
        metadata: {
          alt: reference.alt ?? "",
          title: reference.title ?? ""
        }
      });
    }
  }

  for (const file of files) {
    file.references.sort((a, b) => a.target.localeCompare(b.target));
    file.referencedBy.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
  }

  const visualizationManifests = await discoverVisualizationManifests(rootPath, files, loadedConfig.summary, diagnostics);
  applyVisualizationDeclarations(rootPath, files, relationships, visualizationManifests, diagnostics);

  const candidateSidecarGroups = inferCandidateSidecarGroups(files, relationships, diagnostics);
  relationships.sort(compareRelationships);
  diagnostics.sort(compareDiagnostics);

  return {
    schemaVersion: "0.1",
    scan: {
      rootPath,
      scanner: {
        name: "@oser/project-scanner",
        version: SCANNER_VERSION
      },
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      note: "modifiedAt and scan timestamps are audit metadata, not reproducibility identity. Use checksums for content identity.",
      ignorePatterns: [...loadedConfig.ignorePatterns, ...(options.ignorePatterns ?? [])],
      defaultIgnorePatterns: defaultProjectIgnorePatterns,
      configPath: loadedConfig.summary?.path
    },
    project: loadedConfig.summary,
    files,
    relationships,
    candidateSidecarGroups,
    diagnostics
  };
}

async function walkProject(
  rootPath: string,
  ignorePatterns: string[],
  diagnostics: ProjectDiagnostic[],
  currentPath = rootPath
): Promise<FileRecord[]> {
  let entries;

  try {
    entries = await readdir(currentPath, { withFileTypes: true });
  } catch (error) {
    diagnostics.push(unreadableDiagnostic(rootPath, currentPath, error));
    return [];
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));
  const records: FileRecord[] = [];

  for (const entry of entries) {
    const absolutePath = join(currentPath, entry.name);
    const relativePath = normalizeRelativePath(rootPath, absolutePath);

    if (shouldIgnore(relativePath, entry.name, ignorePatterns)) {
      continue;
    }

    if (entry.isDirectory()) {
      records.push(...await walkProject(rootPath, ignorePatterns, diagnostics, absolutePath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    records.push({ absolutePath, relativePath });
  }

  return records;
}

function shouldIgnore(relativePath: string, name: string, ignorePatterns: string[]): boolean {
  const segments = relativePath.split("/");

  return ignorePatterns.some((pattern) => {
    const normalized = normalizePattern(pattern);

    if (!normalized) {
      return false;
    }

    if (name === normalized || relativePath === normalized) {
      return true;
    }

    if (segments.includes(normalized)) {
      return true;
    }

    if (normalized.endsWith("/")) {
      return relativePath.startsWith(normalized.slice(0, -1));
    }

    if (normalized.includes("*")) {
      return globLikeMatch(relativePath, normalized);
    }

    return false;
  });
}

function normalizePattern(pattern: string): string {
  return toPosixPath(pattern.trim()).replace(/^\.\//, "");
}

function globLikeMatch(value: string, pattern: string): boolean {
  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${escaped}$`).test(value);
}

async function loadProjectConfig(
  rootPath: string,
  explicitConfigPath: string | undefined,
  diagnostics: ProjectDiagnostic[]
): Promise<LoadedProjectConfig> {
  const configAbsolutePath = explicitConfigPath
    ? resolve(rootPath, explicitConfigPath)
    : resolve(rootPath, DEFAULT_PROJECT_CONFIG_PATH);

  if (!isInsideRoot(rootPath, configAbsolutePath)) {
    diagnostics.push({
      code: "project-config-outside-root",
      severity: "error",
      message: "Project configuration path resolves outside the project root.",
      target: explicitConfigPath ?? DEFAULT_PROJECT_CONFIG_PATH
    });
    return { path: explicitConfigPath ?? DEFAULT_PROJECT_CONFIG_PATH, ignorePatterns: [] };
  }

  try {
    await access(configAbsolutePath);
  } catch {
    if (explicitConfigPath) {
      diagnostics.push({
        code: "missing-project-config",
        severity: "error",
        message: `Explicit project configuration file does not exist: ${explicitConfigPath}.`,
        target: explicitConfigPath
      });
    }
    return { path: normalizeRelativePath(rootPath, configAbsolutePath), ignorePatterns: [] };
  }

  const relativeConfigPath = normalizeRelativePath(rootPath, configAbsolutePath);
  let parsed: unknown;

  try {
    parsed = JSON.parse(await readFile(configAbsolutePath, "utf8")) as unknown;
  } catch (error) {
    diagnostics.push({
      code: "malformed-project-config",
      severity: "error",
      message: `Project configuration could not be parsed: ${relativeConfigPath}.`,
      path: relativeConfigPath,
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    return { path: relativeConfigPath, ignorePatterns: [] };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    diagnostics.push({
      code: "unsupported-project-config",
      severity: "error",
      message: `Project configuration must be a JSON object: ${relativeConfigPath}.`,
      path: relativeConfigPath
    });
    return { path: relativeConfigPath, ignorePatterns: [] };
  }

  const config = parsed as Record<string, unknown>;
  const schemaVersion = typeof config.schemaVersion === "string" ? config.schemaVersion : undefined;
  if (!schemaVersion) {
    diagnostics.push({
      code: "unsupported-project-config",
      severity: "warning",
      message: "Project configuration is missing schemaVersion.",
      path: relativeConfigPath
    });
  } else if (schemaVersion !== "0.1") {
    diagnostics.push({
      code: "unsupported-project-config",
      severity: "warning",
      message: `Project configuration schemaVersion ${schemaVersion} is not explicitly supported by this scanner.`,
      path: relativeConfigPath
    });
  }

  const typedConfig: OserProjectConfig = {
    schemaVersion: schemaVersion ?? "unknown",
    id: stringValue(config.id),
    title: stringValue(config.title),
    languages: stringArray(config.languages, "languages", relativeConfigPath, diagnostics),
    contentRoots: stringArray(config.contentRoots, "contentRoots", relativeConfigPath, diagnostics),
    assetRoots: stringArray(config.assetRoots, "assetRoots", relativeConfigPath, diagnostics),
    ignore: stringArray(config.ignore, "ignore", relativeConfigPath, diagnostics),
    visualizationManifests: stringArray(config.visualizationManifests, "visualizationManifests", relativeConfigPath, diagnostics),
    bibliography: stringArray(config.bibliography, "bibliography", relativeConfigPath, diagnostics),
    outputRoots: stringArray(config.outputRoots, "outputRoots", relativeConfigPath, diagnostics)
  };

  const summary: OserProjectConfigSummary = {
    path: relativeConfigPath,
    id: typedConfig.id,
    title: typedConfig.title,
    languages: typedConfig.languages ?? [],
    contentRoots: typedConfig.contentRoots ?? [],
    assetRoots: typedConfig.assetRoots ?? [],
    ignore: typedConfig.ignore ?? [],
    visualizationManifests: typedConfig.visualizationManifests ?? [],
    bibliography: typedConfig.bibliography ?? [],
    outputRoots: typedConfig.outputRoots ?? []
  };

  return {
    path: relativeConfigPath,
    summary,
    config: typedConfig,
    ignorePatterns: typedConfig.ignore ?? []
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function stringArray(
  value: unknown,
  fieldName: string,
  configPath: string,
  diagnostics: ProjectDiagnostic[]
): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    diagnostics.push({
      code: "unsupported-project-config",
      severity: "warning",
      message: `Project configuration field ${fieldName} must be an array of strings.`,
      path: configPath,
      details: { fieldName }
    });
    return undefined;
  }

  return value;
}

async function inspectFile(
  rootPath: string,
  record: FileRecord,
  diagnostics: ProjectDiagnostic[]
): Promise<ProjectFileEntry | undefined> {
  let fileStat;
  let content: Buffer;

  try {
    fileStat = await stat(record.absolutePath);
    content = await readFile(record.absolutePath);
  } catch (error) {
    diagnostics.push(unreadableDiagnostic(rootPath, record.absolutePath, error));
    return undefined;
  }

  const extension = extname(record.relativePath).toLowerCase();
  const jsonClassification = extension === ".json" ? classifyJson(record.relativePath, content, diagnostics) : undefined;

  return {
    path: record.relativePath,
    kind: jsonClassification?.kind ?? classifyByExtension(extension),
    extension: extension.replace(/^\./, ""),
    sizeBytes: fileStat.size,
    checksum: {
      algorithm: "sha256",
      value: createHash("sha256").update(content).digest("hex")
    },
    modifiedAt: fileStat.mtime.toISOString(),
    references: [],
    referencedBy: [],
    declarations: []
  };
}

function classifyJson(relativePath: string, content: Buffer, diagnostics: ProjectDiagnostic[]): JsonClassification {
  try {
    const parsed = JSON.parse(content.toString("utf8")) as unknown;
    return {
      kind: classifyParsedJson(relativePath, parsed),
      malformed: false
    };
  } catch (error) {
    diagnostics.push({
      code: "malformed-json",
      severity: "error",
      message: `JSON file could not be parsed: ${relativePath}.`,
      path: relativePath,
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    return {
      kind: filenameSuggestsVega(relativePath) ?? "json",
      malformed: true
    };
  }
}

function classifyParsedJson(relativePath: string, parsed: unknown): ProjectFileKind {
  const filenameKind = filenameSuggestsVega(relativePath);
  if (filenameKind) {
    return filenameKind;
  }

  if (!parsed || typeof parsed !== "object") {
    return "json";
  }

  const record = parsed as Record<string, unknown>;
  const schema = typeof record["$schema"] === "string" ? record["$schema"].toLowerCase() : "";

  if (schema.includes("vega-lite")) {
    return "vega-lite";
  }

  if (schema.includes("vega")) {
    return "vega";
  }

  if ("mark" in record && "encoding" in record) {
    return "vega-lite";
  }

  if ("marks" in record && ("scales" in record || "signals" in record || "data" in record)) {
    return "vega";
  }

  return "json";
}

function filenameSuggestsVega(relativePath: string): ProjectFileKind | undefined {
  const lower = relativePath.toLowerCase();

  if (lower.endsWith(".vega-lite.json") || lower.endsWith(".vl.json") || lower.includes("vega-lite")) {
    return "vega-lite";
  }

  if (lower.endsWith(".vega.json")) {
    return "vega";
  }

  return undefined;
}

function classifyByExtension(extension: string): ProjectFileKind {
  switch (extension) {
    case ".md":
    case ".markdown":
      return "markdown";
    case ".svg":
      return "svg";
    case ".png":
    case ".jpg":
    case ".jpeg":
      return "raster-image";
    case ".pdf":
      return "pdf";
    case ".csv":
      return "csv";
    case ".json":
      return "json";
    case ".yaml":
    case ".yml":
      return "yaml";
    case ".bib":
      return "bib";
    case ".py":
      return "python";
    case ".r":
      return "r";
    case ".html":
    case ".htm":
      return "html";
    default:
      return "unknown";
  }
}

async function extractMarkdownImageReferences(
  rootPath: string,
  sourcePath: string,
  absolutePath: string,
  fileMap: Map<string, ProjectFileEntry>,
  diagnostics: ProjectDiagnostic[]
): Promise<ProjectFileReference[]> {
  let content: string;

  try {
    content = await readFile(absolutePath, "utf8");
  } catch (error) {
    diagnostics.push(unreadableDiagnostic(rootPath, absolutePath, error));
    return [];
  }

  const references: ProjectFileReference[] = [];
  const pattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const parsed = parseMarkdownImageTarget(match[2]);
    const reference = resolveMarkdownReference(rootPath, sourcePath, parsed.target);
    const item: ProjectFileReference = {
      kind: "markdown-image",
      target: parsed.target,
      alt: match[1],
      title: parsed.title,
      status: reference.status,
      normalizedTarget: reference.normalizedTarget
    };

    references.push(item);

    if (reference.status === "missing") {
      diagnostics.push({
        code: "missing-referenced-file",
        severity: "error",
        message: `Markdown image reference does not resolve: ${parsed.target}.`,
        path: sourcePath,
        target: reference.normalizedTarget ?? parsed.target
      });
    }

    if (reference.status === "outside-root") {
      diagnostics.push({
        code: "reference-outside-project-root",
        severity: "error",
        message: `Markdown image reference resolves outside the project root: ${parsed.target}.`,
        path: sourcePath,
        target: parsed.target
      });
    }

    if (reference.status === "resolved" && reference.normalizedTarget && !fileMap.has(reference.normalizedTarget)) {
      diagnostics.push({
        code: "missing-referenced-file",
        severity: "error",
        message: `Markdown image reference does not resolve: ${parsed.target}.`,
        path: sourcePath,
        target: reference.normalizedTarget
      });
      item.status = "missing";
    }
  }

  return references;
}

function parseMarkdownImageTarget(value: string): { target: string; title?: string } {
  const trimmed = value.trim();

  if (trimmed.startsWith("<")) {
    const closeIndex = trimmed.indexOf(">");
    if (closeIndex !== -1) {
      return {
        target: trimmed.slice(1, closeIndex),
        title: parseMarkdownTitle(trimmed.slice(closeIndex + 1).trim())
      };
    }
  }

  const titleMatch = trimmed.match(/^(.*?)(?:\s+(["'])(.*?)\2)\s*$/);
  if (titleMatch) {
    return {
      target: titleMatch[1].trim(),
      title: titleMatch[3]
    };
  }

  return { target: trimmed };
}

function parseMarkdownTitle(value: string): string | undefined {
  const match = value.match(/^(["'])(.*?)\1$/);
  return match ? match[2] : undefined;
}

function resolveMarkdownReference(
  rootPath: string,
  sourcePath: string,
  rawTarget: string
): { status: ProjectFileReference["status"]; normalizedTarget?: string } {
  if (/^[a-z][a-z0-9+.-]*:/i.test(rawTarget) || rawTarget.startsWith("//")) {
    return { status: "external" };
  }

  const targetWithoutFragment = stripQueryAndFragment(rawTarget);
  const targetPath = safeDecodeUri(targetWithoutFragment);
  const absoluteTarget = isAbsolute(targetPath)
    ? resolve(targetPath)
    : resolve(rootPath, dirname(fromPosixPath(sourcePath)), targetPath);

  if (!isInsideRoot(rootPath, absoluteTarget)) {
    return { status: "outside-root" };
  }

  const normalizedTarget = normalizeRelativePath(rootPath, absoluteTarget);
  return {
    status: "resolved",
    normalizedTarget
  };
}

function stripQueryAndFragment(target: string): string {
  const queryIndex = target.search(/[?#]/);
  return queryIndex === -1 ? target : target.slice(0, queryIndex);
}

function safeDecodeUri(value: string): string {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}


async function discoverVisualizationManifests(
  rootPath: string,
  files: ProjectFileEntry[],
  config: OserProjectConfigSummary | undefined,
  diagnostics: ProjectDiagnostic[]
): Promise<VisualizationManifest[]> {
  const manifestPaths = new Set<string>();

  for (const declaredPath of config?.visualizationManifests ?? []) {
    const normalized = resolveDeclaredProjectPath(rootPath, declaredPath, config ? config.path : "oser.project.json", diagnostics, "declared-path-outside-project-root");
    if (normalized) {
      manifestPaths.add(normalized);
    }
  }

  for (const file of files) {
    if (file.path.toLowerCase().endsWith(".visualization.json")) {
      manifestPaths.add(file.path);
    }
  }

  const manifests: VisualizationManifest[] = [];
  const seenIds = new Map<string, string>();

  for (const manifestPath of [...manifestPaths].sort()) {
    const file = files.find((candidate) => candidate.path === manifestPath);
    if (!file) {
      diagnostics.push({
        code: "missing-declared-file",
        severity: "error",
        message: `Declared visualization manifest does not exist: ${manifestPath}.`,
        path: config ? config.path : undefined,
        target: manifestPath
      });
      continue;
    }

    const manifest = await readVisualizationManifest(rootPath, manifestPath, diagnostics);
    if (!manifest) {
      continue;
    }

    const previousPath = seenIds.get(manifest.summary.id);
    if (previousPath) {
      diagnostics.push({
        code: "duplicate-declared-asset-id",
        severity: "error",
        message: `Duplicate declared visualization asset id: ${manifest.summary.id}.`,
        path: manifestPath,
        target: previousPath
      });
    } else {
      seenIds.set(manifest.summary.id, manifestPath);
    }

    manifests.push(manifest);
  }

  return manifests;
}

async function readVisualizationManifest(
  rootPath: string,
  manifestPath: string,
  diagnostics: ProjectDiagnostic[]
): Promise<VisualizationManifest | undefined> {
  const absolutePath = resolve(rootPath, fromPosixPath(manifestPath));
  let parsed: unknown;

  try {
    parsed = JSON.parse(await readFile(absolutePath, "utf8")) as unknown;
  } catch (error) {
    diagnostics.push({
      code: "malformed-visualization-manifest",
      severity: "error",
      message: `Visualization manifest could not be parsed: ${manifestPath}.`,
      path: manifestPath,
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    return undefined;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    diagnostics.push({
      code: "malformed-visualization-manifest",
      severity: "error",
      message: `Visualization manifest must be a JSON object: ${manifestPath}.`,
      path: manifestPath
    });
    return undefined;
  }

  const record = parsed as Record<string, unknown>;
  const id = stringValue(record.id);
  if (!id) {
    diagnostics.push({
      code: "malformed-visualization-manifest",
      severity: "error",
      message: `Visualization manifest is missing a string id: ${manifestPath}.`,
      path: manifestPath
    });
    return undefined;
  }

  const summary: VisualizationManifestSummary = {
    path: manifestPath,
    id,
    title: stringValue(record.title),
    status: stringValue(record.status),
    sourceData: extractSourceRefs(record.source_data),
    sourceCode: extractSourceRefs(record.source_code),
    specifications: extractSourceRefs(record.specifications),
    renderedAssets: extractRenderedRefs(record.rendered_assets),
    notes: extractSourceRefs(record.notes),
    metadata: extractSourceRefs(record.source_data).filter((path) => /\.json$/i.test(path)),
    accessibility: extractAccessibility(record.accessibility),
    caption: extractCaption(record.editorial)
  };

  if (summary.accessibility.dataTable) {
    summary.sourceData.push(summary.accessibility.dataTable);
  }

  return { path: manifestPath, summary };
}

function extractSourceRefs(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item === "string") {
      return [item];
    }

    if (item && typeof item === "object" && typeof (item as Record<string, unknown>).path === "string") {
      return [(item as Record<string, string>).path];
    }

    return [];
  });
}

function extractRenderedRefs(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const paths: string[] = [];
  for (const rendered of Object.values(value as Record<string, unknown>)) {
    if (!rendered) {
      continue;
    }

    if (typeof rendered === "string") {
      paths.push(rendered);
      continue;
    }

    if (typeof rendered === "object" && typeof (rendered as Record<string, unknown>).path === "string") {
      paths.push((rendered as Record<string, string>).path);
    }
  }

  return paths;
}

function extractAccessibility(value: unknown): VisualizationManifestSummary["accessibility"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  return {
    altText: stringValue(record.alt_text) ?? stringValue(record.altText),
    longDescription: stringValue(record.long_description) ?? stringValue(record.longDescription),
    dataTable: stringValue(record.data_table) ?? stringValue(record.dataTable)
  };
}

function extractCaption(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return stringValue((value as Record<string, unknown>).caption);
}

function applyVisualizationDeclarations(
  rootPath: string,
  files: ProjectFileEntry[],
  relationships: ProjectAssetRelationship[],
  manifests: VisualizationManifest[],
  diagnostics: ProjectDiagnostic[]
): void {
  const fileMap = new Map(files.map((file) => [file.path, file]));

  for (const manifest of manifests) {
    const manifestFile = fileMap.get(manifest.path);
    const declaredFiles: Array<{ path: string; role: VisualizationDeclaredRole }> = [
      ...manifest.summary.sourceData.map((path) => ({ path, role: "source-data" as const })),
      ...manifest.summary.sourceCode.map((path) => ({ path, role: "source-code" as const })),
      ...manifest.summary.specifications.map((path) => ({ path, role: "specification" as const })),
      ...manifest.summary.renderedAssets.map((path) => ({ path, role: "rendered-asset" as const })),
      ...manifest.summary.notes.map((path) => ({ path, role: "notes" as const })),
      ...manifest.summary.metadata.map((path) => ({ path, role: "metadata" as const }))
    ];

    if (manifest.summary.accessibility.dataTable) {
      declaredFiles.push({ path: manifest.summary.accessibility.dataTable, role: "accessibility" });
    }

    for (const declaredFile of uniqueDeclaredFiles(declaredFiles)) {
      const normalizedDeclaredPath = resolveDeclaredProjectPath(
        rootPath,
        declaredFile.path,
        manifest.path,
        diagnostics,
        "declared-path-outside-project-root"
      );
      if (!normalizedDeclaredPath) {
        continue;
      }

      const target = fileMap.get(normalizedDeclaredPath);
      if (!target) {
        diagnostics.push({
          code: declaredFile.role === "rendered-asset" ? "declared-rendered-asset-missing" : "missing-declared-file",
          severity: "error",
          message: `Declared ${declaredFile.role} does not exist: ${normalizedDeclaredPath}.`,
          path: manifest.path,
          target: normalizedDeclaredPath,
          details: {
            assetId: manifest.summary.id,
            role: declaredFile.role
          }
        });
        continue;
      }

      const declaration: ProjectFileDeclaration = {
        sourcePath: manifest.path,
        kind: "visualization-declaration",
        role: declaredFile.role,
        assetId: manifest.summary.id
      };
      target.declarations.push(declaration);
      addBackReference(target, manifest.path, "visualization-declaration");

      relationships.push({
        kind: "visualization-declaration",
        sourcePath: manifest.path,
        targetPath: normalizedDeclaredPath,
        provenance: "declared",
        observed: false,
        declared: true,
        inferred: false,
        metadata: {
          assetId: manifest.summary.id,
          role: declaredFile.role
        }
      });
    }

    if (manifest.summary.caption && manifestFile) {
      manifestFile.declarations.push({
        sourcePath: manifest.path,
        kind: "visualization-declaration",
        role: "caption",
        assetId: manifest.summary.id
      });
    }
  }
}


function addBackReference(
  file: ProjectFileEntry,
  sourcePath: string,
  kind: "markdown-image" | "visualization-declaration"
): void {
  if (file.referencedBy.some((reference) => reference.sourcePath === sourcePath && reference.kind === kind)) {
    return;
  }

  file.referencedBy.push({ sourcePath, kind });
}

function uniqueDeclaredFiles(
  files: Array<{ path: string; role: VisualizationDeclaredRole }>
): Array<{ path: string; role: VisualizationDeclaredRole }> {
  const seen = new Set<string>();
  const unique: Array<{ path: string; role: VisualizationDeclaredRole }> = [];

  for (const file of files) {
    const key = `${file.role}:${file.path}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(file);
  }

  return unique;
}

function resolveDeclaredProjectPath(
  rootPath: string,
  declaredPath: string,
  sourcePath: string,
  diagnostics: ProjectDiagnostic[],
  diagnosticCode: string
): string | undefined {
  const absolutePath = isAbsolute(declaredPath)
    ? resolve(declaredPath)
    : resolve(rootPath, fromPosixPath(declaredPath));

  if (!isInsideRoot(rootPath, absolutePath)) {
    diagnostics.push({
      code: diagnosticCode,
      severity: "error",
      message: `Declared path resolves outside the project root: ${declaredPath}.`,
      path: sourcePath,
      target: declaredPath
    });
    return undefined;
  }

  return normalizeRelativePath(rootPath, absolutePath);
}

function inferCandidateSidecarGroups(
  files: ProjectFileEntry[],
  relationships: ProjectAssetRelationship[],
  diagnostics: ProjectDiagnostic[]
): CandidateSidecarGroup[] {
  const grouped = new Map<string, CandidateSidecarFile[]>();

  for (const file of files) {
    if (!isSidecarCandidate(file)) {
      continue;
    }

    const key = sidecarGroupKey(file.path);
    const groupFile: CandidateSidecarFile = {
      path: file.path,
      kind: file.kind,
      role: sidecarRole(file)
    };

    const group = grouped.get(key) ?? [];
    group.push(groupFile);
    grouped.set(key, group);
  }

  const groups: CandidateSidecarGroup[] = [];

  for (const [key, groupFiles] of grouped) {
    if (groupFiles.length < 2) {
      continue;
    }

    groupFiles.sort((a, b) => a.path.localeCompare(b.path));
    const directory = dirnameFromPosix(key);
    const basename = basenameFromPosix(key);
    const roles = collectSidecarRoles(groupFiles);
    const groupDiagnostics = sidecarDiagnostics(roles);
    const groupId = directory === "." ? basename : `${directory}/${basename}`;

    for (const diagnosticCode of groupDiagnostics) {
      diagnostics.push({
        code: diagnosticCode,
        severity: "warning",
        message: sidecarDiagnosticMessage(diagnosticCode, groupId),
        path: groupId,
        details: { inferred: true }
      });
    }

    const group: CandidateSidecarGroup = {
      id: groupId,
      basename,
      directory,
      provenance: "inferred",
      files: groupFiles,
      roles,
      diagnostics: groupDiagnostics
    };
    groups.push(group);

    for (const file of groupFiles) {
      relationships.push({
        kind: "candidate-sidecar",
        sourcePath: groupId,
        targetPath: file.path,
        provenance: "inferred",
        observed: false,
        declared: false,
        inferred: true,
        metadata: {
          role: file.role
        }
      });
    }
  }

  groups.sort((a, b) => a.id.localeCompare(b.id));
  return groups;
}

function isSidecarCandidate(file: ProjectFileEntry): boolean {
  return file.kind !== "unknown";
}

function sidecarRole(file: ProjectFileEntry): CandidateSidecarRole {
  const lower = file.path.toLowerCase();

  if (file.kind === "svg") {
    return "rendered-svg";
  }

  if (file.kind === "raster-image") {
    return "rendered-raster";
  }

  if (file.kind === "pdf") {
    return "rendered-pdf";
  }

  if (file.kind === "html") {
    return "rendered-html";
  }

  if (file.kind === "csv") {
    return "source-data";
  }

  if (file.kind === "vega" || file.kind === "vega-lite") {
    return "specification";
  }

  if (file.kind === "json") {
    return "metadata";
  }

  if (file.kind === "yaml") {
    return "metadata";
  }

  if (file.kind === "markdown" && /(?:^|[-_.])notes?\.(?:md|markdown)$/i.test(lower)) {
    return "notes";
  }

  if (file.kind === "python" || file.kind === "r") {
    return "source-code";
  }

  if (file.kind === "bib") {
    return "bibliography";
  }

  return "unknown";
}

function sidecarGroupKey(path: string): string {
  const directory = dirnameFromPosix(path);
  const name = basenameFromPosix(path);
  const lower = name.toLowerCase();
  let base = name.slice(0, name.length - extname(name).length);

  if (lower.endsWith(".vega-lite.json")) {
    base = name.slice(0, -".vega-lite.json".length);
  } else if (lower.endsWith(".vega.json")) {
    base = name.slice(0, -".vega.json".length);
  } else if (lower.endsWith(".vl.json")) {
    base = name.slice(0, -".vl.json".length);
  }

  base = base.replace(/(?:[-_.])notes?$/i, "");
  return directory === "." ? base : `${directory}/${base}`;
}

function collectSidecarRoles(files: CandidateSidecarFile[]): CandidateSidecarRoles {
  const roles: CandidateSidecarRoles = {
    renderedAssets: [],
    sourceData: [],
    metadata: [],
    specifications: [],
    notes: [],
    sourceCode: [],
    bibliography: [],
    unknown: []
  };

  for (const file of files) {
    switch (file.role) {
      case "rendered-svg":
      case "rendered-raster":
      case "rendered-pdf":
      case "rendered-html":
        roles.renderedAssets.push(file.path);
        break;
      case "source-data":
        roles.sourceData.push(file.path);
        break;
      case "metadata":
        roles.metadata.push(file.path);
        break;
      case "specification":
        roles.specifications.push(file.path);
        break;
      case "notes":
        roles.notes.push(file.path);
        break;
      case "source-code":
        roles.sourceCode.push(file.path);
        break;
      case "bibliography":
        roles.bibliography.push(file.path);
        break;
      case "unknown":
        roles.unknown.push(file.path);
        break;
    }
  }

  for (const values of Object.values(roles)) {
    values.sort();
  }

  return roles;
}

function sidecarDiagnostics(roles: CandidateSidecarRoles): string[] {
  const diagnostics: string[] = [];
  const hasSources = roles.sourceData.length > 0 || roles.sourceCode.length > 0 || roles.specifications.length > 0;
  const hasRendered = roles.renderedAssets.length > 0;

  if (hasSources && !hasRendered) {
    diagnostics.push("candidate-sidecar-missing-rendered-asset");
  }

  if (hasRendered && roles.metadata.length === 0 && roles.notes.length === 0) {
    diagnostics.push("candidate-sidecar-missing-metadata-or-notes");
  }

  return diagnostics;
}

function sidecarDiagnosticMessage(code: string, groupId: string): string {
  if (code === "candidate-sidecar-missing-rendered-asset") {
    return `Candidate sidecar group ${groupId} has source/specification files but no rendered asset.`;
  }

  if (code === "candidate-sidecar-missing-metadata-or-notes") {
    return `Candidate sidecar group ${groupId} has rendered assets but no metadata or notes sidecar.`;
  }

  return `Candidate sidecar group ${groupId} has an inconsistency.`;
}

function unreadableDiagnostic(rootPath: string, absolutePath: string, error: unknown): ProjectDiagnostic {
  const path = isInsideRoot(rootPath, absolutePath) ? normalizeRelativePath(rootPath, absolutePath) : absolutePath;
  return {
    code: "unreadable-file",
    severity: "error",
    message: `File or directory could not be read: ${path}.`,
    path,
    details: {
      error: error instanceof Error ? error.message : String(error)
    }
  };
}

function compareRelationships(a: ProjectAssetRelationship, b: ProjectAssetRelationship): number {
  return `${a.kind}:${a.sourcePath}:${a.targetPath}`.localeCompare(`${b.kind}:${b.sourcePath}:${b.targetPath}`);
}

function compareDiagnostics(a: ProjectDiagnostic, b: ProjectDiagnostic): number {
  return `${a.severity}:${a.code}:${a.path ?? ""}:${a.target ?? ""}`.localeCompare(`${b.severity}:${b.code}:${b.path ?? ""}:${b.target ?? ""}`);
}

function normalizeRelativePath(rootPath: string, absolutePath: string): string {
  return toPosixPath(relative(rootPath, absolutePath));
}

function toPosixPath(value: string): string {
  return value.split(sep).join("/");
}

function fromPosixPath(value: string): string {
  return value.split("/").join(sep);
}

function dirnameFromPosix(value: string): string {
  const index = value.lastIndexOf("/");
  return index === -1 ? "." : value.slice(0, index);
}

function basenameFromPosix(value: string): string {
  const index = value.lastIndexOf("/");
  return index === -1 ? value : value.slice(index + 1);
}

function isInsideRoot(rootPath: string, absolutePath: string): boolean {
  const relativePath = relative(rootPath, absolutePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}
