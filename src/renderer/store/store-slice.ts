import { createSlice } from "@reduxjs/toolkit";

const storeSlice = createSlice({
  name: "store",
  initialState: {
    activeCategory: 1,
    searchQuery: "",
    selectedStore: "web",
  },
  reducers: {
    setActiveCategory(state, action) {
      state.activeCategory = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setSelectedStore(state, action) {
      state.selectedStore = action.payload;
    },
  },
});

export const storeActions = storeSlice.actions;

export default storeSlice;
