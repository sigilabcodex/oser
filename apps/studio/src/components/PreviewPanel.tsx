import type { RenderManifest } from "../types";

type PreviewStatus = "not-rendered" | "rendered" | "stale" | "error";

type PreviewPanelProps = {
  previewUrl?: string;
  manifest: RenderManifest | null;
  status: PreviewStatus;
  error?: string | null;
  onRefreshPreview: () => void;
};

export function PreviewPanel({
  previewUrl,
  manifest,
  status,
  error,
  onRefreshPreview
}: PreviewPanelProps) {
  return (
    <section className="panel preview-panel" aria-label="HTML preview">
      <div className="panel-header">
        <div>
          <h2>Preview</h2>
          <p>{manifest?.outputs.htmlPath ?? "No render yet"}</p>
        </div>
        <span className={`state-pill ${status}`}>{statusLabel(status)}</span>
      </div>
      <div className="preview-toolbar">
        <span>{previewUrl ?? "No preview URL"}</span>
        <div>
          <button type="button" className="secondary-button" onClick={onRefreshPreview} disabled={!previewUrl}>
            Refresh preview
          </button>
          <a
            className={previewUrl ? "button-link" : "button-link disabled"}
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!previewUrl}
          >
            Open preview in new tab
          </a>
        </div>
      </div>
      {error ? <div className="inline-error">Render HTML failed: {error}</div> : null}
      {previewUrl ? (
        <iframe className="preview-frame" title="OSER HTML preview" src={previewUrl} />
      ) : (
        <div className="empty-state">Render HTML to load the preview.</div>
      )}
    </section>
  );
}

function statusLabel(status: PreviewStatus): string {
  switch (status) {
    case "not-rendered":
      return "Not rendered";
    case "rendered":
      return "Rendered";
    case "stale":
      return "Stale";
    case "error":
      return "Error";
  }
}
