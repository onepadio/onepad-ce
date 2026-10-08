import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  getSortedTabIdsForWindow,
  switchAppTab,
  switchBrowserTab,
} from "../../util/browserTabGroups";
import { OTHERS_BROWSER_CARD_ID } from "./othersBrowser";

import "./Desktop3DTabDots.css";

interface Desktop3DTabDotsProps {
  /** Focused 3D card id (window id, or Others card id) */
  focusedCardId?: string | null;
}

/**
 * Vertical page-dot pagination for the focused 3D window when it has multiple tabs.
 * Works for app/link/xapp windows and browser tab-groups (Others screen).
 * Portaled to document.body so Electron <webview> native layers cannot cover it.
 */
function Desktop3DTabDots({ focusedCardId = null }: Desktop3DTabDotsProps) {
  const dispatch = useDispatch();
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const activeTabId = useSelector((state: any) => state.session.activeTabId);

  const { windowId, tabIds, activeIndex } = useMemo(() => {
    const empty = {
      windowId: null as string | null,
      tabIds: [] as string[],
      activeIndex: -1,
    };

    let windowId: string | null =
      focusedCardId || activeWindowId || null;

    if (windowId === "launchpad") windowId = null;

    // Others screen → representative / active browser window
    if (windowId === OTHERS_BROWSER_CARD_ID) {
      windowId =
        (activeWindowId && openWindows[activeWindowId]?.type === "browser"
          ? activeWindowId
          : null) ||
        Object.keys(openWindows).find(
          (id) => openWindows[id]?.type === "browser"
        ) ||
        null;
    }

    // Fallback: tab → window
    if (!windowId || !openWindows[windowId]) {
      const tab =
        (activeTabId && openTabs[activeTabId]) ||
        null;
      const fromTab = tab?.window;
      if (fromTab && openWindows[fromTab]) {
        windowId = fromTab;
      }
    }

    if (!windowId || !openWindows[windowId]) return empty;

    let ids = getSortedTabIdsForWindow(windowId, windowTabs, openTabs);
    if (ids.length <= 1) {
      // Fallback if windowTabs is stale: gather from openTabs by window ref
      const fromOpen = Object.keys(openTabs || {}).filter(
        (id) => openTabs[id]?.window === windowId && !openTabs[id]?.sleeping
      );
      if (fromOpen.length > ids.length) {
        ids = fromOpen.sort((a, b) => {
          const ca = openTabs[a]?.created || 0;
          const cb = openTabs[b]?.created || 0;
          return ca - cb;
        });
      }
    }

    const currentId =
      activeTabId && ids.includes(activeTabId)
        ? activeTabId
        : activeTabs?.[windowId] || ids[0];
    const activeIndex = ids.indexOf(currentId);
    return { windowId, tabIds: ids, activeIndex };
  }, [
    focusedCardId,
    activeWindowId,
    activeTabId,
    activeTabs,
    openWindows,
    openTabs,
    windowTabs,
  ]);

  // Sit just left of the focused webview host
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!windowId || tabIds.length <= 1) {
      setPos(null);
      return;
    }

    const update = () => {
      const cardKey =
        focusedCardId === OTHERS_BROWSER_CARD_ID
          ? OTHERS_BROWSER_CARD_ID
          : windowId;
      const host =
        (document.querySelector(
          `[data-desktop3d-webview="${cardKey}"]`
        ) as HTMLElement | null) ||
        (document.querySelector(
          `[data-desktop3d-webview="${windowId}"]`
        ) as HTMLElement | null);
      if (!host) {
        // Fallback: mid-left of viewport (outside FOCUS_SIDE_INSET band)
        setPos({ left: 16, top: window.innerHeight * 0.5 });
        return;
      }
      const r = host.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) {
        setPos({ left: 16, top: window.innerHeight * 0.5 });
        return;
      }
      setPos({
        left: Math.max(10, r.left - 36),
        top: r.top + r.height * 0.5,
      });
    };

    update();
    const id = window.setInterval(update, 120);
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", update);
    };
  }, [windowId, focusedCardId, tabIds.length]);

  if (!windowId || tabIds.length <= 1) return null;

  const win = openWindows[windowId];

  function selectTab(tabId: string) {
    const tab = openTabs[tabId];
    if (!tab) return;
    if (win?.type === "browser") {
      switchBrowserTab(tab, dispatch, openWindows, activeTabs, activeWindowId);
    } else {
      switchAppTab(tab, dispatch, openWindows, activeTabs, activeWindowId);
    }
  }

  const node = (
    <nav
      className="desktop-3d-tab-dots"
      aria-label={
        win?.type === "browser" ? "Browser tab group" : "Window tabs"
      }
      style={
        pos
          ? {
              left: pos.left,
              top: pos.top,
              transform: "translateY(-50%)",
            }
          : undefined
      }
    >
      {tabIds.map((tabId: string, i: number) => {
        const tab = openTabs[tabId];
        const label =
          tab?.state?.title || tab?.title || tab?.state?.url || `Tab ${i + 1}`;
        const active = i === activeIndex;
        return (
          <button
            key={tabId}
            type="button"
            className={`desktop-3d-tab-dot${active ? " active" : ""}`}
            aria-label={label}
            aria-current={active ? "true" : undefined}
            title={label}
            onClick={() => selectTab(tabId)}
          />
        );
      })}
    </nav>
  );

  return createPortal(node, document.body);
}

export default Desktop3DTabDots;
