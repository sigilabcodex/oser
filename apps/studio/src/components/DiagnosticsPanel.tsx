import type { DiagnosticsPayload } from "../types";

type DiagnosticsPanelProps = {
  diagnostics: DiagnosticsPayload | null;
};

export function DiagnosticsPanel({ diagnostics }: DiagnosticsPanelProps) {
  const summary = diagnostics?.summary;

  return (
    <section className="panel compact-panel" aria-label="Diagnostics">
      <div className="panel-header">
        <div>
          <h2>Diagnostics</h2>
          <p>{summary ? `${summary.errors} errors, ${summary.warnings} warnings` : "Not run"}</p>
        </div>
      </div>
      <div className="diagnostic-summary">
        <span><strong>{summary?.errors ?? 0}</strong> errors</span>
        <span><strong>{summary?.warnings ?? 0}</strong> warnings</span>
        <span><strong>{summary?.info ?? 0}</strong> info</span>
      </div>
      {diagnostics && diagnostics.items.length > 0 ? (
        <ul className="diagnostic-list">
          {diagnostics.items.map((item) => (
            <li key={`${item.code}-${item.path ?? item.message}`} className={`diagnostic-item ${item.severity}`}>
              <span>{item.code}</span>
              <p>{item.message}</p>
              {item.path ? <small>{item.path}</small> : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state small">No diagnostics to show.</div>
      )}
    </section>
  );
}
