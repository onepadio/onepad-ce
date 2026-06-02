import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListGroup, ListGroupItem } from "reactstrap";
import { Star, ThreeDots, ChevronUp, ChevronDown } from "react-bootstrap-icons";
import log from "loglevel";

import { appActions } from "../../store/app-slice";
import { windowServiceActions } from "../../store/window-service-slice";
import { sessionActions } from "../../store/session-slice";
import { modalActions } from "../../store/modal-slice";
import XAppService from "../../services/xapp";

import defaultIcon from "../../images/default_icon.png";

import "./FavouriteAppsList.css";

interface FavouriteAppsListProps {
  onOpenWindow: (item: any) => void;
  onEdit: (itemId: string) => void;
}

function FavouriteAppsList({ onOpenWindow, onEdit }: FavouriteAppsListProps) {
  const dispatch = useDispatch();

  const profileId = useSelector((state: any) => state.app.profileId);
  const xappsStore = useSelector((state: any) => state.app.xappsStore);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  const windowHistory = useSelector((state: any) => state.session.windowHistory);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  function navBarItem(item: any, itemId: string) {
    let _icon = "";
    let _title = item.data.name;
    let _icon_size = 36;

    let _is_sleeping = false;
    if (
      openWindows[item.id] === undefined ||
      openWindows[item.id] === null ||
      openWindows[item.id].sleeping
    ) {
      _is_sleeping = true;
    }

    // Check if this app is in favourites (xapps list)
    const favouriteIds = JSON.parse(localStorage.getItem(`xappIds-${profileId}`) || "[]");
    const isFavourite = favouriteIds.includes(item.id);

    try {
      if (!item.data.icon || item.data.icon.length === 0) {
        _icon = defaultIcon;
      } else if (item.data.icon.startsWith("http") ||
                 item.data.icon.startsWith("data:") ||
                 item.data.icon.startsWith("blob:")) {
        _icon = item.data.icon;
      } else if (item.data.startUrl.startsWith("https://google.com")) {
        _icon = item.data.icon;
      } else {
        _icon = "./images/store/icon/" + item.data.icon;
      }

      const isActive = item.id === activeWindowId;

      return (
        <ListGroupItem
          key={item.id}
          className={`d-flex justify-content-center align-items-center m-1 mt-3 menu-icon ${isActive ? 'active' : ''}`}
          onContextMenu={(e) => {
            e.preventDefault();
            // Context menu logic
            let _menu = document.createElement("div");
            _menu.className = "context-menu";
            _menu.innerHTML = `
              <div className="context-menu-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-square" viewBox="0 0 16 16">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                </svg>
                <span>Edit</span>
              </div>
              <div className="context-menu-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                </svg>
                <span>Remove</span>
              </div>
            `;
            _menu.style.position = "fixed";
            _menu.style.bottom = "50px";
            _menu.style.left = e.clientX + "px";
            document.body.appendChild(_menu);

            // Add event listeners for menu items
            _menu.querySelector(".context-menu-item:first-child")?.addEventListener("click", () => {
              onEdit(item.id);
              document.body.removeChild(_menu);
            });

            _menu.querySelector(".context-menu-item:last-child")?.addEventListener("click", () => {
              document.body.removeChild(_menu);
              if (window.confirm(`Are you sure you want to delete ${item.data.name}?`)) {
                // check if the app is open
                if (openWindows[item.id] !== undefined && openWindows[item.id] !== null) {
                  dispatch(windowServiceActions.closeWindow(item.id));
                }
                XAppService.delete(item.id).then(() => {
                  let _xappIds =
                    JSON.parse(localStorage.getItem("xappIds-" + profileId) || "[]");
                  _xappIds = _xappIds.filter((id: any) => id !== item.id);
                  localStorage.setItem(
                    "xappIds-" + profileId,
                    JSON.stringify(_xappIds)
                  );
                  XAppService.getAll()
                    .then((xapps: any) => {
                      dispatch(appActions.setXApps(xapps.reverse() || []));
                      let _xappsStore = {};
                      xapps.forEach((xapp: any) => {
                        (_xappsStore as any)[xapp.id] = xapp;
                      });
                      dispatch(appActions.setXAppsStore(_xappsStore));
                    })
                    .catch((error) => {
                      log.debug("Error getting xapps", error);
                    });
                }).catch((error) => {
                  log.error("Error deleting app:", error);
                  alert("Error deleting app:" + error);
                });
              }
            });

            // Close menu when clicking outside
            const closeMenu = (e: any) => {
              if (document.body.contains(_menu) && !_menu.contains(e.target)) {
                document.body.removeChild(_menu);
                document.removeEventListener("click", closeMenu);
              }
            };

            // Delay adding the click listener to prevent immediate closure
            setTimeout(() => {
              document.addEventListener("click", closeMenu);
            }, 0);
          }}
        >
          <div
            className="appicon d-flex justify-content-center"
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            title={_title}
            data-bs-custom-className="custom-tooltip"
            onContextMenu={(e) => {
              e.preventDefault();
            }}
          >
            {_is_sleeping ? (
              <img
                width={_icon_size}
                className="launch-icon grayscale"
                src={_icon}
                alt=""
                onClick={() => onOpenWindow(item)}
                onError={(e: any) => {
                  e.target.src = defaultIcon;
                }}
              />
            ) : (
              <img
                width={_icon_size}
                className="launch-icon"
                src={_icon}
                alt=""
                onClick={() => onOpenWindow(item)}
                onError={(e: any) => {
                  e.target.src = defaultIcon;
                }}
              />
            )}
          </div>
          {
            windowTabs[item.id] && windowTabs[item.id].length > 0 && (
              <span className="position-absolute bottom-0 right-0 translate-bottom badge rounded-pill bg-primary">{windowTabs[item.id].length}</span>
            )
          }
          {
            isFavourite && (
              <span className="favourite-star">
                <Star size={12} color="white" />
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

  // Get recently used favourite apps (last 7 used)
  const favouriteIds = JSON.parse(localStorage.getItem(`xappIds-${profileId}`) || "[]");
  const activeAppIds = Object.keys(openWindows);

  // Filter to get only open favourite apps
  const activeFavouriteIds = favouriteIds.filter((id: string) =>
    activeAppIds.includes(id) && xappsStore.hasOwnProperty(id)
  );

  // Sort by recent usage (most recently used first)
  const recentlyUsedIds = activeFavouriteIds.sort((a: string, b: string) => {
    // Current active window comes first
    if (a === activeWindowId) return -1;
    if (b === activeWindowId) return 1;

    // Then sort by position in window history (more recent = higher index)
    const indexA = windowHistory.lastIndexOf(a);
    const indexB = windowHistory.lastIndexOf(b);

    // If both are in history, sort by most recent (higher index first)
    if (indexA !== -1 && indexB !== -1) {
      return indexB - indexA;
    }

    // If only one is in history, it comes first
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // If neither is in history, sort by creation time as fallback
    const windowA = openWindows[a];
    const windowB = openWindows[b];
    const timeA = windowA?.createdAt || 0;
    const timeB = windowB?.createdAt || 0;

    return timeB - timeA;
  });

  // Show 1 item when collapsed, 7 when expanded
  const collapsedItems = 1;
  const expandedItems = 7;
  const maxVisibleItems = isCollapsed ? collapsedItems : expandedItems;
  const visibleItems = recentlyUsedIds.slice(0, maxVisibleItems);
  const hasMoreItems = recentlyUsedIds.length > maxVisibleItems;
  const hasChevronButton = recentlyUsedIds.length > collapsedItems;

  function renderHeaderButton() {

    function handleHeaderButtonClick() {

      dispatch(modalActions.showFavouritesPad({}));

    }

    return (
      <ListGroupItem
        key="more-button"
        className="d-flex justify-content-center align-items-center m-1 mt-3 menu-icon more-button"
        onClick={handleHeaderButtonClick}
        title={isExpanded ? "Show less" : `Show all ${recentlyUsedIds.length} recent favourite apps`}
      >
        <div className="appicon d-flex justify-content-center">
          <div className="more-icon">

              <Star color="white" size={24} />
          </div>
        </div>
      </ListGroupItem>
    );
  }

  function renderChevronButton() {
    if (!hasChevronButton) return null;

    function handleChevronButtonClick() {
      setIsCollapsed(!isCollapsed);
    }

    return (
      <ListGroupItem
        key="chevron-button"
        className="d-flex justify-content-center align-items-center m-1 mt-3 menu-icon chevron-button"
        onClick={handleChevronButtonClick}
        title={isCollapsed ? `Show ${expandedItems} favourite apps` : "Show only 1 favourite app"}
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
    <>
      {/* Star icon header for favourites section */}
      <div className="apps-list-header">
        {renderHeaderButton()}
      </div>
      <div className={`apps-list-container ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <ListGroup className="apps-list d-flex justify-content-start align-items-center">
          {visibleItems?.map((id: any) => navBarItem(xappsStore[id], id))}
        </ListGroup>
        {hasChevronButton && (
          <div className="chevron-button-container">
            {renderChevronButton()}
          </div>
        )}
      </div>
    </>
  );
}

export default FavouriteAppsList;
