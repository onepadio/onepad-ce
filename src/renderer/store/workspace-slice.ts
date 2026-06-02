import { createSlice } from "@reduxjs/toolkit";

const workSpaceSlice = createSlice({
  name: "workSpace",
  initialState: {
    isLocal: true,
    isOnline: false,
    workspaces: [],
    recentWorkspaces: {},
    selectedWorkspace: {},
    desktops: [],
    desktopNames: {},
    defaultDesktopId: "",
    selectedDesktop: {},
    selectedDesktopId: "",
    selectedCategory: "",
    apps: [],
    links: [],
    items: [],
    sessions: [],
    currentSession: {},
    widgetConfig: {},
    selectedWidgetId: 0,
  },
  reducers: {
    reset(state, action){
        state.workspaces = [];
        state.recentWorkspaces = {};
        state.selectedWorkspace = {};
        state.desktops = [];
        state.desktopNames = {};
        state.defaultDesktopId = "";
        state.selectedDesktop = {};
        state.selectedDesktopId = "";
        state.selectedCategory = "";
        state.apps = [];
        state.links = [];
        state.items = [];
        state.sessions = [];
        state.currentSession = {};
        state.widgetConfig = {};
        state.selectedWidgetId = 0;
    },
    setWorkspaces(state, action){
        state.workspaces = action.payload.workspaces.filter((workspace: any) => workspace.archived !== 1);
    },
    setRecentWorkspaces(state, action){
        state.recentWorkspaces = action.payload;
    },
    setDesktops(state, action){
        state.desktops = action.payload.desktops;
        state.desktopNames = action.payload.desktops.reduce((desktopNames: any, desktop: any) => {
            desktopNames[desktop.id] = desktop.name;
            return desktopNames;
        }, {});
    },
    setDefaultDesktopId(state, action){
        state.defaultDesktopId = action.payload.id;
    },
    addWorkspace(state, action){
        state.workspaces.push(action.payload.workspace);
    },
    removeWorkspace(state, action){
        state.workspaces = state.workspaces.filter((workspace) => workspace.id !== action.payload.id);
    },
    updateWorkspace(state, action){
        state.workspaces = state.workspaces.map((workspace) => {
            if(workspace.id === action.payload.workspace.id){
                return action.payload.workspace;
            }
            return workspace;
        });
    },
    updateDesktop(state, action){
        state.desktops = state.desktops.map((desktop) => {
            if(desktop.id === action.payload.desktop.id){
                return action.payload.desktop;
            }
            return desktop;
        });
    },
    selectWorkspaceByName(state, action){
        state.selectedWorkspace = state.workspaces.find((workspace) => workspace.name === action.payload.name) ? state.workspaces.find((workspace) => workspace.name === action.payload.name) : state.workspaces[0];
    },
    selectWorkspaceById(state, action){
        state.selectedWorkspace = state.workspaces.find((workspace) => workspace.id === action.payload.id);
    },
    selectWorkspace(state, action) {
      state.selectedWorkspace = action.payload.workspace;
      state.isOnline = action.payload.workspace.sync === 1 ? true : false;
      state.isLocal = action.payload.workspace.sync === 0 ? true : false;
    },
    renameWorkspace(state, action){
        // @ts-expect-error
        state.selectedWorkspace.name = action.payload.name;
    },
    renameDesktop(state, action){
        // @ts-expect-error
        state.selectedDesktop.name = action.payload.name;
    },
    setItems(state, action){
        state.items = action.payload.items;
    },
    setLinks(state, action){
        state.links = action.payload.links;
    },
    setApps(state, action){
        state.apps = action.payload.apps;
    },
    clearWorkspaces(state, action){
        state.workspaces = [];
    },
    addDesktop(state, action){
        state.desktops.push(action.payload.desktop);
    },
    selectDesktop(state, action){
        state.selectedDesktop = action.payload.desktop;
        // @ts-expect-error
        state.selectedWorkspace.state.desktop = action.payload.desktop.id;
    },
    selectCategory(state, action){
        state.selectedCategory = action.payload.category;
    },
    setSessions(state, action){
        state.sessions = action.payload.data;
    },
    addSession(state, action){
        state.sessions.push(action.payload.session);
    },
    setCurrentSession(state, action){
        state.currentSession = action.payload;
    },
    setWidgetConfig(state, action){
        state.widgetConfig = action.payload;
    },
    setSelectedWidgetId(state, action){
        state.selectedWidgetId = action.payload;
    },
  },
});

export const workspaceActions = workSpaceSlice.actions;

export default workSpaceSlice;
