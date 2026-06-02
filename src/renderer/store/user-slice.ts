import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    id: "",
    name: "",
    email: "",
    userType: "",
    uid: "",
    username: "",
    isLoggedIn: false,
    defaultWorkspace: "",
    product: "FREE",
    limits: {
      maxProfiles: 1,
      maxWorkspaces: 3,
      //desktops: 3,
      //sessions: 3,
      maxApps: 10,
      maxLinks: 10,
    },
    lastSync: 0,
    lastSyncVersion: "",
  },
  reducers: {
    setUser(state, action) {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.userType = action.payload.userType;
      state.uid = action.payload.uid ? action.payload.uid : "";
    },
    setUserId(state, action) {
      state.id = action.payload;
    },
    setUid(state, action) {
      state.uid = action.payload;
    },
    setDefaultWorkspace(state, action) {
      state.defaultWorkspace = action.payload.id;
    },
    setProduct(state, action) {
      state.product = action.payload;
    },
    setLimits(state, action) {
      state.limits = action.payload;
    },
    setLastSync(state, action) {
      state.lastSync = action.payload;
    },
    setLastSyncVersion(state, action) {
      state.lastSyncVersion = action.payload;
    }
  },
});

export const userActions = userSlice.actions;

export default userSlice;
