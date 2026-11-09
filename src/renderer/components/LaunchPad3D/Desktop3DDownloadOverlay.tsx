import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  downloadExperiencePack,
  formatBytes,
  type ExperienceAssetProgress,
} from "./experiences/downloadExperiencePack";
import { getExperience } from "./experiences/registry";

import "./Desktop3DDownloadOverlay.css";

export type Desktop3DGatePhase = "download" | "loading";

type Desktop3DDownloadOverlayProps = {
  experienceId: string;
  /** download = CDN pack; loading = scene/GLTF into GPU */
  phase?: Desktop3DGatePhase;
  onDownloadComplete: () => void;
  onCancel: () => void;
};

function fileLabel(relativePath: string): string {
  if (!relativePath) return "";
  const parts = relativePath.split("/");
  return parts[parts.length - 1] || relativePath;
}

/**
 * Blocks the UI while required 3D assets download, then while the scene loads.
 */
export default function Desktop3DDownloadOverlay({
  experienceId,
  phase = "download",
  onDownloadComplete,
  onCancel,
}: Desktop3DDownloadOverlayProps) {
  const experience = getExperience(experienceId);
  const [progress, setProgress] = useState<ExperienceAssetProgress>({
    relativePath: "",
    index: 0,
    total: 0,
    receivedBytes: 0,
    totalBytes: null,
    fraction: 0,
    phase: "checking",
  });
  const [error, setError] = useState<string | null>(null);
  const [loadPulse, setLoadPulse] = useState(0);

  useEffect(() => {
    if (phase !== "download") return;
    let cancelled = false;
    setError(null);
    setProgress({
      relativePath: "",
      index: 0,
      total: 0,
      receivedBytes: 0,
      totalBytes: null,
      fraction: 0,
      phase: "checking",
    });

    downloadExperiencePack(experienceId, (p) => {
      if (!cancelled) setProgress(p);
    })
      .then(() => {
        if (!cancelled) onDownloadComplete();
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || String(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [experienceId, phase, onDownloadComplete]);

  // Indeterminate pulse while the Canvas loads GLTFs / HDRI
  useEffect(() => {
    if (phase !== "loading") return;
    const id = window.setInterval(() => {
      setLoadPulse((n) => (n + 1) % 100);
    }, 40);
    return () => window.clearInterval(id);
  }, [phase]);

  const pct = Math.round(Math.min(1, Math.max(0, progress.fraction)) * 100);
  const fileProgress =
    progress.phase === "download" && progress.totalBytes
      ? `${formatBytes(progress.receivedBytes)} / ${formatBytes(
          progress.totalBytes
        )}`
      : null;

  const barWidth =
    phase === "loading" ? `${20 + (loadPulse % 60)}%` : `${pct}%`;

  // Portal to body — parent `.desktop-3d-fullscreen` uses isolation:isolate
  // (z-index 100), so a high local z-index still loses to the launchpad overlay
  // (z-index 1500) which is a sibling outside that stacking context.
  return createPortal(
    <div className="desktop-3d-download-overlay" role="alertdialog" aria-modal>
      <div className="desktop-3d-download-card">
        <h2 className="desktop-3d-download-title">
          {error
            ? "Download failed"
            : phase === "loading"
              ? "Loading world"
              : "Downloading world"}
        </h2>
        <p className="desktop-3d-download-subtitle">
          {error
            ? "Check your connection and that experience assets are public on the CDN."
            : phase === "loading"
              ? `Opening ${experience.label}. This may take a moment for large scenes.`
              : `Downloading assets for ${experience.label}.`}
        </p>

        {!error && (
          <>
            <div className="desktop-3d-download-bar" aria-hidden>
              <div
                className={`desktop-3d-download-bar-fill${
                  phase === "loading" ? " is-indeterminate" : ""
                }`}
                style={{ width: barWidth }}
              />
            </div>
            {phase === "download" ? (
              <>
                <div className="desktop-3d-download-meta">
                  <span>
                    {progress.total > 0
                      ? `File ${Math.min(
                          progress.index + 1,
                          progress.total
                        )} of ${progress.total}`
                      : "Starting…"}
                  </span>
                  <span>{fileProgress || `${pct}%`}</span>
                </div>
                {progress.relativePath ? (
                  <div
                    className="desktop-3d-download-file"
                    title={progress.relativePath}
                  >
                    {fileLabel(progress.relativePath)}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="desktop-3d-download-meta">
                <span>Building scene…</span>
              </div>
            )}
          </>
        )}

        {error ? (
          <>
            <p className="desktop-3d-download-error">{error}</p>
            <div className="desktop-3d-download-actions">
              <button type="button" onClick={onCancel}>
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setError(null);
                  setProgress((p) => ({
                    ...p,
                    phase: "checking",
                    fraction: 0,
                  }));
                  downloadExperiencePack(experienceId, setProgress)
                    .then(() => onDownloadComplete())
                    .catch((err) => setError(err?.message || String(err)));
                }}
              >
                Retry
              </button>
            </div>
          </>
        ) : phase === "download" ? (
          <div className="desktop-3d-download-actions">
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
