import { createSlice } from "@reduxjs/toolkit";
// @ts-expect-error
import  { SessionStateFactory, State } from "../model/state";
import { processWindows, processOpenTabsBeforePersist } from "../services/window";

function activateLaunchPad(state: any, action: any){
  state.activeWindow = {
    id: "launchpad",
    data: {}, 
    tabs: [
        {id: "launchpad"},
      ]
  };
  state.activeWindowId = "launchpad";
  state.activeWindowTabs = [];
  state.activeTabId = "launchpad";
  state.activeTab = {id: "launchpad"};
  state.activeDesktopWindows[action.payload.data.desktopId] = "launchpad";
}

const sessionSlice = createSlice({
  name: "session",
  initialState: SessionStateFactory.create(),
  reducers: {
    reset(state, action){
      let _state = SessionStateFactory.create();
      state.openWindows = _state.openWindows;
      state.openTabs = _state.openTabs;
      state.windowTabs = _state.windowTabs;
      state.activeDesktopWindows = _state.activeDesktopWindows;
      state.activeWindow = _state.activeWindow;
      state.activeWindowId = _state.activeWindowId;
      state.windowHistory = _state.windowHistory;
      state.activeWindowTabs = _state.activeWindowTabs;
      state.activeTab = _state.activeTab;
      state.activeTabId = _state.activeTabId;
      state.previousTabId = _state.previousTabId;
      state.activeTabs = _state.activeTabs;
      state.browserWindows = _state.browserWindows;
      state.activeBrowserWindowId = _state.activeBrowserWindowId;
      state.bookmarks = _state.bookmarks;
      state.favourites = _state.favourites;
      state.isInSession = false;
      state.sync = _state.sync;
      state.isFullScreen = _state.isFullScreen;
    },
    startSession(state, action){
      let _state = SessionStateFactory.create();
      state.openWindows = _state.openWindows;
      state.openTabs = _state.openTabs;
      state.windowTabs = _state.windowTabs;
      state.activeDesktopWindows = _state.activeDesktopWindows;
      state.activeWindow = _state.activeWindow;
      state.activeWindowId = _state.activeWindowId;
      state.windowHistory = _state.windowHistory;
      state.activeWindowTabs = _state.activeWindowTabs;
      state.activeTab = _state.activeTab;
      state.activeTabId = _state.activeTabId;
      state.previousTabId = _state.previousTabId;
      state.activeTabs = _state.activeTabs;
      state.browserWindows = _state.browserWindows;
      state.activeBrowserWindowId = _state.activeBrowserWindowId;
      state.bookmarks = _state.bookmarks;
      state.favourites = _state.favourites;
      state.isInSession = true;
      state.sync = _state.sync;
      state.isFullScreen = _state.isFullScreen;
    },
    endSession(state, action){
      state.isInSession = false;
    },
    resumeSession(state, action){
      //state = action.payload.state;
      if(action.payload.state.activeDesktopWindows){
        state.activeDesktopWindows = action.payload.state.activeDesktopWindows;
      }
      
      state.browserWindows = action.payload.state.browserWindows;
      state.activeBrowserWindowId = action.payload.state.activeBrowserWindowId;
      state.bookmarks = action.payload.state.bookmarks;
      state.favourites = action.payload.state.favourites;
      state.isInSession = true;
      state.sync = action.payload.state.sync;
    },
    setOpenWindows(state, action){
      state.openWindows = action.payload.data;
    },
    setActiveDesktopWindows(state, action){
      state.activeDesktopWindows = action.payload.data;
    },
    setActiveWindow(state, action){
      state.windowHistory.push(state.activeWindowId);
      if(state.windowHistory.length > 10){
        state.windowHistory.shift();
      }
      state.activeWindow = action.payload.data;
      state.activeWindowId = action.payload.data.id;
    },
    goBackToPreviousWindow(state, action){
      let _windowId = state.windowHistory.pop();
      if(_windowId === "launchpad"){
        activateLaunchPad(state, action);
      }else{
        state.activeWindowId = _windowId;
        if(state.openWindows[_windowId]){
          state.activeWindow = state.openWindows[_windowId];
        }
      }
    },
    setActiveWindowId(state, action){
      state.activeWindowId = action.payload.data;
    },
    setOpenTabs(state, action){
      state.openTabs = action.payload.data;
    },
    setExternalTabs(state, action){
      state.externalTabs = action.payload.data;
    },
    setWindowTabs(state, action){
      state.windowTabs = action.payload.data;
    },
    setActiveWindowTabs(state, action){
      state.activeWindowTabs = action.payload.data;
    },
    setActiveTab(state, action){
      state.activeTab = action.payload.data;
      state.previousTabId = state.activeTabId;
      state.activeTabId = action.payload.data.id;
    },
    setActiveTabId(state, action){
      state.previousTabId = state.activeTabId;
      state.activeTabId = action.payload.data;
    },
    setActiveTabs(state, action){
      state.activeTabs = action.payload.data;
    },
    setBrowserWindows(state, action){
      state.browserWindows = action.payload.data;
    },
    setActiveBrowserWindowId(state, action){
      state.activeBrowserWindowId = action.payload.data;
    },
    setPreviousTabId(state, action){
      state.previousTabId = action.payload;
    },
    setBookmarks(state, action){
      state.bookmarks = action.payload.data;
    },
    setFavourites(state, action){
      state.favourites = action.payload.data;
    },
    setZoomLevel(state, action){
      state.zoomLevel = action.payload;
    },
    addBrowserWindow(state, action){
      const id = action.payload.data;
      const exists = state.browserWindows.some(
        (entry: any) => entry === id || (entry && typeof entry === "object" && entry.id === id)
      );
      if (!exists) {
        state.browserWindows.push(id);
      }
    },
    setClosedExternalTabId(state, action){
      state.closedExternalTabId = action.payload;
    },
    setLocation(state, action){
      // @ts-expect-error
      state.location = action.payload;
    },
    setLastGlobalWindowId(state, action){
      state.lastGlobalWindowId = action.payload;
    },
    setSSDict(state, action){
      state.ssDict = action.payload;
      state.ssDictVersion++;
    },
    toggleFullScreen(state, action){
      state.isFullScreen = !state.isFullScreen;
    },
    setIsFullScreen(state, action){
      state.isFullScreen = action.payload;
    },
    goBackToLaunchPad(state, action){
      activateLaunchPad(state, action);
    },
    getBackToLaunchPad(state, action){
      if(state.windowHistory[state.windowHistory.length - 1] === "launchpad"){
        state.windowHistory.push(state.activeWindowId);
      }
      activateLaunchPad(state, action);
    },
    
  },
});

export const sessionActions = sessionSlice.actions;

export default sessionSlice;
