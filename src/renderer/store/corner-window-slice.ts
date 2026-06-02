import { createSlice } from "@reduxjs/toolkit";

const cornerWindowSlice = createSlice({
  name: "corner-window",
  initialState: {
    webviewUrl: "https://calculator.onepad.io",
    isOpen:false,
    backdrop: true,
    fade: true,
    width: 400,
    height: 400,
  },
  reducers: {
    setUrl(state, action) {
      state.webviewUrl = action.payload;
    },
    setIsOpen(state, action) {
      state.isOpen = action.payload;
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
    setHeight(state, action) {
      state.height = action.payload;
    },
    close(state) {
      state.isOpen = false;
    },
    toggle(state) {
        state.isOpen = !state.isOpen;
    },
  },
});

export const cornerWindowActions = cornerWindowSlice.actions;

export default cornerWindowSlice;
