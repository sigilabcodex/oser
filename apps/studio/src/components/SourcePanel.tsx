import type { StudioDocument } from "../types";

type SourcePanelProps = {
  document: StudioDocument | null;
};

export function SourcePanel({ document }: SourcePanelProps) {
  return (
    <section className="panel source-panel" aria-label="Source document">
      <div className="panel-header">
        <div>
          <h2>Source</h2>
          <p>{document ? document.format : "Loading"}</p>
        </div>
      </div>
      <pre className="source-code">{document?.content ?? ""}</pre>
    </section>
  );
}
