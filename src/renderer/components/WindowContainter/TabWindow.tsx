import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import isElectron from "is-electron";

import { getProcessDetails } from "../../api/ProcessApi";
import { closeWindow } from "../../services/window";
import { closeTab } from "../../util/tabs";
import { appActions } from "../../store/app-slice";
import { sessionActions } from "../../store/session-slice";
import { windowBarActions } from "../../store/windowbar-slice";
import { windowServiceActions } from "../../store/window-service-slice";

import "./Window.css";
import AppService from "../../services/app";
import { LinkService } from "../../services/link";
import XAppService from "../../services/xapp";
import {
  Spinner,
  Button,
  Progress,
} from "reactstrap";

import LoadingBar from 'react-top-loading-bar'
import OPWebView from "./OPWebView";

function TabWindow(this, props) {
  const dispatch = useDispatch();

  const user = useSelector((state: any) => state.user);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const openWindows = useSelector((state: any) => state.session.openWindows);

  const browserWindows = useSelector((state: any) => state.session.browserWindows);


  const sessionState = useSelector((state: any) => state.session);

  const openTabs = useSelector((state: any) => state.session.openTabs);

  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  const activeWindow = useSelector((state: any) => state.session.activeWindow);

  const activeTabId = useSelector((state: any) => state.session.activeTabId);


  const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

  const isSharedAppsEnabled = useSelector((state: any) => state.settings.isSharedAppsEnabled);

  const isBottomNavBarVisible = useSelector((state: any) => state.view.isBottomNavBarVisible);

  const hideTabBar = useSelector((state: any) => state.view.hideTabBar);

  const isExtended = useSelector((state: any) => state.view.isExtended);


  const tabsBarVisualMode = useSelector((state: any) => state.tabsBar.mode);

  const isAIAssistantOpen = useSelector((state: any) => state.ai.isOpen);

  const [progress, setProgress] = useState(0);
  const [webViewId, setWebViewId] = useState("webview-" + props.tabId);
  const [webViewContainerId, setWebViewContainerId] = useState("webview-container-" + props.tabId);
  const [loadingBarId, setLoadingBarId] = useState("loading-bar-" + props.tabId);

  const [currentUrl, setCurrentUrl] = useState("");
  const [title, setTitle] = useState("");
  const [currentFavIcon, setCurrentFavIcon] = useState("");
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [isProcessRunning, setIsProcessRunning] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    log.debug("tab mounted");
    if(props.type === "remote"){
      checkProcess(props.url);
      setTimer(timer + 1);
    }
    if(props.url !== openTabs[props.tabId].state.url){
      setWebViewId("webview-" + props.tabId);
    }

    return () => {
      log.debug("tab unmounted", props.tabId, currentUrl);
      if(openTabs.hasOwnProperty(props.tabId)){
        log.debug("Tab is still open, closing that tab");
      }
    };
  }, []);

  function checkProcess(processUrl) {
    let timeout = 10000;
    if(isProcessRunning){
      timeout = 60000;
    }
    getProcessDetails(user.uid, props.tabId).then((response: any) => {
        log.debug("process response", response.status);
        if(response.status === "TERMINATED"){
          setIsProcessRunning(false);
          window.alert("Cloud app terminated, window is closing...");
          dispatch(windowServiceActions.closeWindow(props.windowId));
          return;
        }

        if(response.status === "STOPPED" || response.status === "STOPPING"){
          setIsProcessRunning(false);
          window.alert("Cloud app stopped, window is closing...");
          dispatch(windowServiceActions.closeWindow(props.windowId));
          return;
        }

        if (response.status === "RUNNING" && !isProcessRunning) {
          setIsProcessRunning(true);
        }else {
          if(!isProcessRunning){
            log.debug("process not ready, retrying in 10 seconds");
          }
          setTimeout(() => {
              checkProcess(processUrl);
          }, timeout);
        }
    }).catch((error) => {
        log.error("error getting process status", error);
        window.alert("Error getting process status, window is closing...");
        dispatch(windowServiceActions.closeWindow(props.windowId));
    });
  }

  useEffect(() => {
    setTimeout(() => {
      setTimer(timer + 1);
    }, 1000);
  }, [timer]);

  useEffect(() => {
    let _openTabs = Object.assign({}, openTabs);
    let _tab = Object.assign({}, _openTabs[props.tabId]);
    _tab.mediaPlaying = mediaPlaying;
    _openTabs[props.tabId] = _tab;
    dispatch(sessionActions.setOpenTabs({data: _openTabs}));
  }, [mediaPlaying]);

  useEffect(() => {
    const container = document.getElementById(props.tabId);
    const _webviewContainer = document.getElementById(webViewContainerId);
    const loadingBar = document.getElementById(loadingBarId);
    if (activeWindow && container != null && _webviewContainer != null) {
      if(props.type === "remote"){
        container.classList.add("remote");
      }else{
        container.classList.remove("remote");
      }
      if (props.windowId === activeWindow.id) {
        container.classList.remove("hidden-tab");
        if(props.tabId !== activeTabId){
          container.classList.add("d-none");
          _webviewContainer.classList.add("d-none");
          if(loadingBar){
            loadingBar.classList.add("d-none");
          }
        }else{
          container.classList.remove("d-none");
          _webviewContainer.classList.remove("d-none");
          if(loadingBar){
            loadingBar.classList.remove("d-none");
          }
        }
      } else {
        //setTimeout(() => {
          container.classList.add("hidden-tab");
        //  }, 200);
      }
    }
  }, [workspace, desktop, activeWindow, activeTabId, webViewContainerId]);

  useEffect(() => {
    const container = document.getElementById(props.tabId);
    if (container != null) {
      if(hideTabBar[activeWindow.id] !== undefined && hideTabBar[activeWindow.id] === true){
        if(isBottomNavBarVisible){
          container.classList.remove("no-tab-and-bottom-bar");
          container.classList.remove("no-bottom-bar");
          setTimeout(() => {
            container.classList.add("no-tab-bar");
          }, 100);
        }else{
          container.classList.remove("no-tab-bar");
          setTimeout(() => {
            container.classList.add("no-tab-and-bottom-bar");
          }, 100);
        }
      }else{
        if(isBottomNavBarVisible){
          container.classList.remove("no-tab-bar");
          container.classList.remove("no-bottom-bar");
          container.classList.remove("no-tab-and-bottom-bar");
        }else{
          container.classList.remove("no-tab-bar");
          container.classList.remove("no-tab-and-bottom-bar");
          container.classList.add("no-bottom-bar");
        }
      }
    }
  }, [windowTabs, activeTabId, isSharedAppsEnabled, isBottomNavBarVisible, hideTabBar]);

  useEffect(() => {
    if(activeTabId === props.tabId){
      log.debug("Window.js: activeTabId", activeTabId);
      let _openTabs = Object.assign({}, openTabs);
      let _tab = Object.assign({}, _openTabs[activeTabId]);
      _tab.lastAccessed = Date.now();
      if(_tab.sleeping){
        _tab.sleeping = false;
        setWebViewId("webview-" + props.tabId);
      }
      _openTabs[activeTabId] = _tab;
      dispatch(sessionActions.setOpenTabs({data: _openTabs}));
    }
  }, [activeTabId]);

  useEffect(() => {
    try{
      if (webViewId == null) return;
      let _openTabs = Object.assign({}, openTabs);
      let _tab = Object.assign({}, _openTabs[props.tabId]);
      let _tabState = Object.assign({}, _tab.state);
      let _window = openWindows[props.windowId];
      const getTLD = (hostname) => {
        const parts = hostname.split('.');
        if (parts.length > 2 && parts[parts.length - 2] === 'co') {
            return parts.slice(-3).join('.');
        }
        return parts.slice(-2).join('.');
      };

      if(_window.type === "app"){
        let _domain = getTLD(new URL(_tabState.url).hostname);
        let _appDomain = _window.data.customUrl !== "" ?
          getTLD(new URL(_window.data.customUrl).hostname) :
          getTLD(new URL(_window.data.startUrl).hostname);
        if(_domain === _appDomain){
          _tabState.icon = "./images/store/icon/"+_window.data.icon;
        }else{
          _tabState.icon = currentFavIcon;
        }
      }else{
        if(_tabState.icon !== currentFavIcon){
          _tabState.icon = currentFavIcon;
        }
      }

      if(_tabState.title !== title){
        _tabState.title = title;
      }
      _tab.state = _tabState;
      // Note: webContentsId should be set by the webview component when ready, not from the HTML element ID
      _openTabs[props.tabId] = _tab;
      log.debug("updateTabIcon_openTabs", _openTabs);
      dispatch(
        sessionActions.setOpenTabs({
          data: _openTabs,
        })
      );
    }catch(e){
      log.error(e);
    }
  }, [currentFavIcon, title]);

  useEffect(() => {
    log.debug("currentUrl", currentUrl);
    if(currentUrl === "") return;

    let _openTabs = Object.assign({}, openTabs);
    let _tab = Object.assign({}, _openTabs[props.tabId]);
    let _state = Object.assign({}, _tab.state);

    if(_state.url !== currentUrl){
      _state.url = currentUrl;
    }
    _tab.state = _state;
    _openTabs[props.tabId] = _tab;
    dispatch(
      sessionActions.setOpenTabs({
        data: _openTabs,
      })
    );
  }, [currentUrl]);

  function handleCloseTab(tab){
    if(tab === null || tab === undefined){
      tab = openTabs[props.tabId];
    }
    // @ts-expect-error TS(2554): Expected 13 arguments, but got 11.
    closeTab(tab, dispatch, openTabs, windowTabs, openWindows, browserWindows, activeTabId, [], desktop, isExternalWindowMode, sessionActions);
  }

  function handleCloseWindow(){
    let _window = openWindows[props.windowId];
    let _autoSave = _window.data.autoSave !== undefined ? _window.data.autoSave : false;
    if(sessionState.isInSession || !_autoSave){
      closeWindow(dispatch, sessionActions, props.windowId, openWindows, openTabs, [], windowTabs, desktop, isExternalWindowMode);
      return;
    }

    let _tabIds = Object.assign([], windowTabs[props.windowId]);
    let tabs = [];
    _tabIds.forEach((tabId) => {
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
      AppService.updateState(props.windowId, {
        tabs: tabs,
      }).then((res) => {
        log.debug("updateState", res);
        closeWindow(dispatch, sessionActions, props.windowId, openWindows, openTabs, [], windowTabs, desktop, isExternalWindowMode);
      }).catch((err) => {
        log.error("updateState", err);
        closeWindow(dispatch, sessionActions, props.windowId, openWindows, openTabs, [], windowTabs, desktop, isExternalWindowMode);
      });
    }else if(_window.type === "link"){
      LinkService.updateState(props.windowId, {
        tabs: tabs,
      }).then((res) => {
        log.debug("updateState", res);
        closeWindow(dispatch, sessionActions, props.windowId, openWindows, openTabs, [], windowTabs, desktop, isExternalWindowMode);
      }).catch((err) => {
        log.error("updateState", err);
        closeWindow(dispatch, sessionActions, props.windowId, openWindows, openTabs, [], windowTabs, desktop, isExternalWindowMode);
      });
    }else if(_window.type === "xapp"){
      log.debug("updateState XAPP", tabs);
      XAppService.updateState(props.windowId, {
        tabs: tabs,
      }).then((res) => {
        log.debug("updateState", res);
        closeWindow(dispatch, sessionActions, props.windowId, openWindows, openTabs, [], windowTabs, desktop, isExternalWindowMode);
      }).catch((err) => {
        log.error("updateState", err);
        closeWindow(dispatch, sessionActions, props.windowId, openWindows, openTabs, [], windowTabs, desktop, isExternalWindowMode);
      });
    }else{
      closeWindow(dispatch, sessionActions, props.windowId, openWindows, openTabs, [], windowTabs, desktop, isExternalWindowMode);
    }
  }

  function handleTerminateProcess(){
    if (window.confirm("Are you sure you want to cancel the process?")) {
      dispatch(windowServiceActions.closeTab(props.tabId));
    }
  }

  return <>
    {
      activeTabId === props.tabId && progress < 100 && (
                <LoadingBar containerClassName="loading-bar-container" color="#2196f3" progress={progress} onLoaderFinished={() => log.debug("loader finished...")} />
      )
    }

    <div id={props.tabId} className="app-window hidden-tab">
      <div id={webViewContainerId} className={`${isExtended ? "webview-container d-none extended" : "webview-container " + tabsBarVisualMode}${props.type === "remote" ? " remote" : ""}${isSharedAppsEnabled ? " with-left-bar" : ""}${isAIAssistantOpen ? " chat-assistant-open" : ""}`}>
        {
          props.type === "remote" && !isProcessRunning ? (
            <div className="d-flex justify-content-center align-middle h-100 bg-dark">
              <div className="spinner">
                <Spinner color="primary" />
              </div>
              <div className="spinner-text">
                <span className="text-secondary">Please wait...</span> <br/>
                <span className="text-secondary">{timer} seconds</span> <br/> <br/>
                <Progress animated
                  style={{
                    width: '250px'
                  }}
                  color="success"
                  value={100}
                  />
                  <br/>
                  <Button color="primary" onClick={() => handleTerminateProcess()}>Cancel</Button>
              </div>
            </div>
          ) : (
            <OPWebView
              type={props.type}
              ref={(instance) => { this.child = instance; }}
              windowId={props.windowId}
              tabId={props.tabId}
              partition={props.partition}
              startUrl={props.url}
              workspaceId={props.workspaceId}
              desktopId={props.desktopId}
              sleeping={props.sleeping}
              location={props.location}
              isolated={props.isolated ? true : false}
              isProcessRunning={isProcessRunning}
              checkProcess={checkProcess}
              setProgress={setProgress}
              setMediaPlaying={setMediaPlaying}
              setCurrentUrl={setCurrentUrl}
              setTitle={setTitle}
              setCurrentFavIcon={setCurrentFavIcon}
            />
          )
        }
      </div>
    </div>
  </>;
}

export default TabWindow;
