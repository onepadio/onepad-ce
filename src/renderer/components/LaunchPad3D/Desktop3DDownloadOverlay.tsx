import { useEffect, useState } from "react";

import {
  downloadExperiencePack,
  formatBytes,
  type ExperienceAssetProgress,
} from "./experiences/downloadExperiencePack";
import { getExperience } from "./experiences/registry";

import "./Desktop3DDownloadOverlay.css";

type Desktop3DDownloadOverlayProps = {
  experienceId: string;
  onComplete: () => void;
  onCancel: () => void;
};

function fileLabel(relativePath: string): string {
  if (!relativePath) return "";
  const parts = relativePath.split("/");
  return parts[parts.length - 1] || relativePath;
}

/**
 * Blocks the UI while required 3D assets download (or verify from cache).
 */
export default function Desktop3DDownloadOverlay({
  experienceId,
  onComplete,
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

  useEffect(() => {
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
        if (!cancelled) onComplete();
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || String(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [experienceId, onComplete]);

  const pct = Math.round(Math.min(1, Math.max(0, progress.fraction)) * 100);
  const fileProgress =
    progress.phase === "download" && progress.totalBytes
      ? `${formatBytes(progress.receivedBytes)} / ${formatBytes(
          progress.totalBytes
        )}`
      : null;

  return (
    <div className="desktop-3d-download-overlay" role="alertdialog" aria-modal>
      <div className="desktop-3d-download-card">
        <h2 className="desktop-3d-download-title">
          {error ? "Download failed" : "Preparing 3D world"}
        </h2>
        <p className="desktop-3d-download-subtitle">
          {error
            ? "Check your connection and that experience assets are public on the CDN."
            : `Downloading assets for ${experience.label}. 3D opens when this finishes.`}
        </p>

        {!error && (
          <>
            <div className="desktop-3d-download-bar" aria-hidden>
              <div
                className="desktop-3d-download-bar-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="desktop-3d-download-meta">
              <span>
                {progress.total > 0
                  ? `File ${Math.min(progress.index + 1, progress.total)} of ${
                      progress.total
                    }`
                  : "Starting…"}
              </span>
              <span>{fileProgress || `${pct}%`}</span>
            </div>
            {progress.relativePath ? (
              <div className="desktop-3d-download-file" title={progress.relativePath}>
                {fileLabel(progress.relativePath)}
              </div>
            ) : null}
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
                  setProgress((p) => ({ ...p, phase: "checking", fraction: 0 }));
                  // Remount effect by toggling error clear + key on parent preferred;
                  // re-invoke download here:
                  downloadExperiencePack(experienceId, setProgress)
                    .then(() => onComplete())
                    .catch((err) => setError(err?.message || String(err)));
                }}
              >
                Retry
              </button>
            </div>
          </>
        ) : (
          <div className="desktop-3d-download-actions">
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
