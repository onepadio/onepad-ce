import { createSlice } from "@reduxjs/toolkit";

export const tabsBarVisualModes = {
    TABS: "tabs-mode",
    SCREENS: "screens-mode",
    SPACE: "space-mode",
};

const tabsBarSlice = createSlice({
  name: "tabs-bar",
  initialState: {
    mode: tabsBarVisualModes.TABS,
  },
  reducers: {
    setMode(state, action) {
      state.mode = action.payload;
    },
    switchToTabsMode(state) {
      state.mode = tabsBarVisualModes.TABS;
    },
    switchToScreensMode(state) {
      state.mode = tabsBarVisualModes.SCREENS;
    },
    switchToSpaceMode(state) {
      state.mode = tabsBarVisualModes.SPACE;
    },
  },
});

export const tabsBarActions = tabsBarSlice.actions;

export default tabsBarSlice;
