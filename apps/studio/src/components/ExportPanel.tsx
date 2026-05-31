import type { RenderManifest } from "../types";

type ExportPanelProps = {
  busy: boolean;
  htmlManifest: RenderManifest | null;
  pdfManifest: RenderManifest | null;
  pdfUrl?: string;
  onValidate: () => void;
  onRenderHtml: () => void;
  onExportPdf: () => void;
};

export function ExportPanel({
  busy,
  htmlManifest,
  pdfManifest,
  pdfUrl,
  onValidate,
  onRenderHtml,
  onExportPdf
}: ExportPanelProps) {
  return (
    <section className="panel compact-panel" aria-label="Actions and exports">
      <div className="panel-header">
        <div>
          <h2>Actions</h2>
          <p>{htmlManifest?.generatedAt ?? "No output"}</p>
        </div>
      </div>
      <div className="action-grid">
        <button type="button" onClick={onValidate} disabled={busy}>Validate</button>
        <button type="button" onClick={onRenderHtml} disabled={busy}>Render HTML</button>
        <button type="button" onClick={onExportPdf} disabled={busy}>Export PDF</button>
      </div>
      <dl className="metadata-list">
        <div>
          <dt>HTML</dt>
          <dd>{htmlManifest?.outputs.htmlPath ?? "-"}</dd>
        </div>
        <div>
          <dt>PDF</dt>
          <dd>{pdfManifest?.outputs.pdfPath ?? "-"}</dd>
        </div>
      </dl>
      {pdfUrl ? (
        <a className="pdf-link" href={pdfUrl} target="_blank" rel="noreferrer">Open PDF</a>
      ) : null}
    </section>
  );
}
