import { getExperienceAssetPack } from "./experienceAssetPacks";
import { markExperienceAssetsResolved } from "./useExperienceAsset";

export type ExperienceAssetProgress = {
  relativePath: string;
  index: number;
  total: number;
  receivedBytes: number;
  totalBytes: number | null;
  fraction: number;
  phase: "checking" | "download" | "done" | "error";
  error?: string;
};

type ProgressCb = (progress: ExperienceAssetProgress) => void;

/**
 * Download (or verify cache for) every asset needed by an experience.
 * Emits progress via IPC from main; no-ops to resolve immediately if empty pack.
 */
export async function downloadExperiencePack(
  experienceId: string,
  onProgress?: ProgressCb
): Promise<void> {
  const paths = getExperienceAssetPack(experienceId);
  if (paths.length === 0) {
    onProgress?.({
      relativePath: "",
      index: 0,
      total: 0,
      receivedBytes: 0,
      totalBytes: null,
      fraction: 1,
      phase: "done",
    });
    return;
  }

  const api = (window as any).electronAPI;
  if (!api?.invoke) {
    // Non-Electron fallback — CDN only works if CORS allows this origin.
    markExperienceAssetsResolved(paths);
    onProgress?.({
      relativePath: "",
      index: 0,
      total: paths.length,
      receivedBytes: 0,
      totalBytes: null,
      fraction: 1,
      phase: "done",
    });
    return;
  }

  const onEvent = (_event: unknown, progress: ExperienceAssetProgress) => {
    onProgress?.(progress);
  };
  api.receive?.("experience-asset-progress", onEvent);
  try {
    await api.invoke("ensure-experience-asset-pack", paths);
    markExperienceAssetsResolved(paths);
    onProgress?.({
      relativePath: "",
      index: paths.length,
      total: paths.length,
      receivedBytes: 0,
      totalBytes: null,
      fraction: 1,
      phase: "done",
    });
  } finally {
    api.removeListener?.("experience-asset-progress", onEvent);
  }
}

export function formatBytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
