import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import { utilityAppItemsDb, utilityAppOthers } from "../UtilityAppsCanvas/utility_apps";
import { itemsDb } from "../../data/store";
import { ReactSVG } from 'react-svg';
import { Button } from "reactstrap";
import { Plus, Star, Search, Instagram, X } from "react-bootstrap-icons";
import { Instagram as InstagramFeather } from "react-feather";

import { modalActions } from "../../store/modal-slice";
import { utilityAppsActions } from "../../store/utility-slice";
import { sessionActions } from "../../store/session-slice";
import { openInternalWindow } from "../../services/window";
import XAppService from "../../services/xapp";

import "./CategoryPad.css";
import "../LaunchIcon/LaunchIcon.css";

import defaultIcon from "../../images/default_icon.png";
import { createNavHistoryState } from "../../util/navHistory";

interface CategoryPadBodyProps {
  category: "favourites" | "search" | "social";
}

function CategoryPadBody({ category }: CategoryPadBodyProps) {
  const dispatch = useDispatch();

  const profileId = useSelector((state: any) => state.app.profileId);
  const xapps = useSelector((state: any) => state.app.xapps);
  const xappsStore = useSelector((state: any) => state.app.xappsStore);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const utilityState = useSelector((state: any) => state.utility);

  const [categoryApps, setCategoryApps] = useState<any[]>([]);

  const getCategoryTitle = () => {
    switch (category) {
      case "favourites":
        return "Favourites";
      case "search":
        return "Search Apps";
      case "social":
        return "Social Apps";
      default:
        return "Category Apps";
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case "favourites":
        return <Star color="white" size={24} />;
      case "search":
        return <Search color="white" size={20} />;
      case "social":
        return <InstagramFeather color="white" size={20} />;
      default:
        return <Star color="white" size={24} />;
    }
  };

  useEffect(() => {
    if (category === "favourites") {
      // For favourites, get user's xapps from localStorage (same as SideBar)
      const xappIds = JSON.parse(localStorage.getItem(`xappIds-${profileId}`) || "[]");
      const userApps = xappIds
        .map((id: string) => xappsStore[id])
        .filter((app: any) => app);
      setCategoryApps(userApps);
    } else {
      // For search and social, get apps from utility categories
      const categoryItems = utilityAppItemsDb[category];
      if (categoryItems && categoryItems.length > 0) {
        const apps = categoryItems.map((id: string) => {
          const item = itemsDb[id] ? itemsDb[id] : utilityAppOthers[id];
          return item ? { ...item, from: itemsDb[id] ? "itemDb" : "others" } : null;
        }).filter(Boolean);
        setCategoryApps(apps);
      }
    }
  }, [category, profileId, xappsStore]);

  function newTab(windowId: any, url: any, icon: any, title: any) {
    const now = new Date().getTime();
    return {
      id: Date.now().toString(),
      url: url,
      location: "main",
      type: "xapp",
      desktop: desktop.id,
      workspace: workspace.id,
      window: windowId,
      state: createNavHistoryState(url, title, icon),
      created: now,
      lastAccessed: now,
      sleeping: true,
    };
  }

  function resumeTab(windowId: any, tabId: any, type: any, url: any, icon: any, title: any) {
    let _tabId = tabId ? tabId : Date.now().toString();
    const now = new Date().getTime();
    return {
      id: _tabId,
      url: url,
      location: "main",
      type: type,
      desktop: desktop.id,
      workspace: workspace.id,
      window: windowId,
      state: createNavHistoryState(url, title, icon),
      created: now,
      lastAccessed: now,
      sleeping: true,
    };
  }

  function handleOpenApp(item: any) {
    if (category === "favourites") {
      // Handle favourite apps (xapps)
      handleOpenWindow(item);
    } else {
      // Handle utility apps (search/social)
      let _url = item.login;
      if (category === "search" && utilityState.searchQuery !== "" && utilityState.searchQuery !== undefined) {
        _url = item.search + utilityState.searchQuery;
      }

      // Open utility app in utility canvas
      dispatch(utilityAppsActions.setUrl(_url));
      dispatch(utilityAppsActions.setTitle(item.name));
      dispatch(utilityAppsActions.setIcon(item.icon));
      dispatch(utilityAppsActions.setActivePlayer(item.id));
      dispatch(utilityAppsActions.setActiveCategory(category));
      if (!utilityState.isOpen) {
        dispatch(utilityAppsActions.open(category));
      }

      // Close the category pad
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.hideCategoryPad());
    }
  }

  function handleOpenWindow(item: any) {
    let _url = item.data.customUrl !== "" ? item.data.customUrl : item.data.startUrl;

    if (openWindows[item.id] != null) {
      dispatch(
        sessionActions.setActiveWindow({ data: openWindows[item.id] })
      );
      dispatch(sessionActions.setLastGlobalWindowId(item.id));
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.hideCategoryPad());
      return;
    }

    let window = {
      workspace: "all",
      id: item.id,
      url: _url,
      location: "main",
    };

    let _openWindows = Object.assign({}, openWindows);
    let _openTabs = Object.assign({}, openTabs);
    let _windowTabs = Object.assign({}, windowTabs);

    openInternalWindow(window, xapps, openWindows, true, (result: any) => {
      if (result === undefined || result === null) {
        return;
      }
      XAppService.get(item.id)
        .then((app: any) => {
          if (app == null) {
            return;
          }

          let _result = Object.assign({}, app);
          _result.type = "xapp";
          _result.url = _url;
          _result.location = "main";
          _result.desktop = "all";

          // Openwindows
          _openWindows[item.id] = _result;
          dispatch(
            sessionActions.setOpenWindows({
              data: _openWindows,
            })
          );
          let _tabIds = [];
          // OpenTabs
          if (app.state && app.state.tabs && app.state.tabs.length > 0) {
            app.state.tabs.forEach((tabState: any) => {
              let _tab = resumeTab(
                item.id,
                tabState.id,
                "xapp",
                tabState.url,
                tabState.icon,
                tabState.title
              );
              _openTabs[_tab.id] = _tab;
              _tabIds.push(_tab.id);
            });
          } else {
            let _tab = newTab(item.id, _url, _result.data.icon, "");
            _openTabs[_tab.id] = _tab;
            _tabIds.push(_tab.id);
          }

          dispatch(
            sessionActions.setOpenTabs({
              data: _openTabs,
            })
          );
          // WindowTabs
          _windowTabs[_result.id] = _tabIds;
          dispatch(
            sessionActions.setWindowTabs({
              data: _windowTabs,
            })
          );

          dispatch(sessionActions.setActiveWindow({ data: _result }));
          dispatch(sessionActions.setLastGlobalWindowId(item.id));

          // Close the category pad
          // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
          dispatch(modalActions.hideCategoryPad());
        })
        .catch((error) => {
          log.error("Error:", error);
        });
    });
  }

  function renderAppIcon(item: any) {
    let _icon_url;

    if (category === "favourites") {
      // Handle xapp icons with custom icon support
      if (!item.data?.icon || item.data.icon.length === 0) {
        _icon_url = defaultIcon;
      } else if (item.data.icon.startsWith("http") ||
                 item.data.icon.startsWith("data:") ||
                 item.data.icon.startsWith("blob:")) {
        _icon_url = item.data.icon;
      } else if (item.data.startUrl?.startsWith("https://google.com")) {
        _icon_url = item.data.icon;
      } else {
        _icon_url = "./images/store/icon/" + item.data.icon;
      }
    } else {
      // Handle utility app icons
      _icon_url = item.icon;
      if (item.from === "itemDb") {
        _icon_url = "./images/store/icon/" + item.icon;
      }
    }

    const isActive = category !== "favourites" && item.id === utilityState.activePlayer;
    const isOpen = category === "favourites" && openWindows.hasOwnProperty(item.id);

    if (_icon_url && _icon_url.includes("svg")) {
      return (
        <ReactSVG
          src={_icon_url}
          className={`launch-icon ${(!isActive && !isOpen) ? "grayscale" : ""}`}
        />
      );
    } else {
      return (
        <img
          width={48}
          height={48}
          className={`launch-icon ${(!isActive && !isOpen) ? "grayscale" : ""}`}
          src={_icon_url}
          alt=""
          onError={(e: any) => {
            e.target.src = defaultIcon;
          }}
        />
      );
    }
  }

  function handleRemoveApp(item: any, event: React.MouseEvent) {
    event.stopPropagation(); // Prevent opening the app when clicking remove

    // Show confirmation dialog
    const appName = item.data?.name || "this app";
    const confirmed = window.confirm(`Are you sure you want to remove "${appName}"?`);

    if (!confirmed) {
      return;
    }

    if (category === "favourites") {
      // Remove from favourites (localStorage)
      const xappIds = JSON.parse(localStorage.getItem(`xappIds-${profileId}`) || "[]");
      const updatedIds = xappIds.filter((id: string) => id !== item.id);
      localStorage.setItem(`xappIds-${profileId}`, JSON.stringify(updatedIds));

      // Update local state
      setCategoryApps(prev => prev.filter(app => app.id !== item.id));
    } else {
      // For utility apps (search/social), we can't really "remove" them from the system
      // but we could implement a user preference system here in the future
      console.log("Remove functionality for utility apps not implemented yet");
    }
  }

  function openAppStore() {
    dispatch(modalActions.setLocation("xapps"));
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleAppStoreModal());
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.hideCategoryPad());
  }

  return (
    <div className="category-pad-container">
      <div className="category-pad-header">
        <div className="d-flex flex-column">
          <div className="d-flex align-items-center">
            {getCategoryIcon()}
            <h4 className="ms-2 mb-0 text-white">{getCategoryTitle()}</h4>
          </div>
          {category === "favourites" && (
            <p className="ms-4 mt-1 mb-0 text-white-50 small">
              Apps accessible from all spaces
            </p>
          )}
        </div>
        <Button
          color="light"
          size="sm"
          onClick={openAppStore}
        >
          <Plus size={16} />
        </Button>
      </div>

      <div className="category-pad-body">
        <div className="apps-grid">
          {categoryApps.map((item) => (
            <div
              key={item.id || uuidv4()}
              className="app-item"
              onClick={() => handleOpenApp(item)}
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title={category === "favourites" ? item.data?.name : item.name}
              data-bs-custom-className="custom-tooltip"
            >
              {!openWindows.hasOwnProperty(item.id) && (
                  <button
                    className="remove-app-btn"
                    onClick={(e) => handleRemoveApp(item, e)}
                    title="Remove from favourites"
                  >
                    <X size={12} color="white" />
                  </button>
                )}
              <div className="app-icon">
                {renderAppIcon(item)}

              </div>
              <div className="app-name">
                {category === "favourites" ? item.data?.name : item.name}
              </div>
            </div>
          ))}

          {categoryApps.length === 0 && (
            <div className="empty-state">
              <p className="text-white-50">No {category} apps available</p>
              <Button
                color="primary"
                size="sm"
                onClick={openAppStore}
              >
                <Plus size={16} className="me-1" />
                Add Apps
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryPadBody;
