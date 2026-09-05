import isElectron from "is-electron";
import log from "loglevel";

import { sessionActions } from "../store/session-slice";
import { getBrowserWindowIds } from "./browserWindows";

export type TabGroup = {
  windowId: string;
  parentTabId: string | null;
  childTabIds: string[];
};

export function getSortedTabIdsForWindow(
  windowId: string,
  windowTabs: any,
  openTabs: any
): string[] {
  const tabIds = windowTabs[windowId];
  if (!tabIds || !Array.isArray(tabIds)) return [];

  return [...tabIds]
    .filter((tabId) => openTabs[tabId])
    .sort((a, b) => {
      const createdA = openTabs[a]?.created || openTabs[a]?.lastAccessed || 0;
      const createdB = openTabs[b]?.created || openTabs[b]?.lastAccessed || 0;
      if (createdA !== createdB) return createdA - createdB;
      return tabIds.indexOf(a) - tabIds.indexOf(b);
    });
}

export function buildGroups(
  openWindows: any,
  browserWindows: any[],
  windowTabs: any,
  openTabs: any,
  workspaceId?: string
): TabGroup[] {
  const windowIds = getBrowserWindowIds(openWindows, browserWindows, windowTabs);

  return windowIds
    .filter((windowId) => {
      if (!workspaceId) return true;
      return openWindows[windowId]?.workspace === workspaceId;
    })
    .map((windowId) => {
      const sorted = getSortedTabIdsForWindow(windowId, windowTabs, openTabs);
      return {
        windowId,
        parentTabId: sorted[0] || null,
        childTabIds: sorted.slice(1),
      };
    })
    .filter((group) => group.parentTabId != null)
    .sort((a, b) => {
      const tabA = openTabs[a.parentTabId!];
      const tabB = openTabs[b.parentTabId!];
      const timeA = tabA?.created || tabA?.lastAccessed || 0;
      const timeB = tabB?.created || tabB?.lastAccessed || 0;
      return timeA - timeB;
    });
}

export function truncateTabTitle(tab: any, maxLen = 24): string {
  const title = tab?.state?.title || "";
  const url = tab?.state?.url || "";
  if (!title) {
    return url.length > maxLen ? url.substring(0, maxLen).concat("...") : url;
  }
  return title.length > maxLen ? title.substring(0, maxLen).concat("...") : title;
}

export function getTabScreenshot(tabId: string): string | null {
  try {
    if (isElectron()) {
      // @ts-expect-error
      const storeSS = window.electronAPI?.screenshot?.get("screenshot-" + tabId);
      if (storeSS) return storeSS;
    }
    return localStorage.getItem("screenshot-" + tabId);
  } catch (error) {
    log.error("Error retrieving tab screenshot:", error);
    return null;
  }
}

/**
 * Switch to a browser tab, updating activeTabs / active window as needed.
 * Shared by BrowserVerticalTabBar and BrowserTabSwitcher.
 */
export function switchBrowserTab(
  tab: any,
  dispatch: any,
  openWindows: any,
  activeTabs: any,
  activeWindowId?: string | null
) {
  log.debug("switchBrowserTab", tab);

  // Update this window's remembered active tab before switching windows.
  // App.tsx restores activeTabs[windowId] whenever activeWindow changes;
  // without this, clicking a child in another group shows that group's last tab.
  const _activeTabs = Object.assign({}, activeTabs);
  _activeTabs[tab.window] = tab.id;
  dispatch(sessionActions.setActiveTabs({ data: _activeTabs }));

  const win = openWindows[tab.window];
  if (win && activeWindowId !== tab.window) {
    dispatch(sessionActions.setActiveWindow({ data: win }));
    dispatch(sessionActions.setActiveBrowserWindowId({ data: tab.window }));
  }

  if (tab.location === "external") {
    if (isElectron()) {
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "switch-to-external-tab",
        tabWindowId: tab.window,
        tabId: tab.id,
        type: tab.type,
      });
    }
  } else {
    dispatch(sessionActions.setActiveTab({ data: tab }));
  }
}

/**
 * Switch to an app/link tab within (or into) a non-browser window.
 * Shared by VerticalTabBar and AppTabSwitcher.
 */
export function switchAppTab(
  tab: any,
  dispatch: any,
  openWindows: any,
  activeTabs: any,
  activeWindowId?: string | null
) {
  log.debug("switchAppTab", tab);

  const _activeTabs = Object.assign({}, activeTabs);
  _activeTabs[tab.window] = tab.id;
  dispatch(sessionActions.setActiveTabs({ data: _activeTabs }));

  const win = openWindows[tab.window];
  if (win && activeWindowId !== tab.window) {
    dispatch(sessionActions.setActiveWindow({ data: win }));
  }

  if (tab.location === "external") {
    if (isElectron()) {
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "switch-to-external-tab",
        tabWindowId: tab.window,
        tabId: tab.id,
        type: tab.type,
      });
    }
  } else {
    dispatch(sessionActions.setActiveTab({ data: tab }));
  }
}
