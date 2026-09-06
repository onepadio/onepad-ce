import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

const windowServiceSlice = createSlice({
  name: "window-service",
  initialState: {
    serviceActionId: "",
    serviceAction: "",
    newTabWindowId: "",
    newTabUrl: "",
    /** Window id whose dock icon should animate (link-opened new tab) */
    dockPulseWindowId: "",
    dockPulseToken: 0,
    closeTabId: "",
    closeWindowId: "",
    showCloseWindowConfirmation: false,
    sleepWindowId: "",
    moveTabToExternalWindowTabId: "",
    searchQuery: "",
    newRemoteApp: {
        name: "", application: "", processId: "", url: "", storeData: {}
    },
    stoppedRemoteProcessWindowId: "",
    searchEngine: {
      id: "google",
      name: "Google",
      icon: "./images/store/icon/google.png",
      login: "https://www.google.co.uk",
      search: "https://www.google.co.uk/search?q="
    },
  },
  reducers: {
    setWindowServiceAction(state, action) {
        state.serviceAction = action.payload;
        state.serviceActionId = uuidv4();
    },
    openNewTab(state, action) {
        state.newTabWindowId = action.payload.windowId;
        state.newTabUrl = action.payload.url;
        state.serviceAction = "newTab";
        state.serviceActionId = uuidv4();
    },
    /** Briefly animate the dock icon for the given window (e.g. link opened a new tab). */
    pulseDockIcon(state, action) {
        state.dockPulseWindowId = action.payload.windowId || "";
        state.dockPulseToken = Date.now();
    },
    openRemoteApp(state, action) {
        state.newRemoteApp.name = action.payload.name;
        state.newRemoteApp.application = action.payload.application;
        state.newRemoteApp.processId = action.payload.processId;
        state.newRemoteApp.url = action.payload.url;
        state.newRemoteApp.storeData = action.payload.storeData;
        state.serviceAction = "openRemoteApp";
        state.serviceActionId = uuidv4();
    },
    stoppedRemoteProcess(state, action) {
        state.stoppedRemoteProcessWindowId = action.payload;
        state.serviceAction = "stoppedRemoteProcess";
        state.serviceActionId = uuidv4();
    },
    closeTab(state, action) {
        state.closeTabId = action.payload;
        state.serviceAction = "closeTab";
        state.serviceActionId = uuidv4();
    },
    closeWindow(state, action) {
        state.closeWindowId = action.payload;
        state.showCloseWindowConfirmation = true;
        state.serviceAction = "closeWindow";
        state.serviceActionId = uuidv4();
    },
    closeWindowNoConfirmation(state, action) {
        state.closeWindowId = action.payload;
        state.showCloseWindowConfirmation = false;
        state.serviceAction = "closeWindowConfirmation";
        state.serviceActionId = uuidv4();
    },
    closeBrowser(state, action) {
        state.serviceAction = "closeBrowser";
        state.serviceActionId = uuidv4();
    },
    sleepWindow(state, action) {
        state.sleepWindowId = action.payload;
        state.serviceAction = "sleepWindow";
        state.serviceActionId = uuidv4();
    },
    closeAllWindows(state, action) {
        state.serviceAction = "closeAllWindows";
        state.serviceActionId = uuidv4();
    },
    moveTabToExternalWindow(state, action) {
        state.moveTabToExternalWindowTabId = action.payload;
        state.serviceAction = "moveTabToExternalWindow";
        state.serviceActionId = uuidv4();
    },
    setSearchQuery(state, action) {
        state.searchQuery = action.payload;
    },
    setSearchEngine(state, action) {
        state.searchEngine = action.payload;
    },
  },
});

export const windowServiceActions = windowServiceSlice.actions;

export default windowServiceSlice;
