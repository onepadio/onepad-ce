import { createSlice } from "@reduxjs/toolkit";
// @ts-expect-error
import { showLaunchPad } from "../components/LaunchPadLocal/LaunchPadLocal";

const modalSlice = createSlice({
  name: "modal",
  initialState: {
    isChangeBackgroundModalOpen: false,
    isNewWorkspaceModalOpen: false,
    isRenameSpaceModalOpen: false,
    isArchiveSpaceModalOpen: false,
    isSettingsOpen: false,
    isAppStoreOpen: false,
    isAppStoreModalOpen: false,
    isAddLinkModalOpen: false,
    addLinkModalData: {
      url: "",
      title: "",
    },
    editIconSelectedItem: {},
    isEditIconModalOpen: false,
    isEditLinkModalOpen: false,
    isNewDesktopModalWindowOpen: false,
    isNewSessionModalWindowOpen: false,
    isRenameDesktopModalWindowOpen: false,
    isDeleteDesktopModalWindowOpen: false,
    selectedAppStoreItem: null,
    isAddLaunchIconModalOpen: false,
    isEndSessionModalOpen: false,
    isRemoteLaunchModalOpen: false,
    isTabTilesModalOpen: false,
    isWelcomeModalWindowOpen: false,
    isSignUpModalOpen: false,
    isUpgradeModalOpen: false,
    isStripeModalOpen: false,
    showLoginPage: false,
    // favourites
    isEditFavouritesGroupModalOpen: false,
    selectedFavouritesGroupId: "",
    selectedRemoteApp: null,
    // add launch icon modal
    location: "launchpad",
    openStripeModalWhenLoggedIn: false,
    // profile modal
    newProfileType: "",
    //p2p file sharing
    isFileSharingWindowOpen: false,
    isFileSharingRequestModalOpen: false,
    isFileSharingResponseModalOpen: false,
    // global apps
    isGlobalAppsModalOpen: true,
    // widget configuration
    isWidgetPageConfigurationModalOpen: false,

    isPasswordImportModalOpen: false,
    isPasswordSavePromptOpen: false,
    passwordSavePromptData: null,

    isLaunchPadOpen: false,
    isRemoteTaskManagerOpen: false,
    isSpacePadOpen: false,
    isCloudPadOpen: false,
    isSaasPadOpen: false,
    saasPadSelectedIndex: 0,
    isFavouritesPadOpen: false,
    isRunDockerModalOpen: false,
    isDockerTaskManagerOpen: false,
    isTaskManagerOpen: false,
    isMemoryDashboardOpen: false,
    selectedDockerApp: null,
    cloudPadTab: "apps",
    isCategoryPadOpen: false,
    selectedCategory: "favourites",
    isResumeSessionModalOpen: false,
    resumeSessionData: null,
    isPauseSpaceModalOpen: false,
    pauseSpaceWorkspaceId: null,
    pauseSpaceDefaultOption: null,
    isRestartSessionModalOpen: false,
    isDownloadManagerOpen: false,
  },
  reducers: {
    toggleAppStore(state, action) {
      state.isAppStoreOpen = !state.isAppStoreOpen;
    },
    openAppStore(state, action) {
      state.isAppStoreModalOpen = true;
    },
    closeAppStore(state, action) {
      state.isAppStoreModalOpen = false;
    },
    toggleAppStoreModal(state, action) {
      state.isAppStoreModalOpen = !state.isAppStoreModalOpen;
    },
    setSelectedAppStoreItem(state, action) {
      state.selectedAppStoreItem = action.payload;
    },
    toggleAddLaunchIconModal(state, action) {
      state.isAddLaunchIconModalOpen = !state.isAddLaunchIconModalOpen;
    },
    toggleAddLinkModal(state, action) {
      state.isAddLinkModalOpen = !state.isAddLinkModalOpen;
      state.addLinkModalData = action.payload.data;
    },
    toggleChangeBackgroundModal(state, action) {
      state.isChangeBackgroundModalOpen = !state.isChangeBackgroundModalOpen;
    },
    toggleNewWorkspaceModal(state, action) {
      state.isNewWorkspaceModalOpen = !state.isNewWorkspaceModalOpen;
    },
    toggleRenameSpaceModal(state, action) {
      state.isRenameSpaceModalOpen = !state.isRenameSpaceModalOpen;
    },
    toggleArchiveSpaceModal(state, action) {
      state.isArchiveSpaceModalOpen = !state.isArchiveSpaceModalOpen;
    },
    openSettings(state, action) {
      state.isSettingsOpen = true;
    },
    closeSettings(state, action) {
      state.isSettingsOpen = false;
    },
    toggleSettings(state, action) {
      state.isSettingsOpen = !state.isSettingsOpen;
    },
    selectIcon(state, action) {
      state.editIconSelectedItem = action.payload;
    },
    toggleEditIconModal(state, action) {
      state.isEditIconModalOpen = !state.isEditIconModalOpen;
    },
    toggleEditLinkModal(state, action) {
      state.isEditLinkModalOpen = !state.isEditLinkModalOpen;
    },
    toggleNewDesktopModalWindow(state, action) {
      state.isNewDesktopModalWindowOpen = !state.isNewDesktopModalWindowOpen;
    },
    toggleRenameDesktopModalWindow(state, action) {
      state.isRenameDesktopModalWindowOpen = !state.isRenameDesktopModalWindowOpen;
    },
    toggleDeleteDesktopModalWindow(state, action) {
      state.isDeleteDesktopModalWindowOpen = !state.isDeleteDesktopModalWindowOpen;
    },
    toggleNewSessionModalWindow(state, action) {
      state.isNewSessionModalWindowOpen = !state.isNewSessionModalWindowOpen;
    },
    toggleEndSessionModal(state, action) {
      state.isEndSessionModalOpen = !state.isEndSessionModalOpen;
    },
    toggleEditFavoritesGroupModal(state, action) {
      state.isEditFavouritesGroupModalOpen = !state.isEditFavouritesGroupModalOpen;
    },
    toggleRemoteLaunchModal(state, action) {
      state.isRemoteLaunchModalOpen = !state.isRemoteLaunchModalOpen;
    },
    toggleTabTilesModal(state, action) {
      state.isTabTilesModalOpen = !state.isTabTilesModalOpen;
    },
    toggleWelcomeModalWindow(state, action) {
      state.isWelcomeModalWindowOpen = !state.isWelcomeModalWindowOpen;
    },
    toggleSignUpModalWindow(state, action) {
      state.isSignUpModalOpen = !state.isSignUpModalOpen;
    },
    toggleUpgradeModalWindow(state, action) {
      state.isUpgradeModalOpen = !state.isUpgradeModalOpen;
    },
    toggleStripeModalWindow(state, action) {
      state.isStripeModalOpen = !state.isStripeModalOpen;
    },
    toggleFileSharingRequestModal(state, action) {
      state.isFileSharingRequestModalOpen = !state.isFileSharingRequestModalOpen;
    },
    toggleFileSharingResponseModal(state, action) {
      state.isFileSharingResponseModalOpen = !state.isFileSharingResponseModalOpen;
    },
    toggleFileSharingWindow(state, action) {
      state.isFileSharingWindowOpen = !state.isFileSharingWindowOpen;
    },
    toggleGlobalAppsModal(state, action) {
      state.isGlobalAppsModalOpen = !state.isGlobalAppsModalOpen;
    },
    toggleCategoryAppsModal(state, action) {
      // @ts-expect-error
      state.isCategoryAppsModalOpen = !state.isCategoryAppsModalOpen;
    },
    toggleCategoryPad(state, action) {
      state.isCategoryPadOpen = !state.isCategoryPadOpen;
      if (action.payload && action.payload.category) {
        state.selectedCategory = action.payload.category;
      }
    },
    showCategoryPad(state, action) {
      state.isCategoryPadOpen = true;
    },
    hideCategoryPad(state, action) {
      state.isCategoryPadOpen = false;
    },
    setSelectedCategory(state, action) {
      state.selectedCategory = action.payload;
    },
    toggleWidgetConfigurationModal(state, action) {
      state.isWidgetPageConfigurationModalOpen = !state.isWidgetPageConfigurationModalOpen;
    },
    togglePasswordImportModal(state, action) {
      state.isPasswordImportModalOpen = !state.isPasswordImportModalOpen;
    },
    showPasswordSavePrompt(state, action) {
      state.isPasswordSavePromptOpen = true;
      state.passwordSavePromptData = action.payload;
    },
    hidePasswordSavePrompt(state, action) {
      state.isPasswordSavePromptOpen = false;
      state.passwordSavePromptData = null;
    },
    toggleRemoteTaskManager(state, action) {
      state.isRemoteTaskManagerOpen = !state.isRemoteTaskManagerOpen;
    },
    toggleLaunchPad(state, action) {
      state.isLaunchPadOpen = !state.isLaunchPadOpen;
    },
    showLaunchPad (state, action) {
      state.isLaunchPadOpen = true;
    },
    hideLaunchPad(state, action) {
      state.isLaunchPadOpen = false;
    },
    toggleSpacePad(state, action) {
      state.isSpacePadOpen = !state.isSpacePadOpen;
    },
    showSpacePad (state, action) {
      state.isSpacePadOpen = true;
    },
    hideSpacePad(state, action) {
      state.isSpacePadOpen = false;
    },
    toggleCloudPad(state, action) {
      state.isCloudPadOpen = !state.isCloudPadOpen;
      state.cloudPadTab = action.payload;
    },
    showCloudPad (state, action) {
      state.isCloudPadOpen = true;
    },
    hideCloudPad(state, action) {
      state.isCloudPadOpen = false;
    },
    toggleSaasPad(state, action) {
      state.isSaasPadOpen = !state.isSaasPadOpen;
    },
    showSaasPad (state, action) {
      state.isSaasPadOpen = true;
      // Reset selected index when opening
      state.saasPadSelectedIndex = 0;
    },
    hideSaasPad(state, action) {
      state.isSaasPadOpen = false;
      state.saasPadSelectedIndex = 0;
    },
    setSaasPadSelectedIndex(state, action) {
      state.saasPadSelectedIndex = action.payload;
    },
    toggleFavouritesPad(state, action) {
      state.isFavouritesPadOpen = !state.isFavouritesPadOpen;
    },
    showFavouritesPad (state, action) {
      state.isFavouritesPadOpen = true;
    },
    hideFavouritesPad(state, action) {
      state.isFavouritesPadOpen = false;
    },
    setShowLoginPage(state, action) {
      state.showLoginPage = action.payload;
    },
    setSelectedFavouritesGroupId(state, action) {
      state.selectedFavouritesGroupId = action.payload;
    },
    setSelectedRemoteApp(state, action) {
      state.selectedRemoteApp = action.payload;
    },
    setLocation(state, action) {
      state.location = action.payload;
    },
    setOpenStripeModalWhenLoggedIn(state, action) {
      state.openStripeModalWhenLoggedIn = action.payload;
    },
    setNewProfileType(state, action) {
      state.newProfileType = action.payload;
    },
    toggleRunDockerModal(state) {
      state.isRunDockerModalOpen = !state.isRunDockerModalOpen;
    },
    toggleDockerTaskManager(state) {
      state.isDockerTaskManagerOpen = !state.isDockerTaskManagerOpen;
    },
    toggleTaskManager(state) {
      state.isTaskManagerOpen = !state.isTaskManagerOpen;
    },
    toggleMemoryDashboard(state) {
      state.isMemoryDashboardOpen = !state.isMemoryDashboardOpen;
    },
    setSelectedDockerApp(state, action) {
      state.selectedDockerApp = action.payload;
    },
    clearSelectedDockerApp(state) {
      state.selectedDockerApp = null;
    },
    toggleResumeSessionModal(state) {
      state.isResumeSessionModalOpen = !state.isResumeSessionModalOpen;
    },
    openResumeSessionModal(state, action) {
      state.isResumeSessionModalOpen = true;
      state.resumeSessionData = action.payload;
    },
    closeResumeSessionModal(state) {
      state.isResumeSessionModalOpen = false;
      state.resumeSessionData = null;
    },
    togglePauseSpaceModal(state) {
      state.isPauseSpaceModalOpen = !state.isPauseSpaceModalOpen;
    },
    openPauseSpaceModal(state, action) {
      state.isPauseSpaceModalOpen = true;
      state.pauseSpaceWorkspaceId = action.payload?.workspaceId || null;
      state.pauseSpaceDefaultOption = action.payload?.defaultOption || null;
    },
    closePauseSpaceModal(state) {
      state.isPauseSpaceModalOpen = false;
      state.pauseSpaceWorkspaceId = null;
      state.pauseSpaceDefaultOption = null;
    },
    toggleRestartSessionModal(state) {
      state.isRestartSessionModalOpen = !state.isRestartSessionModalOpen;
    },
    openRestartSessionModal(state) {
      state.isRestartSessionModalOpen = true;
    },
    closeRestartSessionModal(state) {
      state.isRestartSessionModalOpen = false;
    },
    toggleDownloadManager(state) {
      state.isDownloadManagerOpen = !state.isDownloadManagerOpen;
    },
    openDownloadManager(state) {
      state.isDownloadManagerOpen = true;
    },
    closeDownloadManager(state) {
      state.isDownloadManagerOpen = false;
    },
  },
});

export const modalActions = modalSlice.actions;

export default modalSlice;
