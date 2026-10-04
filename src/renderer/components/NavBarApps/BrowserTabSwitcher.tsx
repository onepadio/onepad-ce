import { useEffect, useState, type MouseEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import { PlusCircle, X } from "react-bootstrap-icons";

import {
  buildGroups,
  getTabScreenshot,
  switchBrowserTab,
  truncateTabTitle,
  type TabGroup,
} from "../../util/browserTabGroups";
import {
  syncBrowserWindowsIfNeeded,
  getSameSpaceBrowserWindowIds,
  resolveBrowserWindowId,
} from "../../util/browserWindows";
import { createBrowserGroup } from "../../util/browser";
import { closeTab, newTabForActiveWindow } from "../../util/tabs";
import { closeWindow } from "../../services/window";
import { sessionActions } from "../../store/session-slice";
import { formatTabTimeMeta } from "../../util/time";

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
  const isExternalWindowMode = useSelector(
    (state: any) => state.settings.isExternalWindowMode
  );
  const screenShotStatusVersion = useSelector(
    (state: any) => state.app.screenShotStatusVersion
  );
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

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

  if (!open) return null;

  function handleSelectTab(tab: any) {
    if (!tab) return;
    switchBrowserTab(tab, dispatch, openWindows, activeTabs, activeWindow?.id);
    onClose();
  }

  function handleNewGroup() {
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

  function handleNewTabInWindow(windowId: string, e?: MouseEvent) {
    e?.stopPropagation();
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

  function handleCloseChildTab(tab: any, e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    closeTab(
      tab,
      dispatch,
      openTabs,
      windowTabs,
      openWindows,
      browserWindows,
      activeWindow?.id,
      activeTabId,
      activeTabs,
      desktop,
      isExternalWindowMode,
      sessionActions,
      undefined
    );
  }

  function handleCloseGroup(windowId: string, e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const closedWorkspace = openWindows[windowId]?.workspace;
    const remaining = (browserWindows || [])
      .map(resolveBrowserWindowId)
      .filter((id: string | null | undefined): id is string => id != null && id !== windowId);
    const sameSpace = getSameSpaceBrowserWindowIds(
      browserWindows,
      openWindows,
      closedWorkspace,
      windowId
    );

    if (sameSpace.length > 0) {
      const nextId = sameSpace.at(-1);
      if (nextId && openWindows[nextId]) {
        dispatch(sessionActions.setActiveWindow({ data: openWindows[nextId] }));
        dispatch(sessionActions.setActiveBrowserWindowId({ data: nextId }));
      }
    } else {
      dispatch(
        sessionActions.getBackToLaunchPad({
          data: { desktopId: desktop.id },
        })
      );
    }

    dispatch(sessionActions.setBrowserWindows({ data: remaining }));
    closeWindow(
      dispatch,
      sessionActions,
      windowId,
      openWindows,
      openTabs,
      activeTabs,
      windowTabs,
      desktop,
      isExternalWindowMode
    );
  }

  function renderTabRow(
    tabId: string,
    options: {
      isParent: boolean;
      windowId: string;
      isFirstChild?: boolean;
      isLastChild?: boolean;
    }
  ) {
    const tab = openTabs[tabId];
    if (!tab) return null;

    const screenshot = getTabScreenshot(tabId);
    const isActive = tabId === activeTabId;
    const showClose = hoveredTabId === tabId || isActive;
    const title = truncateTabTitle(tab, options.isParent ? 48 : 40);
    const icon = tab?.state?.icon || "";
    const timeMeta = formatTabTimeMeta(tab.created, tab.lastAccessed);

    const row = (
      <div
        className={clsx(
          "browser-tab-switcher-row",
          showClose && "show-close"
        )}
        onMouseEnter={() => setHoveredTabId(tabId)}
        onMouseLeave={() => setHoveredTabId(null)}
      >
        <button
          type="button"
          className={clsx(
            "browser-tab-switcher-row-item",
            options.isParent ? "parent" : "child",
            isActive && "active",
            tab.sleeping && "sleeping"
          )}
          onClick={() => handleSelectTab(tab)}
          title={tab.state?.title || tab.state?.url || ""}
        >
          <div className="browser-tab-switcher-row-preview">
            {screenshot ? (
              <img src={screenshot} alt="" />
            ) : (
              <div className="browser-tab-switcher-row-placeholder">
                {icon ? <img src={icon} alt="" /> : null}
              </div>
            )}
          </div>
          <div className="browser-tab-switcher-row-meta">
            {icon ? (
              <img className="browser-tab-switcher-row-icon" src={icon} alt="" />
            ) : (
              <span className="browser-tab-switcher-row-icon-spacer" />
            )}
            <div className="browser-tab-switcher-row-text">
              <span className="browser-tab-switcher-row-title">{title}</span>
              {timeMeta ? (
                <span className="browser-tab-switcher-row-time">{timeMeta}</span>
              ) : null}
            </div>
          </div>
        </button>
        <button
          type="button"
          className="browser-tab-switcher-row-close"
          onClick={(e) =>
            options.isParent
              ? handleCloseGroup(options.windowId, e)
              : handleCloseChildTab(tab, e)
          }
          title={options.isParent ? "Close tab group" : "Close tab"}
          aria-label={options.isParent ? "Close tab group" : "Close tab"}
        >
          <X size={14} />
        </button>
      </div>
    );

    if (options.isParent) {
      return (
        <div key={tabId} className="browser-tab-switcher-tree-parent">
          {row}
        </div>
      );
    }

    return (
      <div
        key={tabId}
        className={clsx(
          "browser-tab-switcher-tree-child",
          options.isFirstChild && "first",
          options.isLastChild && "last"
        )}
      >
        <div className="browser-tab-switcher-tree-branch" aria-hidden="true" />
        {row}
      </div>
    );
  }

  function renderGroup(group: TabGroup) {
    const hasChildren = group.childTabIds.length > 0;
    const isActiveGroup = group.windowId === activeWindow?.id;

    return (
      <div
        key={group.windowId}
        className={clsx(
          "browser-tab-switcher-tree-group",
          isActiveGroup && "active-group",
          hasChildren && "has-children"
        )}
      >
        {renderTabRow(group.parentTabId!, {
          isParent: true,
          windowId: group.windowId,
        })}
        <div className="browser-tab-switcher-tree-children">
          {group.childTabIds.map((tabId, index) =>
            renderTabRow(tabId, {
              isParent: false,
              windowId: group.windowId,
              isFirstChild: index === 0,
              isLastChild: false,
            })
          )}
          <div
            className={clsx(
              "browser-tab-switcher-tree-child",
              "last",
              !hasChildren && "first"
            )}
          >
            <div className="browser-tab-switcher-tree-branch" aria-hidden="true" />
            <button
              type="button"
              className="browser-tab-switcher-add-tab"
              onClick={(e) => handleNewTabInWindow(group.windowId, e)}
              title="New Tab"
            >
              <PlusCircle size={14} />
              <span>New Tab</span>
            </button>
          </div>
        </div>
      </div>
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
                onClick={handleNewGroup}
                title="New Tab Group"
              >
                <PlusCircle size={16} />
                <span>Tab Group</span>
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

          <div
            className="browser-tab-switcher-tree"
            key={`tree-${screenShotStatusVersion}`}
          >
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
