import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from "is-electron";
import log from "loglevel";
import { sessionActions } from "../store/session-slice";
import { appActions } from "../store/app-slice";

function TabSleeperHub() {
    const dispatch = useDispatch();
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const openTabs = useSelector((state) => state.session.openTabs);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const openWindows = useSelector((state) => state.session.openWindows);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const windowTabs = useSelector((state) => state.session.windowTabs);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const activeTabId = useSelector((state) => state.session.activeTabId);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const activeWindow = useSelector((state) => state.session.activeWindow);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const tabTimeOut = useSelector((state) => state.settings.sleepingTabsTimeout)*60*1000; // 15 minutes
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const isKeepActiveWindowTabsAwake = useSelector((state) => state.settings.isKeepActiveWindowTabsAwake);

    const sleepingTabsTimerInterval = 1*60*1000;

    useEffect(() => {
        log.debug("TabSleeperHub: useEffect");
        log.debug("TabSleeperHub: tabTimeOut", tabTimeOut);
        log.debug("TabSleeperHub: isKeepActiveWindowTabsAwake", isKeepActiveWindowTabsAwake);

        const intervalId = setInterval(() => {
            log.debug("TabSleeperHub: setInterval");
            let _openTabs = Object.assign({}, openTabs);
            let _openWindows = Object.assign({}, openWindows);
            let _windowTabs = Object.assign({}, windowTabs);
        
            Object.keys(windowTabs).forEach((windowId) => {
              let _window = Object.assign({}, openWindows[windowId]);
              if(_window === undefined || _window === null || _window.data === undefined || _window.data === null){
                log.debug("TabSleeperHub: sleepTabs", "Window not found "+windowId);
                log.debug("                 ","Deleted window:"+windowId);
                delete _openWindows[windowId];
                delete _windowTabs[windowId];
              }else{
                let _windowTabs = windowTabs[windowId];
                let _sleeping = true;
                _windowTabs.forEach((tabId: any) => {
                  if(_openTabs[tabId] !== undefined && !_openTabs[tabId].sleeping){
                    _sleeping = false;
                  }
                });
                if(_sleeping){
                  _window.sleeping = _sleeping;
                  _openWindows[windowId] = _window;
                }
              }
            });
        
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
        
            Object.values(_openTabs).forEach((tab) => {
              // @ts-expect-error TS(2571): Object is of type 'unknown'.
              if(tab.id === undefined) return;
              // @ts-expect-error TS(2571): Object is of type 'unknown'.
              if(tab.location === "external" || tab.type === "xapp"){
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                log.debug("TabSleeperHub: sleepTabs", "External or xapp tab "+tab.id);
                return;
              }
              // @ts-expect-error TS(2571): Object is of type 'unknown'.
              if(tab.mediaPlaying !== undefined && tab.mediaPlaying){
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                log.debug("TabSleeperHub: sleepTabs", "Media playing tab detected "+tab.id);
                return;
              }
              // @ts-expect-error TS(2571): Object is of type 'unknown'.
              if(tab.id !== activeTabId && !tab.sleeping && tab.lastAccessed < Date.now() - tabTimeOut){
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                if(isKeepActiveWindowTabsAwake && tab.window === activeWindow.id){
                  return;
                }
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                let _tab = Object.assign({}, _openTabs[tab.id]);
                let _window = openWindows[_tab.window];
                let _suspendTabs = true;
                //if(_window && _window.data !== undefined && _window.data.suspendTabs !== undefined){
                //  _suspendTabs = _window.data.suspendTabs;
                //}
                
                if(_suspendTabs){
                  _tab.sleeping = true;
                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  _openTabs[tab.id] = _tab;
                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  log.debug("TabSleeperHub: sleepTabs", "Sleeping tab "+tab.id);
                }
              }
        
              // @ts-expect-error TS(2571): Object is of type 'unknown'.
              if(_openWindows[tab.window] === undefined || _openWindows[tab.window] === null){
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                log.debug("TabSleeperHub: sleepTabs", "Window not found "+tab.window+" for tab "+tab.id);
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                delete _openTabs[tab.id];
              }
            });

            // Keep last good previews on disk for sleeping tabs (switchers read cache)
            if (isElectron()) {
              try {
                const sleepingIds = Object.values(_openTabs)
                  // @ts-expect-error
                  .filter((t: any) => t?.sleeping && t?.id)
                  // @ts-expect-error
                  .map((t: any) => t.id);
                // @ts-expect-error
                window.electronAPI?.screenshot?.flush?.(sleepingIds);
              } catch (e) {
                log.error("TabSleeperHub: screenshot flush failed", e);
              }
            }
        
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            dispatch(appActions.updateScreenShotStatusVersion());
        
            dispatch(
              sessionActions.setOpenTabs({
                data: _openTabs,
              })
            );
        }, sleepingTabsTimerInterval);

        return () => clearInterval(intervalId);
    }, [sleepingTabsTimerInterval, openTabs, openWindows, windowTabs, activeTabId, activeWindow, tabTimeOut, isKeepActiveWindowTabsAwake, dispatch]);

    return null;
}

export default TabSleeperHub;