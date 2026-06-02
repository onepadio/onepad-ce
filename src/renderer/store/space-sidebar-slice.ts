import { createSlice } from "@reduxjs/toolkit";

const spaceSideBarSlice = createSlice({
  name: "space-sidebar",
  initialState: {
    isOpen: false,
  },
  reducers: {
    setIsOpen(state, action) {
      state.isOpen = action.payload;
    },
    toggle(state) {
      state.isOpen = !state.isOpen;
    }
  },
});

export const spaceSideBarActions = spaceSideBarSlice.actions;

export default spaceSideBarSlice;
