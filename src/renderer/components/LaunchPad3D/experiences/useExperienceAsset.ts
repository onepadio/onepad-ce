import { EXPERIENCE_CDN_BASE } from "./assetUrls";

type EnsureFn = (relativePath: string) => Promise<string>;

const resolved = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

/** Local protocol URL — main process serves from userData cache (avoids CDN CORS). */
export function localLoaderUrl(relativePath: string): string {
  const safe = relativePath.replace(/^\/+/, "");
  return `onepad-asset://local/${safe}`;
}

function getEnsureFn(): EnsureFn | null {
  const api = (window as any).electronAPI;
  if (api?.invoke) {
    return (relativePath: string) =>
      api.invoke("ensure-experience-asset", relativePath) as Promise<string>;
  }
  return null;
}

/**
 * Resolve a relative experience path to a loadable URL.
 * Electron: download/cache via main → `onepad-asset://local/…`
 * Non-Electron fallback: CDN HTTPS (needs CORS).
 */
export function ensureExperienceAssetUrl(
  relativePath: string
): Promise<string> {
  if (
    relativePath.startsWith("onepad-asset://") ||
    /^https?:\/\//.test(relativePath)
  ) {
    return Promise.resolve(relativePath);
  }

  const cached = resolved.get(relativePath);
  if (cached) return Promise.resolve(cached);

  let pending = inflight.get(relativePath);
  if (!pending) {
    const ensure = getEnsureFn();
    pending = (ensure
      ? ensure(relativePath)
      : Promise.resolve(`${EXPERIENCE_CDN_BASE}/${relativePath}`)
    )
      .then((url) => {
        const loadUrl =
          typeof url === "string" && url.length > 0
            ? url
            : localLoaderUrl(relativePath);
        resolved.set(relativePath, loadUrl);
        inflight.delete(relativePath);
        return loadUrl;
      })
      .catch((err) => {
        inflight.delete(relativePath);
        throw err;
      });
    inflight.set(relativePath, pending);
  }
  return pending;
}

/**
 * Suspense-friendly hook: suspends until the asset URL is ready.
 * Must be under a <Suspense>.
 */
export function useExperienceAssetUrl(relativePath: string): string {
  const hit = resolved.get(relativePath);
  if (hit) return hit;

  throw ensureExperienceAssetUrl(relativePath);
}

export function useExperienceAssetUrls(
  relativePaths: readonly string[]
): string[] {
  const missing: Promise<string>[] = [];
  const urls: string[] = [];

  for (const rel of relativePaths) {
    const hit = resolved.get(rel);
    if (hit) {
      urls.push(hit);
    } else {
      missing.push(ensureExperienceAssetUrl(rel));
      urls.push("");
    }
  }

  if (missing.length > 0) {
    throw Promise.all(missing);
  }
  return urls;
}

/** Mark paths as resolved to local protocol URLs (after a pack download). */
export function markExperienceAssetsResolved(relativePaths: string[]): void {
  for (const rel of relativePaths) {
    resolved.set(rel, localLoaderUrl(rel));
  }
}

export function preloadExperienceAsset(relativePath: string): Promise<string> {
  return ensureExperienceAssetUrl(relativePath);
}
