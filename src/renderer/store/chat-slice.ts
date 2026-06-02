import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    title: "Chat",
    webviewUrl: "https://web.whatsapp.com",
    isOpen:false,
    direction: "end",
    backdrop: true,
    fade: true,
    width: "50%",
    scopes: ["profile"],
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
    open(state) {
        state.isOpen = true;
    },
    close(state) {
        state.isOpen = false;
    }
  },
});

export const chatActions = chatSlice.actions;

export default chatSlice;
