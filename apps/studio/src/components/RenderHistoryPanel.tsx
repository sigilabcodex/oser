import type { StudioRenderHistoryItem } from "../types";

type RenderHistoryPanelProps = {
  renders: StudioRenderHistoryItem[];
  activeRenderId?: string;
  onLoadPreview: (render: StudioRenderHistoryItem) => void;
};

export function RenderHistoryPanel({
  renders,
  activeRenderId,
  onLoadPreview
}: RenderHistoryPanelProps) {
  return (
    <section className="panel compact-panel" aria-label="Render history">
      <div className="panel-header">
        <div>
          <h2>Render History</h2>
          <p>{renders.length > 0 ? `${renders.length} saved renders` : "No renders yet"}</p>
        </div>
      </div>
      {renders.length > 0 ? (
        <ol className="render-history-list">
          {renders.slice(0, 8).map((render) => (
            <li key={render.renderId} className={render.renderId === activeRenderId ? "active" : undefined}>
              <div className="render-history-main">
                <strong>{shortRenderId(render.renderId)}</strong>
                <span>{formatDate(render.generatedAt)}</span>
              </div>
              <p>{render.sourcePath}</p>
              <small>{render.profilePath ?? "No profile"}</small>
              <div className="render-history-actions">
                <span>{render.hasHtml ? "HTML" : "No HTML"}</span>
                <span>{render.hasPdf ? "PDF" : "No PDF"}</span>
                <button type="button" className="secondary-button" onClick={() => onLoadPreview(render)} disabled={!render.hasHtml}>
                  Load preview
                </button>
                {render.pdfUrl ? (
                  <a href={render.pdfUrl} target="_blank" rel="noreferrer">PDF</a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty-state small">Render HTML to start a local history.</div>
      )}
    </section>
  );
}

function shortRenderId(renderId: string): string {
  return renderId.slice(11);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
