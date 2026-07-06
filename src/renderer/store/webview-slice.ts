import { createSlice } from "@reduxjs/toolkit";

const webviewSlice = createSlice({
  name: "webview",
  initialState: {
    isScrolling: false,
    mousePosition: {
      x: 0,
      y: 0,
    },
    scrollPosition: {
      x: 0,
      y: 0,
    },
  },
  reducers: {
    setScrolling(state, action) {
      state.isScrolling = action.payload;
    },
    setMousePosition(state, action) {
      state.mousePosition = action.payload;
    },
    setScrollPosition(state, action) {
      state.scrollPosition = action.payload;
    },
  },
});

export const webviewActions = webviewSlice.actions;

export default webviewSlice;
