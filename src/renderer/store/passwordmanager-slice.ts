import { createSlice } from "@reduxjs/toolkit";

const passwordManagerSlice = createSlice({
  name: "passwordManager",
  initialState: {
    isOpen: false,
    searchQuery: "",
  },
  reducers: {
    togglePasswordManager(state) {
      state.isOpen = !state.isOpen;
    },
    openPasswordManager(state) {
      state.isOpen = true;
    },
    closePasswordManager(state) {
      state.isOpen = false;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    
  },
});

export const passwordManagerActions = passwordManagerSlice.actions;

export default passwordManagerSlice;