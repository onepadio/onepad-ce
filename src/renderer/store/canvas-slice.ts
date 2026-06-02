import { createSlice } from "@reduxjs/toolkit";

const canvasSlice = createSlice({
  name: "canvas",
  initialState: {
    title: "",
    webviewUrl: "https://todolist.onepad.io",
    isOpen:false,
    direction: "end",
    backdrop: true,
    fade: true,
    width: "600px",
    scopes: [],
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
    toggle(state) {
        state.isOpen = !state.isOpen;
    },
  },
});

export const canvasActions = canvasSlice.actions;

export default canvasSlice;
