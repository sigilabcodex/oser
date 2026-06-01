import type { StudioDocument, StudioDocumentSummary } from "../types";

type SourcePanelProps = {
  document: StudioDocument | null;
  documents: StudioDocumentSummary[];
  selectedSourcePath: string;
  busy: boolean;
  onSelectDocument: (sourcePath: string) => void;
};

export function SourcePanel({
  document,
  documents,
  selectedSourcePath,
  busy,
  onSelectDocument
}: SourcePanelProps) {
  return (
    <section className="panel source-panel" aria-label="Source document">
      <div className="panel-header">
        <div>
          <h2>Source</h2>
          <p>{document ? `Active document: ${document.sourcePath}` : "Loading"}</p>
        </div>
        <select
          className="document-select"
          value={selectedSourcePath}
          disabled={busy || documents.length === 0}
          aria-label="Select source document"
          onChange={(event) => onSelectDocument(event.target.value)}
        >
          {documents.map((item) => (
            <option key={item.path} value={item.path}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <pre className="source-code">{document?.content ?? ""}</pre>
    </section>
  );
}
