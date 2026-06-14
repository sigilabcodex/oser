export type OserProjectManifest = {
  schemaVersion: "0.1";
  scan: ProjectScanMetadata;
  project?: OserProjectConfigSummary;
  files: ProjectFileEntry[];
  relationships: ProjectAssetRelationship[];
  candidateSidecarGroups: CandidateSidecarGroup[];
  diagnostics: ProjectDiagnostic[];
};

export type ProjectScanMetadata = {
  rootPath: string;
  scanner: {
    name: "@oser/project-scanner";
    version: "0.1.0";
  };
  startedAt: string;
  completedAt: string;
  note: string;
  ignorePatterns: string[];
  defaultIgnorePatterns: string[];
  configPath?: string;
};

export type OserProjectConfig = {
  schemaVersion: string;
  id?: string;
  title?: string;
  languages?: string[];
  contentRoots?: string[];
  assetRoots?: string[];
  ignore?: string[];
  visualizationManifests?: string[];
  bibliography?: string[];
  outputRoots?: string[];
};

export type OserProjectConfigSummary = {
  path: string;
  id?: string;
  title?: string;
  languages: string[];
  contentRoots: string[];
  assetRoots: string[];
  ignore: string[];
  visualizationManifests: string[];
  bibliography: string[];
  outputRoots: string[];
};

export type ProjectFileKind =
  | "markdown"
  | "svg"
  | "raster-image"
  | "pdf"
  | "csv"
  | "json"
  | "yaml"
  | "bib"
  | "python"
  | "r"
  | "html"
  | "vega"
  | "vega-lite"
  | "unknown";

export type ProjectFileEntry = {
  path: string;
  kind: ProjectFileKind;
  extension: string;
  sizeBytes: number;
  checksum: {
    algorithm: "sha256";
    value: string;
  };
  modifiedAt: string;
  references: ProjectFileReference[];
  referencedBy: ProjectFileBackReference[];
  declarations: ProjectFileDeclaration[];
};

export type ProjectFileReference = {
  kind: "markdown-image";
  target: string;
  normalizedTarget?: string;
  alt?: string;
  title?: string;
  status: "resolved" | "missing" | "outside-root" | "external";
};

export type ProjectFileBackReference = {
  sourcePath: string;
  kind: "markdown-image" | "visualization-declaration";
};

export type ProjectFileDeclaration = {
  sourcePath: string;
  kind: "visualization-declaration";
  role: VisualizationDeclaredRole;
  assetId: string;
};

export type ProjectRelationshipProvenance = "observed" | "declared" | "inferred";

export type ProjectAssetRelationship = {
  kind: "markdown-image" | "candidate-sidecar" | "visualization-declaration";
  sourcePath: string;
  targetPath: string;
  provenance: ProjectRelationshipProvenance;
  observed: boolean;
  declared: boolean;
  inferred: boolean;
  metadata?: Record<string, string | number | boolean>;
};

export type VisualizationDeclaredRole =
  | "source-data"
  | "source-code"
  | "specification"
  | "rendered-asset"
  | "notes"
  | "metadata"
  | "accessibility"
  | "caption";

export type CandidateSidecarGroup = {
  id: string;
  basename: string;
  directory: string;
  provenance: ProjectRelationshipProvenance;
  files: CandidateSidecarFile[];
  roles: CandidateSidecarRoles;
  diagnostics: string[];
};

export type CandidateSidecarFile = {
  path: string;
  kind: ProjectFileKind;
  role: CandidateSidecarRole;
};

export type CandidateSidecarRole =
  | "rendered-svg"
  | "rendered-raster"
  | "rendered-pdf"
  | "rendered-html"
  | "source-data"
  | "metadata"
  | "specification"
  | "notes"
  | "source-code"
  | "bibliography"
  | "unknown";

export type CandidateSidecarRoles = {
  renderedAssets: string[];
  sourceData: string[];
  metadata: string[];
  specifications: string[];
  notes: string[];
  sourceCode: string[];
  bibliography: string[];
  unknown: string[];
};

export type ProjectDiagnosticSeverity = "info" | "warning" | "error";

export type VisualizationManifestSummary = {
  path: string;
  id: string;
  title?: string;
  status?: string;
  sourceData: string[];
  sourceCode: string[];
  specifications: string[];
  renderedAssets: string[];
  notes: string[];
  metadata: string[];
  accessibility: {
    altText?: string;
    longDescription?: string;
    dataTable?: string;
  };
  caption?: string;
};

export type ProjectDiagnostic = {
  code: string;
  severity: ProjectDiagnosticSeverity;
  message: string;
  path?: string;
  target?: string;
  details?: Record<string, string | number | boolean>;
};
