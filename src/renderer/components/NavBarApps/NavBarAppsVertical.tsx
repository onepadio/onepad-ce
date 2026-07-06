import React, { useState, useEffect } from "react";
import { ListGroupItem } from "reactstrap";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { ThreeDots, ChevronUp, ChevronDown, Star, Pin, PinFill } from "react-bootstrap-icons";
import log from "loglevel";

import { appActions } from "../../store/app-slice";
import { sessionActions } from "../../store/session-slice";
import { openAppWindow, openInternalWindow } from "../../services/window";
import { windowServiceActions } from "../../store/window-service-slice";
import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from "../../store/workspace-slice";
import DesktopService from "../../services/desktop";
import AppService from "../../services/app";
import { LinkService } from "../../services/link";

// @ts-expect-error TS(2307): Cannot find module or its corresponding type declarations.
import defaultIcon from "../../images/default_icon.png";

import "./NavBarAppsVertical.css";

interface NavBarAppsVerticalProps {
  apps: any[];
}

function NavBarAppsVertical({ apps }: NavBarAppsVerticalProps) {
  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const profileId = useSelector((state: any) => state.app.profileId);
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  const windowHistory = useSelector((state: any) => state.session.windowHistory);
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const workspaceApps = useSelector((state: any) => state.workspace.apps);
  const workspaceLinks = useSelector((state: any) => state.workspace.links);
  const isLocal = useSelector((state: any) => state.workspace.isLocal);
  const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

  const pinnedApps = desktop?.state?.pinnedApps || [];

  function handleSwitchWindow(item: any) {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(appActions.hideTabsScreen());

    // Check if window is open
    const isWindowOpen = openWindows[item.id] != null;

    if (!isWindowOpen) {
      // Window is closed, open it
      handleOpenClosedPinnedApp(item);
      return;
    }

    if (activeWindowId === item.id) {
      dispatch(
        sessionActions.goBackToPreviousWindow({
          data: {
            desktopId: desktop.id,
          },
        })
      );
      return;
    }
    if (item.location === "external") {
      openAppWindow(
        item.id,
        item.start_url,
        item.window_type,
        item.is_stateful,
        item.show_controls
      );
    } else {
      dispatch(sessionActions.setActiveWindow({ data: item }));
      if (openWindows[item.id].sleeping === true) {
        dispatch(appActions.showSplashScreen({}));
        setTimeout(() => {
          dispatch(appActions.hideSplashScreen({}));
        }, 1000);
      }
    }
  }

  async function handleTogglePin(appId: string) {
    if (!desktop?.id) return;

    try {
      await DesktopService.togglePinnedApp(desktop.id, appId);
      log.debug("Toggled pin for app:", appId);

      // Update the desktop in Redux store
      const updatedDesktop = await DesktopService.get(desktop.id);
      dispatch(workspaceActions.selectDesktop({ desktop: updatedDesktop }));
    } catch (error) {
      log.error("Error toggling pin:", error);
    }
  }

  function getPartitionId(workspaceId: string) {
    return `persist:workspace-${workspaceId}`;
  }

  function newTab(windowId: string, url: string, icon: string, title: string, isolated = false) {
    const now = new Date().getTime();
    return {
      id: uuidv4(),
      url: url,
      location: "main",
      type: "app",
      desktop: desktop.id,
      workspace: workspace.id,
      window: windowId,
      partition: getPartitionId(workspace.id),
      isolated: isolated,
      state: {
        url: url,
        title: title,
        icon: icon,
      },
      created: now,
      lastAccessed: now,
    };
  }

  async function handleOpenClosedPinnedApp(appData: any) {
    log.debug("Opening closed pinned app:", appData);

    if (appData.type === "app") {
      // Handle app opening
      const app = await AppService.get(appData.id);
      if (!app) {
        log.error("App not found:", appData.id);
        return;
      }

      const url = app.data.customUrl && app.data.customUrl.length > 0
        ? app.data.customUrl
        : app.data.startUrl;

      const window = {
        workspace: workspace.id,
        id: app.id,
        url: url,
        location: "main",
      };

      let _openWindows = Object.assign({}, openWindows);
      let _openTabs = Object.assign({}, openTabs);
      let _windowTabs = Object.assign({}, windowTabs);

      openInternalWindow(
        window,
        workspaceApps,
        _openWindows,
        isLocal,
        (result: any) => {
          if (result === undefined || result === null) {
            return;
          }

          let _result = Object.assign({}, app);
          _result.type = "app";
          _result.url = url;
          _result.location = "main";
          _result.desktop = desktop.id;
          _result.partition = getPartitionId(workspace.id);

          // Open windows
          _openWindows[app.id] = _result;
          dispatch(sessionActions.setOpenWindows({ data: _openWindows }));

          // Create tab
          let _tabIds: string[] = [];
          let _tab = newTab(app.id, url, app.data.icon, app.data.name, app.data.isolated || false);
          _openTabs[_tab.id] = _tab;
          _tabIds.push(_tab.id);

          dispatch(sessionActions.setOpenTabs({ data: _openTabs }));

          // Window tabs
          _windowTabs[_result.id] = _tabIds;
          dispatch(sessionActions.setWindowTabs({ data: _windowTabs }));

          dispatch(sessionActions.setActiveWindow({ data: _result }));
          dispatch(appActions.showSplashScreen({}));
          setTimeout(() => {
            dispatch(appActions.hideSplashScreen({}));
          }, 1000);
        }
      );
    } else if (appData.type === "link") {
      // Handle link opening
      const link = await LinkService.get(appData.id);
      if (!link) {
        log.error("Link not found:", appData.id);
        return;
      }

      const window = {
        workspace: workspace.id,
        id: link.id,
        url: link.data.startUrl,
        location: "main",
      };

      let _openWindows = Object.assign({}, openWindows);
      let _openTabs = Object.assign({}, openTabs);
      let _windowTabs = Object.assign({}, windowTabs);

      openInternalWindow(
        window,
        workspaceLinks,
        _openWindows,
        isLocal,
        (result: any) => {
          if (result === undefined || result === null) {
            return;
          }

          let _result = Object.assign({}, link);
          _result.type = "link";
          _result.url = link.data.startUrl;
          _result.location = "main";
          _result.desktop = desktop.id;

          // Open windows
          _openWindows[link.id] = _result;
          dispatch(sessionActions.setOpenWindows({ data: _openWindows }));

          // Create tab
          let _tabIds: string[] = [];
          let _tab = newTab(link.id, link.data.startUrl, link.data.icon, link.data.title);
          _openTabs[_tab.id] = _tab;
          _tabIds.push(_tab.id);

          dispatch(sessionActions.setOpenTabs({ data: _openTabs }));

          // Window tabs
          _windowTabs[_result.id] = _tabIds;
          dispatch(sessionActions.setWindowTabs({ data: _windowTabs }));

          dispatch(sessionActions.setActiveWindow({ data: _result }));
          dispatch(appActions.showSplashScreen({}));
          setTimeout(() => {
            dispatch(appActions.hideSplashScreen({}));
          }, 1000);
        }
      );
    }
  }

  function navBarItem(item: any) {
    if (item.type === "browser") return <></>;
    let _icon = "";
    let _title = item.type === "app" ? item.data.name : item.data.title;
    // Check if this app is in favourites (xapps list)
    const favouriteIds = JSON.parse(localStorage.getItem(`xappIds-${profileId}`) || "[]");
    const isFavourite = favouriteIds.includes(item.id);
    const isWindowOpen = openWindows[item.id] != null;

    try {
      if (item.data.startUrl && item.data.startUrl.startsWith("https://google.com")) {
        _icon = item.data.icon;
      } else {
        _icon =
          localStorage.getItem(item.data.icon) == null
            ? item.data.icon.length === 0
              ? defaultIcon
              : item.data.icon
            : localStorage.getItem(item.data.icon);
        if (!(_icon.startsWith("http") || _icon.startsWith("data:"))) {
          _icon = "./images/store/icon/" + item.data.icon;
        }
      }

      let itemClassName = "d-flex justify-content-center align-items-center m-1 mt-3 menu-icon";
      if (item.id === activeWindowId) {
        itemClassName += " active";
      }
      if (!isWindowOpen) {
        itemClassName += " closed";
      }

      return (
        <ListGroupItem
          key={uuidv4()}
          id={item.id}
          className={itemClassName}
          onClick={() => handleSwitchWindow(item)}
        >
          <div
            className="appicon d-flex justify-content-center"
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            title={_title}
            data-bs-custom-className="custom-tooltip"
            onContextMenu={(e) => {
              e.preventDefault();
              const isPinned = pinnedApps.includes(item.id);
              const isWindowOpen = openWindows[item.id] != null;

              // remove all other context menus
              document.querySelectorAll(".context-menu").forEach((menu) => {
                document.body.removeChild(menu);
              });
              let _menu = document.createElement("div");
              _menu.id = "context-menu-" + item.id;
              _menu.className = "context-menu";
              _menu.innerHTML = `
                <div class="context-menu-item pin-item">
                  ${isPinned ? `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin-fill" viewBox="0 0 16 16">
                      <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A6 6 0 0 1 5 6.708V2.277a3 3 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354"/>
                    </svg>
                  ` : `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin" viewBox="0 0 16 16">
                      <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A6 6 0 0 1 5 6.708V2.277a3 3 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354m1.58 1.408-.002-.001zm-.002-.001.002.001A.5.5 0 0 1 6 2v5a.5.5 0 0 1-.276.447h-.002l-.012.007-.054.03a5 5 0 0 0-.827.58c-.318.278-.585.596-.725.936h7.792c-.14-.34-.407-.658-.725-.936a5 5 0 0 0-.881-.61l-.012-.006h-.002A.5.5 0 0 1 10 7V2a.5.5 0 0 1 .295-.458 1.8 1.8 0 0 0 .351-.271c.08-.08.155-.17.214-.271H5.14q.091.15.214.271a1.8 1.8 0 0 0 .37.282"/>
                    </svg>
                  `}
                  <span>${isPinned ? 'Unpin' : 'Pin'}</span>
                </div>
                <div class="context-menu-item${!isWindowOpen ? ' disabled' : ''}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                  </svg>
                  <span>Close</span>
                </div>
              `;
              _menu.style.position = "fixed";
              _menu.style.top = e.clientY + "px";
              _menu.style.left = (e.clientX + 10) + "px";
              document.body.appendChild(_menu);

              _menu?.querySelector(".context-menu-item.pin-item")
                ?.addEventListener("click", () => {
                  handleTogglePin(item.id);
                  document.body.removeChild(_menu);
                });

              _menu?.querySelector(".context-menu-item:nth-child(2)")
                ?.addEventListener("click", () => {
                  if (isWindowOpen) {
                    dispatch(windowServiceActions.closeWindow(item.id));
                    document.body.removeChild(_menu);
                  }
                });

              _menu?.addEventListener("mouseleave", () => {
                if (document.body.contains(_menu)) {
                  document.body.removeChild(_menu);
                }
              });

              // Close menu when clicking outside
              const closeMenu = (e: any) => {
                if (
                  document.body.contains(_menu) &&
                  !_menu.contains(e.target)
                ) {
                  document.body.removeChild(_menu);
                  document?.removeEventListener("click", closeMenu);
                }
              };

              setTimeout(() => {
                document?.addEventListener("click", closeMenu);
              }, 0);
            }}
          >
            <img
              width={36}
              className="launch-icon"
              src={_icon}
              alt=""
            />
          </div>
          {
            windowTabs[item.id] && windowTabs[item.id].length > 0 && (
              <span className="position-absolute bottom-0 right-0 translate-bottom badge rounded-pill bg-primary">{windowTabs[item.id].length}</span>
            )
          }
          {
            isFavourite && (
              <span className="favourite-star">
                <Star color="white" size={12} />
              </span>
            )
          }
          {
            pinnedApps.includes(item.id) && (
              <span className="pinned-indicator">
                <PinFill color="white" size={10} />
              </span>
            )
          }
        </ListGroupItem>
      );
    } catch (error) {
      console.error(error);
      return <></>;
    }
  }

  // Filter apps and sort by recent usage (most recently used first)
  const filteredApps = apps.filter(app => app.type !== "browser");
  const xapps = apps.filter(app => app.type === "xapp");

  // Get closed pinned apps from workspace apps/links
  const closedPinnedApps: any[] = [];
  pinnedApps.forEach((pinnedId: string) => {
    // Check if this pinned app is already in the open windows (apps list)
    const isOpen = filteredApps.some((app: any) => app.id === pinnedId);
    if (!isOpen) {
      // Look for this app in workspace apps or links
      const workspaceApp = workspaceApps.find((app: any) => app.id === pinnedId);
      if (workspaceApp) {
        closedPinnedApps.push({
          id: workspaceApp.id,
          type: "app",
          data: workspaceApp.data,
          workspace: workspaceApp.workspace,
        });
      } else {
        const workspaceLink = workspaceLinks.find((link: any) => link.id === pinnedId);
        if (workspaceLink) {
          closedPinnedApps.push({
            id: workspaceLink.id,
            type: "link",
            data: workspaceLink.data,
            workspace: workspaceLink.workspace,
          });
        }
      }
    }
  });

  // Combine open apps with closed pinned apps
  const allAppsIncludingClosed = [...filteredApps, ...closedPinnedApps];

  // Separate pinned and unpinned apps
  const pinnedItems = allAppsIncludingClosed.filter((app: any) => pinnedApps.includes(app.id));
  const unpinnedItems = allAppsIncludingClosed.filter((app: any) => !pinnedApps.includes(app.id));

  // Show 1 item when collapsed, 7 when expanded
  const collapsedItems = 5;
  const expandedItems = 999;
  const maxVisibleItems = expandedItems; // no collapse anymore

  // Always show pinned apps, then fill remaining slots with unpinned apps
  const unpinnedSlotsAvailable = Math.max(0, maxVisibleItems - pinnedItems.length);
  const visibleUnpinnedItems = unpinnedItems.slice(0, unpinnedSlotsAvailable);
  const visibleItems = [...pinnedItems, ...visibleUnpinnedItems];

  const hasMoreItems = allAppsIncludingClosed.length > maxVisibleItems;
  const hasChevronButton = allAppsIncludingClosed.length > collapsedItems;

  function renderChevronButton() {
    if (!hasChevronButton) return null;

    function handleChevronButtonClick() {
      setIsCollapsed(!isCollapsed);
    }

    return (
      <ListGroupItem
        key="chevron-button"
        className="d-flex justify-content-center align-items-center m-1 mt-3 menu-icon chevron-button d-none"
        onClick={handleChevronButtonClick}
        title={isCollapsed ? `Show ${expandedItems} recent windows` : "Show only 1 recent window"}
      >
        <div className="appicon d-flex justify-content-center">
          <div className="chevron-icon">
            {isCollapsed ? (
              <ChevronDown color="white" size={20} />
            ) : (
              <ChevronUp color="white" size={20} />
            )}
          </div>
        </div>
      </ListGroupItem>
    );
  }

  return (
    <div className={`navbar-apps-vertical-container mt-2 ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="navbar-apps-vertical-wrapper">
        <div className="navbar-apps-vertical">
          {visibleItems.map((item) => {
            return navBarItem(item);
          })}
        </div>
        {hasChevronButton && (
          <div className="chevron-button-container">
            {renderChevronButton()}
          </div>
        )}
      </div>
    </div>
  );
}

export default NavBarAppsVertical;
