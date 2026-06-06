import log from "loglevel";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from 'react-router';
import { Steps, Hints } from 'intro.js-react';
import * as Icon from 'react-feather';
import isElectron from "is-electron";

import { Platform } from "../../enum";

import "../../App.css";
import { Button, Fade } from "reactstrap";

// Reducers
import { userActions } from "../../store/user-slice";
import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";
import { appActions } from "../../store/app-slice";
import { sessionActions } from "../../store/session-slice";

import UserApi from "../../api/UserApi";

import ElectronHub from "../../hubs/ElectronHub";
import WebSocketHub from "../../hubs/WebSocketHub";
import WorkspaceHub from "../../hubs/WorkspaceHub";
import TabSleeperHub from "../../hubs/TabSleeperHub";
import ScreenshotManagerHub from "../../hubs/ScreenshotManagerHub";
import TabSwitchScreenshotHub from "../../hubs/TabSwitchScreenshotHub";

import {Login} from "../Login/Login";

import SplashScreen from "../../components/SplashScreen/SplashScreen";
import TabsScreen from "../../components/TabsScreen/TabsScreen";
import SPNavBar from "../../components/SPNavBar/SPNavBar";
import Desktop from "../../components/Desktop/Desktop";
import TabWindow from "../../components/WindowContainter/TabWindow";
import SideBar from "../../components/SideBar/SideBar";
import SettingsCanvas from "../../components/SettingsCanvas/SettingsCanvas";

import AppStoreModalWindow from "../../components/AppStoreModalWindow/AppStoreModalWindow";
import NewWorkspaceModalWindow from "../../components/NewWorkspaceModalWindow/NewWorkspaceModalWindow";
import RenameSpaceModalWindow from "../../components/RenameSpaceModalWindow/RenameSpaceModalWindow";
import ArchiveWorkspaceModal from "../../components/ArchiveWorkspaceModal/ArchiveWorkspaceModal";
import EditLaunchIconModalWindow from "../../components/EditLaunchIconModalWindow/EditLaunchIconModalWindow";
import AddLinkModalWindow from "../../components/AddLinkModalWindow/AddLinkModalWindow";
import NewDesktopModalWindow from "../../components/NewDesktopModalWindow/NewDesktopModalWindow";
import AddLaunchIconModalWindow from "../../components/AddLaunchIconModalWindow/AddLaunchIconModalWindow";
import EditLinkModalWindow from "../../components/EditLinkModalWindow/EditLinkModalWindow";
import EditFavouritesGroupModal from "../../components/modal/favourites/EditFavouritesGroupModal/EditFavouritesGroupModal";

import VerticalTabBar from "../../components/TabsVerticalBar/VerticalTabBar";
import TilesBar from "../../components/TabsVerticalBar/TilesBar";
import RenameDesktopModalWindow from "../../components/RenameDesktopModalWindow/RenameDesktopModalWindow";
import WindowSideBar from "../../components/WindowSideBar/WindowSideBar";
import BookmarkSideMenu from "../../components/BookmarkSideMenu/BookmarkSideMenu";
import NewSessionModalWindow from "../../components/NewSessionModalWindow/NewSessionModalWindow";
import TerminateSessionModalWindow from "../../components/SessionSwitchMenu/TerminateSessionModalWindow";
import CreateRemoteModalWindow from "../../components/CreateRemoteWindowModal/CreateRemoteModalWindow";
import WelcomeModalWindow from "../../components/WelcomeModalWindow/WelcomeModalWindow";
import FileSharingRequestModalWindow from "../../components/P2PFileSharing/FileSharingRequestModalWindow";
import FileSharingResponseModalWindow from "../../components/P2PFileSharing/FileSharingResponseModalWindow";

import SingInModalWindow from "../../components/SignInModalWindow/SignInModalWindow";
import UpgradeModalWindow from "../../components/UpgradeModalWindow/UpgradeModalWindow";
import StripeModalWindow from "../../components/StripeModal/StripeModal";
import MacActionsMenu from "../../components/WindowActionsMenu/MacActionsMenu";
import WindowsActionsMenu from "../../components/WindowActionsMenu/WindowsActionsMenu";
import WebViewCanvas from "../../components/WebViewCanvas/WebViewCanvas";
import CornerWebViewModal from "../../components/CornerWebViewModal/CornerWebViewModal";
import ChatAppsWindow from "../../components/ChatAppsWindow/ChatAppsWindow";
import ChatAssistant from "../../components/ChatAssistant/ChatAssistant";
import MusicPlayerWindow from "../../components/MusicPlayerWindow/MusicPlayerWindow";
import UtilityAppsCanvas from "../../components/UtilityAppsCanvas/UtilityAppsCanvas";
import SyncManager from "../../components/SyncManager/SyncManager";
import SpaceAppWindow from "../../components/SpaceAppWindow/SpaceAppWindow";
import WindowBar from "../../components/WindowContainter/WindowBar";
import TabsPreviewBar from "../../components/TabPreviewBar/TabPreviewBar";
import PasswordManagerCanvas from "../../components/PasswordManagerCanvas/PasswordManagerCanvas";
import PasswordImportModal from "../../components/PasswordImportModal/PasswordImportModal";
import LaunchPadLocal from "../../components/LaunchPadLocal/LaunchPadLocal";
import SpaceTopBar from "../../components/SpaceTopBar/SpaceTopBar";
import WindowService from "../../hubs/WindowService";
import DesktopContainer from "../../components/DesktopContainer/DesktopContainer";
import SyncHub from "../../hubs/SyncHub";
import CloudService from "../../hubs/CloudService";
import SpacePad from "../../components/SpacePad/SpacePad";
import CloudPad from "../../components/LaunchPadLocal/CloudPad";
import SaasPad from "../../components/LaunchPadLocal/SaasPad";
import FavouritesPad from "../../components/FavouritesPad/FavouritesPad";
import CategoryPad from "../../components/CategoryPad/CategoryPad";
import RunDockerContainerModal from "../../components/RunDockerContainerModal/RunDockerContainerModal";
import TaskManager from "../../components/TaskManager/TaskManager";
import MemoryDashboard from "../../components/MemoryDashboard/MemoryDashboard";
import ChangeBackgroundModalWindow from "../../components/ChangeBackgroundModalWindow/ChangeBackgroundModalWindow";
import AIAssistantsCanvas from "renderer/components/AIAssistantsCanvas/AIAssistantsCanvas";
function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const route = useSelector((state: any) => state.session.route);
  const user = useSelector((state: any) => state.user);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const version = useSelector((state) => state.app.version);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const platform = useSelector((state) => state.app.platform);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const userState = useSelector((state) => state.user);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const personId = useSelector((state) => state.app.personId);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const profileId = useSelector((state) => state.app.profileId);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const userId = useSelector((state) => state.user.id);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const desktops = useSelector((state) => state.workspace.desktops);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const workspaces = useSelector((state) => state.workspace.workspaces);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const desktop = useSelector((state) => state.workspace.desktop);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const sessionState = useSelector((state) => state.session);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const workspaceState = useSelector((state) => state.workspace);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const openWindows = useSelector((state) => state.session.openWindows);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const openTabs = useSelector((state) => state.session.openTabs);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeWindow = useSelector((state) => state.session.activeWindow);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeWindowTabs = useSelector((state) => state.session.activeWindowTabs);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const showSidebar = useSelector((state) => state.window.showSidebar);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeBar = useSelector((state) => state.window.activeBar);

  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isStripeModalOpen = useSelector((state) => state.modal.isStripeModalOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isAddLinkModalOpen = useSelector((state) => state.modal.isAddLinkModalOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isAddLaunchIconModalOpen = useSelector((state) => state.modal.isAddLaunchIconModalOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isGlobalAppsModalOpen = useSelector((state) => state.modal.isGlobalAppsModalOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const showLoginPage = useSelector((state) => state.modal.showLoginPage);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const tabsScreenVisible = useSelector((state) => state.app.tabsScreenVisible);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const openStripeModalWhenLoggedIn = useSelector((state) => state.modal.openStripeModalWhenLoggedIn);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isWebViewCanvasOpen = useSelector((state) => state.canvas.isOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isChatAppsWindowOpen = useSelector((state) => state.chat.isOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isSpaceSideBarOpen = useSelector((state) => state.spaceSideBar.isOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isRemoteTaskManagerOpen = useSelector((state) => state.modal.isRemoteTaskManagerOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isRunDockerModalOpen = useSelector((state) => state.modal.isRunDockerModalOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isDockerTaskManagerOpen = useSelector((state) => state.modal.isDockerTaskManagerOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isTaskManagerOpen = useSelector((state) => state.modal.isTaskManagerOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isMemoryDashboardOpen = useSelector((state) => state.modal.isMemoryDashboardOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isLaunchPadOpen = useSelector((state) => state.modal.isLaunchPadOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isSpacePadOpen = useSelector((state) => state.modal.isSpacePadOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isCloudPadOpen = useSelector((state) => state.modal.isCloudPadOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isSaasPadOpen = useSelector((state) => state.modal.isSaasPadOpen);
  const isFavouritesPadOpen = useSelector((state: any) => state.modal.isFavouritesPadOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isCategoryPadOpen = useSelector((state) => state.modal.isCategoryPadOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const selectedCategory = useSelector((state) => state.modal.selectedCategory);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isAppStoreModalOpen = useSelector(state => state.modal.isAppStoreModalOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isRemoteLaunchModalOpen = useSelector(state => state.modal.isRemoteLaunchModalOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isSharedAppsEnabled = useSelector((state) => state.settings.isSharedAppsEnabled);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isWorkspacesEnabled = useSelector((state) => state.settings.isWorkspacesEnabled);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isChangeBackgroundModalOpen = useSelector((state) => state.modal.isChangeBackgroundModalOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const importCompleted = useSelector((state) => state.app.importCompleted);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const reload = useSelector((state) => state.app.reload);

  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isExternalWindowMode = useSelector((state) => state.settings.isExternalWindowMode);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isSpaceOSEnabled = useSelector((state) => state.settings.isSpaceOSEnabled);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isSleepingTabsEnabled = useSelector((state) => state.settings.isSleepingTabsEnabled);

  const [stepsEnabled, setStepsEnabled] = useState(false);
  const [hintsEnabled, setHintsEnabled] = useState(false);
  const [initialStep, setInitialStep] = useState(0);
  const toggleHints = () => setHintsEnabled(!hintsEnabled);
  const [options, setOptions] = useState({
    nextLabel: 'Next',
    prevLabel: 'Back',
    doneLabel: 'Done',
    tooltipPosition: 'auto',
    tooltipClass: '',
    highlightClass: '',
    exitOnEsc: false,
    exitOnOverlayClick: false,
    showStepNumbers: true,
    keyboardNavigation: true,
    showButtons: true,
    showBullets: false,
    showProgress: true,
    scrollToElement: true,
    overlayOpacity: 0.5,
    positionPrecedence: ['bottom', 'top', 'right', 'left'],
  });
  const [steps, setSteps] = useState([
    {
      title: 'Welcome to OnePad',
      intro: 'This is a quick tour to help you get started.<br/><br/> Please click on the next button to continue.',
    },
    {
      title: 'Spaces',
      element: '#spacepad-id',
      intro: 'Spaces are the core feature of your OnePad. You can create and manage them through the space menu. <br/><br/> Each space has its own isolated container for data—like cookies, cache, to keep your data clean and isolated for every space.',
    },
    /*{
      title: 'Desktops',
      element: '#desktopSwithcMenu',
      intro: 'Desktops help you to group your apps/sites in a desktop. Desktops menu helps you to create and manage your desktops.<br/>  You can enable/disable desktops from settings.',
    },*/
    {
      title: 'Space Apps',
      element: '#launchpad-container-id',
      intro: 'The Space Apps section makes it easy to find and launch your space apps quickly. <br/><br/> Apps use the space container to store its data so the same app can be used in different spaces without conflicts.',
    },
    {
      title: 'App Store',
      element: '#space-apps-add-button',
      intro: 'You can add your favourite apps from App Store by clicking on the add app button.',
    },
    {
      title: 'App Store',
      element: '#storeSearchBox',
      intro: 'App store helps you to find and install apps from the app store.',
    },
    {
      title: 'Add Custom Link',
      element: '#add-link-button',
      intro: 'Add Custom button helps you to add any site by url.',
    },
    {
      title: 'Search Box',
      element: '#searchBar',
      intro: 'Search box helps you to find any site or app quickly.',
    },
    /*
    {
      title: 'Browser',
      element: '.sidebar',
      intro: 'Browser helps you to open any site in the browser.',
    },*/
    {
      title: 'Favourite Apps',
      element: '#globalAppsMenu',
      intro: 'Favourite apps menu helps you to use your favourite apps quickly. <br/><br/> Favourite apps don\'t use the space container to store their data, each app has its own container so you can use them in any space.',
    },
    {
      title: 'Settings',
      element: '.settings-menu-button',
      intro: 'Settings helps you to configure your OnePad. <br/><br/> You can enable/disable features.',
    },
    {
      title: 'Lets Start!',
      element: '#space-apps-add-button',
      intro: 'Lets start by installing your favourite apps from the app store.',
    },
  ]);
  const [hints, setHints] = useState([
    {
      element: '#searchBar',
      hint: 'Search for a space or a person',
      hintPosition: 'middle-right',
    },
    {
      element: '#spacesTopMenu',
      hint: 'Launch a space',
      hintPosition: 'middle-right',
    },
    {
      element: '#spaceMenu',
      hint: 'Manage your spaces',
      hintPosition: 'middle-right',
    },
  ]);

  function onStart() {
  };

  function onExit() {
    // TODO: Open app store
    log.debug("Steps:Exit");
    setStepsEnabled(false);
    // localStorage.setItem("intro-launchpad", "true");
    // dispatch(modalActions.openAppStore());
    //dispatch(settingsActions.toggleWorkspaces());
    //dispatch(settingsActions.toggleDesktops());
    // dispatch(settingsActions.toggleSessions());
  };

  function onComplete() {
    // TODO: Open app store
    log.debug("Steps:Exit");
    setStepsEnabled(false);
    localStorage.setItem("intro-launchpad", "true");
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.openAppStore());
    //dispatch(settingsActions.toggleWorkspaces());
    //dispatch(settingsActions.toggleDesktops());
    // dispatch(settingsActions.toggleSessions());
  };

  function onBeforeChange(nextStepIndex: any, nextElement: any) {
    // log.debug("Steps:BeforeChange", nextStepIndex, nextElement);
    if(nextStepIndex === 1){
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.showSpacePad());
    }else{
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.hideSpacePad());
    }

    if(nextStepIndex === 3 ){
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.closeAppStore());
    }

    if(nextStepIndex === 4 ){
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.openAppStore());
    }

    if(nextStepIndex === 6){
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.closeAppStore());
    }

    if(nextStepIndex === 8 ){
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.openSettings());
    }else{
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.closeSettings());
    }

  }


  const [isUpdating, setIsUpdating] = useState(false);
  const [isInEditMode, setIsInEditMode] = useState(false);

  function setUserData(user: any) {
    const _name = user.attributes.email.split("@")[0];
    dispatch(
      userActions.setUser({
        id: user.username,
        email: user.attributes.email,
        name: _name,
      })
    );
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "signed-in",
        id: user.username,
      });
    }
  }

  useEffect(() => {
    log.debug("home loaded... ");
    dispatch(modalActions.setOpenStripeModalWhenLoggedIn(false));
    if(!localStorage.getItem("intro-launchpad")){
      // dispatch(settingsActions.toggleWorkspaces());
      // dispatch(settingsActions.toggleDesktops());
      // dispatch(settingsActions.toggleSessions());
      setStepsEnabled(true);
    }
    // setStepsEnabled(false);
    // log.debug("welcome-completed", localStorage.getItem("welcome-completed"));
    // if(!localStorage.getItem("welcome-completed")){
    //   dispatch(modalActions.toggleWelcomeModalWindow());
    // }
  }, []);

  useEffect(() => {
    if(reload){
      dispatch(appActions.setProfileId(""));
      dispatch(sessionActions.setLocation("profiles"));
      dispatch(appActions.setReload(false));
      navigate('/');
    }
  }, [reload]);


  useEffect(() => {
    log.debug("profileID", profileId);
    if(profileId === ""){
      dispatch(sessionActions.setLocation("profiles"));
      navigate('/');
    }
  }, [profileId]);

  useEffect(() => {
    log.debug("user state", userState);

  }, [userId]);


  useEffect(() => {
    log.debug("openWindows", openWindows);
  }, [openWindows]);

  useEffect(() => {
    log.debug("openTabs", openTabs);
  }, [openTabs]);

  useEffect(() => {
    log.debug("showSidebar", showSidebar);
  }, [showSidebar]);

  useEffect(() => {
    if(showLoginPage){
      // document.getElementById("login-content").classList.remove("d-none");
      document.getElementById("home-content")?.classList.add("d-none");
    }else{
      // document.getElementById("login-content").classList.add("d-none");
      document.getElementById("home-content")?.classList.remove("d-none");
      if(route === "authenticated" && openStripeModalWhenLoggedIn && userState.product !== "PLUS"){
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(modalActions.toggleStripeModalWindow());
      }
    }
  }, [showLoginPage]);

  function updateLimits(response: any){
    if(response.limits === undefined){
      return;
    }
    dispatch(userActions.setLimits(response.limits));
    dispatch(appActions.updateAccountLimits({
      workspaces: response.limits.maxWorkspaces,
      profiles: response.limits.maxProfiles,
      apps: response.limits.maxApps,
      links: response.limits.maxLinks,
    }));
  }

  function initWorkspacesOffline(){
    if (!isUpdating) {
      setIsUpdating(true);
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(workspaceActions.clearWorkspaces());

      setTimeout(() => {
        setIsUpdating(false);
      }, 5000);
    }
  }

  function openSignIn() {
    navigate("/login");
  }


  function getPartitionId(workspaceId: any){
    let partition = "";
    if(route === "authenticated"){
      partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+user.username+"_"+workspaceState.currentSession.id : "persist:"+user.username+"_"+workspaceId;
    }else{
      partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+workspaceState.currentSession.id : "persist:"+workspaceId;
    }
    return partition;
  }

  function _tab(item: any){
    if (!item.url || !item.location || item.sleeping) return <></>;
    let partition = item.partition ? item.partition : getPartitionId(item["workspace"]);

    if(item.type === "xapp" || (item.isolated ? item.isolated : false)){
      partition = "persist:"+item["window"];
    }

    return <TabWindow type={item["type"]}
      key={item["id"]} windowId={item["window"]} tabId={item["id"]}
      partition={partition} url={item.state.url} workspaceId={item["workspace"]}
      desktopId={item["desktop"]} sleeping={item.sleeping} location={item.location} isolated={item.isolated ? item.isolated : false}
    />;
  }

  function tilesBar(){
    if(activeWindow && activeWindow.id !== "launchpad" && showSidebar && activeBar === "tiles"){
      return (<TilesBar />)
    }
  }

  function verticalBar(){
    if(activeWindow && activeWindow.id !== "launchpad" && showSidebar && activeBar === "tabs"){
      return (<VerticalTabBar />)
    }
  }

  function bookmarks(){
    if(activeWindow && activeWindow.id !== "launchpad" && showSidebar && activeBar === "bookmarks"){
      return (<BookmarkSideMenu />)
    }
  }

  function windowSideBar(){
    if(activeWindow && activeWindow.id != "launchpad"){
      return (<WindowSideBar />)
    }
  }

  function editIcon(){
    return (
      <Button color="dark" onClick={() => setIsInEditMode(!isInEditMode)} className="edit-button">
        {isInEditMode ? <Icon.X size={16} /> : <Icon.Edit2 size={16} />}
      </Button>
    )
  }

  return <>
  {
    showLoginPage ? <Login /> : <></>
  }
  <SyncManager />
  <div id="home-content">
    <Steps
      enabled={stepsEnabled}
      steps={steps}
      initialStep={initialStep}
      onStart={onStart}
      onBeforeChange={onBeforeChange}
      onChange={nextStep => log.debug("Steps:Change", nextStep)}
      onComplete={onComplete}
      onExit={onExit}
      options={options}
    />
    <Hints enabled={hintsEnabled} hints={hints} />
    {/* @ts-expect-error TS(2322): Type '{ user: AmplifyUser; }' is not assignable to... Remove this comment to see the full error message */}
    <SPNavBar user={user}/>
    {
      isLaunchPadOpen ? <LaunchPadLocal name="pad1" data-interval="false" isInEditMode={false}/> : <></>
    }

    <SaasPad />

    {
      isFavouritesPadOpen ? <FavouritesPad /> : <></>
    }

    {
      isCloudPadOpen ? <CloudPad /> : <></>
    }

    {
      isSpacePadOpen ? <SpacePad/> : <></>
    }

    {
      isCategoryPadOpen ? <CategoryPad category={selectedCategory} /> : <></>
    }

    {}
    <div className="w-100 pt-0 mt-2">


      {
        isSpaceOSEnabled ? (
          <>
            {desktops && desktops?.map((desktop: any) => <DesktopContainer
              key={desktop.id}
              id={desktop.id}
            />)}
          </>
        ) : (
          <Fade className="mt-2" tag="div">
            {desktops && desktops?.map((desktop: any) => <Desktop
              key={desktop.id}
              id={desktop.id}
              name={desktop.name}
              data-interval="false"
              isInEditMode={isInEditMode}
            />)}
          </Fade>
        )
      }
      {
        false && (<WindowBar />)
      }
      {
        false && (<TabsPreviewBar />)
      }
      <>
        {
          isExternalWindowMode ? (
            <> </>
          ) : Object.values(openTabs).map(tab =>{
            return _tab(tab);
          })
        }
      </>
      <SplashScreen />
      {false ? <TabsScreen /> : <></>}
      <SingInModalWindow />
      <UpgradeModalWindow />
      {
        isStripeModalOpen ? <StripeModalWindow /> : <></>
      }
      {
        platform === "" ? <></> : (platform === Platform.MacOS ? <MacActionsMenu /> : <WindowsActionsMenu />)
      }
      {
        isSharedAppsEnabled ? <SideBar /> : <></>
      }
      <AppStoreModalWindow />

      <NewWorkspaceModalWindow onClose={(success: boolean) => {
        if(success){
          setTimeout(() => {
            window.alert("Space is ready, please use space menu to switch to it.");
          }, 100);
        }
      }} />
      <RenameSpaceModalWindow />
      <RenameDesktopModalWindow />
      <ArchiveWorkspaceModal />
      <SettingsCanvas />
      <PasswordManagerCanvas />
      <PasswordImportModal />
      {
        isChangeBackgroundModalOpen ? <ChangeBackgroundModalWindow /> : <></>
      }
      {
        isTaskManagerOpen ? <TaskManager /> : <></>
      }
      {
        isMemoryDashboardOpen ? <MemoryDashboard /> : <></>
      }
      {
        personId !== "" ? <ChatAppsWindow /> : <></>
      }
      <ChatAssistant />
      {
        personId !== "" ? <MusicPlayerWindow /> : <></>
      }
      {
        personId !== "" ? <UtilityAppsCanvas /> : <></>
      }
      {
        personId !== "" ? <AIAssistantsCanvas /> : <></>
      }
      {
        isWebViewCanvasOpen ? <WebViewCanvas /> : <></>
      }
      {/* @ts-expect-error TS(2554): Expected 1 arguments, but got 0. */}
      <SpaceAppWindow partitionId={getPartitionId()}/>
      {
        isAddLaunchIconModalOpen ? <AddLaunchIconModalWindow /> : <></>
      }
      <EditLaunchIconModalWindow/>
      {
        isAddLinkModalOpen ? <AddLinkModalWindow /> : <></>
      }
      <EditLinkModalWindow />
      {
        isRunDockerModalOpen ? <RunDockerContainerModal /> : <></>
      }
      <NewDesktopModalWindow />
      <NewSessionModalWindow />
      <TerminateSessionModalWindow />
      <EditFavouritesGroupModal />
      {
        isRemoteLaunchModalOpen ? <CreateRemoteModalWindow /> : <></>
      }

      <WelcomeModalWindow />
      <FileSharingRequestModalWindow />
      <FileSharingResponseModalWindow />
      <CornerWebViewModal />
      {/* <TabTilesWindow /> */}
      {
        activeWindow.type === "browser" && false  ? <SideBar /> : <></>
      }
      {
        isWorkspacesEnabled ? <SpaceTopBar /> : <></>
      }
      {
        windowSideBar()
      }
      {
        tilesBar()
      }
      {
        verticalBar()
      }
      {
        bookmarks()
      }
      <ElectronHub />
      <WindowService />
      <WorkspaceHub />
      <CloudService />
      <ScreenshotManagerHub />
      <TabSwitchScreenshotHub />
      {
        version.includes("dev") ? <SyncHub /> : <></>
      }
      {
        // @ts-expect-error TS(2786): 'WebSocketHub' cannot be used as a JSX component.
        version.includes("dev") ? <WebSocketHub /> : <></>
      }

      {
        isSleepingTabsEnabled ? <TabSleeperHub /> : <></>
      }
    </div>
  </div>

  </>;
}

export default Home;
