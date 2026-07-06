import { configureStore } from "@reduxjs/toolkit";
import appSlice from "./app-slice";
import workSpaceSlice from "./workspace-slice";
import userSlice from "./user-slice";
import modalSlice from "./modal-slice";
import settingsSlice from "./settings-slice";
import sessionSlice from "./session-slice";
import windowSlice from "./window-slice";
import storeSlice from "./store-slice";
import viewSlice from "./view-slice";
import launchpadSlice from "./launchpad-slice";
import p2pFileSlice from "./p2pfile-slice";
import canvasSlice from "./canvas-slice";
import cornerWindowSlice from "./corner-window-slice";
import chatSlice from "./chat-slice";
import musicPlayerSlice from "./musicplayer-slice";
import utilityAppsSlice from "./utility-slice";
import browserSlice from "./browser-slice";
import streamAppsSlice from "./stream-slice";
import spaceSideBarSlice from "./space-sidebar-slice";
import spaceAppSlice from "./spaceapp-slice";
import windowBarSlice from "./windowbar-slice";
import passwordManagerSlice from "./passwordmanager-slice";
import tabsBarSlice from "./tabsbar-slice";
import windowServiceSlice from "./window-service-slice";
import cloudServiceSlice from "./cloud-service-slice";
import chatAssistantSlice from "./chat-assistant-slice";
import aiAppsSlice from "./ai-slice";
import downloadSlice from "./download-slice";
import webviewSlice from "./webview-slice";

const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    modal: modalSlice.reducer,
    workspace: workSpaceSlice.reducer,
    user: userSlice.reducer,
    settings: settingsSlice.reducer,
    session: sessionSlice.reducer,
    window: windowSlice.reducer,
    store: storeSlice.reducer,
    view: viewSlice.reducer,
    launchpad: launchpadSlice.reducer,
    p2pFile: p2pFileSlice.reducer,
    canvas: canvasSlice.reducer,
    cornerWindow: cornerWindowSlice.reducer,
    chat: chatSlice.reducer,
    musicPlayer: musicPlayerSlice.reducer,
    utility: utilityAppsSlice.reducer,
    browser: browserSlice.reducer,
    stream: streamAppsSlice.reducer,
    spaceSideBar: spaceSideBarSlice.reducer,
    spaceApp: spaceAppSlice.reducer,
    windowBar: windowBarSlice.reducer,
    passwordManager: passwordManagerSlice.reducer,
    tabsBar: tabsBarSlice.reducer,
    windowService: windowServiceSlice.reducer,
    cloudService: cloudServiceSlice.reducer,
    chatAssistant: chatAssistantSlice.reducer,
    ai: aiAppsSlice.reducer,
    downloads: downloadSlice.reducer,
    webview: webviewSlice.reducer,
  },
});

export default store;
