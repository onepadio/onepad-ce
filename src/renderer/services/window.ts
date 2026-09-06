import isElectron from "is-electron";
import { v4 as uuidv4 } from "uuid";
import log from "loglevel";

import XAppService from "./xapp";

// @ts-expect-error
import defaultIcon from "../images/default_icon.png";
// @ts-expect-error
import googleIcon from "../images/google_icon.png";
// @ts-expect-error
import globeIcon from "../images/globe_icon_96.png";

const defaultUserAgent = "";
const customUserAgents = {
  "https://web.whatsapp.com":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
  "https://mail.yandex.com":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
};

export const WindowType = {
  Internal: 'internal',
  Modal: 'modal',
  External: 'external',
  SystemBrowser: 'browser'
};

export const windowTypes = [
  { key: WindowType.Internal, label: "Standard Window" },
  { key: WindowType.Modal, label: "Overlay Window" },
  // { key: WindowType.External, label: "External Window" },
  { key: WindowType.SystemBrowser, label: "System Browser" },
];

export function openBrowserWindow(query: any) {
  var width = window.screen.availWidth;
  var height = window.screen.availHeight;

  let id = uuidv4();
  let _url = query == null ? "https://google.com/search?q=" : "https://google.com/search?q="+query;
  let type = WindowType.SystemBrowser;
  let userAgent = defaultUserAgent;
  let window_type = "workspace";
  let is_stateful = 0;
  let showControls = 0;

  let passValue =
      id +
      "|" +
      type +
      "|" +
      userAgent +
      "|" +
      _url +
      "|" +
      window_type +
      "|" +
      is_stateful +
      "|" +
      showControls;
    let enc = btoa(passValue);
    window.open(
      enc,
      "_blank",
      "width=" + width + ",height=" + height + ",nodeIntegration=yes"
    );
}

export function openAppWindow(id: any, url: any, window_type: any, is_stateful: any, showControls: any) {
  var width = window.screen.availWidth;
  var height = window.screen.availHeight;
  var type = "app";

  if (isElectron()) {
    let userAgent = defaultUserAgent;
    if (customUserAgents.hasOwnProperty(url)) {
      userAgent = customUserAgents[url];
    }
    let passValue =
      id +
      "|" +
      type +
      "|" +
      userAgent +
      "|" +
      url +
      "|" +
      window_type +
      "|" +
      is_stateful +
      "|" +
      showControls;
    let enc = btoa(passValue);
    var appWindow = window.open(
      enc,
      "_blank",
      "width=" + width + ",height=" + height + ",nodeIntegration=yes"
    );
  } else {
    // @ts-expect-error
    var appWindow = window.open(url, "_blank").focus();
    if (appWindow) {
      appWindow.onunload = function () {
        var win = appWindow.opener;
        if (!win.closed) {
          log.debug("Closed window");
        }
      };
    }
  }
}

export function openWindowForIconSearch(url: any) {
  var width = window.screen.availWidth;
  var height = window.screen.availHeight;
  var type = "data";
  let passValue = type + "|" + url;
  let enc = btoa(passValue);
  window.open(
    enc,
    "_blank",
    "width=" + width + ",height=" + height + ",nodeIntegration=yes"
  );
}

export function openInternalWindow(
  window: any,
  items: any,
  openWindows: any,
  isLocal: any,
  onCompleted: any
){
  processWindowOpen(window, items, openWindows, isLocal, onCompleted);
}

export function handleWindowOpened(
  window: any,
  items: any,
  openWindows: any,
  isLocal: any,
  onCompleted: any
) {

  processWindowOpen(window, items, openWindows, isLocal, onCompleted);

}

function processWindowOpen(
  window: any,
  items: any,
  openWindows: any,
  isLocal: any,
  onCompleted: any
  ){
  if (openWindows.hasOwnProperty(window.id)) {
    delete openWindows[window.id];
  }

  let _default = {
    start_url: window.url,
    icon: defaultIcon,
    id: window.id,
    location: window.location,
  };

  let browser = {
    id: window.id,
    data:{
      title:"Google",
      startUrl: "https://google.com/search?q=",
      icon: globeIcon,
      window:{
        fullScreen:true,
        enableTabs:true,
        width:0,
        height:0
      }
    },
  };

  try {
    if (window.url.startsWith(":browser")) {
      onCompleted(browser);
    } else {
      //if (isLocal) {
        /* getAppById(window.id).then((launchIcon) => {
          if(launchIcon){
            onCompleted(launchIcon);
          }else{
            db.links.get({id: window.id}).then((link) => {
              if(link){
                onCompleted(link);
              }
            });
          }
        }); */
      //} else {
        items
          .filter((item: any) => item.id === window.id)
          .map((item: any) => {
            onCompleted(item);
          });
      //}
    }
  } catch (error) {
    console.error(error);
    onCompleted(_default);
  }
}

export function handleWindowClosed(
  id: any,
  openWindows: any,
  onCompleted: any
) {
  let _openWindows = Object.assign({}, openWindows);
  if (_openWindows.hasOwnProperty(id)) {
    log.debug("handleWindowClosed: " + id);
    delete _openWindows[id];
    onCompleted(_openWindows);
  }
}

export function closeWindow(dispatch: any, sessionActions: any, windowId: any, openWindows: any, openTabs: any, activeTabs: any, windowTabs: any, desktop: any, isExternalWindowMode: any){
  if(isExternalWindowMode && isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "close-window",
        id: windowId,
      });
  }else{
      handleWindowClosed(windowId, openWindows, (result: any) => {
          dispatch(
            sessionActions.setOpenWindows({
              data: result,
            })
          );

          if(openWindows[windowId].type !== "browser"){
            //dispatch(sessionActions.goBackToPreviousWindow({data: {
            //    desktopId: desktop.id,
            //  }}));
            dispatch(sessionActions.goBackToLaunchPad({data: {
              desktopId: desktop.id,
            }}));
          }
          
          let _activeTabs = Object.assign({}, activeTabs);
          delete _activeTabs[windowId];
          dispatch(
              sessionActions.setActiveTabs({
              data: _activeTabs,
              })
          );

          let _windowTabs = Object.assign([], windowTabs);
          delete _windowTabs[windowId];
          dispatch(
              sessionActions.setWindowTabs({
              data: _windowTabs,
              })
          );

          let _openTabs = Object.assign({}, openTabs);
          Object.values(_openTabs).forEach((tab) => {
              // @ts-expect-error TS(2571): Object is of type 'unknown'.
              if(tab.window === windowId){
                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  log.debug("closeWindow:delete tab:"+tab.id);
                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  delete _openTabs[tab.id];
                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  localStorage.removeItem("screenshot-"+tab.id);
                  if (isElectron()) {
                    try {
                      // @ts-expect-error TS(2571): Object is of type 'unknown'.
                      window.electronAPI?.screenshot?.delete("screenshot-" + tab.id);
                    } catch (e) {
                      log.error("Failed to delete screenshot", e);
                    }
                  }
              }
          });
          dispatch(
              sessionActions.setOpenTabs({
              data: _openTabs,
              })
          );

          if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "close-window",
                id: windowId,
            });
          }
      });
  }
}


export function processWindows(workspaceId: any, openWindows: any, windowTabs: any, activeTabs: any, openTabs: any){
  let _openWindows = Object.assign({},openWindows);
  let _windowTabs = Object.assign({},windowTabs);
  let _activeTabs = Object.assign({},activeTabs);

  Object.keys(_openWindows).forEach((windowId) => {
      if(_openWindows[windowId].data === null || _openWindows[windowId].workspace !== workspaceId){
          log.debug("processWindows:deleted window:"+windowId);
          delete _openWindows[windowId];
          delete _windowTabs[windowId];
          delete _activeTabs[windowId];
      }
  });

  Object.keys(_openWindows).forEach((windowId) => {
      let window = Object.assign({},_openWindows[windowId]);
      switch(window.type){
          case "xapp":
              let _tabs: any = [];
              windowTabs[window.id].forEach((tabId: any) => {
                  let _tab = Object.assign({}, openTabs[tabId]);
                  let _state = Object.assign({}, _tab.state);
                  _state.id = tabId;
                  _tabs.push(_state);
              });
              XAppService.updateState(window.id, {
                  tabs: _tabs,
              }).then((res) => {
                  log.debug("XApp state updated",res);
                  delete _openWindows[window.id];
                  delete _windowTabs[window.id];
                  delete _activeTabs[window.id];
              });
              break;
          default:
              break;
      }
      window.sleeping = true;
      _openWindows[windowId] = window;
  });
  return {
      openWindows: _openWindows,
      windowTabs: _windowTabs,
      activeTabs: _activeTabs,
  };
}

export function processOpenTabsBeforePersist(workspaceId: any, openTabs: any){
  let _openTabs = Object.assign({},openTabs);
  let _tabs = {};
  Object.values(_openTabs).forEach((tab) => {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      if(tab.type !== "xapp" && tab.type !== undefined && tab.type !== null && tab.workspace === workspaceId){
          let _tab = Object.assign({},tab);
          // @ts-expect-error TS(2339): Property 'location' does not exist on type '{}'.
          _tab.location = "main";
          // @ts-expect-error TS(2339): Property 'sleeping' does not exist on type '{}'.
          _tab.sleeping = true;
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          _openTabs[tab.id] = _tab;

          // @ts-expect-error
          _tabs[tab.id] = tab;
      }
  });
  return _tabs;
}

export function closeMultipleWindows(dispatch: any, sessionActions: any, windowIds: any, openWindows: any, openTabs: any, activeTabs: any, windowTabs: any, desktop: any, isExternalWindowMode: any) {
    let _openWindows = Object.assign({}, openWindows);
    let _activeTabs = Object.assign({}, activeTabs);
    let _windowTabs = Object.assign([], windowTabs);
    let _openTabs = Object.assign({}, openTabs);
    
    windowIds.forEach((windowId: any) => {
        // Process window closure
        if (_openWindows.hasOwnProperty(windowId)) {
            log.debug("closeMultipleWindows: " + windowId);
            delete _openWindows[windowId];
            delete _activeTabs[windowId];
            delete _windowTabs[windowId];
            
            // Process tabs
            Object.values(_openTabs).forEach((tab) => {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                if(tab.window === windowId){
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    log.debug("closeMultipleWindows:delete tab:" + tab.id);
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    delete _openTabs[tab.id];
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    localStorage.removeItem("screenshot-" + tab.id);
                    if (isElectron()) {
                      try {
                        // @ts-expect-error TS(2571): Object is of type 'unknown'.
                        window.electronAPI?.screenshot?.delete("screenshot-" + tab.id);
                      } catch (e) {
                        log.error("Failed to delete screenshot", e);
                      }
                    }
                }
            });

            // Handle electron windows if needed
            if(isElectron()){
                // @ts-expect-error
                window.electronAPI.send("toMain", {
                    action: "close-window",
                    id: windowId,
                });
            }
        }
    });

    // Dispatch all updates at once
    dispatch(
        sessionActions.setOpenWindows({
            data: _openWindows,
        })
    );

    dispatch(
        sessionActions.setActiveTabs({
            data: _activeTabs,
        })
    );

    dispatch(
        sessionActions.setWindowTabs({
            data: _windowTabs,
        })
    );

    dispatch(
        sessionActions.setOpenTabs({
            data: _openTabs,
        })
    );
}