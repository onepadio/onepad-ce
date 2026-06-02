import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";



import XAppService from "../../services/xapp";
import { openInternalWindow, openAppWindow } from "../../services/window";

import { sessionActions } from "../../store/session-slice";
import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";
import { appActions } from "../../store/app-slice";

import "./FavouritesPad.css";

import { Alert } from "reactstrap";
import "react-tabs/style/react-tabs.css";

import defaultIcon from "../../images/default_icon.png";


import LinkIcon from "../LinkIcon/LinkIcon";

function FavouritesPadBody(props: any) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const route = useSelector((state: any) => state.session.route);

  const profileId = useSelector((state: any) => state.app.profileId);
  const user = useSelector((state: any) => state.user);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  const windowHistory = useSelector((state: any) => state.session.windowHistory);
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const selectedDesktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const apps = useSelector((state: any) => state.workspace.apps);
  const links = useSelector((state: any) => state.workspace.links);
  const xapps = useSelector((state: any) => state.app.xapps);
  const xappsStore = useSelector((state: any) => state.app.xappsStore);
  const appsLimit = useSelector((state: any) => state.app.appsLimit);
  const linksLimit = useSelector((state: any) => state.app.linksLimit);
  const searchQuery = useSelector((state: any) => state.launchpad.searchQuery);
  const isFavouritesPadOpen = useSelector((state: any) => state.modal.isFavouritesPadOpen);


  const [visibleApps, setVisibleApps] = useState<any[]>([]);
  const [visibleLinks, setVisibleLinks] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);

  // Alert
  const [visible, setVisible] = useState(true);
  const onDismiss = () => setVisible(false);

  const [tabIndex, setTabIndex] = useState(0);

  function openSignIn() {
    navigate("/login");
  }

  let alert = null;
  if (route === "authenticated") {
    alert = (
      <Alert color="info" isOpen={visible} toggle={onDismiss}>
        This workspace is offline. <br /> Please use online workspaces to save
        your data.
      </Alert>
    );
  } else {
    alert = (
      <Alert color="info" isOpen={visible} toggle={onDismiss}>
        This workspace is offline. <br /> Please &nbsp;
        <a className="alert-link" onClick={openSignIn}>
          Sign In
        </a>{" "}
        &nbsp; and use online workspaces to save your data.
      </Alert>
    );
  }



  function handleOpenWindow(item: any) {
    // If window is already open, just activate it
    if (openWindows[item.id] != null) {
      dispatch(sessionActions.setActiveWindow({ data: openWindows[item.id] }));
      dispatch(sessionActions.setLastGlobalWindowId(item.id));
      return;
    }

    // If not open, we need to open it (but this shouldn't happen since we only show open apps)
    let _url = item.data.customUrl !== "" ? item.data.customUrl : item.data.startUrl;

    if (item.location === "external") {
      openAppWindow(
        item.id,
        _url,
        item.window_type,
        item.is_stateful,
        item.show_controls
      );
    } else {
      let window = {
        workspace: "all",
        id: item.id,
        url: _url,
        location: "main",
      };

      openInternalWindow(window, xapps, openWindows, true, (result: any) => {
        if (result === undefined || result === null) {
          return;
        }
        XAppService.get(item.id)
          .then((app: any) => {
            log.debug("app:", app);
            let _result = Object.assign({}, result);
            _result.data = app.data;
            _result.id = app.id;
            _result.type = "app";
            _result.workspace = workspace.id;
            _result.desktop = selectedDesktop.id;
            _result.location = "internal";
            _result.start_url = app.data.startUrl;
            _result.window_type = app.data.windowType;
            _result.is_stateful = app.data.isStateful;
            _result.show_controls = app.data.showControls;
            dispatch(sessionActions.setActiveWindow({ data: _result }));
            dispatch(sessionActions.setLastGlobalWindowId(item.id));
          })
          .catch((error) => {
            log.error("Error:", error);
          });
      });
    }
  }

  useEffect(() => {
    log.debug("Selected tab: " + tabIndex);
    switch (tabIndex) {
      case 0:
        log.debug("Selected Apps tab");
        dispatch(workspaceActions.selectCategory({ category: "apps" }));
        break;
      case 1:
        //dispatch(workspaceActions.selectCategory({ category: "links" }));
        log.debug("Selected Remote tab");
        break;
      default:
        dispatch(workspaceActions.selectCategory({ category: "none" }));
        log.debug("Selected unknown tab");
    }
  }, [tabIndex]);

  useEffect(() => {
    if (workspace.name === "RemoteTest") {
      const rtab = document.getElementById("remoteTab");
      if (rtab) {
        rtab.classList.remove("d-none");
      }
    }
  }, [workspace]);

  useEffect(() => {
    log.debug("FavouritesPadBody: useEffect: apps: ", apps);
    if (appsLimit > 0) {
      setVisibleApps(apps.slice(0, appsLimit));
    } else {
      setVisibleApps(apps);
    }
  }, [apps, route, appsLimit]);

  useEffect(() => {
    setVisibleLinks(links);
  }, [links, route, linksLimit]);

  useEffect(() => {
    // Get recently used favourite apps (same logic as FavouriteAppsList)
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

    let _allItems: any[] = [];

    // Add recently used favourite apps
    recentlyUsedIds.forEach((id: string) => {
      if (xappsStore[id]) {
        let _item = Object.assign({}, xappsStore[id]);
        _item.type = "app";
        _allItems.push(_item);
      }
    });

    log.debug("Recently used favourite items: ", _allItems);

    if (sortAlphabetically) {
      _allItems.sort((a, b) => {
        return a.data.name.localeCompare(b.data.name);
      });
    }

    if (searchQuery.length > 0) {
      _allItems = _allItems.filter((item) => {
        return item.data.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setAllItems(_allItems);
  }, [xappsStore, profileId, openWindows, searchQuery, sortAlphabetically]);

  useEffect(() => {
    const _launchpad = document.getElementById("favourites-pad-id");
    const _backdrop = document.getElementById("launchpad-backdrop");
    if(!_launchpad || !_backdrop) return;

    if (isFavouritesPadOpen) {
      _launchpad.style.display = "block";
      _backdrop.style.display = "block";
    } else {
      _launchpad.style.display = "none";
      _backdrop.style.display = "none";
    }
  }, [isFavouritesPadOpen]);

  useEffect(() => {
    log.debug("Profile ID: ", profileId);
    if(profileId === "" || profileId === undefined) return;

    XAppService.getAllByProfileId(profileId).then((xapps: any) => {
      dispatch(appActions.setXApps(xapps.reverse() || []));
      let _xappsStore = {};
      let _xappIds: any = [];

      xapps.forEach((xapp: any) => {
        (_xappsStore as any)[xapp.id] = xapp;
        _xappIds.push(xapp.id);
      });
      if(localStorage.getItem("xappIds-"+profileId) === null){
        localStorage.setItem("xappIds-"+profileId, JSON.stringify(_xappIds));
      }
      dispatch(appActions.setXAppsStore(_xappsStore));
    }).catch((error) => {
      log.debug("Error getting xapps", error);
    });

  }, [profileId]);

  return (
    <div className="container-fluid launchpad-container">
      <div className="small-icons-tab">
        <div className="icons">
          {allItems?.map((item) =>
            item.type === "app" ? (
              <div key={item.id} className="launch-icon-container">
                <div className="launch-item">
                  <div className="appicon d-flex justify-content-center">
                    <img
                      width={56}
                      className="launch-icon"
                      src={
                        !item.data.icon || item.data.icon.length === 0
                          ? defaultIcon
                          : item.data.icon.startsWith("http") ||
                            item.data.icon.startsWith("data:") ||
                            item.data.icon.startsWith("blob:")
                          ? item.data.icon
                          : item.data.startUrl.startsWith("https://google.com")
                          ? item.data.icon
                          : "./images/store/icon/" + item.data.icon
                      }
                      alt=""
                      onClick={() => handleOpenWindow(item)}
                      style={{ cursor: "pointer" }}
                      onError={(e: any) => {
                        e.target.src = defaultIcon;
                      }}
                    />
                  </div>
                  <div className="app-name">{item.data.name}</div>
                </div>
              </div>
            ) : (
              <LinkIcon
                key={item.id}
                id={item.id}
                data={item}
                url={item.data.startUrl}
                title={item.data.title}
                icon={item.data.icon}
                isInEditMode={props.isInEditMode}
                isOpen={openWindows.hasOwnProperty(item.id)}
                workspaceId={workspace.id}
                desktopId={selectedDesktop.id}
                windowType={
                  item.data.windowType
                    ? item.data.windowType
                    : "internal"
                }
                showStatusDot={false}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default FavouritesPadBody;
