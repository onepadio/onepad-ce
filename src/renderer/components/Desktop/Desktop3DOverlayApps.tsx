import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import OPWebView from "../WindowContainter/OPWebView";
import { sessionActions } from "../../store/session-slice";
import { isSharedAppWindow } from "../../util/sharedApps";
import { getSortedTabIdsForWindow } from "../../util/browserTabGroups";
import { getWindowLiveActiveTab } from "../LaunchPad3D/windowTab";
import {
  getDesktopOrigin,
  getFocusFramePose,
} from "../LaunchPad3D/WebViewProjector";

import "../LaunchPad3D/Desktop3DWebViewHost.css";
import "./Desktop3DOverlayApps.css";

const OPEN_IGNORE_MS = 600;
const CLOSE_ANIM_MS = 320;

const CHROME_IGNORE =
  [
    ".apps-overlay-menu",
    ".apps-overlay-trigger-indicator",
    ".desktop-3d-overlay-top",
    ".desktop-top-controls",
    ".desktop-3d-chrome",
    ".desktop-3d-experience-picker",
    ".desktop-3d-launchpad-overlay",
    ".desktop-3d-tab-dots",
    ".others-window-switcher",
    ".overview-tab-switcher",
    ".screen-opacity-slider",
    ".screen-settings",
    ".launchpad-3d-card-label",
    ".desktop-3d-search-overlay",
    ".desktop-3d-overlay-apps-host",
    "#vertical-tab-bar",
    "#vertical-tab-bar-overlay",
    "#vertical-tab-bar-trigger",
    ".vertical-tab-bar-trigger-zone",
    ".browser-tab-switcher-panel",
    ".browser-tab-switcher-backdrop",
    ".app-tab-switcher-panel",
    ".builtin-apps-switcher-panel",
    ".shared-apps-switcher-panel",
    ".builtin-apps-switcher-backdrop",
  ].join(", ");

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
      ? sessionState.isInSession && workspaceState.currentSession?.isolated
        ? `persist:${user.username}_${workspaceState.currentSession.id}`
        : `persist:${user.username}_${workspaceId}`
      : sessionState.isInSession && workspaceState.currentSession?.isolated
        ? `persist:${workspaceState.currentSession.id}`
        : `persist:${workspaceId}`;

  if (item.type === "xapp" || item.isolated) {
    partition = `persist:${item.window}`;
  }
  return partition;
}

/**
 * My Apps / xapps as a HUD-sized webview over the 3D scene.
 * Click outside (or Esc) scales down and returns to the space overview.
 */
function Desktop3DOverlayApps() {
  const dispatch = useDispatch();
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const homeWorkspaceId = useSelector(
    (state: any) => state.user.homeWorkspace
  );
  const selectedDesktop = useSelector(
    (state: any) => state.workspace.selectedDesktop
  );
  const user = useSelector((state: any) => state.user);
  const route = useSelector((state: any) => state.session.route);
  const sessionState = useSelector((state: any) => state.session);
  const workspaceState = useSelector((state: any) => state.workspace);

  const activeWin = activeWindowId ? openWindows?.[activeWindowId] : null;
  const focused =
    !!activeWindowId && isSharedAppWindow(activeWin, homeWorkspaceId);

  const [closing, setClosing] = useState(false);
  const openedAtRef = useRef(0);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hosts = useMemo(() => {
    const entries: {
      windowId: string;
      activeTabId: string;
      tabs: TabHost[];
    }[] = [];

    Object.values(openWindows || {}).forEach((win: any) => {
      if (!isSharedAppWindow(win, homeWorkspaceId)) return;

      const ids = getSortedTabIdsForWindow(win.id, windowTabs, openTabs);
      const tabs: TabHost[] = [];
      const mountAll = activeWindowId === win.id;

      if (mountAll) {
        ids.forEach((tid) => {
          const tab = openTabs[tid];
          if (!tab || tab.sleeping) return;
          if (tab.location && tab.location !== "main") return;
          const url = tab.state?.url || tab.url;
          if (!url) return;
          tabs.push({
            tabId: tab.id,
            partition: getPartitionId(
              tab,
              route,
              user,
              sessionState,
              workspaceState,
              tab.workspace
            ),
            url,
            workspaceId: tab.workspace,
            desktopId: tab.desktop,
            location: tab.location || "main",
            isolated: !!tab.isolated,
            type: tab.type,
          });
        });
      } else {
        const live = getWindowLiveActiveTab(win.id, activeTabs, openTabs);
        if (!live) return;
        const url = live.state?.url || live.url;
        if (!url) return;
        tabs.push({
          tabId: live.id,
          partition: getPartitionId(
            live,
            route,
            user,
            sessionState,
            workspaceState,
            live.workspace
          ),
          url,
          workspaceId: live.workspace,
          desktopId: live.desktop,
          location: live.location || "main",
          isolated: !!live.isolated,
          type: live.type,
        });
      }

      if (tabs.length === 0) return;
      const preferred =
        (activeTabs?.[win.id] &&
          tabs.find((t) => t.tabId === activeTabs[win.id])?.tabId) ||
        tabs[0].tabId;
      entries.push({
        windowId: win.id,
        activeTabId: preferred,
        tabs,
      });
    });

    return entries;
  }, [
    openWindows,
    openTabs,
    activeTabs,
    windowTabs,
    activeWindowId,
    homeWorkspaceId,
    user,
    route,
    sessionState,
    workspaceState,
  ]);

  const applyFocusPose = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const { left: ox, top: oy } = getDesktopOrigin();
    const pose = getFocusFramePose(ox, oy);
    el.style.visibility = "visible";
    el.style.opacity = "1";
    el.style.pointerEvents = "auto";
    el.style.position = "absolute";
    el.style.left = `${pose.left}px`;
    el.style.top = `${pose.top}px`;
    el.style.width = `${pose.width}px`;
    el.style.height = `${pose.height}px`;
    el.style.transform = "none";
  }, []);

  useEffect(() => {
    if (focused) {
      setClosing(false);
      openedAtRef.current = performance.now();
      window.dispatchEvent(new CustomEvent("desktop3d-clear-zoom"));
      requestAnimationFrame(() => applyFocusPose(hostRef.current));
    } else {
      setClosing(false);
    }
  }, [focused, activeWindowId, applyFocusPose]);

  useEffect(() => {
    if (!focused) return;
    const onResize = () => applyFocusPose(hostRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [focused, applyFocusPose]);

  const dismiss = useCallback(() => {
    if (closing) return;
    const desktopId = selectedDesktop?.id;
    if (!desktopId) return;
    setClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      dispatch(
        sessionActions.getBackToLaunchPad({
          data: { desktopId },
        })
      );
      setClosing(false);
    }, CLOSE_ANIM_MS);
  }, [closing, dispatch, selectedDesktop?.id]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!focused) return;
    const onDismiss = () => dismiss();
    window.addEventListener("desktop3d-overlay-dismiss", onDismiss);
    return () =>
      window.removeEventListener("desktop3d-overlay-dismiss", onDismiss);
  }, [focused, dismiss]);

  useEffect(() => {
    if (!focused || closing) return;
    const onPointerDown = (e: PointerEvent) => {
      if (performance.now() - openedAtRef.current < OPEN_IGNORE_MS) return;
      const target = e.target as Element | null;
      if (!target) return;
      // Host + guest: Electron may target <webview> or a point inside its rect
      if (hostRef.current?.contains(target)) return;
      if (target.closest?.("[data-desktop3d-overlay-webview]")) return;
      if (target.tagName?.toLowerCase?.() === "webview") {
        const r = hostRef.current?.getBoundingClientRect();
        if (
          r &&
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom
        ) {
          return;
        }
      }
      if (hostRef.current) {
        const r = hostRef.current.getBoundingClientRect();
        if (
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom
        ) {
          return;
        }
      }
      if (target.closest?.(CHROME_IGNORE)) return;
      dismiss();
      e.stopPropagation();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      dismiss();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [focused, closing, dismiss]);

  if (hosts.length === 0) return null;

  return (
    <div className="desktop-3d-overlay-apps-layer" aria-hidden={!focused}>
      {hosts.map((host) => {
        const isActive = focused && host.windowId === activeWindowId;
        return (
          <div
            key={host.windowId}
            ref={isActive ? hostRef : undefined}
            data-desktop3d-webview={host.windowId}
            data-desktop3d-overlay-webview={host.windowId}
            className={`desktop-3d-webview-host desktop-3d-overlay-apps-host${
              isActive ? " is-interactive is-open" : ""
            }${isActive && closing ? " is-closing" : ""}`}
            style={
              isActive
                ? undefined
                : { visibility: "hidden", pointerEvents: "none", opacity: 0 }
            }
          >
            <div className="desktop-3d-webview-inner">
              {host.tabs.map((tab) => {
                const isTabActive = tab.tabId === host.activeTabId;
                return (
                  <div
                    key={tab.tabId}
                    className={`desktop-3d-webview-tab${
                      isTabActive ? " is-active" : ""
                    }`}
                    aria-hidden={!isTabActive}
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
        );
      })}
    </div>
  );
}

export default Desktop3DOverlayApps;
