import { createSlice } from "@reduxjs/toolkit";

const appSlice = createSlice({
  name: "app",
  initialState: {
    deviceId: "",
    personId: "",
    selectedPerson: {},
    profileId: "",
    selectedProfile: {},
    bgImage: null,
    platform: "",
    version: "",
    hostname: "",
    minBuildNumber: 74,
    saveState: false,
    quitState: false,
    quitAlertShown: false,
    secretPass: "062011OnePad122013",
    xapps: [],
    xappsStore: {},
    userApps: [],
    userAppsVersion: 0,
    sync: false,
    workspacesLimit: -1,
    profilesLimit: -1,
    appsLimit: -1,
    linksLimit: -1,
    paymentCycle: "yearly",
    splashScreenVisible: false,
    tabsScreenVisible: false,
    screenShotStatusVersion: 0,
    wss:  {
      dev: "wss://76sser3z9a.execute-api.us-east-1.amazonaws.com/dev",
      beta: "wss://cw2bd052ii.execute-api.us-east-1.amazonaws.com/beta",
      master: "wss://rrzy1csdz0.execute-api.us-east-1.amazonaws.com/master",
    },
    stripeKey:{
      test: "pk_test_36kVIoR3YhN4OX3MtrqjdvfG",
      live: "pk_live_98EweSpekgs8AdGDRjqHPt2v",
    },
    priceId: {
      test: {
        annual: "price_1OiZVPJwYjkKyg9MnQVP6cef",
        monthly: "price_1OiZUUJwYjkKyg9M8GcASu6Y",
      },
      live: {
        annual: "price_1Ol8viJwYjkKyg9MZM8GwOd3",
        monthly: "price_1Ol8viJwYjkKyg9MAv8jUl4G",
      }
    },
    importCompleted: true,
    reload: false,
    clipboard: "",
    clipboardHistory: [],
    isSyncing: false,

  },
  reducers: {
    setDeviceId(state, action) {
      state.deviceId = action.payload;
    },
    setPersonId(state, action) {
      state.personId = action.payload;
    },
    setSelectedPerson(state, action) {
      state.selectedPerson = action.payload;
    },
    setProfileId(state, action) {
      state.profileId = action.payload;
    },
    setBgImage(state, action) {
      state.bgImage = action.payload.bgImage;
    },
    setPlatform(state, action) {
      state.platform = action.payload;
    },
    setVersion(state, action) {
      state.version = action.payload.version;
    },
    setHostname(state, action) {
      state.hostname = action.payload;
    },
    setSaveState(state, action) {
      state.saveState = action.payload;
    },
    setSaveAndQuitState(state, action) {
      state.quitState = action.payload;
    },
    setQuitAlertShown(state, action) {
      state.quitAlertShown = action.payload;
    },
    setXApps(state, action) {
      state.xapps = action.payload;
    },
    setXAppsStore(state, action) {
      state.xappsStore = action.payload;
    },
    setUserApps(state, action) {
      state.userApps = action.payload;
    },
    refreshUserApps(state) {
      state.userAppsVersion = state.userAppsVersion + 1;
    },
    setSync(state, action) {
      state.sync = action.payload;
    },
    setSelectProfile(state, action) {
      state.selectedProfile = action.payload;
    },
    togglePaymentCycle(state, action) {
      state.paymentCycle = state.paymentCycle === "monthly" ? "yearly" : "monthly";
    },
    setImportCompleted(state, action) {
      state.importCompleted = action.payload;
    },
    setReload(state, action) {
      state.reload = action.payload;
    },
    setIsSyncing(state, action) {
      state.isSyncing = action.payload;
    },
    showSplashScreen(state, action) {
      state.splashScreenVisible = true;
    },
    hideSplashScreen(state, action) {
      state.splashScreenVisible = false;
    },
    showTabsScreen(state, action) {
      state.tabsScreenVisible = true;
    },
    hideTabsScreen(state, action) {
      state.tabsScreenVisible = false;
    },
    updateClipboard(state, action) {
      state.clipboard = action.payload;
      state.clipboardHistory.push(action.payload);
      if(state.clipboardHistory.length > 10){
        state.clipboardHistory.shift();
      }
    },
    updateAccountLimits(state, action) {
      state.workspacesLimit = action.payload.workspaces;
      state.profilesLimit = action.payload.profiles;
      state.appsLimit = action.payload.apps;
      state.linksLimit = action.payload.links;
    },
    resetLimits(state, action) {
      state.profilesLimit = -1;
      state.workspacesLimit = -1;
      state.appsLimit = -1;
      state.linksLimit = -1;
    },
    updateScreenShotStatusVersion(state, action) {
      state.screenShotStatusVersion = Math.random()*1000;
    }
  },
});

export const appActions = appSlice.actions;

export default appSlice;
