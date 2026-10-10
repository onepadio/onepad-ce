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
    /** LRU of warm space ids (max 3); [0] = most recently selected */
    warmSpaceIds: [] as string[],
    /** Snapshot of apps/links/desktops per warm space for keep-alive mount */
    warmSpaceCache: {} as Record<
      string,
      { apps: any[]; links: any[]; desktops: any[]; workspace: any }
    >,
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
        state.warmSpaceIds = [];
        state.warmSpaceCache = {};
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
    /** Touch space as most-recent warm; evict oldest beyond max (caller persists) */
    touchWarmSpace(state, action) {
      const {
        workspaceId,
        apps,
        links,
        desktops,
        workspace,
        max = 3,
      } = action.payload || {};
      if (!workspaceId) return;
      const prev = (state.warmSpaceIds || []).filter(
        (id: string) => id !== workspaceId
      );
      state.warmSpaceIds = [workspaceId, ...prev].slice(0, max);
      if (!state.warmSpaceCache) state.warmSpaceCache = {};
      state.warmSpaceCache[workspaceId] = {
        apps: apps || state.apps || [],
        links: links || state.links || [],
        desktops: desktops || state.desktops || [],
        workspace: workspace || state.selectedWorkspace || {},
      };
      // Drop cache entries no longer warm
      Object.keys(state.warmSpaceCache).forEach((id) => {
        if (!state.warmSpaceIds.includes(id)) {
          delete state.warmSpaceCache[id];
        }
      });
    },
    evictWarmSpace(state, action) {
      const workspaceId = action.payload?.workspaceId;
      if (!workspaceId) return;
      state.warmSpaceIds = (state.warmSpaceIds || []).filter(
        (id: string) => id !== workspaceId
      );
      if (state.warmSpaceCache) {
        delete state.warmSpaceCache[workspaceId];
      }
    },
    setWarmSpaceIds(state, action) {
      state.warmSpaceIds = Array.isArray(action.payload)
        ? action.payload.slice(0, 3)
        : [];
    },
  },
});

export const workspaceActions = workSpaceSlice.actions;

export default workSpaceSlice;
