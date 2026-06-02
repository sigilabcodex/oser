import { useEffect, useMemo, useState } from "react";
import { exportPdf, fetchDocument, fetchDocuments, fetchProfiles, fetchRenderHistory, renderHtml, validateDocument } from "../api";
import type {
  DiagnosticsPayload,
  RenderManifest,
  StudioDocument,
  StudioDocumentSummary,
  StudioProfile,
  StudioRenderHistoryItem
} from "../types";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { ExportPanel } from "./ExportPanel";
import { ManifestSummaryPanel } from "./ManifestSummaryPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ProfilePanel } from "./ProfilePanel";
import { RenderHistoryPanel } from "./RenderHistoryPanel";
import { SourcePanel } from "./SourcePanel";

type ActionState = "idle" | "loading";
type PreviewStatus = "not-rendered" | "rendered" | "stale" | "error";
type ExportStatus = "not-exported" | "exported" | "stale" | "error";

export function AppShell() {
  const [document, setDocument] = useState<StudioDocument | null>(null);
  const [documents, setDocuments] = useState<StudioDocumentSummary[]>([]);
  const [selectedSourcePath, setSelectedSourcePath] = useState<string>("");
  const [profiles, setProfiles] = useState<StudioProfile[]>([]);
  const [selectedProfilePath, setSelectedProfilePath] = useState<string>("");
  const [diagnostics, setDiagnostics] = useState<DiagnosticsPayload | null>(null);
  const [htmlManifest, setHtmlManifest] = useState<RenderManifest | null>(null);
  const [pdfManifest, setPdfManifest] = useState<RenderManifest | null>(null);
  const [currentRenderId, setCurrentRenderId] = useState<string | undefined>();
  const [renderHistory, setRenderHistory] = useState<StudioRenderHistoryItem[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [pdfUrl, setPdfUrl] = useState<string | undefined>();
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>("not-rendered");
  const [exportStatus, setExportStatus] = useState<ExportStatus>("not-exported");
  const [validateError, setValidateError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setActionState("loading");
      setError(null);
      try {
        const [loadedDocuments, loadedProfiles, loadedRenders] = await Promise.all([
          fetchDocuments(),
          fetchProfiles(),
          fetchRenderHistory()
        ]);
        const initialSourcePath = loadedDocuments[0]?.path;
        const loadedDocument = await fetchDocument(initialSourcePath);
        if (cancelled) {
          return;
        }
        setDocuments(loadedDocuments);
        setDocument(loadedDocument);
        setSelectedSourcePath(loadedDocument.sourcePath);
        setProfiles(loadedProfiles);
        setRenderHistory(loadedRenders);
        setSelectedProfilePath(loadedProfiles[0]?.path ?? "");
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
        }
      } finally {
        if (!cancelled) {
          setActionState("idle");
        }
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.path === selectedProfilePath),
    [profiles, selectedProfilePath]
  );

  function clearActionState() {
    setDiagnostics(null);
    setValidateError(null);
    setRenderError(null);
    setExportError(null);
  }

  function markOutputsStale() {
    clearActionState();
    setCurrentRenderId(undefined);
    setPreviewStatus(htmlManifest ? "stale" : "not-rendered");
    setExportStatus(pdfManifest ? "stale" : "not-exported");
  }

  function markOutputsStaleForProfileChange(profilePath: string) {
    setSelectedProfilePath(profilePath);
    markOutputsStale();
  }

  function refreshPreview() {
    if (!previewUrl) {
      return;
    }

    setPreviewUrl(withCacheBust(previewUrl));
  }

  async function refreshRenderHistory() {
    setRenderHistory(await fetchRenderHistory());
  }

  function loadHistoricalPreview(render: StudioRenderHistoryItem) {
    if (!render.previewUrl) {
      return;
    }

    clearActionState();
    setCurrentRenderId(render.renderId);
    setHtmlManifest(render.htmlManifest ?? null);
    setPdfManifest(render.pdfManifest ?? null);
    setPreviewUrl(withCacheBust(render.previewUrl));
    setPdfUrl(render.pdfUrl ? withCacheBust(render.pdfUrl) : undefined);
    setPreviewStatus(render.hasHtml ? "rendered" : "not-rendered");
    setExportStatus(render.hasPdf ? "exported" : "not-exported");
    setDiagnostics(render.pdfManifest?.diagnostics ?? render.htmlManifest?.diagnostics ?? null);
  }

  async function selectDocument(sourcePath: string) {
    setSelectedSourcePath(sourcePath);
    markOutputsStale();
    await runAction(async () => {
      const loadedDocument = await fetchDocument(sourcePath);
      setDocument(loadedDocument);
      setSelectedSourcePath(loadedDocument.sourcePath);
    });
  }

  async function runAction(action: () => Promise<void>, onError?: (message: string) => void) {
    setActionState("loading");
    setError(null);
    try {
      await action();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : String(actionError);
      setError(message);
      onError?.(message);
    } finally {
      setActionState("idle");
    }
  }

  function requireInputs(): { sourcePath: string; profilePath: string } {
    if (!document) {
      throw new Error("Document is not loaded.");
    }
    if (!selectedProfilePath) {
      throw new Error("No profile is selected.");
    }
    return { sourcePath: document.sourcePath, profilePath: selectedProfilePath };
  }

  const isBusy = actionState === "loading";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">OSER Studio MVP</p>
          <h1>{document?.sourcePath ?? "Loading source"}</h1>
        </div>
        <div className="status-strip" aria-live="polite">
          <span className={isBusy ? "status-dot active" : "status-dot"} />
          {isBusy ? "Working" : "Ready"}
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="workspace">
        <SourcePanel
          document={document}
          documents={documents}
          selectedSourcePath={selectedSourcePath}
          busy={isBusy}
          onSelectDocument={selectDocument}
        />
        <PreviewPanel
          previewUrl={previewUrl}
          manifest={htmlManifest}
          status={previewStatus}
          error={renderError}
          onRefreshPreview={refreshPreview}
        />
        <aside className="side-rail">
          <ProfilePanel
            profiles={profiles}
            selectedProfilePath={selectedProfilePath}
            selectedProfile={selectedProfile}
            onSelectProfile={markOutputsStaleForProfileChange}
          />
          <ExportPanel
            busy={isBusy}
            htmlManifest={htmlManifest}
            pdfManifest={pdfManifest}
            pdfUrl={pdfUrl}
            exportStatus={exportStatus}
            validateError={validateError}
            renderError={renderError}
            exportError={exportError}
            onValidate={() => runAction(async () => {
              setValidateError(null);
              const { sourcePath } = requireInputs();
              const result = await validateDocument(sourcePath);
              setDiagnostics(result.diagnostics);
            }, setValidateError)}
            onRenderHtml={() => runAction(async () => {
              setRenderError(null);
              const { sourcePath, profilePath } = requireInputs();
              const result = await renderHtml(sourcePath, profilePath);
              setCurrentRenderId(result.renderId);
              setHtmlManifest(result.manifest);
              setPdfManifest(null);
              setPdfUrl(undefined);
              setDiagnostics(result.manifest.diagnostics);
              setPreviewUrl(result.previewUrl ? withCacheBust(result.previewUrl) : undefined);
              setPreviewStatus("rendered");
              setExportStatus("not-exported");
              await refreshRenderHistory();
            }, (message) => {
              setRenderError(message);
              setPreviewStatus("error");
            })}
            onExportPdf={() => runAction(async () => {
              setExportError(null);
              const { sourcePath, profilePath } = requireInputs();
              const renderIdForExport = currentRenderId;
              const result = await exportPdf(sourcePath, profilePath, renderIdForExport);
              setCurrentRenderId(result.renderId);
              if (!renderIdForExport && previewStatus === "stale") {
                setHtmlManifest(null);
                setPreviewUrl(undefined);
                setPreviewStatus("not-rendered");
              }
              setPdfManifest(result.manifest);
              setDiagnostics(result.manifest.diagnostics);
              setPdfUrl(result.pdfUrl ? withCacheBust(result.pdfUrl) : undefined);
              setExportStatus("exported");
              await refreshRenderHistory();
            }, (message) => {
              setExportError(message);
              setExportStatus("error");
            })}
          />
          <ManifestSummaryPanel
            htmlManifest={htmlManifest}
            pdfManifest={pdfManifest}
            htmlStatus={previewStatus}
            pdfStatus={exportStatus}
          />
          <RenderHistoryPanel
            renders={renderHistory}
            activeRenderId={currentRenderId}
            onLoadPreview={loadHistoricalPreview}
          />
          <DiagnosticsPanel diagnostics={diagnostics} />
        </aside>
      </section>
    </main>
  );
}

function withCacheBust(url: string): string {
  const [baseUrl] = url.split("?");
  return `${baseUrl}?t=${Date.now()}`;
}
