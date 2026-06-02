import { createSlice } from "@reduxjs/toolkit";
import { set } from "lodash";

const windowBarSlice = createSlice({
  name: "windowbar",
  initialState: {
    currentUrl: "",
    currentTitle: "",
  },
  reducers: {
    setCurrentUrl(state, action) {
        state.currentUrl = action.payload;
    },
    setCurrentTitle(state, action) {
        state.currentTitle = action.payload;
    },
  },
});

export const windowBarActions = windowBarSlice.actions;

export default windowBarSlice;
