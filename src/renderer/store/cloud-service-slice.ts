import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";


const cloudServiceSlice = createSlice({
  name: "cloud",
  initialState: {
    newProcessInput: {
      user: "", 
      application: "", 
      applicationId: "", 
      instanceType: "", 
      name: "",
      diskSize: 32,
      timeOut: 10,
      subdomain: "",
    },
    stopProcessId: "",
    terminateProcessId: "",
    startProcessId: "",
    serviceAction: "",
    serviceActionId: "",
  },
  reducers: {
    setWindowServiceAction(state, action) {
        state.serviceAction = action.payload;
    },
    installProcess(state, action) {
        state.newProcessInput.user = action.payload.user;
        state.newProcessInput.application = action.payload.application;
        state.newProcessInput.applicationId = action.payload.applicationId;
        state.newProcessInput.instanceType = action.payload.instanceType;
        state.newProcessInput.name = action.payload.name;
        state.newProcessInput.diskSize = action.payload.diskSize;
        state.newProcessInput.timeOut = action.payload.timeOut;
        state.newProcessInput.subdomain = action.payload.subdomain;
        state.serviceAction = "installProcess";
        state.serviceActionId = uuidv4();
    },
    stopProcess(state, action) {
        state.stopProcessId = action.payload;
        state.serviceAction = "stopProcess";
    },
    terminateProcess(state, action) {
        state.terminateProcessId = action.payload;
        state.serviceAction = "terminateProcess";
    },
    startProcess(state, action) {
        state.startProcessId = action.payload;
        state.serviceAction = "startProcess";
    },
  },
});

export const cloudServiceActions = cloudServiceSlice.actions;

export default cloudServiceSlice;
