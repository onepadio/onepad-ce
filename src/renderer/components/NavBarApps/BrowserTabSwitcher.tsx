import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import { ChevronDown, ChevronRight, PlusCircle, X } from "react-bootstrap-icons";

import {
  buildGroups,
  getTabScreenshot,
  switchBrowserTab,
  truncateTabTitle,
  type TabGroup,
} from "../../util/browserTabGroups";
import { syncBrowserWindowsIfNeeded } from "../../util/browserWindows";
import { createBrowserGroup } from "../../util/browser";

import "./BrowserTabSwitcher.css";

interface BrowserTabSwitcherProps {
  open: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function BrowserTabSwitcher({
  open,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: BrowserTabSwitcherProps) {
  const dispatch = useDispatch();

  const openWindows = useSelector((state: any) => state.session.openWindows);
  const browserWindows = useSelector((state: any) => state.session.browserWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const activeWindow = useSelector((state: any) => state.session.activeWindow);
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const items = useSelector((state: any) => state.workspace.items);
  const isLocal = useSelector((state: any) => state.workspace.isLocal);
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const newTabUrl = useSelector((state: any) => state.browser.newTabUrl);
  const screenShotStatusVersion = useSelector(
    (state: any) => state.app.screenShotStatusVersion
  );

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const groups = buildGroups(
    openWindows,
    browserWindows,
    windowTabs,
    openTabs,
    workspace?.id
  );
  const homePage = newTabUrl || "https://www.google.com/";

  useEffect(() => {
    if (!open) return;
    syncBrowserWindowsIfNeeded(browserWindows, openWindows, windowTabs, dispatch);
  }, [open, browserWindows, openWindows, windowTabs, dispatch]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // When opening, expand only the active group by default
  useEffect(() => {
    if (!open) return;
    const next: Record<string, boolean> = {};
    groups.forEach((group) => {
      next[group.windowId] = group.windowId !== activeWindow?.id;
    });
    setCollapsedGroups(next);
    // Only reset collapse state when overlay opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function isGroupCollapsed(windowId: string) {
    if (collapsedGroups[windowId] !== undefined) {
      return collapsedGroups[windowId];
    }
    return activeWindow?.id !== windowId;
  }

  function toggleGroup(windowId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setCollapsedGroups((prev) => ({
      ...prev,
      [windowId]: !isGroupCollapsed(windowId),
    }));
  }

  function handleSelectTab(tab: any) {
    if (!tab) return;
    switchBrowserTab(tab, dispatch, openWindows, activeTabs, activeWindow?.id);
    onClose();
  }

  function handleNewTab() {
    const created = createBrowserGroup(
      openWindows,
      items,
      isLocal,
      desktop,
      workspace,
      dispatch,
      homePage,
      (browserWindows || []).length
    );
    if (created) {
      onClose();
    }
  }

  function groupTabIds(group: TabGroup): string[] {
    const ids = [group.parentTabId!, ...group.childTabIds];
    return ids.filter((id) => openTabs[id]);
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
        className={clsx("browser-tab-switcher-tile", isActive && "active")}
        onClick={() => handleSelectTab(tab)}
        title={tab.state?.title || tab.state?.url || ""}
      >
        <div className="browser-tab-switcher-tile-preview">
          {screenshot ? (
            <img src={screenshot} alt="" />
          ) : (
            <div className="browser-tab-switcher-tile-placeholder">
              {icon ? <img src={icon} alt="" /> : null}
            </div>
          )}
        </div>
        <div className="browser-tab-switcher-tile-meta">
          {icon ? (
            <img className="browser-tab-switcher-tile-icon" src={icon} alt="" />
          ) : (
            <span className="browser-tab-switcher-tile-icon-spacer" />
          )}
          <span className="browser-tab-switcher-tile-title">{title}</span>
        </div>
      </button>
    );
  }

  function renderGroup(group: TabGroup) {
    const parentTab = openTabs[group.parentTabId!];
    const collapsed = isGroupCollapsed(group.windowId);
    const tabIds = groupTabIds(group);
    const groupTitle = truncateTabTitle(parentTab, 48);
    const groupIcon = parentTab?.state?.icon || "";
    const isActiveGroup = group.windowId === activeWindow?.id;

    return (
      <section
        key={group.windowId}
        className={clsx(
          "browser-tab-switcher-group",
          isActiveGroup && "active-group",
          !collapsed && "expanded"
        )}
      >
        <button
          type="button"
          className="browser-tab-switcher-group-header"
          onClick={(e) => toggleGroup(group.windowId, e)}
        >
          <span className="browser-tab-switcher-group-chevron">
            {collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </span>
          {groupIcon ? (
            <img
              className="browser-tab-switcher-group-icon"
              src={groupIcon}
              alt=""
            />
          ) : null}
          <span className="browser-tab-switcher-group-title">{groupTitle}</span>
          <span className="browser-tab-switcher-group-count">{tabIds.length}</span>
        </button>

        {!collapsed && (
          <div
            className="browser-tab-switcher-row"
            key={`row-${group.windowId}-${screenShotStatusVersion}`}
          >
            {tabIds.map((tabId) => renderTabTile(tabId))}
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      <div
        className="browser-tab-switcher-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="browser-tab-switcher-panel"
        role="dialog"
        aria-label="Switch browser tab"
      >
        <div
          className="browser-tab-switcher-panel-inner"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="browser-tab-switcher-toolbar">
            <span className="browser-tab-switcher-heading">Others</span>
            <div className="browser-tab-switcher-toolbar-actions">
              <button
                type="button"
                className="browser-tab-switcher-new-tab"
                onClick={handleNewTab}
                title="New Tab"
              >
                <PlusCircle size={16} />
                <span>New Tab</span>
              </button>
              <button
                type="button"
                className="browser-tab-switcher-close"
                onClick={onClose}
                title="Close"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="browser-tab-switcher-groups">
            {groups.length === 0 ? (
              <div className="browser-tab-switcher-empty">No browser tabs open</div>
            ) : (
              groups.map((group) => renderGroup(group))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default BrowserTabSwitcher;
