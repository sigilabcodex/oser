import type { RenderManifest } from "../types";

type PreviewPanelProps = {
  previewUrl?: string;
  manifest: RenderManifest | null;
};

export function PreviewPanel({ previewUrl, manifest }: PreviewPanelProps) {
  return (
    <section className="panel preview-panel" aria-label="HTML preview">
      <div className="panel-header">
        <div>
          <h2>Preview</h2>
          <p>{manifest?.outputs.htmlPath ?? "No render yet"}</p>
        </div>
      </div>
      {previewUrl ? (
        <iframe className="preview-frame" title="OSER HTML preview" src={previewUrl} />
      ) : (
        <div className="empty-state">Render HTML to load the preview.</div>
      )}
    </section>
  );
}
