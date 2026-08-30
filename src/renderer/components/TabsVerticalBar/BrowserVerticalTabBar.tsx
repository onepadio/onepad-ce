import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from "is-electron";
import log from "loglevel";
import clsx from "clsx";
import { Container, Row, Col, ListGroup, ListGroupItem } from "reactstrap";
import {
  PlusCircle,
  XCircleFill,
  ChevronRight,
  ChevronDown,
  Speedometer,
} from "react-bootstrap-icons";

import { sessionActions } from "../../store/session-slice";
import { windowActions } from "../../store/window-slice";
import { closeTab } from "../../util/tabs";
import { createBrowserGroup } from "../../util/browser";
import { closeWindow } from "../../services/window";
import {
  requestSidebarAutoHide,
  isNodeInAppsMenu,
} from "../../util/sidebarChrome";

import "./VerticalTabBar.css";
import "./BrowserVerticalTabBar.css";

type TabGroup = {
  windowId: string;
  parentTabId: string | null;
  childTabIds: string[];
};

function truncateTitle(tab: any, maxLen = 24): string {
  const title = tab?.state?.title || "";
  const url = tab?.state?.url || "";
  if (!title) {
    return url.length > maxLen ? url.substring(0, maxLen).concat("...") : url;
  }
  return title.length > maxLen ? title.substring(0, maxLen).concat("...") : title;
}

function getSortedTabIdsForWindow(windowId: string, windowTabs: any, openTabs: any): string[] {
  const tabIds = windowTabs[windowId];
  if (!tabIds || !Array.isArray(tabIds)) return [];

  return [...tabIds]
    .filter((tabId) => openTabs[tabId])
    .sort((a, b) => {
      const createdA = openTabs[a]?.created || 0;
      const createdB = openTabs[b]?.created || 0;
      return createdA - createdB;
    });
}

function buildGroups(browserWindows: string[], windowTabs: any, openTabs: any): TabGroup[] {
  return (browserWindows || [])
    .filter((windowId) => openTabs && windowTabs[windowId])
    .map((windowId) => {
      const sorted = getSortedTabIdsForWindow(windowId, windowTabs, openTabs);
      return {
        windowId,
        parentTabId: sorted[0] || null,
        childTabIds: sorted.slice(1),
      };
    })
    .filter((group) => group.parentTabId != null);
}

function BrowserVerticalTabBar() {
  const dispatch = useDispatch();

  const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);
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
  const showSidebar = useSelector((state: any) => state.window.showSidebar);
  const newTabUrl = useSelector((state: any) => state.browser.newTabUrl);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  const groups = buildGroups(browserWindows, windowTabs, openTabs);
  const homePage = newTabUrl || "https://www.google.com/";

  useEffect(() => {
    const container = document.getElementById("vertical-tab-bar");
    const overlay = document.getElementById("vertical-tab-bar-overlay");
    if (container != null) {
      if (showSidebar) {
        container.classList.add("vertical-tab-bar-open");
      } else {
        container.classList.remove("vertical-tab-bar-open");
        setHoveredTabId(null);
      }
    }
    if (overlay != null) {
      if (showSidebar) {
        overlay.classList.add("open");
      } else {
        overlay.classList.remove("open");
      }
    }
  }, [showSidebar]);

  function closeTabSidebar(e?: React.MouseEvent) {
    if (e && isNodeInAppsMenu(e.relatedTarget)) {
      return;
    }
    dispatch(windowActions.hideSidebar({}));
    requestSidebarAutoHide();
  }

  function toggleGroupCollapsed(windowId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setCollapsedGroups((prev) => ({
      ...prev,
      [windowId]: !prev[windowId],
    }));
  }

  function isGroupCollapsed(windowId: string, childCount: number) {
    if (childCount === 0) return false;
    if (collapsedGroups[windowId] !== undefined) {
      return collapsedGroups[windowId];
    }
    // Default: expand the active group, collapse others that have children
    return activeWindow?.id !== windowId;
  }

  function handleSwitchTab(tab: any) {
    log.debug("BrowserVerticalTabBar handleSwitchTab", tab);

    // Update this window's remembered active tab before switching windows.
    // App.tsx restores activeTabs[windowId] whenever activeWindow changes;
    // without this, clicking a child in another group shows that group's last tab.
    const _activeTabs = Object.assign({}, activeTabs);
    _activeTabs[tab.window] = tab.id;
    dispatch(sessionActions.setActiveTabs({ data: _activeTabs }));

    const win = openWindows[tab.window];
    if (win && activeWindow?.id !== tab.window) {
      dispatch(sessionActions.setActiveWindow({ data: win }));
      dispatch(sessionActions.setActiveBrowserWindowId({ data: tab.window }));
    }

    if (tab.location === "external") {
      if (isElectron()) {
        // @ts-expect-error
        window.electronAPI.send("toMain", {
          action: "switch-to-external-tab",
          tabWindowId: tab.window,
          tabId: tab.id,
          type: tab.type,
        });
      }
    } else {
      dispatch(sessionActions.setActiveTab({ data: tab }));
    }
  }

  function handleCloseChildTab(tab: any, e: React.MouseEvent) {
    e.stopPropagation();
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

  function handleCloseGroup(windowId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const filtered = (browserWindows || []).filter((id: string) => id !== windowId);

    if (filtered.length > 0) {
      const nextId = filtered.at(-1);
      if (openWindows[nextId]) {
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

    dispatch(sessionActions.setBrowserWindows({ data: filtered }));
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

  function handleNewGroup() {
    createBrowserGroup(
      openWindows,
      items,
      isLocal,
      desktop,
      workspace,
      dispatch,
      homePage,
      (browserWindows || []).length
    );
  }

  function handleMouseOver(tabId: string) {
    setHoveredTabId(tabId);
  }

  function handleMouseOut() {
    setHoveredTabId(null);
  }

  function tabIcon(tab: any) {
    return tab?.state?.icon || "";
  }

  function renderTabRow(
    tab: any,
    options: {
      isParent: boolean;
      windowId: string;
      childCount?: number;
      collapsed?: boolean;
      isFirstChild?: boolean;
      isLastChild?: boolean;
    }
  ) {
    if (!tab) return null;

    const isActive = tab.id === activeTabId;
    const showClose = hoveredTabId === tab.id || isActive;
    const title = truncateTitle(tab);
    const icon = tabIcon(tab);

    const row = (
      <div
        className={clsx(
          "col-12 vertical-tab-item",
          options.isParent ? "browser-group-parent" : "browser-group-child",
          isActive && "active"
        )}
        onMouseEnter={() => handleMouseOver(tab.id)}
        onMouseLeave={handleMouseOut}
      >
        <Container fluid>
          <Row>
            {options.isParent && (options.childCount || 0) > 0 ? (
              <Col
                xs={1}
                className="align-self-center tab-item-col browser-tab-chevron-col"
                onClick={(e) => toggleGroupCollapsed(options.windowId, e)}
              >
                {options.collapsed ? (
                  <ChevronRight size={12} color="gray" />
                ) : (
                  <ChevronDown size={12} color="gray" />
                )}
              </Col>
            ) : options.isParent ? (
              <Col xs={1} className="align-self-center tab-item-col browser-tab-chevron-col" />
            ) : null}

            <Col
              xs={options.isParent ? 1 : 2}
              className="align-self-center tab-item-col"
              onClick={() => handleSwitchTab(tab)}
            >
              <div className="appicon d-flex justify-content-center">
                <img width={16} className="launch-icon" src={icon} alt="" />
              </div>
            </Col>

            <Col
              xs={8}
              className="align-self-center tab-item-col"
              onClick={() => handleSwitchTab(tab)}
            >
              <div className="d-flex w-100 justify-content-start align-items-center">
                <span className="tab-title w-100" title={tab.state?.title || tab.state?.url}>
                  {title}
                </span>
                {tab.sleeping && !showClose && (
                  <Speedometer size={14} color="gray" className="ml-1" />
                )}
              </div>
            </Col>

            <Col xs={2} className="align-self-center tab-item-col">
              <div
                className={clsx(
                  "d-flex justify-content-end mr-2",
                  !showClose && "d-none"
                )}
              >
                <XCircleFill
                  size={14}
                  color="gray"
                  onClick={(e) =>
                    options.isParent
                      ? handleCloseGroup(options.windowId, e)
                      : handleCloseChildTab(tab, e)
                  }
                />
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );

    if (options.isParent) {
      return (
        <ListGroupItem
          key={tab.id}
          id={"tabItem" + tab.id}
          className="browser-tab-list-item browser-tab-parent"
        >
          {row}
        </ListGroupItem>
      );
    }

    return (
      <ListGroupItem
        key={tab.id}
        id={"tabItem" + tab.id}
        className={clsx(
          "browser-tab-list-item",
          "browser-tab-child-item",
          options.isFirstChild && "browser-tab-child-first",
          options.isLastChild && "browser-tab-child-last"
        )}
      >
        <div className="browser-tree-branch" aria-hidden="true" />
        {row}
      </ListGroupItem>
    );
  }

  function renderGroup(group: TabGroup) {
    const parentTab = openTabs[group.parentTabId!];
    const collapsed = isGroupCollapsed(group.windowId, group.childTabIds.length);
    const hasChildren = group.childTabIds.length > 0;

    return (
      <div
        key={group.windowId}
        className={clsx(
          "browser-tab-group",
          hasChildren && !collapsed && "browser-tab-group-expanded"
        )}
      >
        {renderTabRow(parentTab, {
          isParent: true,
          windowId: group.windowId,
          childCount: group.childTabIds.length,
          collapsed,
        })}
        {!collapsed && hasChildren && (
          <div className="browser-tab-children">
            {group.childTabIds.map((tabId, index) =>
              renderTabRow(openTabs[tabId], {
                isParent: false,
                windowId: group.windowId,
                isFirstChild: index === 0,
                isLastChild: index === group.childTabIds.length - 1,
              })
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        className={clsx(
          "!m-0 fixed inset-0",
          "items-end justify-end",
          "vertical-tab-bar-overlay",
          "flex"
        )}
        id="vertical-tab-bar-overlay"
        onClick={() => {
          dispatch(windowActions.hideSidebar({}));
          requestSidebarAutoHide();
        }}
      />
      <div
        id="vertical-tab-bar"
        className="d-flex justify-content-start vertical-tabbar bg-dark w-100"
        onMouseLeave={(e) => closeTabSidebar(e)}
      >
        <div className="tabs-menu-container">
          <div className="new-tab-button-fixed">
            <ListGroupItem
              key="new-tab-button"
              className="cursor-pointer"
              onClick={() => handleNewGroup()}
              style={{ cursor: "pointer" }}
            >
              <div className="col-12 d-flex align-items-center justify-content-center py-2">
                <PlusCircle size={20} color="white" className="mr-2" />
                <span className="text-white">New Tab</span>
              </div>
            </ListGroupItem>
          </div>
          <ListGroup className="w-100 bg-dark tabs-menu-scrollable browser-groups-list">
            {groups.map((group) => renderGroup(group))}
          </ListGroup>
        </div>
      </div>
    </>
  );
}

export default BrowserVerticalTabBar;
