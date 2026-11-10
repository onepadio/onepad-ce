import defaultIcon from "../images/default_icon.png";
import globeIcon from "../images/globe_icon_96.png";
import { isSharedAppWindow } from "./sharedApps";

export type AppSwitcherEntry = {
  id: string;
  title: string;
  icon: string;
  window: any;
};

function resolveIcon(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0) {
    return defaultIcon;
  }

  try {
    const cached = localStorage.getItem(raw);
    let icon = cached == null ? raw : cached;
    if (!(icon.startsWith("http") || icon.startsWith("data:") || icon.startsWith(".") || icon.startsWith("/"))) {
      icon = "./images/store/icon/" + icon;
    }
    return icon || defaultIcon;
  } catch {
    return defaultIcon;
  }
}

export function getWindowSwitcherTitle(
  window: any,
  openTabs: Record<string, any> | null | undefined,
  windowTabs: Record<string, any> | null | undefined,
  activeTabs: Record<string, any> | null | undefined
): string {
  if (!window) return "App";

  if (window.type === "browser" || String(window.id || "").startsWith("browser_")) {
    const activeTabId = activeTabs?.[window.id];
    const activeTab = activeTabId ? openTabs?.[activeTabId] : null;
    if (activeTab?.state?.title) return activeTab.state.title;
    const firstTabId = windowTabs?.[window.id]?.[0];
    const firstTab = firstTabId ? openTabs?.[firstTabId] : null;
    if (firstTab?.state?.title) return firstTab.state.title;
    return window.data?.title || "Space Tabs";
  }

  if (window.type === "app" || window.type === "xapp") {
    return window.data?.name || "App";
  }

  return window.data?.title || window.data?.name || "App";
}

export function getWindowSwitcherIcon(
  window: any,
  openTabs: Record<string, any> | null | undefined,
  windowTabs: Record<string, any> | null | undefined,
  activeTabs: Record<string, any> | null | undefined
): string {
  if (!window) return defaultIcon;

  if (window.type === "browser" || String(window.id || "").startsWith("browser_")) {
    const activeTabId = activeTabs?.[window.id];
    const activeTab = activeTabId ? openTabs?.[activeTabId] : null;
    if (activeTab?.state?.icon) return resolveIcon(activeTab.state.icon);
    const firstTabId = windowTabs?.[window.id]?.[0];
    const firstTab = firstTabId ? openTabs?.[firstTabId] : null;
    if (firstTab?.state?.icon) return resolveIcon(firstTab.state.icon);
    return resolveIcon(window.data?.icon) || globeIcon;
  }

  return resolveIcon(window.data?.icon);
}

/**
 * Awake open windows that still have at least one non-sleeping tab.
 * Sorted MRU: active first, then windowHistory (recent → older).
 */
export function getAppSwitcherEntries(options: {
  openWindows: Record<string, any> | null | undefined;
  openTabs: Record<string, any> | null | undefined;
  windowTabs: Record<string, any> | null | undefined;
  activeTabs: Record<string, any> | null | undefined;
  activeWindowId: string | null | undefined;
  windowHistory: string[] | null | undefined;
  workspaceId: string | null | undefined;
  homeWorkspaceId: string | null | undefined;
}): AppSwitcherEntry[] {
  const {
    openWindows,
    openTabs,
    windowTabs,
    activeTabs,
    activeWindowId,
    windowHistory,
    workspaceId,
    homeWorkspaceId,
  } = options;

  if (!openWindows) return [];

  const candidates = Object.values(openWindows).filter((window: any) => {
    if (!window?.id || window.id === "launchpad") return false;
    if (window.sleeping === true) {
      console.log("[app-switcher] skip sleeping window", window.id);
      return false;
    }

    const tabIds = windowTabs?.[window.id];
    if (!Array.isArray(tabIds) || tabIds.length === 0) {
      console.log("[app-switcher] skip window without tabs", window.id, window.type);
      return false;
    }

    const hasAwakeTab = tabIds.some((tabId: string) => {
      const tab = openTabs?.[tabId];
      return tab != null && tab.sleeping !== true;
    });
    if (!hasAwakeTab) {
      console.log("[app-switcher] skip window with only sleeping tabs", window.id);
      return false;
    }

    if (window.type === "browser" || String(window.id).startsWith("browser_")) {
      const ok = !workspaceId || window.workspace === workspaceId;
      if (!ok) {
        console.log("[app-switcher] skip browser other workspace", window.id);
      }
      return ok;
    }
    if (isSharedAppWindow(window, homeWorkspaceId)) return true;
    const ok = !workspaceId || window.workspace === workspaceId;
    if (!ok) {
      console.log("[app-switcher] skip other workspace", window.id, window.workspace);
    }
    return ok;
  });

  candidates.sort((a: any, b: any) => {
    if (a.id === activeWindowId) return -1;
    if (b.id === activeWindowId) return 1;

    const history = windowHistory || [];
    const indexA = history.lastIndexOf(a.id);
    const indexB = history.lastIndexOf(b.id);

    if (indexA !== -1 && indexB !== -1) return indexB - indexA;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });

  return candidates.map((window: any) => ({
    id: window.id,
    title: getWindowSwitcherTitle(window, openTabs, windowTabs, activeTabs),
    icon: getWindowSwitcherIcon(window, openTabs, windowTabs, activeTabs),
    window,
  }));
}
