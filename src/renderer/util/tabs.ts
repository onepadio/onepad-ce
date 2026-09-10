import log from "loglevel";
import { sessionActions } from "../store/session-slice";
import { v4 as uuidv4 } from 'uuid';
import isElectron from "is-electron";
import AppService from "../services/app";
import LinkService from "../services/link";
import { closeWindow } from "../services/window";
import BrowserStateService from "../services/browsers";
import XAppService from "../services/xapp";
import { windowServiceActions } from "renderer/store/window-service-slice";
import {
  getSameSpaceBrowserWindowIds,
  resolveBrowserWindowId,
} from "./browserWindows";

export function newTabForActiveWindow(dispatch: any, workspace: any, desktop: any, windowTabs: any, openTabs: any, activeTabs: any, activeWindow: any, isolated = false){
  let _url = activeWindow.data.customUrl !== undefined && activeWindow.data.customUrl !== "" ? activeWindow.data.customUrl : activeWindow.data.startUrl;

  // Use centralized WindowService implementation
  dispatch(windowServiceActions.openNewTab({
    windowId: activeWindow.id,
    url: _url
  }));
}

export function closeTab(tab: any, dispatch: any, openTabs: any, windowTabs: any, openWindows: any, browserWindows: any, activeWindowId: any, activeTabId: any, activeTabs: any, desktop: any, isExternalWindowMode: any, sessionActions: any, onTabClose: any) {
    log.debug("Active tab",activeTabId);
    log.debug("Closing tab",tab.id);
    if(windowTabs[tab.window].length === 1){
      if(tab.type === "app"){
        AppService.updateState(tab.window, {
          tabs: [],
        }).then((res) => {
          log.debug("App state updated",res);
          dispatch(windowServiceActions.closeWindow(tab.window));
        });
      }else if(tab.type === "xapp"){
        XAppService.updateState(tab.window, {
          tabs: [],
        }).then((res) => {
          log.debug("App state updated",res);
          dispatch(windowServiceActions.closeWindow(tab.window));
        });
      }else if(openWindows[tab.window].type === "link"){
        LinkService.updateState(tab.window, {
          tabs: [],
        }).then((res) => {
          log.debug("updateState", res);
          dispatch(windowServiceActions.closeWindow(tab.window));
        }).catch((err) => {
          log.error("updateState", err);
          dispatch(windowServiceActions.closeWindow(tab.window));
        });
      }else{
        // remote or browser
        if(openWindows[tab.window].type === "browser"){
          const closedWorkspace =
            openWindows[tab.window]?.workspace ?? tab.workspace;
          const remaining = (browserWindows || [])
            .map(resolveBrowserWindowId)
            .filter((id): id is string => id != null && id !== tab.window);
          const sameSpace = getSameSpaceBrowserWindowIds(
            browserWindows,
            openWindows,
            closedWorkspace,
            tab.window
          );

          log.debug("close browser window", openWindows[tab.window]);
          log.debug("sameSpace remaining", sameSpace.length);

          if (sameSpace.length === 0) {
            dispatch(sessionActions.getBackToLaunchPad({data: {
              desktopId: desktop.id,
            }}));
            log.debug("Closing last browser window in space: ", closedWorkspace);
            BrowserStateService.deleteBrowserStateByWorkspaceId(closedWorkspace).then((res) => {
              log.debug("deleteBrowserStateByWorkspaceId", res);
            }).catch((err) => {
              log.error(err);
            });
          } else {
            const nextId = sameSpace.at(-1);
            if (nextId && openWindows[nextId]) {
              dispatch(sessionActions.setActiveWindow({data: openWindows[nextId]}));
              dispatch(sessionActions.setActiveBrowserWindowId({data: nextId}));
            }
          }
          dispatch(sessionActions.setBrowserWindows({data: remaining}));
        }
        closeWindow(dispatch, sessionActions, tab.window, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
      }
      if(isElectron()){
        // @ts-expect-error
        window.electronAPI.send("toMain", {
          action: "close-tab",
          closeTabWindowId: tab.window,
          closeTabId: tab.id,
          closeTabType: tab.type,
        });
      }
    }else{
      let tabId = tab.id;
      let _windowTabs = Object.assign([], windowTabs);

      let _updatedTabs = _windowTabs[tab.window].filter((_tabId: any) => _tabId !== tabId && openTabs[_tabId] !== undefined );
      _windowTabs[tab.window] = _updatedTabs;
      log.debug("handleCloseTab", _windowTabs);
      dispatch(
          sessionActions.setWindowTabs({
            data: _windowTabs,
          })
      );

      let _openTabs = Object.assign({}, openTabs);
      delete _openTabs[tabId];
      dispatch(
          sessionActions.setOpenTabs({
          data: _openTabs,
          })
      );

      if(tabId === activeTabId || tabId === activeTabs[tab.window]){
        log.debug("Closing active tab");
        log.debug("_updatedTabs",_updatedTabs);
        log.debug("openTabs[_updatedTabs.at(-1)]",openTabs[_updatedTabs.at(-1)]);

        let _activeTabs = Object.assign({}, activeTabs);
        _activeTabs[tab.window] = _updatedTabs.at(-1);
        dispatch(
            sessionActions.setActiveTabs({
            data: _activeTabs,
            })
        );
        if(activeWindowId === tab.window){
          // switch tab
          dispatch(sessionActions.setActiveTab({
              data: openTabs[_updatedTabs.at(-1)]
          }));
        }
      }

    }
    // Delete screenshot (memory + disk + localStorage)
    localStorage.removeItem("screenshot-"+tab.id);
    if(isElectron()){
      try {
        // @ts-expect-error
        window.electronAPI?.screenshot?.delete("screenshot-"+tab.id);
      } catch (e) {
        log.error("Failed to delete screenshot", tab.id, e);
      }
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "close-tab",
        closeTabWindowId: tab.window,
        closeTabId: tab.id,
        closeTabType: tab.type,
      });
    }
  }
