import { createSlice } from "@reduxjs/toolkit";

const launchpadSlice = createSlice({
  name: "launchpad",
  initialState: {
    searchQuery: "",
  },
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
  },
});

export const launchpadActions = launchpadSlice.actions;

export default launchpadSlice;
