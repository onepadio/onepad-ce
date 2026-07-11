import { createSlice } from "@reduxjs/toolkit";

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
      }
    },
    close(state) {
      state.isOpen = false;
    }
  },
});

export const sidebarActions = sidebarSlice.actions;

export default sidebarSlice;
