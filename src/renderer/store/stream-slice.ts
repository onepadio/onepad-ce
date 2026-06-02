import { createSlice } from "@reduxjs/toolkit";

const streamAppsSlice = createSlice({
  name: "streamwindow",
  initialState: {
    title: "",
    webviewUrl: "",
    isOpen:false,
    direction: "end",
    backdrop: true,
    fade: true,
    width: "58%",
    scopes: ["profile"],
    activePlayer: "5e1a8b8f-2584-4b2c-9953-d7ef3eb13a1e",
    activeCategory: "calendar",
    previousCategory: "",
  },
  reducers: {
    setUrl(state, action) {
      state.webviewUrl = action.payload;
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
    setActivePlayer(state, action) {
      state.activePlayer = action.payload;
    },
    setActiveCategory(state, action) {
      state.activeCategory = action.payload;
    },
    toggle(state, action) {
      state.isOpen = !state.isOpen;
    },
  },
});

export const streamAppsActions = streamAppsSlice.actions;

export default streamAppsSlice;
