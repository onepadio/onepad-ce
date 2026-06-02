import { createSlice } from "@reduxjs/toolkit";

const aiAppsSlice = createSlice({
  name: "aiapps",
  initialState: {
    title: "",
    webviewUrl: "https://google.com",
    icon: "",
    isOpen:false,
    direction: "end",
    backdrop: true,
    fade: true,
    width: "40%",
    scopes: ["profile"],
    activePlayer: "",
    activeCategory: "ai",
    previousCategory: "",
    searchQuery: "",
    searchEngine: {
      id: "google",
      name: "Google",
      icon: "./images/store/icon/google.png",
      login: "https://www.google.co.uk",
      search: "https://www.google.co.uk/search?q="
  },
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
    setIcon(state, action) {
      state.icon = action.payload;
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
    setActiveCategory(state, action) {
      state.activeCategory = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setSearchEngine(state, action) {
      state.searchEngine = action.payload;
    },
    toggle(state, action) {
      if(action.payload){
        state.previousCategory = state.activeCategory;
        state.activeCategory = action.payload;
      }
      state.isOpen =  !state.isOpen;
    },
    close(state) {
      state.isOpen = false;
    },
  },
});

export const aiAppsActions = aiAppsSlice.actions;

export default aiAppsSlice;
