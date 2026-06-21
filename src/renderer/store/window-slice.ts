import { createSlice } from "@reduxjs/toolkit";

const windowSlice = createSlice({
  name: "window",
  initialState: {
    windows: {},
    showSidebar: false,
    activeBar: "tabs",
    sideBarSize: "xs",
    tabStyle: "sidebar",
  },
  reducers: {
    setWindows(state, action) {
        state.windows = action.payload.data;
    },
    setSideBarSize(state, action) {
        state.sideBarSize = action.payload.data;
    },
    setTabStyle(state, action) {
        state.tabStyle = action.payload.data;
    },
    toggleShowSidebar(state, action) {
        state.showSidebar = !state.showSidebar;
    },
    hideSidebar(state, action) {
        state.showSidebar = false;
    },
    setActiveBar(state, action) {
        state.activeBar = action.payload;
        state.showSidebar = true;
    }
  },
});

export const windowActions = windowSlice.actions;

export default windowSlice;
