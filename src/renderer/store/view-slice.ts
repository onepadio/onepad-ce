import { createSlice } from "@reduxjs/toolkit";

const viewSlice = createSlice({
  name: "view",
  initialState: {
    isBottomNavBarVisible: true,
    hideTabBar: {},
    isExtended: false,
    isExtendedMode: false,
  },
  reducers: {
    toggleBottomNavBar(state, action) {
      state.isBottomNavBarVisible = !state.isBottomNavBarVisible;
    },
    setIsBottomNavBarVisible(state, action) {
      state.isBottomNavBarVisible = action.payload;
    },
    toggleHideTabBar(state, action) {
      if(state.hideTabBar[action.payload] === undefined){
        state.hideTabBar[action.payload] = true;
      }else{
        state.hideTabBar[action.payload] = !state.hideTabBar[action.payload];
      }
    },
    setHideTabBar(state, action) {
      state.hideTabBar[action.payload.id] = action.payload.value;
    },
    toggleExtended(state, action) {
      state.isExtended = !state.isExtended;
    },
    toggleExtendedMode(state, action) {
      state.isExtendedMode = !state.isExtendedMode;
    },
    setIsExtended(state, action) {
      state.isExtended = action.payload;
    },
    setIsExtendedMode(state, action) {
      // @ts-expect-error
      state.isExtendedMode = action
    }
  },
});

export const viewActions = viewSlice.actions;

export default viewSlice;
