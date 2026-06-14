import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type {
  CandidateSidecarFile,
  CandidateSidecarGroup,
  CandidateSidecarRole,
  CandidateSidecarRoles,
  OserProjectManifest,
  ProjectAssetRelationship,
  ProjectDiagnostic,
  ProjectFileEntry,
  ProjectFileKind,
  ProjectFileReference
} from "../../project-model/src";

const SCANNER_VERSION = "0.1.0";

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
};

type FileRecord = {
  absolutePath: string;
  relativePath: string;
};

type JsonClassification = {
  kind: ProjectFileKind;
  malformed: boolean;
};

export async function scanProject(options: ScanProjectOptions): Promise<OserProjectManifest> {
  const startedAt = new Date();
  const rootPath = resolve(options.rootPath);
  const ignorePatterns = [...defaultProjectIgnorePatterns, ...(options.ignorePatterns ?? [])];
  const diagnostics: ProjectDiagnostic[] = [];
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
        observed: true,
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
      ignorePatterns: options.ignorePatterns ?? [],
      defaultIgnorePatterns: defaultProjectIgnorePatterns
    },
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
    referencedBy: []
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
      inferred: true,
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
        observed: false,
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
