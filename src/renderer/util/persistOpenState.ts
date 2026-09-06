import log from "loglevel";

import store from "../store";
import {
  processOpenTabsBeforePersist,
  processWindows,
} from "../services/window";
import { WorkspaceService } from "../services/workspace";
import { SessionService } from "../services/session";
import BrowserStateService from "../services/browsers";
import XAppService from "../services/xapp";
import { getBrowserWindowIds } from "./browserWindows";

export const OPEN_STATE_PERSIST_DEBOUNCE_MS = 600;

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistInFlight = false;
let persistQueued = false;

/**
 * Debounced persist of open windows/tabs so app switches and tab
 * open/close survive crashes without waiting for a space switch.
 */
export function schedulePersistOpenState(reason = "structure-change") {
  if (persistTimer) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(() => {
    persistTimer = null;
    runPersistOpenState(reason);
  }, OPEN_STATE_PERSIST_DEBOUNCE_MS);
}

async function runPersistOpenState(reason: string) {
  if (persistInFlight) {
    persistQueued = true;
    return;
  }

  persistInFlight = true;
  try {
    await persistOpenStateNow(reason);
  } catch (error) {
    log.error("persistOpenState failed", reason, error);
  } finally {
    persistInFlight = false;
    if (persistQueued) {
      persistQueued = false;
      schedulePersistOpenState("queued");
    }
  }
}

export async function persistOpenStateNow(reason = "immediate") {
  const root = store.getState() as any;
  const workspace = root.workspace?.selectedWorkspace;
  const currentSession = root.workspace?.currentSession;
  const sessions = root.workspace?.sessions || [];
  const session = root.session;

  if (!workspace?.id || !workspace?.state?.desktop) {
    return;
  }

  const openWindows = session.openWindows || {};
  const openTabs = session.openTabs || {};
  const windowTabs = session.windowTabs || {};
  const activeTabs = session.activeTabs || {};
  const activeDesktopWindows = session.activeDesktopWindows || {};
  const browserWindows = getBrowserWindowIds(
    openWindows,
    session.browserWindows || [],
    windowTabs
  );
  const activeBrowserWindowId = session.activeBrowserWindowId || "";

  log.debug("persistOpenState", reason, {
    workspaceId: workspace.id,
    isInSession: !!session.isInSession,
    windows: Object.keys(openWindows).length,
    tabs: Object.keys(openTabs).length,
    browsers: browserWindows.length,
  });

  // Flush latest in-memory screenshots for open tabs to disk
  try {
    if (typeof window !== "undefined" && (window as any).electronAPI?.screenshot?.flush) {
      const tabIds = Object.keys(openTabs);
      (window as any).electronAPI.screenshot.flush(tabIds);
    }
  } catch (error) {
    log.error("persistOpenState: screenshot flush failed", error);
  }

  // Browser tabs/windows live in db.browsers
  try {
    const browserState = BrowserStateService.procesState(
      browserWindows,
      openWindows,
      windowTabs,
      activeTabs,
      openTabs,
      activeBrowserWindowId
    );
    const existing: any =
      await BrowserStateService.getBrowserStateByWorkspaceId(workspace.id);
    if (existing?.id) {
      await BrowserStateService.updateBrowserState(existing.id, browserState);
    } else if (browserWindows.length > 0) {
      await BrowserStateService.createBrowserState(workspace.id, browserState);
    }
  } catch (error) {
    log.error("persistOpenState: browser state failed", error);
  }

  // Profile xapps → sessionStorage (same as space switch)
  try {
    XAppService.saveStateToSessionStorage(
      openWindows,
      openTabs,
      windowTabs,
      activeTabs
    );
  } catch (error) {
    log.error("persistOpenState: xapp sessionStorage failed", error);
  }

  if (session.isInSession && currentSession?.id) {
    const sessionPayload = {
      openWindows,
      openTabs,
      windowTabs,
      activeTabs,
      activeDesktopWindows,
      activeTab: session.activeTab,
      activeTabId: session.activeTabId,
      activeWindow: session.activeWindow,
      activeWindowId: session.activeWindowId,
      activeWindowTabs: session.activeWindowTabs,
      browserWindows,
      activeBrowserWindowId,
      bookmarks: session.bookmarks,
      favourites: session.favourites,
      sync: session.sync,
    };
    await SessionService.saveState(currentSession.id, sessionPayload);
    return;
  }

  const _openTabs = processOpenTabsBeforePersist(workspace.id, openTabs);
  const _windows = processWindows(
    workspace.id,
    openWindows,
    windowTabs,
    activeTabs,
    openTabs
  );
  const _sessions = sessions.map((s: any) => ({
    id: s.id,
    name: s.name,
  }));

  const activeTab =
    session.activeTab?.type === "xapp"
      ? { id: "launchpad" }
      : session.activeTab;
  const activeWindow =
    session.activeWindow?.type === "xapp"
      ? { id: "launchpad" }
      : session.activeWindow;

  await WorkspaceService.saveState(workspace.id, {
    desktop: workspace.state.desktop,
    openWindows: _windows.openWindows,
    browserWindows: [],
    openTabs: _openTabs,
    windowTabs: _windows.windowTabs,
    activeDesktopWindows,
    activeTabs: _windows.activeTabs,
    activeTab,
    activeTabId:
      session.activeTab?.type === "xapp" ? "launchpad" : session.activeTabId,
    activeWindow,
    activeWindowId:
      session.activeWindow?.type === "xapp"
        ? "launchpad"
        : session.activeWindowId,
    activeWindowTabs:
      session.activeWindow?.type === "xapp" ? [] : session.activeWindowTabs,
    activeBrowserWindowId: "",
    sessions: _sessions,
    currentSession: {},
  });
}
