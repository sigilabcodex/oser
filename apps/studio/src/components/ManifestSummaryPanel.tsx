import type { RenderManifest } from "../types";

type OutputStatus = "not-rendered" | "rendered" | "not-exported" | "exported" | "stale" | "error";

type ManifestSummaryPanelProps = {
  htmlManifest: RenderManifest | null;
  pdfManifest: RenderManifest | null;
  htmlStatus: OutputStatus;
  pdfStatus: OutputStatus;
};

export function ManifestSummaryPanel({
  htmlManifest,
  pdfManifest,
  htmlStatus,
  pdfStatus
}: ManifestSummaryPanelProps) {
  return (
    <section className="panel compact-panel" aria-label="Render output manifest summary">
      <div className="panel-header">
        <div>
          <h2>Render Output</h2>
          <p>{htmlManifest || pdfManifest ? "Manifest summary" : "No manifest yet"}</p>
        </div>
      </div>
      {htmlManifest || pdfManifest ? (
        <div className="manifest-stack">
          {htmlManifest ? <ManifestBlock label="HTML" manifest={htmlManifest} status={htmlStatus} /> : null}
          {pdfManifest ? <ManifestBlock label="PDF" manifest={pdfManifest} status={pdfStatus} /> : null}
        </div>
      ) : (
        <div className="empty-state small">Render HTML or export PDF to inspect output metadata.</div>
      )}
    </section>
  );
}

type ManifestBlockProps = {
  label: string;
  manifest: RenderManifest;
  status: OutputStatus;
};

function ManifestBlock({ label, manifest, status }: ManifestBlockProps) {
  return (
    <section className="manifest-block" aria-label={`${label} manifest`}>
      <div className="manifest-block-header">
        <h3>{label}</h3>
        <span className={`state-pill ${status}`}>{statusLabel(status)}</span>
      </div>
      <dl className="metadata-list flush">
        <MetadataItem label="Source" value={manifest.source.inputPath} />
        <MetadataItem label="Target" value={manifest.render.target} />
        <MetadataItem label="Profile" value={manifest.render.profilePath} />
        <MetadataItem label="Generated CSS" value={manifest.render.generatedCssPath} />
        <MetadataItem label="HTML path" value={manifest.outputs.htmlPath} />
        <MetadataItem label="PDF path" value={manifest.outputs.pdfPath} />
        <MetadataItem label="Generated at" value={formatDate(manifest.generatedAt)} />
        <MetadataItem label="Manifest" value={manifest.outputs.manifestPath} />
        <MetadataItem label="Diagnostics" value={diagnosticsText(manifest)} />
      </dl>
    </section>
  );
}

type MetadataItemProps = {
  label: string;
  value?: string;
};

function MetadataItem({ label, value }: MetadataItemProps) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "-"}</dd>
    </div>
  );
}

function diagnosticsText(manifest: RenderManifest): string {
  const summary = manifest.diagnostics.summary;
  return `${summary.errors} errors, ${summary.warnings} warnings, ${summary.info} info`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function statusLabel(status: OutputStatus): string {
  switch (status) {
    case "not-rendered":
      return "Not rendered";
    case "rendered":
      return "Rendered";
    case "not-exported":
      return "Not exported";
    case "exported":
      return "Exported";
    case "stale":
      return "Stale";
    case "error":
      return "Error";
  }
}
