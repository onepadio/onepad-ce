import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from "is-electron";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import {
  createProcess,
  getProcessDetails,
  logActivity,
  stopProcess,
  terminateProcess,
} from "../api/ProcessApi";

import { sessionActions } from "../store/session-slice";
import { handleWindowOpened, closeWindow, closeMultipleWindows, openInternalWindow, openAppWindow } from "../services/window";
import { closeTab, newTabForActiveWindow } from "../util/tabs";

import { remoteIcons } from "../data/remote";

import { utilityAppsActions } from "../store/utility-slice";
import { musicPlayerActions } from "../store/musicplayer-slice";
import { chatActions } from "../store/chat-slice";
import { windowServiceActions } from "../store/window-service-slice";
import { appActions } from "../store/app-slice";

// @ts-expect-error TS(2307): Cannot find module or its corresponding type declarations.
import globe_icon from '../images/globe_icon_96.png';
import AppService from "../services/app";
import XAppService from "../services/xapp";
import LinkService from "../services/link";
import { openInternalWindow as openInternalWindowUtil } from "../services/window";


function WindowService() {
  const dispatch = useDispatch();
  const route = useSelector((state: any) => state.session.route);
  const user = useSelector((state: any) => state.user);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const personId = useSelector((state) => state.app.personId);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const userState = useSelector((state) => state.user);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const sessionState = useSelector((state) => state.session);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const workspaceState = useSelector((state) => state.workspace);

  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const workspace = useSelector((state) => state.workspace.selectedWorkspace);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const desktop = useSelector((state) => state.workspace.selectedDesktop);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const openWindows = useSelector((state) => state.session.openWindows);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const items = useSelector((state) => state.workspace.items);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isLocal = useSelector((state) => state.workspace.isLocal);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeWindow = useSelector((state) => state.session.activeWindow);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeWindowId = useSelector((state) => state.session.activeWindowId);
  const activeWindowTabs = useSelector(
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    (state) => state.session.activeWindowTabs
  );
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const openTabs = useSelector((state) => state.session.openTabs);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const windowTabs = useSelector((state) => state.session.windowTabs);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeTabs = useSelector((state) => state.session.activeTabs);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeTab = useSelector((state) => state.session.activeTab);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeTabId = useSelector((state) => state.session.activeTabId);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const browserWindows = useSelector((state) => state.session.browserWindows);
  const isExternalWindowMode = useSelector(
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    (state) => state.settings.isExternalWindowMode
  );

  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isUtilityOpen = useSelector((state) => state.utility.isOpen);
  const utilityActiveCategory = useSelector(
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    (state) => state.utility.activeCategory
  );
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isChatOpen = useSelector((state) => state.chat.isOpen);
  // WindowService
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const actionId = useSelector((state) => state.windowService.serviceActionId);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const action = useSelector((state) => state.windowService.serviceAction);
  const newTabWindowId = useSelector(
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    (state) => state.windowService.newTabWindowId
  );
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const newTabUrl = useSelector((state) => state.windowService.newTabUrl);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const closeTabId = useSelector((state) => state.windowService.closeTabId);
  const closeWindowId = useSelector(
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    (state) => state.windowService.closeWindowId
  );
  const sleepWindowId = useSelector(
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    (state) => state.windowService.sleepWindowId
  );

  const showCloseWindowConfirmation = useSelector(
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    (state) => state.windowService.showCloseWindowConfirmation
  );

  const moveTabToExternalWindowTabId = useSelector(
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    (state) => state.windowService.moveTabToExternalWindowTabId
  );

  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const newRemoteApp = useSelector((state) => state.windowService.newRemoteApp);
  const stoppedRemoteProcessWindowId = useSelector(
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    (state) => state.windowService.stoppedRemoteProcessWindowId
  );

  const [timer, setTimer] = useState(uuidv4());

  useEffect(() => {
    setTimer(uuidv4());
  }, []);

  useEffect(() => {
    if (action === "" || action === undefined || action === null) return;
    switch (action) {
      case "newWindow":
        log.debug("newWindow action...");
        break;
      case "openRemoteApp":
        log.debug("openRemoteApp action...");
        if(activeWindow.id === newRemoteApp.processId) return;
        if(openWindows[newRemoteApp.processId]){
          dispatch(sessionActions.setActiveWindow({data: openWindows[newRemoteApp.processId]}));
          return;
        }
        createRemoteWindow(newRemoteApp.name, newRemoteApp.application, newRemoteApp.processId, newRemoteApp.url, newRemoteApp.storeData);
        break;
      case "closeWindow":
        log.debug("closeWindow action...");
        let _res = false;
        let _window = openWindows[closeWindowId];
        let _tabs = windowTabs[_window.id];
        if (_window.type === "remote") {
          if(showCloseWindowConfirmation){
            _res = window.confirm(
              "You're closing a cloud window. Please don't forget to stop or delete app from task manager. Do you want to close anyway?"
            );
          }else{
            _res = true;
          }
        } else if (_tabs.length > 1) {
          if(showCloseWindowConfirmation){
            _res = window.confirm(
              "You're closing multiple tabs. Do you want to close anyway?"
            );
          }else{
            _res = true;
          }
        } else {
          _res = true;
        }
        if (!_res) break;

        resetWindowState(closeWindowId, () => {
          closeWindow(
            dispatch,
            sessionActions,
            closeWindowId,
            openWindows,
            openTabs,
            activeTabs,
            windowTabs,
            desktop,
            isExternalWindowMode
          );
        }, () => {
          log.error("closeWindow", "Failed to reset window state");
        });
        break;
      case "closeBrowser":
        log.debug("closeBrowser action...");
        dispatch(
          sessionActions.getBackToLaunchPad({
            data: {
              desktopId: desktop.id,
            },
          })
        );
        //closeMultipleWindows(dispatch, sessionActions, browserWindows, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
        let _windowId = "browser_".concat(workspace.id);
        if(openWindows[_windowId]){
          closeWindow(
            dispatch,
            sessionActions,
            _windowId,
            openWindows,
            openTabs,
            activeTabs,
            windowTabs,
            desktop,
            isExternalWindowMode
          );
        }
        break;
      case "sleepWindow":
        log.debug("sleepWindow action...");

        saveWindowState(sleepWindowId, () => {
          closeWindow(
            dispatch,
            sessionActions,
            sleepWindowId,
            openWindows,
            openTabs,
            activeTabs,
            windowTabs,
            desktop,
            isExternalWindowMode
          );
        }, () => {
          log.error("sleepWindow", "Failed to save window state");
        });

        break;
      case "closeAllWindows":
        log.debug("closeAllWindows action...");
        closeAllWindows();
        break;
      case "newTab":
        log.debug("newTab action...");
        addNewTab(newTabWindowId, newTabUrl);
        break;
      case "moveTabToExternalWindow":
        log.debug("moveTabToExternalWindow action...");
        moveTabToExternalWindow(moveTabToExternalWindowTabId);
        break;
      case "closeTab":
        log.debug("closeTab action...", closeTabId);
        let _tab = openTabs[closeTabId];
        let _res2 = true;
        if (_tab.type === "remote") {
          _res2 = window.confirm(
            "You're hiding a cloud app window. Please don't forget to stop or delete from task manager. Do you want to hide anyway?"
          );
        }
        if (_tab && _res2) {
          closeTab(
            _tab,
            dispatch,
            openTabs,
            windowTabs,
            openWindows,
            browserWindows,
            activeWindowId,
            activeTabId,
            activeTabs,
            desktop,
            isExternalWindowMode,
            sessionActions,
            () => {
              log.debug("closeTab", "Tab closed");
            }
          );
        } else {
          log.error("Tab not found");
        }
        break;
      default:
        break;
    }
    dispatch(windowServiceActions.setWindowServiceAction(""));
  }, [actionId, action]);

  useEffect(() => {
    setTimeout(() => {
      setTimer(uuidv4());
      if (activeTab.type === "remote") {
        logActivity(userState.uid, activeTab.id)
          .then((response) => {
            log.debug("activity response", response);
          })
          .catch((error) => {
            log.debug("activity error", error);
          });
      }
    }, 30000);
  }, [timer]);

  useEffect(() => {
    if(isUtilityOpen){
      dispatch(chatActions.close());
      dispatch(musicPlayerActions.close());
    }
  }, [isUtilityOpen]);

  function newTab(windowId: any, url: any, icon: any, title: any) {
    return {
      id: uuidv4(),
      url: url,
      location: "main",
      type: "link",
      desktop: desktop.id,
      workspace: workspace.id,
      window: windowId,
      webContentsId: undefined,
      state: {
        url: url,
        title: title,
        icon: icon,
      },
      partition: getPartitionId(workspace.id),
    };
  }

  function getPartitionId(workspaceId: any){
    let partition = "";
    if(route === "authenticated"){
      partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+user.username+"_"+workspaceState.currentSession.id : "persist:"+user.username+"_"+workspaceId;
    }else{
      partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+workspaceState.currentSession.id : "persist:"+workspaceId;
    }
    return partition;
  }

  function newRemoteTab(processId: any, windowId: any, url: any, icon: any, title: any){
    return {
        id: processId,
        url: url,
        location: "main",
        type: "remote",
        desktop: desktop.id,
        workspace: workspace.id,
        window: windowId,
        state:{
            url: url,
            title: title,
            icon: icon,
        },
        lastAccessed: new Date().getTime(),
        sleeping: true,
    }
  }

  function createRemoteWindow(name: any, application: any, processId: any, processUrl: any, storeData: any){
    let _window = {
      name: name,
      company: storeData.company,
      category: storeData.category,
      description: storeData.description,
      icon: remoteIcons[application as keyof typeof remoteIcons] ? remoteIcons[application as keyof typeof remoteIcons] : globe_icon,
      website: processUrl,
      login: processUrl,
      linkedin: processUrl,
      windowType: "workspace",
      navigationControls: "0",
      autoSave: "0",
      id: processId,
      state: {
        tabs: []
      },
      data: {
        customUrl: "",
        icon: remoteIcons[application as keyof typeof remoteIcons] ? remoteIcons[application as keyof typeof remoteIcons] : globe_icon,
        name: "RemoteApp - "+application,
        startUrl:processUrl
      },
    };

    let _openWindows = Object.assign({}, openWindows);
    let _openTabs = Object.assign({}, openTabs);
    let _windowTabs = Object.assign({}, windowTabs);

    // @ts-expect-error
    _window.type = "remote";
    // @ts-expect-error
    _window.url = processUrl;
    // @ts-expect-error
    _window.location = "main";
    // @ts-expect-error
    _window.desktop = desktop.id;
    // @ts-expect-error
    _window.workspace = "global";

    log.debug("Window:",_window);

    // Openwindows
    _openWindows[_window.id] = _window;
    dispatch(
        sessionActions.setOpenWindows({
        data: _openWindows,
    })
    );
    let _tabIds = [];
    // OpenTabs

    let _tab = newRemoteTab(processId, _window.id, processUrl, _window.data.icon, "");
    _openTabs[_tab.id] = _tab;
    _tabIds.push(_tab.id);


    dispatch(
        sessionActions.setOpenTabs({
        data: _openTabs,
    }));
    // WindowTabs
    _windowTabs[_window.id] = _tabIds;
    dispatch(
        sessionActions.setWindowTabs({
        data: _windowTabs,
    }));

    dispatch(sessionActions.setActiveWindow({data: _window}));
    //toggle();
  }

  function addNewTab(windowId: any, _url: any) {
    let _window = openWindows[windowId];
    if (isUtilityOpen) {
      // add new tab to utility browser
      log.debug("new tab from utility app...");
      // window.open(_url, '_blank');
      dispatch(utilityAppsActions.setUrl(_url));
    } else if (isChatOpen) {
      // add new tab to chat browser
      log.debug("new tab from chat app...");
      window.open(_url, "_blank");
    } else {
      if (
        _window &&
        _window.data &&
        _window.data.window &&
        _window.data.window.enableTabs
      ) {
        const now = new Date().getTime();
        let _tab = {
          id: _window.type === "browser" ? "browser_".concat(uuidv4()) : uuidv4(),
          url: _url,
          title: "",
          type: _window.type,
          icon: _window.data.icon,
          location: _window.location,
          desktop: desktop.id,
          workspace: workspace.id,
          window: _window.id,
          webContentsId: undefined,
          state: {
            url: _url,
            title: "",
            icon: _window.data.icon,
          },
          created: now,
          lastAccessed: now,
          sleeping: false,
          partition: _window.partition ? _window.partition : getPartitionId(workspace.id),
        };

        //ActiveWindowTabs
        let _activeWindowTabs = Object.assign([], activeWindowTabs);
        _activeWindowTabs.push(_tab);
        dispatch(
          sessionActions.setActiveWindowTabs({ data: _activeWindowTabs })
        );

        //dispatch(sessionActions.setActiveTab({ data: _tab }));

        // OpenTabs
        let _openTabs = Object.assign({}, openTabs);
        _openTabs[_tab.id] = _tab;
        dispatch(sessionActions.setOpenTabs({ data: _openTabs }));

        // WindowTabs
        let _windowTabs = Object.assign({}, windowTabs);
        let _tabIds = Object.assign([], windowTabs[_window.id]);
        _tabIds.push(_tab.id);
        _windowTabs[_window.id] = _tabIds;
        dispatch(
          sessionActions.setWindowTabs({
            data: _windowTabs,
          })
        );

        dispatch(sessionActions.setActiveTab({data:_tab}));

        // ActiveTabs
        let _activeTabs = Object.assign({}, activeTabs);
        _activeTabs[_window.id] = _tab.id;
        dispatch(sessionActions.setActiveTabs({ data: _activeTabs }));
        
        // Activate the window to show the new tab
        dispatch(sessionActions.setActiveWindow({data: _window}));
        return;
      } else {
        log.error("Tabs not enabled for this window");
        // add new tab to space browser
        window.open(_url, "_blank");
      }
    }
  }

  function closeAllWindows() {
    //alert("Update needed to close only active workspace windows");
    //return;
    dispatch(sessionActions.setOpenWindows({ data: {} }));
    dispatch(sessionActions.setOpenTabs({ data: {} }));
    dispatch(sessionActions.setActiveTabs({ data: {} }));
    dispatch(sessionActions.setActiveTab({ data: {} }));
    dispatch(sessionActions.setWindowTabs({ data: {} }));
    dispatch(sessionActions.setBrowserWindows({ data: [] }));
    dispatch(sessionActions.setActiveBrowserWindowId({ data: "" }));
    dispatch(
      sessionActions.getBackToLaunchPad({
        data: {
          desktopId: desktop.id,
        },
      })
    );
  }

  function newBrowserTab(windowId: any, url: any, icon: any, title: any) {
    return {
      id: "browser_".concat(uuidv4()),
      url: url,
      location: "main",
      type: "browser",
      desktop: desktop.id,
      workspace: workspace.id,
      window: windowId,
      webContentsId: undefined,
      state: {
        url: url,
        title: title,
        icon: icon,
      },
      lastAccessed: new Date().getTime(),
      sleeping: false,
    };
  }

  function sleepTabs(windowId: any) {
    log.debug("App.js: setInterval");
    let _openTabs = Object.assign({}, openTabs);
    let _openWindows = Object.assign({}, openWindows);
    let _windowTabs = Object.assign({}, windowTabs);

    let _window = Object.assign({}, openWindows[windowId]);
    if (
      _window === undefined ||
      _window === null ||
      _window.data === undefined ||
      _window.data === null
    ) {
      log.debug("App.js: sleepTabs", "Window not found " + windowId);
      log.debug("                 ", "Deleted window:" + windowId);
      delete _openWindows[windowId];
      delete _windowTabs[windowId];
    } else {
      _window.sleeping = true;
      _openWindows[windowId] = _window;
    }

    dispatch(
      sessionActions.setOpenWindows({
        data: _openWindows,
      })
    );

    dispatch(
      sessionActions.setWindowTabs({
        data: _windowTabs,
      })
    );

    windowTabs[windowId].forEach((tabId: any) => {
      let tab = _openTabs[tabId];
      if (tab.id === undefined || tab.window !== windowId) return;
      if (!tab.sleeping) {
        let _tab = Object.assign({}, _openTabs[tab.id]);
        //if (
        //  _tab.mediaPlaying === undefined ||
        //  !_tab.mediaPlaying ||
        //  _suspendTabs
        //) {
          _tab.sleeping = true;
          _openTabs[tab.id] = _tab;
        //}
      }
      // Delete tab if window not found
      if (
        _openWindows[tab.window] === undefined ||
        _openWindows[tab.window] === null
      ) {
        log.debug(
          "WindowService: sleepTabs",
          "Window not found " + tab.window + " for tab " + tab.id
        );
        delete _openTabs[tab.id];
      }

      // Screenshots are now handled by ScreenshotManagerHub
      // No need to capture here - components will retrieve cached screenshots
    });

    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(appActions.updateScreenShotStatusVersion());

    dispatch(
      sessionActions.setOpenTabs({
        data: _openTabs,
      })
    );
  }

  function saveWindowState(windowId: any, oncomplete: any, onerror: any){
    // save window state
    let _window = Object.assign({}, openWindows[windowId]);
    let _tabIds = Object.assign([], windowTabs[windowId]);
    let tabs: any = [];
    _tabIds.forEach((tabId: any) => {
      let _openTabs = Object.assign({}, openTabs);
      let _tab = Object.assign({}, _openTabs[tabId]);
      let _state = Object.assign({}, _tab.state);
      _state.id = tabId;
      tabs.push(_state);
      if(_tab.location === "external"){
        if(isElectron()){
          // @ts-expect-error
          window.electronAPI.send("toMain", {
            action: "close-tab",
            closeTabWindowId: _tab.window,
            closeTabId: _tab.id,
            closeTabType: _tab.type,
          });
        }
      }
    });

    if(_window.type === "app"){
    AppService.updateState(windowId, {
        tabs: tabs,
    }).then((res) => {
        log.debug("updateState", res);
        oncomplete();
    }).catch((err) => {
        log.error("updateState", err);
        onerror();
      });
    }else if(_window.type === "link"){
      LinkService.updateState(windowId, {
          tabs: tabs,
      }).then((res) => {
          log.debug("updateState", res);
          oncomplete();
      }).catch((err) => {
          log.error("updateState", err);
          onerror();
        });
      }else if(_window.type === "xapp"){
        XAppService.updateState(windowId, {
          tabs: tabs,
        }).then((res) => {
          log.debug("updateState", res);
          oncomplete();
        }).catch((err) => {
          log.error("updateState", err);
          onerror();
        });
    }else{
      onerror();
    }
  }

  function resetWindowState(windowId: any, oncomplete: any, onerror: any){
    let _window = Object.assign({}, openWindows[windowId]);
    if(_window === undefined || _window === null){
      onerror();
      return;
    }
    if(_window.type === "browser" || _window.type === "remote"){
      oncomplete();
      return;
    }
    if(_window.type === "app"){
    AppService.updateState(windowId, {
        tabs: [],
    }).then((res) => {
        log.debug("updateState", res);
        oncomplete();
    }).catch((err) => {
        log.error("updateState", err);
        onerror();
      });
    }else if(_window.type === "link"){
      LinkService.updateState(windowId, {
          tabs: [],
      }).then((res) => {
          log.debug("updateState", res);
          oncomplete();
      }).catch((err) => {
          log.error("updateState", err);
          onerror();
        });
      }else if(_window.type === "xapp"){
        XAppService.updateState(windowId, {
          tabs: [],
        }).then((res) => {
          log.debug("updateState", res);
          oncomplete();
        }).catch((err) => {
          log.error("updateState", err);
          onerror();
        });
    }else{
      onerror();
    }
  }

  function moveTabToExternalWindow(tabId: any){
    let _openTabs = Object.assign({}, openTabs);
    let _tab = Object.assign({}, _openTabs[tabId]);
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "open-external-window",
        tabWindowId: _tab.window,
        tabId: tabId,
        url: _tab.state.url,
        partition: _tab.partition ? _tab.partition : getPartitionId(workspace.id),
      });

      _tab.location = "external";
      _openTabs[tabId] = _tab;
      dispatch(
        sessionActions.setOpenTabs({
          data: _openTabs,
        })
      );
    }
  }

  function handleOpenWindow(item: any) {
    if (activeWindowId === item.id) {
      return;
    }
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
      log.debug("openInternalWindow:" + _url);
      if (openWindows[item.id] != null) {
        dispatch(
          sessionActions.setActiveWindow({ data: openWindows[item.id] })
        );
        dispatch(sessionActions.setLastGlobalWindowId(item.id));
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
            log.debug("app:", app);
            if (app == null) {
              return;
            }

            let _result = Object.assign({}, app);
            _result.type = "xapp";
            _result.url = _url;
            _result.location = "main";
            _result.desktop = "all";

            log.debug("Result:", _result);

            // Openwindows
            _openWindows[item.id] = _result;
            dispatch(
              sessionActions.setOpenWindows({
                data: _openWindows,
              })
            );
            let _tabIds = [];
            // OpenTabs
            if (

              app.state &&

              app.state.tabs &&

              app.state.tabs.length > 0
            ) {

              app.state.tabs.forEach((tabState: any) => {
                log.debug("tabState:", tabState);
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
          })
          .catch((error) => {
            log.error("Error:", error);
          });
      });
    }
  }

  function resumeTab(windowId: any, tabId: any, type: any, url: any, icon: any, title: any) {
    let _tabId = tabId ? tabId : Date.now().toString();
    return {
      id: _tabId,
      url: url,
      location: "main",
      type: type,
      desktop: desktop.id,
      workspace: workspace.id,
      window: windowId,
      state: {
        url: url,
        title: title,
        icon: icon,
      },
      lastAccessed: new Date().getTime(),
      sleeping: true,
    };
  }

  return <></>;
}

// Shared browser activation logic
export function activateBrowser(
  homePage: string,
  workspace: any,
  desktop: any,
  openWindows: any,
  items: any,
  isLocal: boolean,
  dispatch: any
) {
  let _openWindows = Object.assign({}, openWindows);
  let _id = "browser_".concat(workspace.id);

  log.debug("openLink");
  log.debug("openInternalWindow:" + homePage);

  if (openWindows[_id] != null) {
    dispatch(
      sessionActions.setActiveWindow({
        data: openWindows[_id],
      })
    );
    return;
  }

  let window = {
    workspace: workspace.id,
    id: _id,
    url: ":browser",
    location: "main",
  };

  openInternalWindow(window, items, openWindows, isLocal, (result: any) => {
    if (result === undefined || result === null) {
      return;
    }
    let _result = Object.assign({}, result);
    _result.type = "browser";
    _result.url = homePage;
    _result.location = "main";
    _result.desktop = desktop.id;
    _result.workspace = workspace.id;

    log.debug("Result:" + _result);

    // OpenWindows
    _openWindows[result.id] = _result;
    dispatch(
      sessionActions.setOpenWindows({
        data: _openWindows,
      })
    );

    // Create initial tab using WindowService
    dispatch(windowServiceActions.openNewTab({
      windowId: _result.id,
      url: _result.data.startUrl
    }));

    dispatch(sessionActions.setActiveWindow({ data: _result }));
    dispatch(sessionActions.addBrowserWindow({ data: _id }));
  });
}

export default WindowService;
