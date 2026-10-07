import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    isWorkspacesEnabled: true,
    isDesktopsEnabled: false,
    isSessionsEnabled: false,
    isSplitWindowsEnabled: false,
    isEfficiencyModeEnabled: false,
    isAdvancedBackgroundEnabled: false,
    isExternalWindowMode: false,
    isDesktopStickyMode: false,
    isDeveloperMode: false,
    isSharedAppsEnabled: true,
    isSpaceBrowserEnabled: true,
    isTabGroupsEnabled: true,
    isSpaceOSEnabled: false,
    isSleepingTabsEnabled: false,
    sleepingTabsTimeout: 15, // Default to 15 minutes
    sleepingTabsTimeoutOptions: [
      //{ value: 1, label: '1 minute' },
      { value: 5, label: '5 minutes' },
      { value: 10, label: '10 minutes' },
      { value: 15, label: '15 minutes' },
      { value: 30, label: '30 minutes' },
      { value: 60, label: '1 hour' }
    ],
    isKeepActiveWindowTabsAwake: false,
    /** Desktop presentation: classic 2D home vs 3D Desktop */
    desktopVisualMode: "2d" as "2d" | "3d",
    /** 3D mode: Cover/Mission/Ring use wallpaper; Scene uses control-room env */
    desktop3dLayout: "coverflow" as
      | "coverflow"
      | "mission"
      | "ring"
      | "scene",
    /** Persisted overview camera distance for Scene mode (null = default) */
    desktop3dSceneZoomDistance: null as number | null,
    /** Persisted Ring camera distance past the front card (null = default) */
    desktop3dRingZoomDistance: null as number | null,
    /** Persisted Ring view pitch in radians (null = flat default) */
    desktop3dRingViewPitch: null as number | null,
    /** Persisted Mission camera Z distance (null = default) */
    desktop3dMissionZoomDistance: null as number | null,
  },
  reducers: {
    toggleWorkspaces(state, action) {
      state.isWorkspacesEnabled = !state.isWorkspacesEnabled;
    },
    setWorkspacesEnabled(state, action) {
      state.isWorkspacesEnabled = action.payload;
    },
    toggleDesktops(state, action) {
      state.isDesktopsEnabled = !state.isDesktopsEnabled;
    },
    setDesktopsEnabled(state, action) {
      state.isDesktopsEnabled = action.payload;
    },
    toggleSessions(state, action) {
      state.isSessionsEnabled = !state.isSessionsEnabled;
    },
    setSessionsEnabled(state, action) {
      state.isSessionsEnabled = action.payload;
    },
    toggleSplitWindows(state, action) {
      state.isSplitWindowsEnabled = !state.isSplitWindowsEnabled;
    },
    setSplitWindowsEnabled(state, action) {
      state.isSplitWindowsEnabled = action.payload;
    },
    toggleExternalWindowMode(state, action) {
      state.isExternalWindowMode = !state.isExternalWindowMode;
    },
    setExternalWindowMode(state, action) {
      state.isExternalWindowMode = action.payload;
    },
    toggleEfficiencyMode(state, action) {
      state.isEfficiencyModeEnabled = !state.isEfficiencyModeEnabled;
    },
    setEfficiencyModeEnabled(state, action) {
      state.isEfficiencyModeEnabled = action.payload;
    },
    toggleAdvancedBackground(state, action) {
      state.isAdvancedBackgroundEnabled = !state.isAdvancedBackgroundEnabled;
    },
    setAdvancedBackgroundEnabled(state, action) {
      state.isAdvancedBackgroundEnabled = action.payload;
    },
    toggleDeveloperMode(state, action) {
      state.isDeveloperMode = !state.isDeveloperMode;
    },
    setDeveloperMode(state, action) {
      state.isDeveloperMode = action.payload;
    },
    toggleSharedApps(state, action) {
      state.isSharedAppsEnabled = !state.isSharedAppsEnabled;
    },
    setSharedAppsEnabled(state, action) {
      state.isSharedAppsEnabled = action.payload;
    },
    toggleSpaceBrowser(state, action) {
      state.isSpaceBrowserEnabled = !state.isSpaceBrowserEnabled;
    },
    setSpaceBrowserEnabled(state, action) {
      state.isSpaceBrowserEnabled = action.payload;
    },
    toggleTabGroups(state, action) {
      state.isTabGroupsEnabled = !state.isTabGroupsEnabled;
    },
    setTabGroupsEnabled(state, action) {
      state.isTabGroupsEnabled = action.payload;
    },
    toggleSpaceOS(state, action) {
      state.isSpaceOSEnabled = !state.isSpaceOSEnabled;
    },
    setSpaceOSEnabled(state, action) {
      state.isSpaceOSEnabled = action.payload;
    },
    setSleepingTabsTimeout(state, action) {
      state.sleepingTabsTimeout = action.payload;
    },
    toggleSleepingTabs(state, action) {
      state.isSleepingTabsEnabled = !state.isSleepingTabsEnabled;
    },
    setSleepingTabsEnabled(state, action) {
      state.isSleepingTabsEnabled = action.payload;
    },
    toggleKeepActiveWindowTabsAwake(state, action) {
      state.isKeepActiveWindowTabsAwake = !state.isKeepActiveWindowTabsAwake;
    },
    setKeepActiveWindowTabsAwake(state, action) {
      state.isKeepActiveWindowTabsAwake = action.payload;
    },
    setDesktopVisualMode(state, action) {
      state.desktopVisualMode = action.payload === "3d" ? "3d" : "2d";
    },
    toggleDesktopVisualMode(state) {
      state.desktopVisualMode =
        state.desktopVisualMode === "3d" ? "2d" : "3d";
    },
    setDesktop3dLayout(state, action) {
      const layout = action.payload;
      if (
        layout === "coverflow" ||
        layout === "mission" ||
        layout === "ring" ||
        layout === "scene"
      ) {
        state.desktop3dLayout = layout;
      }
    },
    setDesktop3dSceneZoomDistance(state, action) {
      const d = action.payload;
      if (d == null || d === undefined) {
        state.desktop3dSceneZoomDistance = null;
        return;
      }
      const n = Number(d);
      if (!Number.isFinite(n)) return;
      state.desktop3dSceneZoomDistance = Math.min(40, Math.max(0.2, n));
    },
    setDesktop3dRingZoomDistance(state, action) {
      const d = action.payload;
      if (d == null || d === undefined) {
        state.desktop3dRingZoomDistance = null;
        return;
      }
      const n = Number(d);
      if (!Number.isFinite(n)) return;
      state.desktop3dRingZoomDistance = Math.min(16, Math.max(2.4, n));
    },
    setDesktop3dRingViewPitch(state, action) {
      const d = action.payload;
      if (d == null || d === undefined) {
        state.desktop3dRingViewPitch = null;
        return;
      }
      const n = Number(d);
      if (!Number.isFinite(n)) return;
      state.desktop3dRingViewPitch = Math.min(0.95, Math.max(-0.35, n));
    },
    setDesktop3dMissionZoomDistance(state, action) {
      const d = action.payload;
      if (d == null || d === undefined) {
        state.desktop3dMissionZoomDistance = null;
        return;
      }
      const n = Number(d);
      if (!Number.isFinite(n)) return;
      state.desktop3dMissionZoomDistance = Math.min(30, Math.max(4.5, n));
    },
    /** Hydrate all layout zooms when switching space (nulls = use defaults) */
    setDesktop3dLayoutZooms(state, action) {
      const z = action.payload || {};
      const clampOrNull = (v: unknown, min: number, max: number) => {
        if (v == null || v === undefined) return null;
        const n = Number(v);
        if (!Number.isFinite(n)) return null;
        return Math.min(max, Math.max(min, n));
      };
      state.desktop3dSceneZoomDistance = clampOrNull(z.scene, 0.2, 40);
      state.desktop3dRingZoomDistance = clampOrNull(z.ring, 2.4, 16);
      state.desktop3dRingViewPitch = clampOrNull(z.ringPitch, -0.35, 0.95);
      state.desktop3dMissionZoomDistance = clampOrNull(z.mission, 4.5, 30);
    },
    // Back-compat aliases (older launchpad* naming)
    setLaunchpadVisualMode(state, action) {
      state.desktopVisualMode = action.payload === "3d" ? "3d" : "2d";
    },
    toggleLaunchpadVisualMode(state) {
      state.desktopVisualMode =
        state.desktopVisualMode === "3d" ? "2d" : "3d";
    },
    setLaunchpad3dLayout(state, action) {
      const layout = action.payload;
      if (
        layout === "coverflow" ||
        layout === "mission" ||
        layout === "ring" ||
        layout === "scene"
      ) {
        state.desktop3dLayout = layout;
      }
    },
  },
});

export const settingsActions = settingsSlice.actions;

export default settingsSlice;
