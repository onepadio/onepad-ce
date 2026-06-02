import { createSlice } from "@reduxjs/toolkit";

const musicPlayerSlice = createSlice({
  name: "musicplayer",
  initialState: {
    title: "MusicPlayer",
    webviewUrl: "https://music.youtube.com",
    isOpen:false,
    direction: "end",
    backdrop: true,
    fade: true,
    width: "50%",
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
    close(state) {
        state.isOpen = false;
    }
  },
});

export const musicPlayerActions = musicPlayerSlice.actions;

export default musicPlayerSlice;
