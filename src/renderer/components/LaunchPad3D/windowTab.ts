/**
 * Resolve the live active tab for a window (not sleeping, main location, has URL).
 * Returns null when the plane should show the app icon instead of a webview.
 */
export function getWindowLiveActiveTab(
  windowId: string,
  activeTabs: Record<string, string> | null | undefined,
  openTabs: Record<string, any> | null | undefined
): any | null {
  const tabId = activeTabs?.[windowId];
  if (!tabId || !openTabs) return null;
  const tab = openTabs[tabId];
  if (!tab) return null;
  if (tab.sleeping) return null;
  if (tab.location && tab.location !== "main") return null;
  const url = tab.state?.url || tab.url;
  if (!url) return null;
  return tab;
}
