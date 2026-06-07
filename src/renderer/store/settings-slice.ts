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
  },
});

export const settingsActions = settingsSlice.actions;

export default settingsSlice;
