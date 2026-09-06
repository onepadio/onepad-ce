import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  X,
} from "react-bootstrap-icons";

import {
  getSortedTabIdsForWindow,
  getTabScreenshot,
  switchAppTab,
  truncateTabTitle,
} from "../../util/browserTabGroups";
import { newTabForActiveWindow } from "../../util/tabs";

import "./AppTabSwitcher.css";

const VIEWPORT_MARGIN = 16;

interface AppTabSwitcherProps {
  open: boolean;
  windowId: string | null;
  /** Horizontal center of the dock app icon, in viewport coordinates */
  anchorX?: number | null;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function AppTabSwitcher({
  open,
  windowId,
  anchorX = null,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: AppTabSwitcherProps) {
  const dispatch = useDispatch();

  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const activeWindow = useSelector((state: any) => state.session.activeWindow);
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const screenShotStatusVersion = useSelector(
    (state: any) => state.app.screenShotStatusVersion
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const stripInnerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [positionLeft, setPositionLeft] = useState<number | null>(null);

  const tabIds = windowId
    ? getSortedTabIdsForWindow(windowId, windowTabs, openTabs)
    : [];

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(maxScroll - el.scrollLeft > 2);
  }, []);

  const updateHorizontalPosition = useCallback(() => {
    const el = stripInnerRef.current;
    if (!el || typeof anchorX !== "number") {
      setPositionLeft(null);
      return;
    }

    const width = el.offsetWidth;
    const half = width / 2;
    const minCenter = VIEWPORT_MARGIN + half;
    const maxCenter = window.innerWidth - VIEWPORT_MARGIN - half;
    const clampedCenter = Math.max(minCenter, Math.min(anchorX, maxCenter));
    setPositionLeft(clampedCenter);
  }, [anchorX]);

  useLayoutEffect(() => {
    if (!open) {
      setPositionLeft(null);
      return;
    }
    updateHorizontalPosition();
  }, [open, anchorX, tabIds.length, screenShotStatusVersion, updateHorizontalPosition]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const onResize = () => updateHorizontalPosition();

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open, onClose, updateHorizontalPosition]);

  useEffect(() => {
    if (!open) return;

    const el = scrollRef.current;
    if (!el) return;

    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            updateScrollButtons();
            updateHorizontalPosition();
          })
        : null;
    if (stripInnerRef.current) {
      ro?.observe(stripInnerRef.current);
    }
    ro?.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
      ro?.disconnect();
    };
  }, [open, tabIds.length, screenShotStatusVersion, updateScrollButtons, updateHorizontalPosition]);

  if (!open || !windowId) return null;

  function handleSelectTab(tab: any) {
    if (!tab) return;
    switchAppTab(tab, dispatch, openWindows, activeTabs, activeWindow?.id);
    onClose();
  }

  function handleNewTab() {
    const targetWindow = openWindows[windowId!];
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

  function scrollByDir(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.7, 180);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  function renderTabTile(tabId: string) {
    const tab = openTabs[tabId];
    if (!tab) return null;

    const screenshot = getTabScreenshot(tabId);
    const isActive = tabId === activeTabId;
    const title = truncateTabTitle(tab, 28);
    const icon = tab?.state?.icon || "";

    return (
      <button
        key={tabId}
        type="button"
        className={clsx(
          "app-tab-switcher-tile",
          isActive && "active",
          tab.sleeping && "sleeping"
        )}
        onClick={() => handleSelectTab(tab)}
        title={tab.state?.title || tab.state?.url || ""}
      >
        <div className="app-tab-switcher-tile-preview">
          {screenshot ? (
            <img src={screenshot} alt="" />
          ) : (
            <div className="app-tab-switcher-tile-placeholder">
              {icon ? <img src={icon} alt="" /> : null}
            </div>
          )}
        </div>
        <div className="app-tab-switcher-tile-meta">
          {icon ? (
            <img className="app-tab-switcher-tile-icon" src={icon} alt="" />
          ) : (
            <span className="app-tab-switcher-tile-icon-spacer" />
          )}
          <span className="app-tab-switcher-tile-title">{title}</span>
        </div>
      </button>
    );
  }

  const anchored = typeof positionLeft === "number";

  return (
    <>
      <div
        className="app-tab-switcher-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={clsx(
          "app-tab-switcher-strip",
          anchored && "app-tab-switcher-strip-anchored"
        )}
        role="dialog"
        aria-label="Switch app tab"
        style={anchored ? { left: positionLeft } : undefined}
      >
        <div
          ref={stripInnerRef}
          className="app-tab-switcher-strip-inner"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="app-tab-switcher-scroll-wrap">
            {canScrollLeft && (
              <button
                type="button"
                className="app-tab-switcher-nav app-tab-switcher-nav-left"
                onClick={() => scrollByDir(-1)}
                title="Scroll left"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            <div
              ref={scrollRef}
              className="app-tab-switcher-scroll"
              key={`app-row-${windowId}-${screenShotStatusVersion}`}
            >
              {tabIds.length === 0 ? (
                <div className="app-tab-switcher-empty">No tabs open</div>
              ) : (
                tabIds.map((tabId) => renderTabTile(tabId))
              )}
            </div>

            {canScrollRight && (
              <button
                type="button"
                className="app-tab-switcher-nav app-tab-switcher-nav-right"
                onClick={() => scrollByDir(1)}
                title="Scroll right"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>

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
      </div>
    </>
  );
}

export default AppTabSwitcher;
