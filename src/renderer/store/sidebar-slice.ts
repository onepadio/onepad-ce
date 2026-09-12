import { createSlice } from "@reduxjs/toolkit";

export interface SidebarOpenedApp {
  appId: string;
  url: string;
  title: string;
  icon: string;
  userAgent: string;
}

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState: {
    title: "",
    webviewUrl: "",
    appId: "",
    icon: "",
    userAgent: "",
    isOpen: false,
    direction: "start",
    backdrop: true,
    fade: true,
    width: "45%",
    scopes: ["profile"],
    openedApps: {} as Record<string, SidebarOpenedApp>,
  },
  reducers: {
    setUrl(state, action) {
      state.webviewUrl = action.payload;
    },
    setAppId(state, action) {
      state.appId = action.payload;
    },
    setIcon(state, action) {
      state.icon = action.payload;
    },
    setIsOpen(state, action) {
      state.isOpen = action.payload;
    },
    setTitle(state, action) {
      state.title = action.payload;
    },
    setDirection(state, action) {
      state.direction = action.payload;
    },
    setBackdrop(state, action) {
      state.backdrop = action.payload;
    },
    setFade(state, action) {
      state.fade = action.payload;
    },
    setWidth(state, action) {
      state.width = action.payload;
    },
    setScopesBoth(state, action) {
      state.scopes = ["profile", "space"];
    },
    setScopesProfile(state, action) {
      state.scopes = ["profile"];
    },
    setScopesSpace(state, action) {
      state.scopes = ["space"];
    },
    toggle(state) {
      state.isOpen = !state.isOpen;
    },
    open(state, action) {
      state.isOpen = true;
      if (action.payload) {
        state.webviewUrl = action.payload.url;
        state.title = action.payload.title;
        state.appId = action.payload.appId;
        state.icon = action.payload.icon || "";
        state.userAgent = action.payload.userAgent || "";

        if (action.payload.appId && action.payload.url && !state.openedApps[action.payload.appId]) {
          state.openedApps[action.payload.appId] = {
            appId: action.payload.appId,
            url: action.payload.url,
            title: action.payload.title,
            icon: action.payload.icon || "",
            userAgent: action.payload.userAgent || "",
          };
        }
      }
    },
    close(state) {
      state.isOpen = false;
    },
    removeOpenedApp(state, action) {
      const appId = action.payload;
      if (appId && state.openedApps[appId]) {
        delete state.openedApps[appId];
      }
      if (state.appId === appId) {
        state.appId = "";
        state.webviewUrl = "";
        state.title = "";
        state.icon = "";
        state.userAgent = "";
      }
    },
    closeAllOpenedApps(state) {
      state.isOpen = false;
      state.openedApps = {};
      state.appId = "";
      state.webviewUrl = "";
      state.title = "";
      state.icon = "";
      state.userAgent = "";
    },
  },
});

export const sidebarActions = sidebarSlice.actions;

export default sidebarSlice;
