import { createSlice } from "@reduxjs/toolkit";

const spaceAppSlice = createSlice({
  name: "spaceapp",
  initialState: {
    title: "SpaceApp",
    webviewUrl: "https://music.youtube.com",
    isOpen:false,
    direction: "end",
    backdrop: true,
    fade: true,
    width: "58%",
    scopes: ["profile"],
    activePlayer: "youtube-music",
  },
  reducers: {
    setUrl(state, action) {
      state.webviewUrl = action.payload;
    },
    setIsOpen(state, action) {
      state.isOpen = action.payload;
    },
    setTitle(state, action) {
      state.title = action.payload;
    },
    setDirection(state, action) {
      state.direction = action.payload;
    },
    setBackdrop(state, action) {
      state.backdrop = action.payload;
    },
    setFade(state, action) {
      state.fade = action.payload;
    },
    setWidth(state, action) {
      state.width = action.payload;
    },
    setScopesBoth(state, action) {
      state.scopes = ["profile", "space"];
    },
    setScopesProfile(state, action) {
      state.scopes = ["profile"];
    },
    setScopesSpace(state, action) {
      state.scopes = ["space"];
    },
    setActivePlayer(state, action) {
      state.activePlayer = action.payload;
    },
    toggle(state) {
        state.isOpen = !state.isOpen;
    },
  },
});

export const spaceAppActions =spaceAppSlice.actions;

export default spaceAppSlice;
