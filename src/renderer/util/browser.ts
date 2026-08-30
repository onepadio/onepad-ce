import { v4 as uuidv4 } from "uuid";
import log from "loglevel";
import { sessionActions } from "../store/session-slice";
import { windowServiceActions } from "../store/window-service-slice";

import BrowserStateService from "../services/browsers";
import { openInternalWindow, openAppWindow } from "../services/window";




const MAX_BROWSER_GROUPS = 9;

/**
 * Creates a new browser window (tab group) with an initial tab.
 * Returns false if the max number of groups has been reached.
 */
export function createBrowserGroup(
  openWindows: any,
  items: any,
  isLocal: any,
  desktop: any,
  workspace: any,
  dispatch: any,
  url: any,
  browserWindowsLength: number
): boolean {
  if (browserWindowsLength >= MAX_BROWSER_GROUPS) {
    alert("Maximum number of tab groups reached");
    return false;
  }

  let _openWindows = Object.assign({}, openWindows);
  let _id = "browser_".concat(uuidv4());
  log.debug("createBrowserGroup", url);

  if (openWindows[_id] != null && openWindows[_id].location === "external") {
    openAppWindow(_id, url, "external", 0, 0);
    return true;
  }

  if (openWindows[_id] != null) {
    dispatch(sessionActions.setActiveWindow({ data: openWindows[_id] }));
    return true;
  }

  let window = {
    workspace: workspace.id,
    id: _id,
    url: ":browser",
    location: "main",
  };

  openInternalWindow(
    window,
    items,
    openWindows,
    isLocal,
    (result: any) => {
      if (result === undefined || result === null) {
        return;
      }
      let _result = Object.assign({}, result);
      _result.type = "browser";
      _result.url = url;
      _result.location = "main";
      _result.desktop = desktop.id;
      _result.workspace = workspace.id;

      log.debug("Result:", _result);
      _openWindows[result.id] = _result;
      dispatch(
        sessionActions.setOpenWindows({
          data: _openWindows,
        })
      );

      dispatch(
        windowServiceActions.openNewTab({
          windowId: _result.id,
          url: url,
        })
      );

      dispatch(sessionActions.setActiveWindow({ data: _result }));
      dispatch(sessionActions.addBrowserWindow({ data: _id }));
      dispatch(sessionActions.setActiveBrowserWindowId({ data: _id }));
    }
  );
  return true;
}

function newBrowserTab(openWindows: any, openTabs: any, windowTabs: any, items: any, isLocal: any, desktop: any, workspace: any, dispatch: any, url: any, activeBrowserWindowId: any){
  createBrowserGroup(openWindows, items, isLocal, desktop, workspace, dispatch, url, 0);
}

export function activateBrowser(url: any, desktop = {}, workspace = {}, dispatch: any, openWindows: any, openTabs: any, windowTabs: any, activeTabs: any, items: any, isLocal: any, activeBrowserWindowId: any, needsOpenTab = false){
    let _openWindows = Object.assign({}, openWindows);
    let _openTabs = Object.assign({}, openTabs);
    let _windowTabs = Object.assign({}, windowTabs);
    let _activeTabs = Object.assign({}, activeTabs);

    // @ts-expect-error TS(2339): Property 'id' does not exist on type '{}'.
    BrowserStateService.getBrowserStateByWorkspaceId(workspace.id).then((res) => {
      log.debug("getBrowserStateByWorkspaceId",res);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      if(res && res.state.activeBrowserWindowId !== "" && res.state.openWindows[res.state.activeBrowserWindowId] !== undefined){
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        let state = res.state;
        Object.keys(state.openWindows).forEach(windowId => {
          _openWindows[windowId] = state.openWindows[windowId];
        });
        Object.keys(state.openTabs).forEach(tabId => {
          let tab = state.openTabs[tabId];

          // Ensure created and lastAccessed fields exist
          if (!tab.created) {
            // For old tabs, use lastAccessed as it's an older timestamp, or 0 if missing
            tab.created = tab.lastAccessed || 0;
          }
          if (!tab.lastAccessed) {
            // Use created if available, otherwise use 0
            tab.lastAccessed = tab.created || 0;
          }

          _openTabs[tabId] = tab;
        });
        Object.keys(state.windowTabs).forEach(windowId => {
          _windowTabs[windowId] = state.windowTabs[windowId];
        });
        Object.keys(state.activeTabs).forEach(windowId => {
          _activeTabs[windowId] = state.activeTabs[windowId];
        });

        dispatch(sessionActions.setOpenWindows({data: _openWindows}));
        dispatch(sessionActions.setOpenTabs({data: _openTabs}));
        dispatch(sessionActions.setWindowTabs({data: _windowTabs}));
        dispatch(sessionActions.setActiveTabs({data: _activeTabs}));
        dispatch(sessionActions.setBrowserWindows({data: state.browserWindows}));
        dispatch(sessionActions.setActiveBrowserWindowId({data: state.activeBrowserWindowId}));
        dispatch(sessionActions.setActiveWindow({data: _openWindows[state.activeBrowserWindowId]}));
      }else{
        newBrowserTab(openWindows, openTabs, windowTabs, items, isLocal, desktop, workspace, dispatch, url, activeBrowserWindowId);
      }
    }).catch((err) => {
      log.error("getBrowserStateByWorkspaceId",err);
    });
  }
