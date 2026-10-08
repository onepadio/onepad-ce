import { getBrowserWindowIds } from "../../util/browserWindows";

/** Stable scene-card id for the single "Others" browser screen */
export const OTHERS_BROWSER_CARD_ID = "others-browser";

export function isBrowserTypeWindow(win: any): boolean {
  return (
    win?.type === "browser" ||
    (typeof win?.id === "string" && win.id.startsWith("browser_"))
  );
}

/**
 * Which real browser window feeds the Others screen:
 * active browser window if any, otherwise first registered browser window in workspace.
 */
export function getRepresentativeBrowserWindowId(
  openWindows: Record<string, any>,
  browserWindows: any[],
  windowTabs: Record<string, string[]>,
  activeWindowId: string | null | undefined,
  workspaceId?: string | null
): string | null {
  const ids = getBrowserWindowIds(
    openWindows || {},
    browserWindows || [],
    windowTabs || {}
  ).filter((id) => {
    if (!workspaceId) return true;
    return openWindows[id]?.workspace === workspaceId;
  });

  if (ids.length === 0) return null;
  if (activeWindowId && ids.includes(activeWindowId)) return activeWindowId;
  return ids[0];
}

export function isOthersBrowserActive(
  activeWindowId: string | null | undefined,
  openWindows: Record<string, any>
): boolean {
  if (!activeWindowId) return false;
  if (activeWindowId.startsWith("browser_")) return true;
  return isBrowserTypeWindow(openWindows?.[activeWindowId]);
}
