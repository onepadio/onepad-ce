import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PlusCircle, X } from "react-bootstrap-icons";

import {
  buildGroups,
  getSortedTabIdsForWindow,
  getTabScreenshot,
  switchAppTab,
  switchBrowserTab,
  truncateTabTitle,
} from "../../util/browserTabGroups";
import {
  syncBrowserWindowsIfNeeded,
} from "../../util/browserWindows";
import { newTabForActiveWindow } from "../../util/tabs";
import { resolveIconUrl } from "./resolveIconUrl";

import LaunchPad3DStage from "./LaunchPad3DStage";
import Desktop3DChrome from "./Desktop3DChrome";
import type { LaunchPadCard, Launchpad3dLayoutId } from "./types";
import { getMissionColumns } from "./layouts/layoutMath";

import "./LaunchPad3D.css";
import "../NavBarApps/AppTabSwitcher.css";

function selectDesktop3dLayout(state: any): Launchpad3dLayoutId {
  return (
    state.settings.desktop3dLayout ||
    state.settings.launchpad3dLayout ||
    "coverflow"
  );
}

export type TabSwitcher3DScope = "app" | "browser";

interface TabSwitcher3DProps {
  open: boolean;
  scope: TabSwitcher3DScope;
  /** Required when scope === "app" */
  windowId?: string | null;
  anchorX?: number | null;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function TabSwitcher3D({
  open,
  scope,
  windowId = null,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: TabSwitcher3DProps) {
  const dispatch = useDispatch();

  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const activeWindow = useSelector((state: any) => state.session.activeWindow);
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const browserWindows = useSelector(
    (state: any) => state.session.browserWindows
  );
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const layout = useSelector(selectDesktop3dLayout);
  const screenShotStatusVersion = useSelector(
    (state: any) => state.app.screenShotStatusVersion
  );

  const [focusedIndex, setFocusedIndex] = useState(0);

  const appTabIds = useMemo(() => {
    if (scope !== "app" || !windowId) return [];
    return getSortedTabIdsForWindow(windowId, windowTabs, openTabs);
  }, [scope, windowId, windowTabs, openTabs]);

  const browserGroups = useMemo(() => {
    if (scope !== "browser") return [];
    return buildGroups(
      openWindows,
      browserWindows,
      windowTabs,
      openTabs,
      workspace?.id
    );
  }, [
    scope,
    openWindows,
    browserWindows,
    windowTabs,
    openTabs,
    workspace?.id,
  ]);

  const tabIds = useMemo(() => {
    if (scope === "app") return appTabIds;
    // Flatten browser groups: parent + children
    const ids: string[] = [];
    browserGroups.forEach((g) => {
      if (g.parentTabId) ids.push(g.parentTabId);
      g.childTabIds.forEach((id) => ids.push(id));
    });
    return ids;
  }, [scope, appTabIds, browserGroups]);

  const cards: LaunchPadCard[] = useMemo(() => {
    return tabIds
      .map((tabId) => {
        const tab = openTabs[tabId];
        if (!tab) return null;
        const screenshot = getTabScreenshot(tabId);
        const icon = resolveIconUrl(tab?.state?.icon, tab?.state?.url);
        return {
          id: tabId,
          title: truncateTabTitle(tab, 32),
          imageUrl: screenshot || icon,
          kind: "tab" as const,
          subtitle: tab?.state?.url,
          isActive: tabId === activeTabId,
          isSleeping: !!tab.sleeping,
        };
      })
      .filter(Boolean) as LaunchPadCard[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabIds, openTabs, activeTabId, screenShotStatusVersion]);

  useEffect(() => {
    if (!open) return;
    if (scope === "browser") {
      syncBrowserWindowsIfNeeded(
        browserWindows,
        openWindows,
        windowTabs,
        dispatch
      );
    }
  }, [open, scope, browserWindows, openWindows, windowTabs, dispatch]);

  useEffect(() => {
    if (!open) return;
    const activeIdx = cards.findIndex((c) => c.id === activeTabId);
    setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
  }, [open, cards, activeTabId]);

  const handleSelect = useCallback(
    (id: string) => {
      const tab = openTabs[id];
      if (!tab) return;
      if (scope === "app") {
        switchAppTab(tab, dispatch, openWindows, activeTabs, activeWindow?.id);
      } else {
        switchBrowserTab(
          tab,
          dispatch,
          openWindows,
          activeTabs,
          activeWindow?.id
        );
      }
      onClose();
    },
    [
      openTabs,
      scope,
      dispatch,
      openWindows,
      activeTabs,
      activeWindow?.id,
      onClose,
    ]
  );

  const onBrowseDelta = useCallback(
    (delta: number) => {
      if (cards.length === 0) return;
      setFocusedIndex((prev) => (prev + delta + cards.length) % cards.length);
    },
    [cards.length]
  );

  const onBrowseRowDelta = useCallback(
    (delta: number) => {
      if (cards.length === 0) return;
      const cols = getMissionColumns(cards.length);
      setFocusedIndex((prev) => {
        let next = prev + delta * cols;
        if (next < 0 || next >= cards.length) return prev;
        return next;
      });
    },
    [cards.length]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (cards.length === 0) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onBrowseDelta(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onBrowseDelta(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (layout === "mission") onBrowseRowDelta(-1);
        else onBrowseDelta(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (layout === "mission") onBrowseRowDelta(1);
        else onBrowseDelta(1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const card = cards[focusedIndex];
        if (card) handleSelect(card.id);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    open,
    cards,
    focusedIndex,
    onBrowseDelta,
    onBrowseRowDelta,
    handleSelect,
    onClose,
    layout,
  ]);

  function handleNewTab() {
    if (scope === "app" && windowId) {
      const targetWindow = openWindows[windowId];
      if (!targetWindow) return;
      newTabForActiveWindow(
        dispatch,
        workspace,
        desktop,
        windowTabs,
        openTabs,
        activeTabs,
        targetWindow
      );
      onClose();
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        className="app-tab-switcher-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="tab-switcher-3d"
        role="dialog"
        aria-label={scope === "app" ? "Switch app tab" : "Switch browser tab"}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="tab-switcher-3d-inner">
          <div className="tab-switcher-3d-toolbar">
            <Desktop3DChrome compact />
            {scope === "app" && (
              <button
                type="button"
                className="app-tab-switcher-new-tab"
                onClick={handleNewTab}
                title="New Tab"
              >
                <div className="app-tab-switcher-new-tab-preview">
                  <PlusCircle size={22} />
                </div>
                <span className="app-tab-switcher-new-tab-label">New Tab</span>
              </button>
            )}
            <button
              type="button"
              className="app-tab-switcher-close"
              onClick={onClose}
              title="Close"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {cards.length === 0 ? (
            <div className="launchpad-3d-empty">No tabs open</div>
          ) : (
            <LaunchPad3DStage
              className="tab-switcher-3d-stage"
              cards={cards}
              layout={layout}
              focusedIndex={focusedIndex}
              onSelect={handleSelect}
              onFocusIndex={setFocusedIndex}
              onBrowseDelta={onBrowseDelta}
              onBrowseRowDelta={onBrowseRowDelta}
              active={open}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default TabSwitcher3D;
