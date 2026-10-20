import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import { PlusLg } from "react-bootstrap-icons";

import { sessionActions } from "../../store/session-slice";
import {
  getSortedTabIdsForWindow,
  getTabScreenshot,
  switchAppTab,
  switchBrowserTab,
  truncateTabTitle,
  wakeSleepingTab,
} from "../../util/browserTabGroups";
import { newTabForActiveWindow } from "../../util/tabs";
import { resolveIconUrl } from "./resolveIconUrl";
import {
  OTHERS_BROWSER_CARD_ID,
  getRepresentativeBrowserWindowId,
} from "./othersBrowser";

import "./OverviewTabSwitcher.css";

interface OverviewTabSwitcherProps {
  deskFrontCardId?: string;
  /** Overview only — hide when HUD / explore */
  visible?: boolean;
}

type TabThumb = {
  tabId: string;
  title: string;
  imageUrl: string | null;
  previewMode: "screenshot" | "icon";
  isActive: boolean;
  isSleeping: boolean;
};

/**
 * Vertical tab screenshot strip on the left when the desk-front app/Others
 * has multiple tabs (overview only). Focused HUD uses Desktop3DTabDots.
 */
function OverviewTabSwitcher({
  deskFrontCardId = "",
  visible = true,
}: OverviewTabSwitcherProps) {
  const dispatch = useDispatch();
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const activeBrowserWindowId = useSelector(
    (state: any) => state.session.activeBrowserWindowId
  );
  const browserWindows = useSelector(
    (state: any) => state.session.browserWindows
  );
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const desktop = useSelector(
    (state: any) => state.workspace.selectedDesktop
  );
  const screenShotStatusVersion = useSelector(
    (state: any) => state.app.screenShotStatusVersion
  );

  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>(
    {}
  );

  const { windowId, thumbs } = useMemo(() => {
    const empty = { windowId: null as string | null, thumbs: [] as TabThumb[] };
    if (!visible || !deskFrontCardId || deskFrontCardId === "launchpad") {
      return empty;
    }

    let windowId: string | null = deskFrontCardId;
    if (deskFrontCardId === OTHERS_BROWSER_CARD_ID) {
      windowId = getRepresentativeBrowserWindowId(
        openWindows,
        browserWindows,
        windowTabs,
        activeWindowId,
        workspace?.id,
        activeBrowserWindowId
      );
    }

    if (!windowId || !openWindows[windowId]) return empty;

    let ids = getSortedTabIdsForWindow(windowId, windowTabs, openTabs);
    if (ids.length === 0) {
      ids = Object.keys(openTabs || {}).filter(
        (id) => openTabs[id]?.window === windowId
      );
      ids.sort(
        (a, b) => (openTabs[a]?.created || 0) - (openTabs[b]?.created || 0)
      );
    }
    if (ids.length < 1) return empty;

    const currentId =
      activeTabs?.[windowId] && ids.includes(activeTabs[windowId])
        ? activeTabs[windowId]
        : activeTabId && ids.includes(activeTabId)
          ? activeTabId
          : ids[0];

    const thumbs: TabThumb[] = ids.map((tabId) => {
      const tab = openTabs[tabId];
      const title = truncateTabTitle(
        tab || { state: { title: "Tab" } },
        28
      );
      const url = tab?.state?.url || tab?.url || "";
      const icon = resolveIconUrl(tab?.state?.favIcon || tab?.state?.icon, url);
      const shot = getTabScreenshot(tabId);
      return {
        tabId,
        title,
        imageUrl: shot || icon,
        previewMode: shot ? ("screenshot" as const) : ("icon" as const),
        isActive: tabId === currentId,
        isSleeping: tab?.sleeping === true,
      };
    });

    return { windowId, thumbs };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visible,
    deskFrontCardId,
    openWindows,
    openTabs,
    windowTabs,
    activeTabs,
    activeTabId,
    activeWindowId,
    activeBrowserWindowId,
    browserWindows,
    workspace?.id,
    screenShotStatusVersion,
  ]);

  const handleSelect = useCallback(
    (tabId: string) => {
      if (!windowId) return;
      const tab = openTabs[tabId];
      const win = openWindows[windowId];
      if (!tab || !win) return;

      // Wake on click so the desk / HUD can remount the webview
      wakeSleepingTab(tabId, dispatch, openTabs, openWindows);

      // Already in this window — normal tab switch (may update session)
      if (activeWindowId === windowId) {
        if (win.type === "browser") {
          switchBrowserTab(
            tab,
            dispatch,
            openWindows,
            activeTabs,
            activeWindowId
          );
        } else {
          switchAppTab(tab, dispatch, openWindows, activeTabs, activeWindowId);
        }
        return;
      }

      // Overview (e.g. launchpad active): change which tab feeds the desk
      // screen without activating / opening the HUD.
      const nextActiveTabs = Object.assign({}, activeTabs);
      nextActiveTabs[windowId] = tabId;
      dispatch(sessionActions.setActiveTabs({ data: nextActiveTabs }));
    },
    [windowId, openTabs, openWindows, dispatch, activeTabs, activeWindowId]
  );

  const handleNewTab = useCallback(() => {
    if (!windowId) return;
    const win = openWindows[windowId];
    if (!win) return;
    newTabForActiveWindow(
      dispatch,
      workspace,
      desktop,
      windowTabs,
      openTabs,
      activeTabs,
      win
    );
  }, [
    windowId,
    openWindows,
    dispatch,
    workspace,
    desktop,
    windowTabs,
    openTabs,
    activeTabs,
  ]);

  // Sit just left of the projected desk screen (same host as TabDots)
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastPosRef = useRef<{ left: number; top: number } | null>(null);
  const hostCardId =
    deskFrontCardId === OTHERS_BROWSER_CARD_ID
      ? OTHERS_BROWSER_CARD_ID
      : deskFrontCardId;

  useEffect(() => {
    lastPosRef.current = null;
  }, [hostCardId, windowId]);

  useEffect(() => {
    if (!visible || !windowId || thumbs.length < 1) return;

    let raf = 0;
    const STRIP_W = 128;
    const GAP = 56;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const root = rootRef.current;
      if (!root) return;

      const host =
        (document.querySelector(
          `[data-desktop3d-webview="${hostCardId}"]`
        ) as HTMLElement | null) ||
        (windowId
          ? (document.querySelector(
              `[data-desktop3d-webview="${windowId}"]`
            ) as HTMLElement | null)
          : null);

      let next: { left: number; top: number } | null = null;
      if (host) {
        const cs = window.getComputedStyle(host);
        const visibleHost =
          cs.visibility !== "hidden" &&
          cs.display !== "none" &&
          parseFloat(cs.opacity || "1") > 0.05;
        if (visibleHost) {
          const r = host.getBoundingClientRect();
          if (r.width >= 80 && r.height >= 80) {
            next = {
              left: Math.max(8, r.left - STRIP_W - GAP),
              top: r.top + r.height * 0.5,
            };
          }
        }
      }

      if (!next) {
        if (!lastPosRef.current) {
          root.style.visibility = "hidden";
          return;
        }
        next = lastPosRef.current;
      }

      const prev = lastPosRef.current;
      if (
        prev &&
        Math.abs(prev.left - next.left) < 0.25 &&
        Math.abs(prev.top - next.top) < 0.25
      ) {
        root.style.visibility = "visible";
        return;
      }
      lastPosRef.current = next;
      root.style.left = `${next.left}px`;
      root.style.top = `${next.top}px`;
      root.style.transform = "translateY(-50%)";
      root.style.visibility = "visible";
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, windowId, hostCardId, thumbs.length]);

  // Show strip when multi-tab, or always with New when desk-front has tabs
  if (!visible || !windowId || thumbs.length < 1) return null;

  return (
    <div
      ref={rootRef}
      className="overview-tab-switcher"
      role="listbox"
      aria-label="Switch tab"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="overview-tab-switcher-col">
        <div className="overview-tab-switcher-scroll">
          {thumbs.map((thumb) => {
            const imgKey = thumb.imageUrl || "";
            const showImg =
              !!thumb.imageUrl &&
              !brokenImages[imgKey] &&
              (thumb.previewMode === "screenshot" ||
                thumb.imageUrl.startsWith("data:image/"));
            return (
              <button
                key={thumb.tabId}
                type="button"
                role="option"
                aria-selected={thumb.isActive}
                className={clsx(
                  "overview-tab-switcher-item",
                  thumb.isActive && "is-active",
                  thumb.isSleeping && "is-sleeping",
                  (!showImg || thumb.previewMode === "icon") && "is-icon"
                )}
                title={thumb.title}
                onClick={() => handleSelect(thumb.tabId)}
              >
                <span className="overview-tab-switcher-frame">
                  {showImg ? (
                    <img
                      src={thumb.imageUrl!}
                      alt=""
                      draggable={false}
                      className="overview-tab-switcher-img"
                      onError={() =>
                        setBrokenImages((prev) => ({
                          ...prev,
                          [imgKey]: true,
                        }))
                      }
                    />
                  ) : (
                    <span className="overview-tab-switcher-placeholder" />
                  )}
                </span>
                <span className="overview-tab-switcher-label">{thumb.title}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="overview-tab-switcher-item overview-tab-switcher-new"
          title="New tab"
          aria-label="New tab"
          onClick={handleNewTab}
        >
          <span className="overview-tab-switcher-frame overview-tab-switcher-new-frame">
            <PlusLg size={20} />
          </span>
          <span className="overview-tab-switcher-label">New</span>
        </button>
      </div>
    </div>
  );
}

export default OverviewTabSwitcher;
