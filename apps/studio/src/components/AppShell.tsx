import { useEffect, useMemo, useState } from "react";
import { exportPdf, fetchDocument, fetchProfiles, renderHtml, validateDocument } from "../api";
import type { DiagnosticsPayload, RenderManifest, StudioDocument, StudioProfile } from "../types";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { ExportPanel } from "./ExportPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ProfilePanel } from "./ProfilePanel";
import { SourcePanel } from "./SourcePanel";

type ActionState = "idle" | "loading";

export function AppShell() {
  const [document, setDocument] = useState<StudioDocument | null>(null);
  const [profiles, setProfiles] = useState<StudioProfile[]>([]);
  const [selectedProfilePath, setSelectedProfilePath] = useState<string>("");
  const [diagnostics, setDiagnostics] = useState<DiagnosticsPayload | null>(null);
  const [htmlManifest, setHtmlManifest] = useState<RenderManifest | null>(null);
  const [pdfManifest, setPdfManifest] = useState<RenderManifest | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [pdfUrl, setPdfUrl] = useState<string | undefined>();
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setActionState("loading");
      setError(null);
      try {
        const [loadedDocument, loadedProfiles] = await Promise.all([fetchDocument(), fetchProfiles()]);
        if (cancelled) {
          return;
        }
        setDocument(loadedDocument);
        setProfiles(loadedProfiles);
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

  async function runAction(action: () => Promise<void>) {
    setActionState("loading");
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : String(actionError));
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
        <SourcePanel document={document} />
        <PreviewPanel previewUrl={previewUrl} manifest={htmlManifest} />
        <aside className="side-rail">
          <ProfilePanel
            profiles={profiles}
            selectedProfilePath={selectedProfilePath}
            selectedProfile={selectedProfile}
            onSelectProfile={setSelectedProfilePath}
          />
          <ExportPanel
            busy={isBusy}
            htmlManifest={htmlManifest}
            pdfManifest={pdfManifest}
            pdfUrl={pdfUrl}
            onValidate={() => runAction(async () => {
              const { sourcePath } = requireInputs();
              const result = await validateDocument(sourcePath);
              setDiagnostics(result.diagnostics);
            })}
            onRenderHtml={() => runAction(async () => {
              const { sourcePath, profilePath } = requireInputs();
              const result = await renderHtml(sourcePath, profilePath);
              setHtmlManifest(result.manifest);
              setDiagnostics(result.manifest.diagnostics);
              setPreviewUrl(result.previewUrl ? `${result.previewUrl}?t=${Date.now()}` : undefined);
            })}
            onExportPdf={() => runAction(async () => {
              const { sourcePath, profilePath } = requireInputs();
              const result = await exportPdf(sourcePath, profilePath);
              setPdfManifest(result.manifest);
              setDiagnostics(result.manifest.diagnostics);
              setPdfUrl(result.pdfUrl ? `${result.pdfUrl}?t=${Date.now()}` : undefined);
            })}
          />
          <DiagnosticsPanel diagnostics={diagnostics} />
        </aside>
      </section>
    </main>
  );
}
