import { createSlice } from "@reduxjs/toolkit";

const p2pFileSlice = createSlice({
  name: "p2pFile",
  initialState: {
    roomId: "",
    senderEmail: "",
    senderDeviceId: "",
    receiverResponse: "",
  },
  reducers: {
    setFromData(state, action) {
      state.roomId = action.payload.roomId;
      state.senderEmail = action.payload.sender;
      state.senderDeviceId = action.payload.senderDeviceId;
    },
    setRoomId(state, action) {
      state.roomId = action.payload;
    },
    setSenderEmail(state, action) {
      state.senderEmail = action.payload;
    },
    setSenderDeviceId(state, action) {
      state.senderDeviceId = action.payload;
    },
    setReceiverResponse(state, action) {
      state.receiverResponse = action.payload;
    },
  },
});

export const p2pFileActions = p2pFileSlice.actions;

export default p2pFileSlice;
