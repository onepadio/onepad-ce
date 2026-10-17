import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import OPWebView from "../WindowContainter/OPWebView";
import { getSceneMaxCards } from "./layouts/layoutMath";
import {
  getVisibleSceneWindowIds,
  subscribeVisibleSceneWindows,
} from "./sceneVisibility";
import { isOnlineToolWindow } from "../../builtin";
import { isSharedAppWindow } from "../../util/sharedApps";
import { getWindowLiveActiveTab } from "./windowTab";
import { getSortedTabIdsForWindow } from "../../util/browserTabGroups";
import { getBrowserWindowIds } from "../../util/browserWindows";
import {
  OTHERS_BROWSER_CARD_ID,
  getRepresentativeBrowserWindowId,
  isBrowserTypeWindow,
} from "./othersBrowser";

import "./Desktop3DWebViewHost.css";

function getPartitionId(
  item: any,
  route: string,
  user: any,
  sessionState: any,
  workspaceState: any,
  workspaceId: string
) {
  let partition = item.partition
    ? item.partition
    : route === "authenticated"
      ? sessionState.isInSession &&
        workspaceState.currentSession?.isolated
        ? `persist:${user.username}_${workspaceState.currentSession.id}`
        : `persist:${user.username}_${workspaceId}`
      : sessionState.isInSession &&
          workspaceState.currentSession?.isolated
        ? `persist:${workspaceState.currentSession.id}`
        : `persist:${workspaceId}`;

  if (item.type === "xapp" || item.isolated) {
    partition = `persist:${item.window}`;
  }
  return partition;
}

type TabHost = {
  tabId: string;
  partition: string;
  url: string;
  workspaceId: string;
  desktopId: string;
  location: string;
  isolated: boolean;
  type: string;
};

type HostEntry = {
  /** Scene card / projector id (Others uses OTHERS_BROWSER_CARD_ID) */
  hostId: string;
  windowId: string;
  /** Active tab for this window (shown); others stay mounted but hidden */
  activeTabId: string;
  tabs: TabHost[];
};

function tabToHost(
  tab: any,
  route: string,
  user: any,
  sessionState: any,
  workspaceState: any,
  workspaceId: string
): TabHost | null {
  if (!tab || tab.sleeping) return null;
  if (tab.location && tab.location !== "main") return null;
  const url = tab.state?.url || tab.url;
  if (!url) return null;
  return {
    tabId: tab.id,
    partition: getPartitionId(
      tab,
      route,
      user,
      sessionState,
      workspaceState,
      workspaceId
    ),
    url,
    workspaceId: tab.workspace,
    desktopId: tab.desktop,
    location: tab.location || "main",
    isolated: !!tab.isolated,
    type: tab.type,
  };
}

/**
 * Mounts OPWebViews for open windows in the 3D scene.
 * Keeps them mounted while awake; WebViewProjector only hides off-front hosts.
 * Active window: all awake tabs mounted, inactive tabs CSS-hidden (like 2D).
 * Other windows: only the live active tab. Sleeping tabs omitted.
 */
function Desktop3DWebViewHost() {
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const browserWindows = useSelector(
    (state: any) => state.session.browserWindows
  );
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const activeBrowserWindowId = useSelector(
    (state: any) => state.session.activeBrowserWindowId
  );
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const homeWorkspaceId = useSelector((state: any) => state.user.homeWorkspace);
  const user = useSelector((state: any) => state.user);
  const route = useSelector((state: any) => state.session.route);
  const sessionState = useSelector((state: any) => state.session);
  const workspaceState = useSelector((state: any) => state.workspace);
  const [visibleIds, setVisibleIds] = useState(() =>
    getVisibleSceneWindowIds()
  );

  useEffect(() => subscribeVisibleSceneWindows(setVisibleIds), []);

  const hosts = useMemo(() => {
    const windows = Object.values(openWindows).filter((window: any) => {
      const isValidType =
        window.type === "app" ||
        window.type === "link" ||
        window.type === "xapp" ||
        window.type === "browser";
      if (!isValidType) return false;
      // My Apps / xapps: mounted by Desktop3DOverlayApps, not scene hosts
      if (isSharedAppWindow(window, homeWorkspaceId)) return false;
      if (isOnlineToolWindow(window)) return false;
      if (window.type === "xapp") return false;
      return window.workspace === workspace.id;
    }) as any[];

    const nonBrowser = windows.filter((w) => !isBrowserTypeWindow(w));
    const maxNonBrowser = Math.max(0, getSceneMaxCards() - 1);
    const entries: HostEntry[] = [];

    const buildTabsForWindow = (
      winId: string,
      mountAllAwakeTabs: boolean
    ): { activeTabId: string; tabs: TabHost[] } | null => {
      if (mountAllAwakeTabs) {
        const ids = getSortedTabIdsForWindow(winId, windowTabs, openTabs);
        const tabs: TabHost[] = [];
        ids.forEach((tid) => {
          const host = tabToHost(
            openTabs[tid],
            route,
            user,
            sessionState,
            workspaceState,
            workspace.id
          );
          if (host) tabs.push(host);
        });
        if (tabs.length === 0) return null;
        const preferred =
          (activeTabs?.[winId] &&
            tabs.find((t) => t.tabId === activeTabs[winId])?.tabId) ||
          tabs[0].tabId;
        return { activeTabId: preferred, tabs };
      }

      const live = getWindowLiveActiveTab(winId, activeTabs, openTabs);
      const host = tabToHost(
        live,
        route,
        user,
        sessionState,
        workspaceState,
        workspace.id
      );
      if (!host) return null;
      return { activeTabId: host.tabId, tabs: [host] };
    };

    nonBrowser.slice(0, maxNonBrowser).forEach((win) => {
      if (!visibleIds.has(win.id)) return;
      const mountAll = activeWindowId === win.id;
      const built = buildTabsForWindow(win.id, mountAll);
      if (!built) return;
      entries.push({
        hostId: win.id,
        windowId: win.id,
        activeTabId: built.activeTabId,
        tabs: built.tabs,
      });
    });

    if (visibleIds.has(OTHERS_BROWSER_CARD_ID)) {
      const repId = getRepresentativeBrowserWindowId(
        openWindows,
        browserWindows,
        windowTabs,
        activeWindowId,
        workspace.id,
        activeBrowserWindowId
      );
      if (repId) {
        // Keep every browser window's live tab mounted under Others so
        // screenshots can be captured when switching groups (unmounting
        // destroys webContents before TabSwitchScreenshotHub can run).
        const browserIds = getBrowserWindowIds(
          openWindows,
          browserWindows,
          windowTabs
        ).filter((id) => openWindows[id]?.workspace === workspace.id);

        const tabs: TabHost[] = [];
        const seen = new Set<string>();
        const addTab = (host: TabHost | null) => {
          if (!host || seen.has(host.tabId)) return;
          seen.add(host.tabId);
          tabs.push(host);
        };

        browserIds.forEach((winId) => {
          const isActiveBrowser =
            !!activeWindowId &&
            openWindows[activeWindowId]?.type === "browser" &&
            activeWindowId === winId;
          if (isActiveBrowser) {
            // Active browser: mount all awake tabs (in-window tab switch)
            const built = buildTabsForWindow(winId, true);
            built?.tabs.forEach((t) => addTab(t));
          } else {
            // Other browsers: keep only the live active tab for previews
            addTab(
              tabToHost(
                getWindowLiveActiveTab(winId, activeTabs, openTabs),
                route,
                user,
                sessionState,
                workspaceState,
                workspace.id
              )
            );
          }
        });

        if (tabs.length > 0) {
          const preferred =
            (activeTabs?.[repId] &&
              tabs.find((t) => t.tabId === activeTabs[repId])?.tabId) ||
            tabs.find((t) => openTabs[t.tabId]?.window === repId)?.tabId ||
            tabs[0].tabId;
          entries.push({
            hostId: OTHERS_BROWSER_CARD_ID,
            windowId: repId,
            activeTabId: preferred,
            tabs,
          });
        }
      }
    }

    return entries;
  }, [
    openWindows,
    openTabs,
    activeTabs,
    windowTabs,
    browserWindows,
    activeWindowId,
    activeBrowserWindowId,
    workspace,
    homeWorkspaceId,
    user,
    route,
    sessionState,
    workspaceState,
    visibleIds,
  ]);

  return (
    <div className="desktop-3d-webview-layer" aria-hidden={false}>
      {hosts.map((host) => (
        <div
          key={host.hostId}
          data-desktop3d-webview={host.hostId}
          className="desktop-3d-webview-host"
        >
          <div className="desktop-3d-webview-inner">
            {host.tabs.map((tab) => {
              const isActive = tab.tabId === host.activeTabId;
              return (
                <div
                  key={tab.tabId}
                  className={`desktop-3d-webview-tab${
                    isActive ? " is-active" : ""
                  }`}
                  aria-hidden={!isActive}
                >
                  <OPWebView
                    type={tab.type}
                    windowId={host.windowId}
                    tabId={tab.tabId}
                    partition={tab.partition}
                    startUrl={tab.url}
                    workspaceId={tab.workspaceId}
                    desktopId={tab.desktopId}
                    sleeping={false}
                    location={tab.location}
                    isolated={tab.isolated}
                    setProgress={() => {}}
                    setMediaPlaying={() => {}}
                    setCurrentUrl={() => {}}
                    setTitle={() => {}}
                    setCurrentFavIcon={() => {}}
                    deviceMode="desktop"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Desktop3DWebViewHost;
