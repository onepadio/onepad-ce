import { createSlice } from "@reduxjs/toolkit";

const browserSlice = createSlice({
  name: "browser",
  initialState: {
    newTabUrl: "",
  },
  reducers: {
    setNewTabUrl(state, action) {
        state.newTabUrl = action.payload;
    },
  },
});

export const browserActions = browserSlice.actions;

export default browserSlice;
