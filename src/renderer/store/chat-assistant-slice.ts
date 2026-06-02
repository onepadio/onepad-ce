import { createSlice } from "@reduxjs/toolkit";

const chatAssistantSlice = createSlice({
  name: "chatAssistant",
  initialState: {
    isOpen: false,
  },
  reducers: {
    open(state) {
      state.isOpen = true;
    },
    close(state) {
      state.isOpen = false;
    },
    toggle(state) {
      state.isOpen = !state.isOpen;
    },
  },
});

export const chatAssistantActions = chatAssistantSlice.actions;

export default chatAssistantSlice;
