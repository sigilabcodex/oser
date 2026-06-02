import type { RenderManifest } from "../types";

type ExportStatus = "not-exported" | "exported" | "stale" | "error";

type ExportPanelProps = {
  busy: boolean;
  htmlManifest: RenderManifest | null;
  pdfManifest: RenderManifest | null;
  pdfUrl?: string;
  exportStatus: ExportStatus;
  validateError?: string | null;
  renderError?: string | null;
  exportError?: string | null;
  onValidate: () => void;
  onRenderHtml: () => void;
  onExportPdf: () => void;
};

export function ExportPanel({
  busy,
  htmlManifest,
  pdfManifest,
  pdfUrl,
  exportStatus,
  validateError,
  renderError,
  exportError,
  onValidate,
  onRenderHtml,
  onExportPdf
}: ExportPanelProps) {
  return (
    <section className="panel compact-panel" aria-label="Actions and exports">
      <div className="panel-header">
        <div>
          <h2>Actions</h2>
          <p>{pdfManifest ? `PDF generated ${formatDate(pdfManifest.generatedAt)}` : "No PDF export"}</p>
        </div>
        <span className={`state-pill ${exportStatus}`}>{statusLabel(exportStatus)}</span>
      </div>
      <div className="action-grid">
        <button type="button" onClick={onValidate} disabled={busy}>Validate</button>
        <button type="button" onClick={onRenderHtml} disabled={busy}>Render HTML</button>
        <button type="button" onClick={onExportPdf} disabled={busy}>Export PDF</button>
      </div>
      {validateError ? <div className="inline-error">Validate failed: {validateError}</div> : null}
      {renderError ? <div className="inline-error">Render HTML failed: {renderError}</div> : null}
      {exportError ? <div className="inline-error">Export PDF failed: {exportError}</div> : null}
      <dl className="metadata-list">
        <div>
          <dt>HTML path</dt>
          <dd>{htmlManifest?.outputs.htmlPath ?? "-"}</dd>
        </div>
        <div>
          <dt>PDF path</dt>
          <dd>{pdfManifest?.outputs.pdfPath ?? "-"}</dd>
        </div>
        <div>
          <dt>Generated at</dt>
          <dd>{pdfManifest ? formatDate(pdfManifest.generatedAt) : "-"}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{pdfManifest?.render.target ?? "-"}</dd>
        </div>
      </dl>
      {pdfUrl ? (
        <a className="pdf-link" href={pdfUrl} target="_blank" rel="noreferrer">Open PDF</a>
      ) : null}
    </section>
  );
}

function statusLabel(status: ExportStatus): string {
  switch (status) {
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

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
