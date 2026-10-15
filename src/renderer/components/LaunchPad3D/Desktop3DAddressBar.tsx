import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowClockwise,
  ChevronLeft,
  ChevronRight,
  LockFill,
  PauseFill,
  X,
} from "react-bootstrap-icons";

import { sessionActions } from "../../store/session-slice";
import { windowServiceActions } from "../../store/window-service-slice";
import {
  canGoBackInHistory,
  canGoForwardInHistory,
  moveHistoryIndex,
  scheduleTabNavHistoryPersist,
} from "../../util/navHistory";
import { OTHERS_BROWSER_CARD_ID } from "./othersBrowser";
import "./Desktop3DAddressBar.css";

interface Desktop3DAddressBarProps {
  /** Leave focused window / return to scene overview (click-outside / Esc) */
  onClose?: () => void;
}

/**
 * Floating pill address bar for focused 3D window — back/forward, URL, reload, pause, close tab.
 * Pause → WindowService.sleepWindow; close → WindowService.closeTab.
 */
function Desktop3DAddressBar({ onClose }: Desktop3DAddressBarProps) {
  const dispatch = useDispatch();
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const workspaceState = useSelector((state: any) => state.workspace);
  const sessionState = useSelector((state: any) => state.session);

  const tab =
    (activeTabId && openTabs[activeTabId]) ||
    (activeWindowId &&
      activeTabs?.[activeWindowId] &&
      openTabs[activeTabs[activeWindowId]]) ||
    null;

  const tabId = tab?.id || activeTabId || null;

  const liveUrl: string =
    tab?.state?.url || tab?.url || tab?.state?.displayUrl || "";

  const [value, setValue] = useState(liveUrl);

  useEffect(() => {
    setValue(liveUrl);
  }, [liveUrl]);

  const canGoBack = useMemo(
    () => canGoBackInHistory(tab?.state || {}),
    [tab?.state]
  );
  const canGoForward = useMemo(
    () => canGoForwardInHistory(tab?.state || {}),
    [tab?.state]
  );

  const findWebView = useCallback(() => {
    if (!activeWindowId) return null;
    const isBrowser =
      activeWindowId.startsWith("browser_") ||
      openTabs[tabId]?.type === "browser";
    const host =
      document.querySelector(
        `[data-desktop3d-webview="${activeWindowId}"]`
      ) ||
      document.querySelector(
        `[data-desktop3d-overlay-webview="${activeWindowId}"]`
      ) ||
      (isBrowser
        ? document.querySelector(
            `[data-desktop3d-webview="${OTHERS_BROWSER_CARD_ID}"]`
          )
        : null);
    return (
      (host?.querySelector("webview") as any) ||
      (tabId
        ? (document.getElementById(`webview-${tabId}`) as any)
        : null)
    );
  }, [activeWindowId, openTabs, tabId]);

  const reload = useCallback(() => {
    findWebView()?.reload?.();
  }, [findWebView]);

  const navigateHistory = useCallback(
    (direction: "back" | "forward") => {
      if (!tabId || tabId === "launchpad" || !tab?.state) return;

      const currentIndex = tab.state.historyIndex ?? -1;
      const newIndex =
        direction === "back" ? currentIndex - 1 : currentIndex + 1;
      const nextState = moveHistoryIndex(tab.state, newIndex);
      if (nextState.historyIndex === currentIndex) return;

      const _openTabs = { ...openTabs, [tabId]: { ...tab, state: nextState } };
      dispatch(sessionActions.setOpenTabs({ data: _openTabs }));

      scheduleTabNavHistoryPersist({
        workspaceId: workspace?.id,
        sessionId: workspaceState?.currentSession?.id,
        isInSession: sessionState?.isInSession,
        tabId,
        tabType: tab.type,
        navState: nextState,
      });

      const webview = findWebView();
      if (webview?.loadURL) {
        webview.loadURL(nextState.url);
      }
    },
    [
      tabId,
      tab,
      openTabs,
      dispatch,
      workspace?.id,
      workspaceState?.currentSession?.id,
      sessionState?.isInSession,
      findWebView,
    ]
  );

  /** Same as 2D AddressBar — WindowService.closeTab → util/tabs.closeTab */
  const handleCloseActiveTab = useCallback(() => {
    if (!tabId || tabId === "launchpad") {
      onClose?.();
      return;
    }
    dispatch(windowServiceActions.closeTab(tabId));
  }, [dispatch, tabId, onClose]);

  /** Dismiss window, then sleep all of its tabs (WindowService.sleepWindow) */
  const handlePauseWindow = useCallback(() => {
    if (!activeWindowId || activeWindowId === "launchpad") {
      onClose?.();
      return;
    }
    dispatch(windowServiceActions.sleepWindow(activeWindowId));
  }, [dispatch, activeWindowId, onClose]);

  const displayUrl = value || "about:blank";

  return (
    <div className="desktop-3d-address-bar" role="search">
      <button
        type="button"
        className="desktop-3d-address-bar-btn"
        onClick={() => navigateHistory("back")}
        disabled={!canGoBack}
        title="Back"
        aria-label="Back"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        className="desktop-3d-address-bar-btn"
        onClick={() => navigateHistory("forward")}
        disabled={!canGoForward}
        title="Forward"
        aria-label="Forward"
      >
        <ChevronRight size={16} />
      </button>
      <span className="desktop-3d-address-bar-lock" aria-hidden>
        <LockFill size={12} />
      </span>
      <input
        className="desktop-3d-address-bar-input"
        type="text"
        value={displayUrl}
        readOnly
        title={displayUrl}
        aria-label="Page address"
      />
      <button
        type="button"
        className="desktop-3d-address-bar-btn"
        onClick={reload}
        title="Reload"
        aria-label="Reload"
      >
        <ArrowClockwise size={14} />
      </button>
      <button
        type="button"
        className="desktop-3d-address-bar-btn"
        onClick={handlePauseWindow}
        title="Pause window"
        aria-label="Pause window"
      >
        <PauseFill size={14} />
      </button>
      <button
        type="button"
        className="desktop-3d-address-bar-btn"
        onClick={handleCloseActiveTab}
        title="Close tab"
        aria-label="Close tab"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default Desktop3DAddressBar;
