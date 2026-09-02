import { sessionActions } from "../store/session-slice";

/** Resolve a browser window registry entry that may be an id string or a window object. */
export function resolveBrowserWindowId(entry: any): string | null {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry === "object" && typeof entry.id === "string") {
    return entry.id;
  }
  return null;
}

function isBrowserWindowWithTabs(
  windowId: string,
  openWindows: Record<string, any>,
  windowTabs: Record<string, string[]>
): boolean {
  return (
    openWindows[windowId]?.type === "browser" &&
    Array.isArray(windowTabs[windowId]) &&
    windowTabs[windowId].length > 0
  );
}

/**
 * Collect all browser window ids from the registry and from open browser windows.
 * Handles legacy/corrupt registry entries (objects instead of ids).
 */
export function getBrowserWindowIds(
  openWindows: Record<string, any>,
  browserWindows: any[],
  windowTabs: Record<string, string[]>
): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  const add = (id: string | null) => {
    if (!id || seen.has(id)) return;
    if (!isBrowserWindowWithTabs(id, openWindows, windowTabs)) return;
    seen.add(id);
    ordered.push(id);
  };

  (browserWindows || []).forEach((entry) => add(resolveBrowserWindowId(entry)));

  Object.keys(openWindows || {}).forEach((windowId) => add(windowId));

  return ordered;
}

/** Keep browserWindows registry in sync when legacy windows exist but are not registered. */
export function syncBrowserWindowsIfNeeded(
  browserWindows: any[],
  openWindows: Record<string, any>,
  windowTabs: Record<string, string[]>,
  dispatch: any
): void {
  const merged = getBrowserWindowIds(openWindows, browserWindows, windowTabs);
  const current = (browserWindows || [])
    .map(resolveBrowserWindowId)
    .filter((id): id is string => id != null);

  const hasCorruptEntries = (browserWindows || []).some(
    (entry) => typeof entry !== "string"
  );
  const isOutOfSync =
    hasCorruptEntries ||
    merged.length !== current.length ||
    merged.some((id, index) => current[index] !== id);

  if (isOutOfSync) {
    dispatch(sessionActions.setBrowserWindows({ data: merged }));
  }
}
