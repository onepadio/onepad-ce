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

type HostEntry = {
  /** Scene card / projector id (Others uses OTHERS_BROWSER_CARD_ID) */
  hostId: string;
  windowId: string;
  tabId: string;
  partition: string;
  url: string;
  workspaceId: string;
  desktopId: string;
  sleeping: boolean;
  location: string;
  isolated: boolean;
  type: string;
};

/**
 * Mounts active-tab OPWebViews for open windows shown in the 3D scene.
 * All browser windows share one host under OTHERS_BROWSER_CARD_ID.
 * Positioning is applied by WebViewProjector via data-desktop3d-webview.
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
      if (isSharedAppWindow(window, homeWorkspaceId)) return false;
      if (isOnlineToolWindow(window)) return false;
      if (window.type === "xapp") return window.desktop === workspace.id;
      return window.workspace === workspace.id;
    }) as any[];

    const nonBrowser = windows.filter((w) => !isBrowserTypeWindow(w));
    const maxNonBrowser = Math.max(0, getSceneMaxCards() - 1);
    const entries: HostEntry[] = [];

    nonBrowser.slice(0, maxNonBrowser).forEach((win) => {
      if (!visibleIds.has(win.id)) return;
      const tab = getWindowLiveActiveTab(win.id, activeTabs, openTabs);
      if (!tab) return;
      entries.push({
        hostId: win.id,
        windowId: win.id,
        tabId: tab.id,
        partition: getPartitionId(
          tab,
          route,
          user,
          sessionState,
          workspaceState,
          workspace.id
        ),
        url: tab.state?.url || tab.url,
        workspaceId: tab.workspace,
        desktopId: tab.desktop,
        sleeping: false,
        location: tab.location || "main",
        isolated: !!tab.isolated,
        type: tab.type,
      });
    });

    // Single Others host for the representative browser window
    if (visibleIds.has(OTHERS_BROWSER_CARD_ID)) {
      const repId = getRepresentativeBrowserWindowId(
        openWindows,
        browserWindows,
        windowTabs,
        activeWindowId,
        workspace.id
      );
      if (repId) {
        const tab = getWindowLiveActiveTab(repId, activeTabs, openTabs);
        if (tab) {
          entries.push({
            hostId: OTHERS_BROWSER_CARD_ID,
            windowId: repId,
            tabId: tab.id,
            partition: getPartitionId(
              tab,
              route,
              user,
              sessionState,
              workspaceState,
              workspace.id
            ),
            url: tab.state?.url || tab.url,
            workspaceId: tab.workspace,
            desktopId: tab.desktop,
            sleeping: false,
            location: tab.location || "main",
            isolated: !!tab.isolated,
            type: tab.type,
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
          key={`${host.hostId}-${host.windowId}-${host.tabId}`}
          data-desktop3d-webview={host.hostId}
          className="desktop-3d-webview-host"
        >
          <div className="desktop-3d-webview-inner">
            <OPWebView
              type={host.type}
              windowId={host.windowId}
              tabId={host.tabId}
              partition={host.partition}
              startUrl={host.url}
              workspaceId={host.workspaceId}
              desktopId={host.desktopId}
              sleeping={host.sleeping}
              location={host.location}
              isolated={host.isolated}
              setProgress={() => {}}
              setMediaPlaying={() => {}}
              setCurrentUrl={() => {}}
              setTitle={() => {}}
              setCurrentFavIcon={() => {}}
              deviceMode="desktop"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Desktop3DWebViewHost;
