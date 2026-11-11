import type { ComponentType } from "react";

import defaultIcon from "../images/default_icon.png";
import globeIcon from "../images/globe_icon_96.png";
import {
  getOpenBuiltinApps,
  getOpenOnlineTools,
  getOnlineToolWindowId,
  isBuiltinWindow,
  isOnlineToolWindow,
  type BuiltinAppId,
} from "../builtin";
import { isSharedAppWindow } from "./sharedApps";

export type AppSwitcherEntryKind =
  | "window"
  | "builtin"
  | "online-tool";

export type AppSwitcherEntry = {
  id: string;
  title: string;
  kind: AppSwitcherEntryKind;
  icon?: string | null;
  DockIcon?: ComponentType<{ color?: string; size?: number | string }>;
  window?: any;
  builtinAppId?: BuiltinAppId;
  onlineToolId?: string;
};

function resolveIcon(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0) {
    return defaultIcon;
  }

  try {
    const cached = localStorage.getItem(raw);
    let icon = cached == null ? raw : cached;
    if (
      !(
        icon.startsWith("http") ||
        icon.startsWith("data:") ||
        icon.startsWith(".") ||
        icon.startsWith("/")
      )
    ) {
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

  if (
    window.type === "browser" ||
    String(window.id || "").startsWith("browser_")
  ) {
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

  return window.data?.title || window.data?.name || window.name || "App";
}

export function getWindowSwitcherIcon(
  window: any,
  openTabs: Record<string, any> | null | undefined,
  windowTabs: Record<string, any> | null | undefined,
  activeTabs: Record<string, any> | null | undefined
): string {
  if (!window) return defaultIcon;

  if (
    window.type === "browser" ||
    String(window.id || "").startsWith("browser_")
  ) {
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

function sortEntriesByMru(
  entries: AppSwitcherEntry[],
  activeId: string | null | undefined,
  windowHistory: string[] | null | undefined
): AppSwitcherEntry[] {
  return [...entries].sort((a, b) => {
    if (a.id === activeId) return -1;
    if (b.id === activeId) return 1;

    const history = windowHistory || [];
    const indexA = history.lastIndexOf(a.id);
    const indexB = history.lastIndexOf(b.id);

    if (indexA !== -1 && indexB !== -1) return indexB - indexA;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });
}

/**
 * Awake open windows with tabs, plus open Tools (builtins + online tools).
 * Sorted MRU: current active first, then windowHistory.
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
  openModalIds?: string[] | null;
  activeModalId?: string | null;
  platform?: string | null;
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
    openModalIds = [],
    activeModalId = null,
    platform = null,
  } = options;

  const entries: AppSwitcherEntry[] = [];

  if (openWindows) {
    Object.values(openWindows).forEach((window: any) => {
      if (!window?.id || window.id === "launchpad") return;
      // Tools are added separately (icons / no-tab builtins)
      if (isOnlineToolWindow(window) || isBuiltinWindow(window)) return;
      if (window.sleeping === true) return;

      const tabIds = windowTabs?.[window.id];
      if (!Array.isArray(tabIds) || tabIds.length === 0) return;

      const hasAwakeTab = tabIds.some((tabId: string) => {
        const tab = openTabs?.[tabId];
        return tab != null && tab.sleeping !== true;
      });
      if (!hasAwakeTab) return;

      if (
        window.type === "browser" ||
        String(window.id).startsWith("browser_")
      ) {
        if (workspaceId && window.workspace !== workspaceId) return;
      } else if (!isSharedAppWindow(window, homeWorkspaceId)) {
        if (workspaceId && window.workspace !== workspaceId) return;
      }

      entries.push({
        id: window.id,
        kind: "window",
        title: getWindowSwitcherTitle(
          window,
          openTabs,
          windowTabs,
          activeTabs
        ),
        icon: getWindowSwitcherIcon(
          window,
          openTabs,
          windowTabs,
          activeTabs
        ),
        window,
      });
    });
  }

  // Open online tools (space-scoped) — match dock: open counts even if sleeping
  // after a space switch (persisted snapshots mark windows sleeping).
  const openOnlineTools = getOpenOnlineTools(openWindows, workspaceId);
  openOnlineTools.forEach((tool) => {
    if (!workspaceId) return;
    const windowId = getOnlineToolWindowId(tool.id, workspaceId);
    const window = openWindows?.[windowId];
    if (!window) return;

    entries.push({
      id: windowId,
      kind: "online-tool",
      title: tool.label,
      DockIcon: tool.DockIcon,
      window,
      onlineToolId: tool.id,
    });
  });

  // Open builtin tools (modal overlays + fullscreen native windows)
  const openBuiltins = getOpenBuiltinApps(
    openWindows,
    workspaceId,
    openModalIds as any,
    platform
  );
  openBuiltins.forEach((app) => {
    if (!workspaceId) return;
    const windowId = app.getWindowId(workspaceId);
    const window =
      app.windowMode === "fullscreen" ? openWindows?.[windowId] : null;

    // Fullscreen builtins must exist in openWindows; sleeping is ok (same as dock)
    if (app.windowMode === "fullscreen" && !window) {
      return;
    }

    entries.push({
      id: app.windowMode === "modal" ? `builtin-modal:${app.id}` : windowId,
      kind: "builtin",
      title: app.label,
      DockIcon: app.DockIcon,
      window: window || undefined,
      builtinAppId: app.id,
    });
  });

  const activeId =
    activeModalId != null
      ? `builtin-modal:${activeModalId}`
      : activeWindowId;

  return sortEntriesByMru(entries, activeId, windowHistory);
}
