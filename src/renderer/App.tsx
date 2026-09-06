import isElectron from "is-electron";
import React, { useState, useEffect } from "react";
import log from "loglevel";
import { fab } from '@fortawesome/free-brands-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'
import { v4 as uuidv4 } from "uuid";

import ClipboardApi from "./api/ClipBoardApi";
import { memoryService } from "./services/memory";

import ProtectedHome from './routes/ProtectedHome/ProtectedHome';
import { Login } from './routes/Login/Login';

import Home from './routes/Home/Home';
import { Layout } from './components/Layout';

import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import { useSelector, useDispatch } from "react-redux";
import { workspaceActions } from "./store/workspace-slice";
import { sessionActions } from "./store/session-slice";
import { appActions } from "./store/app-slice";

import { WorkspaceService } from "./services/workspace";
import PersonsCatalog from "./routes/Person/PersonsCatalog";
import EditProfile from "./routes/EditProfile/EditProfile";
import SpaceSelection from "./routes/SpaceSelection/SpaceSelection";
import ImportService from "./services/import";
import { Hub } from "./utils/hub";

library.add(fab);

function MyRoutes() {
  useEffect(() => {
    Hub.listen('auth', (data) => {
      const { payload } = data;
      switch (data.payload.event) {
        case 'signIn':
            if (isElectron()) {
              // @ts-expect-error
              window.electronAPI.send("toMain", {
                action: "signed-in",
                id: data.payload.data.username,
              });
            }
            break;
        case 'signUp':
            log.debug('user signed up');
            break;
        case 'signOut':
            if (isElectron()) {
              // @ts-expect-error
              window.electronAPI.send("toMain", {
                action: "signed-out",
                id: data.payload.data.username,
              });
            }
            break;
        case 'signIn_failure':
          log.debug('user sign in failed');
            break;
        case 'configured':
          log.debug('the Auth module is configured');
      }
    });
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/home"  element={<Home />} />
          <Route path="/spaces"  element={<SpaceSelection />} />
          <Route index  element={<PersonsCatalog />} />
          <Route
            path="/protected"
            element={
                <ProtectedHome />
            }
          />
          <Route path="/login" element={<Login />} />
        </Route>
        <Route path="/profiles" element={<PersonsCatalog />} />
        <Route path="/profile/edit" element={<EditProfile />} />
      </Routes>
    </HashRouter>
  );
}

function App() {
  const dispatch = useDispatch();

  const saveState = useSelector((state: any) => state.app.saveState);

  const quitState = useSelector((state: any) => state.app.quitState);

  const quitAlertShown = useSelector((state: any) => state.app.quitAlertShown);

  const user = useSelector((state: any) => state.user);

  const deviceId = useSelector((state: any) => state.app.deviceId);

  const version = useSelector((state: any) => state.app.version);

  const minBuildNumber = useSelector((state: any) => state.app.minBuildNumber);

  const profileId = useSelector((state: any) => state.app.profileId);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const apps = useSelector((state: any) => state.workspace.apps);

  const links = useSelector((state: any) => state.workspace.links);

  const desktops = useSelector((state: any) => state.workspace.desktops);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const session = useSelector((state: any) => state.session);

  const sessions = useSelector((state: any) => state.workspace.sessions);

  const activeDesktopWindows = useSelector((state: any) => state.session.activeDesktopWindows);

  const activeWindow = useSelector((state: any) => state.session.activeWindow);

  const windowHistory = useSelector((state: any) => state.session.windowHistory);

  const activeWindowTabs = useSelector((state: any) => state.session.activeWindowTabs);

  const openWindows = useSelector((state: any) => state.session.openWindows);

  const openTabs = useSelector((state: any) => state.session.openTabs);

  const externalTabs = useSelector((state: any) => state.session.externalTabs);

  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  const activeTabs = useSelector((state: any) => state.session.activeTabs);

  const activeTab = useSelector((state: any) => state.session.activeTab);

  const activeTabId = useSelector((state: any) => state.session.activeTabId);

  const browserWindows = useSelector((state: any) => state.session.browserWindows);

  const activeBrowserWindowId = useSelector((state: any) => state.session.activeBrowserWindowId);

  const previousTabId = useSelector((state: any) => state.session.previousTabId);

  const isDesktopStickyMode = useSelector((state: any) => state.settings.isDesktopStickyMode);

  const favourites = useSelector((state: any) => state.session.favourites);

  const importCompleted = useSelector((state: any) => state.app.importCompleted);

  const clipboard = useSelector((state: any) => state.app.clipboard);

  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);

  const [lastSync, setLastSync] = useState(Date.now());
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState("");
  const [counter, setCounter] = useState(0);
  const [syncCounter, setSyncCounter] = useState(0);
  const [closedExternalTabId, setClosedExternalTabId] = useState("");
  const [closedExternalTabUrl, setClosedExternalTabUrl] = useState("");
  const [closeWindowId, setCloseWindowId] = useState("");
  const [messageFromMain, setMessageFromMain] = useState<any>(null);


  const isSleepingTabsEnabled = useSelector((state: any) => state.settings.isSleepingTabsEnabled);
  const sleepingTabsTimerInterval = 1*60*1000;
  const syncTimerInterval = 1000 * 60 * 10; // 10 minutes

  const tabTimeOut = useSelector((state: any) => state.settings.sleepingTabsTimeout)*60*1000; // 15 minutes

  const isKeepActiveWindowTabsAwake = useSelector((state: any) => state.settings.isKeepActiveWindowTabsAwake);

  useEffect(() => {
    log.debug("App.js: user updated...", user);
  }, [user]);

  useEffect(() => {
    log.debug("App.js: version", version);
    log.debug("App.js: minBuildNumber", minBuildNumber);
    log.debug("App.js: version ", version);
    if(version.includes("beta") || version.includes("alpha") || version.includes("dev")){
      log.setLevel("debug");
    }
  }, [version, minBuildNumber]);

  useEffect(() => {
    log.debug("App.js: activeWindow", activeWindow);
    if(activeWindow === undefined || activeWindow === null || activeWindow.data === undefined || activeWindow.data === null){
      return;
    }
    let _activeDesktopWindows = Object.assign({}, activeDesktopWindows);

    if(activeWindow.id === "launchpad"){
      dispatch(sessionActions.setActiveTab({data: {id: "launchpad"}}));
      _activeDesktopWindows[desktop.id] = "launchpad";
      dispatch(sessionActions.setActiveDesktopWindows({data: _activeDesktopWindows}));
      return;
    }

    // update sleep status start
    let _openWindows = Object.assign({}, openWindows);
    let _window = Object.assign({}, _openWindows[activeWindow.id]);
    _window.sleeping = false;
    _openWindows[activeWindow.id] = _window;
    dispatch(sessionActions.setOpenWindows({data: _openWindows}));
    // update sleep status end

    let _tabs: any = [];
    if(windowTabs.hasOwnProperty(activeWindow.id)){
      windowTabs[activeWindow.id].forEach((tabId: any) => {
        let _tab = openTabs[tabId];
        if(_tab){
          _tabs.push(_tab);
        }
      });
    }
    log.debug("App.js: _tabs", _tabs);
    dispatch(sessionActions.setActiveWindowTabs({data: _tabs}));

    let _activeTabs = Object.assign({}, activeTabs);
    log.debug("App.js: _activeTabs", _activeTabs);
    if(_activeTabs.hasOwnProperty(activeWindow.id)){ //Switch to active tab when window is active
      _tabs.forEach((tab) => {
        if(tab.id === _activeTabs[activeWindow.id]){
          dispatch(sessionActions.setActiveTab({data: tab}));
        }
      });
    }else{ // Set first tab as active if no active tab is set
      log.debug("App.js: setActiveTab", _tabs[0]);
      if(_tabs.length > 0){
        dispatch(sessionActions.setActiveTab({data: _tabs[0]}));
      }
    }

    try{
      // Switch desktop if needed
      if(isDesktopStickyMode && activeWindow.desktop !== desktop.id){
        let _desktop = desktops.find((_desktop_: any) => _desktop_.id === activeWindow.desktop);
        WorkspaceService.switchDesktop(workspace.id, _desktop.id).then((data) => {
          dispatch(workspaceActions.selectDesktop({desktop: data.desktop}));
          dispatch(workspaceActions.setApps({ apps: data.apps }));
          dispatch(workspaceActions.setLinks({ links: data.links }));

          _activeDesktopWindows[_desktop.id] = activeWindow.id;
          dispatch(sessionActions.setActiveDesktopWindows({data: _activeDesktopWindows}));
        });
      }else{
        _activeDesktopWindows[desktop.id] = activeWindow.id;
        dispatch(sessionActions.setActiveDesktopWindows({data: _activeDesktopWindows}));
      }
    }catch(e){
      log.error(e);
    }

  }, [activeWindow]);

  useEffect(() => {
    log.debug("App.js: activeWindowId", activeWindowId);

  }, [activeWindowId]);

  useEffect(() => {
    log.info("App.js: windowHistory", windowHistory);
  }, [windowHistory]);

  useEffect(() => {
    log.debug("App.js: openWindows", openWindows);
    if(openWindows === undefined || openWindows === null){
      return;
    }
  }, [openWindows]);

  useEffect(() => {
    log.debug("App.js: favourites", favourites);
    if(favourites === undefined || favourites === null){
      return;
    }
  }, [favourites]);

  useEffect(() => {
    log.debug("App.js: activeWindowTabs", activeWindowTabs);
    if(activeWindowTabs === undefined || activeWindowTabs === null){
      return;
    }

  }, [activeWindowTabs]);

  useEffect(() => {
    log.debug("App.js: activeDesktopWindows", activeDesktopWindows);
    if(activeDesktopWindows === undefined || activeDesktopWindows === null){
      return;
    }

  }, [activeDesktopWindows]);

  useEffect(() => {
    log.debug("App.js: openTabs", openTabs);
    if(openTabs === undefined || openTabs === null){
      return;
    }

  }, [openTabs]);

  useEffect(() => {
    log.debug("App.js: windowTabs", windowTabs);
    if(windowTabs === undefined || windowTabs === null){
      return;
    }

  }, [windowTabs]);

  useEffect(() => {
    log.debug("App.js: activeTabs", activeTabs);
    if(activeTabs === undefined || activeTabs === null){
      return;
    }

  }, [activeTabs]);

  useEffect(() => {
    log.debug("App.js: activeTab", activeTab);
    if(activeTab === undefined || activeTab === null){
      return;
    }

    dispatch(sessionActions.setActiveTabId({data: activeTab.id}));
    log.debug("App.js: activeTabId", activeTabId);
  }, [activeTab]);

  useEffect(() => {
    log.debug("App.js: activeTabId", activeTabId);
    if(activeTabId === undefined || activeTabId === null || activeTabId === ""){
      return;
    }

    if(activeTabId === "launchpad"){
      return;
    }

    if (!openTabs[activeTabId]) {
      return;
    }

    // Wake sleeping tab so Home remounts TabWindow / OPWebView (splash covers until load)
    if (openTabs[activeTabId].sleeping === true) {
      let _wokenTabs = Object.assign({}, openTabs);
      let _wokenTab = Object.assign({}, _wokenTabs[activeTabId]);
      _wokenTab.sleeping = false;
      _wokenTabs[activeTabId] = _wokenTab;
      dispatch(sessionActions.setOpenTabs({ data: _wokenTabs }));
    }

    let _activeTabs = Object.assign({}, activeTabs);
    _activeTabs[openTabs[activeTabId].window] = activeTabId;
    dispatch(sessionActions.setActiveTabs({data: _activeTabs}));

    if(openTabs[activeTabId].location === "external"){
      if(isElectron()){
        // @ts-expect-error
        window.electronAPI.send("toMain", {
          action: "switch-to-external-tab",
          tabWindowId: openTabs[activeTabId].window,
          tabId: openTabs[activeTabId].id,
          type: openTabs[activeTabId].type,
        });
      }
    }

  }, [activeTabId]);

  useEffect(() => {
    let _openTabs = Object.assign({}, openTabs);
    let _tab = Object.assign({}, _openTabs[previousTabId]);
    _tab.lastAccessed = Date.now();
    _tab.sleeping = false;
    _openTabs[previousTabId] = _tab;

    dispatch(
      sessionActions.setOpenTabs({
        data: _openTabs,
      })
    );

  }, [previousTabId]);

  useEffect(() => {
    log.debug("App.js: desktop", desktop);
    if(desktop === undefined || desktop === null){
      return;
    }

  }, [desktop]);

  useEffect(() => {
    log.debug("App.js: desktops", desktops);
    if(desktops === undefined || desktops === null){
      return;
    }

  }, [desktops]);

  useEffect(() => {
    log.debug("App.js: browserWindows", browserWindows);
    log.debug("App.js: activeBrowserWindowId", activeBrowserWindowId);
  }, [browserWindows, activeBrowserWindowId]);

  useEffect(() => {
    log.debug("App.js: closedExternalTabId", closedExternalTabId);
    if(closedExternalTabId === ""){
      return;
    }
    let _openTabs = Object.assign({}, openTabs);
    let _tab = Object.assign({}, _openTabs[closedExternalTabId]);
    let _window = openWindows[_tab.window];
    if(_window.location === "external"){
      // Close external window
    }else{
      _tab.location = "main";
      _openTabs[closedExternalTabId] = _tab;
      dispatch(
        sessionActions.setOpenTabs({
          data: _openTabs,
        })
      );
    }


    setClosedExternalTabId("");

  }, [closedExternalTabId]);

  useEffect(() => {
    if(isElectron() && workspace !== undefined && workspace !== null && workspace.id != currentWorkspaceId){
      setCurrentWorkspaceId(workspace.id);
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "switched-workspace",
        workspace: workspace.id,
      });
    }
  }, [workspace]);

  useEffect(() => {
    if(!saveState || workspace === undefined || workspace === null || workspace.state === undefined || workspace.state === null || workspace.state.desktop === undefined || workspace.state.desktop === null){
      log.debug("App.js: saveState return", saveState);
      return;
    }
    if(session && !session.isInSession){
      log.debug("App.js: save WS state");
      //saveWSState();
    }else{
      log.debug("App.js: is in session");
      // TODO: save session state
      log.debug("App.js: TODO: save session state");
      dispatch(appActions.setSaveState(false));
    }

  }, [saveState]);

  useEffect(() => {
    if(!quitState || workspace === undefined || workspace === null || workspace.state === undefined || workspace.state === null || workspace.state.desktop === undefined || workspace.state.desktop === null){
      log.debug("App.js: quitState return", quitState);
      return;
    }



    if(session && session.isInSession){
      alert("You are in session. Please close all windows and tabs before you quit.");
    }

    log.debug("App.js: save WS state");
    dispatch(sessionActions.getBackToLaunchPad({data: {
      desktopId: desktop.id,
    }}));
    let _counter = 0;
    let _interval = setInterval(() => {
      if(activeTabId === "launchpad"){
        clearInterval(_interval);
        //saveWSState();
        if(isElectron()){
          // @ts-expect-error
          window.electronAPI.send("toMain", {
            action: "app-quit",
          });
        }
        dispatch(appActions.setSaveAndQuitState(false));
      }else{
        _counter++;
        if(_counter > 10){
          clearInterval(_interval);
          log.error("App.js: switchToLaunchPadIFNeeded", "Switch to launchpad failed");
          dispatch(appActions.setSaveAndQuitState(false));
        }
      }
    }, 500);

  }, [quitState, activeTabId]);

  useEffect(() => {
    if(localStorage.getItem("deviceId") !== null){
      log.debug("App.js: deviceId", localStorage.getItem("deviceId"));
      dispatch(appActions.setDeviceId(localStorage.getItem("deviceId")));
    }else{
      log.debug("App.js: deviceId", "No deviceId");
      localStorage.setItem("deviceId", uuidv4());
    }
    
    // Start memory tracking service
    memoryService.startTracking();
    log.debug("App.js: Memory tracking service started");
    
    const interval = setInterval(() => {
      setCounter((prevCounter) => prevCounter + 1);
    }, sleepingTabsTimerInterval);

    return () => {
      clearInterval(interval);
      memoryService.stopTracking();
    }
  }, []);

  useEffect(() => {
    const syncInterval = setInterval(() => {
      setSyncCounter((prevCounter) => prevCounter + 1);
    }, syncTimerInterval);

    return () => {
      clearInterval(syncInterval);
    }
  }, [syncTimerInterval]);

  useEffect(() => {
    if(user.id === undefined || user.id === "" || deviceId === undefined || deviceId === "" || clipboard === undefined || clipboard === ""){
      return;
    }
    ClipboardApi.update(user.id, deviceId, clipboard).then((response) => {
      log.debug("App.js: ClipboardApi.update", response);
    }).catch((error) => {
      log.error("App.js: ClipboardApi.update", error);
    });
  }, [deviceId, clipboard]);

  useEffect(() => {
    if(messageFromMain === null){
      return;
    }
    switch(messageFromMain.action){
      case "app-ready":
        log.debug("App.js: app-ready");
        break;
      case "quit":
        log.debug("App.js: quit");
        dispatch(appActions.setSaveAndQuitState(true));
        break;
      case "clear-cache-success":
        log.debug("App.js: clear-cache-success");
        // TODO: show clear cache success dialog
        break;
      case "clear-cache-error":
        log.debug("App.js: clear-cache-error");
        // TODO: show clear cache error dialog
        break;
      case "external-tab-navigated":
        if(messageFromMain.data === undefined || messageFromMain.data === null){
          return;
        }
        log.debug("App.js: external-tab-navigated", messageFromMain.data.tabId, messageFromMain.data.url);
        return;
        // Causing a crash. Needs to be improved to handle external tabs navigation
        //const webview = document.getElementById("webview-"+messageFromMain.data.tabId);
        // if(webview){
        //  webview.loadURL(messageFromMain.data.url);
        // }
        let _externalTabs = Object.assign({}, externalTabs);
        if(messageFromMain.data === undefined || messageFromMain.data === null){
          return;
        }
        _externalTabs[messageFromMain.data.tabId] = messageFromMain.data.url;
        dispatch(sessionActions.setExternalTabs({data: _externalTabs}));
        break;
      case "external-tab-closed":
        if(messageFromMain.data === undefined || messageFromMain.data === null){
          return;
        }
        log.debug("App.js: external-tab-closed", messageFromMain.data.tabId);
        if(messageFromMain.data === undefined || messageFromMain.data === null){
          return;
        }
        setClosedExternalTabId(messageFromMain.data.tabId);
        break;
      case "import-profile":
        if(messageFromMain.data === undefined || messageFromMain.data === null){
          return;
        }
        log.debug("App.js: import-profile", messageFromMain.data);
        if(importCompleted){
          dispatch(appActions.setImportCompleted(false));
          ImportService.importData(messageFromMain.data, profileId, () => {
            dispatch(appActions.setImportCompleted(true));
            dispatch(appActions.setReload(true));
          });
        }
        break;
      case "on-clipboard-changed":
        if(
          deviceId !== "device" && user.id !== undefined && user.id !== "" &&
          deviceId !== undefined && deviceId !== "" && messageFromMain.data !== undefined &&
          messageFromMain.data !== "" && messageFromMain.data !== clipboard
          ){
          if(messageFromMain.data === undefined || messageFromMain.data === null){
            return;
          }
          dispatch(appActions.updateClipboard(messageFromMain.data));
        }
        break;
      case "autoupdater-checking-for-update":
        log.debug("App.js: autoupdater-checking-for-update");
        break;
      case "autoupdater-update-available":
        log.debug("App.js: autoupdater-update-available");
        break;
      case "autoupdater-update-not-available":
        log.debug("App.js: autoupdater-update-not-available");
        break;
      case "autoupdater-update-downloaded":
        log.debug("App.js: autoupdater-update-downloaded");
        break;
      case "newTab":
        log.debug("App.js: newTab");
        break;
      case "toggle-full-screen":
        if(messageFromMain.data === undefined || messageFromMain.data === null){
          return;
        }
        log.debug("App.js: toggle-full-screen", messageFromMain.data.isFullScreen);
        if(messageFromMain.data === undefined || messageFromMain.data === null){
          return;
        }
        dispatch(sessionActions.setIsFullScreen(messageFromMain.data.isFullScreen));
        break;
      default:
        log.debug("App.js: default");
        break;
    }

  }, [messageFromMain, dispatch, externalTabs, profileId, importCompleted, user, deviceId, clipboard]);

  useEffect(() => {
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "app-ready",
      });
      // @ts-expect-error
      window.electronAPI.handleAppVersion((event: any, value: any) => {
        log.debug("App.js: handleAppVersion", value);
        dispatch(appActions.setVersion({ version: value }));
      });

      // @ts-expect-error
      window.electronAPI.handlePlatform((event: any, value: any) => {
        log.debug("App.js: handlePlatform", value);
        dispatch(appActions.setPlatform(value));
      });

      // @ts-expect-error
      window.electronAPI.handleSetHostName((event: any, value: any) => {
        log.debug("App.js: handleSetHostName", value);
        dispatch(appActions.setHostname(value));
      });

      // @ts-expect-error
      window.electronAPI.handleScreenshot((event: any, data: any) => {
        log.debug("App.js: handleScreenshot", data);
        localStorage.setItem("screenshot-"+data.tab, data.image);
      });

      // @ts-expect-error
      window.electronAPI.fromMain((event: any, message: any) => {
        log.debug("App.js: receive", message);
        setMessageFromMain(message);
      });
    }

  }, []);

  async function switchToLaunchPadIFNeeded(){
    return new Promise((resolve, reject) => {
      if(activeTabId === "launchpad"){
        // @ts-expect-error
        resolve();
      }else{
        dispatch(sessionActions.getBackToLaunchPad({data: {
          desktopId: desktop.id,
        }}));
        let _counter = 0;
        let _interval = setInterval(() => {
          if(activeTabId === "launchpad"){
            clearInterval(_interval);
            // @ts-expect-error
            resolve();
          }else{
            _counter++;
            if(_counter > 10){
              clearInterval(_interval);
              reject("Switch to launchpad failed");
            }
          }
        }, 1000);
      }
    });
  }

  function saveWSState(){
    let _openTabs = {};
    Object.values(openTabs).forEach((tab: any) => {
        let _tab = Object.assign({},tab);
        _tab.location = "main";
        _tab.sleeping = true;
        if(_tab.id){
          // @ts-expect-error
          _openTabs[tab.id] = _tab;
        }
    });
    let _sessions: any = [];
    sessions.forEach((session: any) => {
        _sessions.push({
            id: session.id,
            name: session.name,
        });
    });
    WorkspaceService.saveState(workspace.id,{
        desktop: workspace.state.desktop,
        openWindows: openWindows,
        openTabs: _openTabs,
        windowTabs: windowTabs,
        activeDesktopWindows: activeDesktopWindows,
        activeTabs: activeTabs,
        activeTab: activeTab,
        activeTabId: activeTabId,
        activeWindow: activeWindow,
        activeWindowId: activeWindow.id,
        activeWindowTabs: activeWindowTabs,
        sessions: _sessions,
    }).catch((err) => {
        log.error("onclose",err);
    });
    dispatch(appActions.setSaveState(false));

  }

  return (
    <MyRoutes />
  );
}

export default App;
