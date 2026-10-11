import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  getSortedTabIdsForWindow,
  switchAppTab,
  switchBrowserTab,
} from "../../util/browserTabGroups";
import { isSharedAppWindow } from "../../util/sharedApps";
import { OTHERS_BROWSER_CARD_ID } from "./othersBrowser";
import { getWindowLiveActiveTab } from "./windowTab";

import "./Desktop3DTabDots.css";

interface Desktop3DTabDotsProps {
  /** HUD-focused 3D card id (window id, or Others card id) */
  focusedCardId?: string | null;
}

/**
 * Vertical page-dot pagination when the front desk/HUD window has multiple tabs.
 * Also tracks My Apps / xapp overlay hosts. Portaled so native webviews can't cover it.
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
  const homeWorkspaceId = useSelector(
    (state: any) => state.user.homeWorkspace
  );
  /** Scene front window when HUD is not open */
  const deskFrontCardId = useSelector(
    (state: any) => state.windowService.desktop3dDeskWindowId || ""
  );

  const { windowId, tabIds, activeIndex, cardKey, isOverlay } = useMemo(() => {
    const empty = {
      windowId: null as string | null,
      tabIds: [] as string[],
      activeIndex: -1,
      cardKey: null as string | null,
      isOverlay: false,
    };

    const activeWin = activeWindowId ? openWindows?.[activeWindowId] : null;
    const overlayActive = isSharedAppWindow(activeWin, homeWorkspaceId);

    // My Apps / xapp overlay takes priority over desk-front scene cards
    let cardKey: string | null = null;
    let windowId: string | null = null;
    let isOverlay = false;

    if (overlayActive && activeWindowId) {
      windowId = activeWindowId;
      cardKey = activeWindowId;
      isOverlay = true;
    } else {
      cardKey = focusedCardId || deskFrontCardId || null;
      windowId = cardKey || activeWindowId || null;
    }

    if (windowId === "launchpad") windowId = null;

    // Others screen → representative / active browser window
    if (windowId === OTHERS_BROWSER_CARD_ID) {
      cardKey = OTHERS_BROWSER_CARD_ID;
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
        if (!cardKey) cardKey = fromTab;
        if (isSharedAppWindow(openWindows[fromTab], homeWorkspaceId)) {
          isOverlay = true;
        }
      }
    }

    if (!windowId || !openWindows[windowId]) return empty;

    if (!isOverlay && isSharedAppWindow(openWindows[windowId], homeWorkspaceId)) {
      isOverlay = true;
    }

    let ids = getSortedTabIdsForWindow(windowId, windowTabs, openTabs);
    if (ids.length === 0) {
      ids = Object.keys(openTabs || {}).filter(
        (id) => openTabs[id]?.window === windowId
      );
      ids.sort((a, b) => {
        const ca = openTabs[a]?.created || 0;
        const cb = openTabs[b]?.created || 0;
        return ca - cb;
      });
    }

    // Multi-tab only; hide while the card shows the app icon (no live tab)
    if (ids.length <= 1) return empty;
    if (!getWindowLiveActiveTab(windowId, activeTabs, openTabs)) return empty;

    const currentId =
      activeTabs?.[windowId] && ids.includes(activeTabs[windowId])
        ? activeTabs[windowId]
        : activeTabId && ids.includes(activeTabId)
          ? activeTabId
          : ids[0];
    const activeIndex = ids.indexOf(currentId);
    return {
      windowId,
      tabIds: ids,
      activeIndex,
      cardKey: cardKey || windowId,
      isOverlay,
    };
  }, [
    focusedCardId,
    deskFrontCardId,
    activeWindowId,
    activeTabId,
    activeTabs,
    openWindows,
    openTabs,
    windowTabs,
    homeWorkspaceId,
  ]);

  // Track webview host every frame (same cadence as WebViewProjector scale)
  const navRef = useRef<HTMLElement | null>(null);
  const lastPosRef = useRef({ left: -1, top: -1 });

  useEffect(() => {
    if (!windowId || tabIds.length <= 1) return;

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const nav = navRef.current;
      if (!nav) return;

      const hostKey = cardKey || windowId;
      const host =
        (document.querySelector(
          `[data-desktop3d-overlay-webview="${windowId}"]`
        ) as HTMLElement | null) ||
        (document.querySelector(
          `[data-desktop3d-webview="${hostKey}"]`
        ) as HTMLElement | null) ||
        (document.querySelector(
          `[data-desktop3d-webview="${windowId}"]`
        ) as HTMLElement | null);

      let left = 16;
      let top = window.innerHeight * 0.5;

      if (
        host &&
        host.style.visibility !== "hidden" &&
        host.style.opacity !== "0"
      ) {
        // Includes CSS scale() — same visual box the projector just wrote
        const r = host.getBoundingClientRect();
        if (r.width >= 40 && r.height >= 40) {
          left = Math.max(10, r.left - 36);
          top = r.top + r.height * 0.5;
        }
      }

      const prev = lastPosRef.current;
      if (Math.abs(prev.left - left) < 0.25 && Math.abs(prev.top - top) < 0.25) {
        return;
      }
      lastPosRef.current = { left, top };
      nav.style.left = `${left}px`;
      nav.style.top = `${top}px`;
      nav.style.transform = "translateY(-50%)";
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [windowId, cardKey, tabIds.length, isOverlay]);

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
      ref={navRef}
      className={`desktop-3d-tab-dots${
        isOverlay ? " desktop-3d-tab-dots--overlay" : ""
      }`}
      aria-label={
        win?.type === "browser" ? "Browser tab group" : "Window tabs"
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
