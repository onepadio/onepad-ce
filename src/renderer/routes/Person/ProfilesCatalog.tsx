import { useNavigate, useLocation } from "react-router";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import isElectron from "is-electron";

import { appActions } from "../../store/app-slice";
import { sessionActions } from "../../store/session-slice";
import { userActions } from "../../store/user-slice";
import { workspaceActions } from "../../store/workspace-slice";

import { ProfilesService } from "../../services/profiles";
import { WorkspaceService } from "../../services/workspace";
import DesktopService from "../../services/desktop";
import XAppService from "../../services/xapp";

import ProfileApi from "../../api/ProfileApi";

import logoIcon from '../../images/512x512.png';
import {
    Button, Spinner,
} from "reactstrap";

import * as Icon from 'react-feather';
import clsx from "clsx";

import "./ProfilesCatalog.css";
import NewProfileModalWindow from "./NewProfileModal";
import DeleteProfileWarningModalWindow from "./DeleteProfileWarningModal";
import PINModalWindow from "./PINModal";
import Profile from "./Profle";
import TopBar from "./TopBar";
import { settingsActions } from "../../store/settings-slice";
import { modalActions } from "../../store/modal-slice";
import { db } from "../../repository/db";
import { generateUUID } from "three/src/math/MathUtils";

export default function ProfilesCatalog() {
  const route = useSelector((state: any) => state.session.route);
  const user = useSelector((state: any) => state.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  let from = location.state?.from?.pathname || "/";

  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const sessionStateData = useSelector((state) => state.session);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const workspaceState = useSelector((state) => state.workspace);

  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const version = useSelector((state) => state.app.version);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const minBuildNumber = useSelector((state) => state.app.minBuildNumber);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const favourites = useSelector((state) => state.session.favourites);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const profileId = useSelector((state) => state.app.profileId);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const userState = useSelector((state) => state.user);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const userId = useSelector((state) => state.user.id);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const userName = useSelector((state) => state.user.name);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const userEmail = useSelector((state) => state.user.email);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const product = useSelector((state) => state.user.product);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const profilesLimit = useSelector((state) => state.app.profilesLimit);

  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const toggleAddProfileModal = () => setShowAddProfileModal(!showAddProfileModal);

  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);
  const toggleDeleteProfileModal = () => setShowDeleteProfileModal(!showDeleteProfileModal);

  const [showPINModal, setShowPINModal] = useState(false);
  const togglePINModal = () => setShowPINModal(!showPINModal);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const [profiles, setProfiles] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [isLocal, setIsLocal] = useState(false);

  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
  const [persons, setPersons] = useState([]);


  useEffect(() => {
    if(version === "") return;
    log.debug("App.js: version", version);
    // split version to get the build number
    let _version = version.split(".");
    if(_version.length < 3) return;
    let _buildNumber = 0;
    if(_version.length > 2){
      let _buildNumberS = _version[2];
      // clear dev beta in version
      if(_version[2].includes("-")){
        _buildNumberS = _version[2].split("-")[0];
      }
      _buildNumber = parseInt(_buildNumberS);
    }
    if(_buildNumber < minBuildNumber){
      log.debug("App.js: version is less than minBuildNumber");
      setUpgradeNeeded(true);
      setIsReady(true);
      return;
    }

    // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
    db.persons.toArray().then((_persons) => {
      setPersons(_persons);
      setIsReady(true);
  })
  }, [version, minBuildNumber]);

  useEffect(() => {
    if(persons.length === 0) return;

  }, [persons]);

  function step1(){
    if (route === "authenticated" && (profilesLimit > 1 || profilesLimit < 0)) {
      const _name = user.attributes.email.split("@")[0];
      let _user = {
        id: user.username,
        email: user.attributes.email,
        name: _name,
      };
      dispatch(userActions.setUser(_user));
      dispatch(appActions.setProfileId(""));
      setIsReady(true);
      setShowProfiles(true);
    }else{
      let _userId = route === "authenticated" ? user.username : "device";
      ProfilesService.getAllByUserId(_userId).then((_profiles) => {
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        if(_profiles.length > 0){
          let _profile = _profiles[0];
          ProfilesService.get(_profile.id).then((profile) => {
              // @ts-expect-error TS(2571): Object is of type 'unknown'.
              if(profile.settings !== undefined ){
                  dispatch(settingsActions.setSpaceBrowserEnabled(_profile.settings.isSpaceBrowserEnabled));
                  dispatch(settingsActions.setAdvancedBackgroundEnabled(_profile.settings.isAdvancedBackgroundEnabled));
                  dispatch(settingsActions.setSplitWindowsEnabled(_profile.settings.isSplitWindowsEnabled));
                  dispatch(settingsActions.setSessionsEnabled(_profile.settings.isSessionsEnabled));
                  dispatch(settingsActions.setDesktopsEnabled(_profile.settings.isDesktopsEnabled));
                  dispatch(settingsActions.setWorkspacesEnabled(_profile.settings.isWorkspacesEnabled));
                  dispatch(settingsActions.setSharedAppsEnabled(_profile.settings.isSharedAppsEnabled));
                  dispatch(settingsActions.setDeveloperMode(_profile.settings.isDeveloperMode));
                  dispatch(settingsActions.setExternalWindowMode(_profile.settings.isExternalWindowMode));
                  dispatch(settingsActions.setEfficiencyModeEnabled(_profile.settings.isEfficiencyModeEnabled));
              }
              setTimeout(() => {
                dispatch(appActions.setSelectProfile(_profile));
                dispatch(appActions.setProfileId(_profile.id));
              }
              , 1000);
          });
        }else{
          // create profile
          // @ts-expect-error TS(2554): Expected 2-4 arguments, but got 5.
          ProfilesService.save(_userId, "Profile-1", "", {}, 0).then((id) => {
            log.debug("Profile saved: ", id);
            ProfilesService.get(id).then((__profile) => {
              setTimeout(() => {
                dispatch(appActions.setSelectProfile(__profile));
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                dispatch(appActions.setProfileId(__profile.id));
              }
              , 1000);
            });
          }).catch((error) => {
            log.debug("Error saving profile: ", error);
          });
        }

      });
    }
  }

  useEffect(() => {
    log.debug("User ID: ", userId);
    dispatch(sessionActions.setLocation("profiles"));
    refreshData();
    if(userId !== "device"){
      //fetchProfiles();
    }
  }, [isLocal]);

  useEffect(() => {
    log.debug("Profile ID: ", profileId);
    if(profileId === "") return;
    sessionStorage.clear();

    WorkspaceService.getWorkspacesByProfileId(profileId).then((workspaces) => {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      if(workspaces.length === 0){
        // @ts-expect-error TS(2554): Expected 7-8 arguments, but got 5.
        WorkspaceService.newWorkspace("Default", true, false, true, profileId).then((workspaceId) => {
          WorkspaceService.getWorkspacesByProfileId(profileId).then((workspaces) => {
            log.debug("Workspaces", workspaces);
            dispatch(workspaceActions.setWorkspaces({
              workspaces: workspaces
            }));
          }).catch((error) => {
            log.debug("Error getting workspaces", error);
          });
          dispatch(userActions.setDefaultWorkspace({ id: workspaceId }));
          DesktopService.newDesktop("Default", workspaceId, true).then((desktop) => {
            WorkspaceService.selectWorkspaceById(dispatch, workspaceId, workspaceState, sessionStateData).then(() => {
              log.debug("Default workspace ready...");
              dispatch(sessionActions.setLocation("launchpad"));
              localStorage.setItem("activeProfileId", profileId);
              navigate("/home");
            });
          });
        });
      }else{
        log.debug("Workspaces", workspaces);
        dispatch(workspaceActions.setWorkspaces({
          workspaces: workspaces
        }));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        workspaces.forEach((workspace) => {
          if(workspace.isDefault === 1){
            log.debug("Default workspace found...", workspace);
            WorkspaceService.selectWorkspaceById(dispatch, workspace.id, workspaceState, sessionStateData).then(() => {
              log.debug("Default workspace ready...");
              dispatch(sessionActions.setLocation("launchpad"));
              localStorage.setItem("activeProfileId", profileId);
              navigate("/home");
            });
          }
        });
      }
    });

    XAppService.getAllByProfileId(profileId).then((xapps) => {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      dispatch(appActions.setXApps(xapps.reverse() || []));
      let _xappsStore = {};
      let _xappIds = [];
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      xapps.forEach((xapp) => {
        _xappsStore[xapp.id] = xapp;
        _xappIds.push(xapp.id);
      });
      if(localStorage.getItem("xappIds-"+profileId) === null){
        localStorage.setItem("xappIds-"+profileId, JSON.stringify(_xappIds));
      }
      dispatch(appActions.setXAppsStore(_xappsStore));
    }).catch((error) => {
      log.debug("Error getting xapps", error);
    });

  }, [profileId]);

  function fetchProfiles(){
    ProfileApi.getProfilesByUser(userId).then((_profiles: []) => {
      log.debug("Profiles: ", _profiles);
      _profiles.forEach((p: any) => {
        ProfilesService.findByUId(p.id).then((p2: any) => {
          log.debug("Profile_: ", p2);

          if(p2.length === 0){
            // @ts-expect-error TS(2554): Expected 2-4 arguments, but got 6.
            ProfilesService.save(userId, p.name, "", {}, 1, p.id).then((id) => {
              log.debug("Profile saved: ", id);
            }).catch((error) => {
              log.debug("Error saving profile: ", error);
            });
            refreshData();
          }
        }).catch((error) => {
          log.debug("Error getting profile: ", error);
        });
      });

    });
  }

  function toggleUser(switchTo){

    let _user = {
      id: "device",
      email: "",
      name: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).email : "",
    }
    if(switchTo === "user" && user){
      const _name = user.attributes.email.split("@")[0];
      _user = {
        id: user.username,
        email: user.attributes.email,
        name: _name,
      };

    }
    dispatch(userActions.setUser(_user));
    if(switchTo === "device"){
      setIsLocal(true);
    }else{
      setIsLocal(false);
    }
  }

  function handleAddProfile(){

    if(profilesLimit < 0 || profiles.length < profilesLimit){
      if(isLocal){
        dispatch(modalActions.setNewProfileType("local"));
      }else{
        dispatch(modalActions.setNewProfileType("user"));
      }
      toggleAddProfileModal();
    }else{
      // window.open("https://buy.stripe.com/test_eVacNZ8i5bRigMw7ss", "_blank");
      if(isElectron()){
        // @ts-expect-error
        window.electronAPI.send("toMain", {
            action: "open-modal",
            url: "https://buy.stripe.com/test_eVacNZ8i5bRigMw7ss",
        });
      }
    }
  }

  function onNewProfileWindowClose(){
    toggleAddProfileModal();
    refreshData();
  }

  function onDeleteProfileWindowClose(){
    toggleDeleteProfileModal();
    refreshData();
  }

  function onPINModalWindowClose(){
    togglePINModal();
  }

  function refreshData(){
    log.debug("Refreshing data...");
    let _profilesMap = {};
    let _userId = isLocal ? "device" : userId;
    ProfilesService.getAllByUserId(_userId).then((_profiles) => {
      log.debug("Profiles: ", _profiles);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      _profiles.forEach((profile) => {
        _profilesMap[profile.id] = profile;
      });
      // @ts-expect-error
      setProfiles(_profiles);
      setProfilesMap(_profilesMap);
    });

    if(localStorage.getItem("activeProfileId") !== null){
      //dispatch(appActions.setProfileId(localStorage.getItem("activeProfileId")));
    }
  }

  function selectProfileToDelete(personId){
    setSelectedPersonId(personId);
    toggleDeleteProfileModal();
  }

  function deleteProfile(){
    //ProfilesService.delete(selectedProfileId).then(() => {
    //  log.debug("Profile deleted");
    //}
    //).catch((error) => {
    //  log.error("Error deleting profile: ", error);
    //});
    // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
    db.persons
    .toggleDeleteProfileModal();
    refreshData();
  }

  function selectProfile(profileId){
    log.debug("Selecting profile: ", profileId);
    ProfilesService.get(profileId).then((profile: any) => {

      if(profile.sync && profile.sync === 1){
        log.debug("Profile sync enabled");
        dispatch(appActions.setSync(true));
      }else{
        log.debug("Profile sync disabled");
        dispatch(appActions.setSync(false));
      }

      if(profile.passCode.length > 0){
        setSelectedPersonId(profileId);
        togglePINModal();
      }else{
        //window.electronAPI.send("toMain", {
        //  action: "switch-profile",
        //  id: profileId,
        //});

        dispatch(appActions.setProfileId(profileId));
        dispatch(appActions.setSelectProfile(profile));
        loadSettings(profileId);
      }
    });
  }

  function onPINSuccess(){
    log.debug("PIN success");
    setShowPINModal(false);
    dispatch(appActions.setPersonId(selectedPersonId));
    loadSettings(selectedPersonId);
    //window.electronAPI.send("toMain", {
    //  action: "switch-profile",
    //  id: selectedProfileId,
    //});
  }

  function loadSettings(profileId){
    ProfilesService.get(profileId).then((profile: any) => {
      if(profile.settings !== undefined ){

        dispatch(settingsActions.setSpaceBrowserEnabled(profile.settings.isSpaceBrowserEnabled));
        dispatch(settingsActions.setAdvancedBackgroundEnabled(profile.settings.isAdvancedBackgroundEnabled));
        dispatch(settingsActions.setSplitWindowsEnabled(profile.settings.isSplitWindowsEnabled));
        dispatch(settingsActions.setSessionsEnabled(profile.settings.isSessionsEnabled));
        dispatch(settingsActions.setDesktopsEnabled(profile.settings.isDesktopsEnabled));

        dispatch(settingsActions.setWorkspacesEnabled(profile.settings.isWorkspacesEnabled));

        dispatch(settingsActions.setSharedAppsEnabled(profile.settings.isSharedAppsEnabled));

        dispatch(settingsActions.setDeveloperMode(profile.settings.isDeveloperMode));

        dispatch(settingsActions.setExternalWindowMode(profile.settings.isExternalWindowMode));

        dispatch(settingsActions.setEfficiencyModeEnabled(profile.settings.isEfficiencyModeEnabled));
      }
    });

  }

  function checkForUpdates(){
    if(isElectron()){
        // @ts-expect-error
        window.electronAPI.send("toMain", {
            action: "check-for-updates",
        });
    }
  }

  function onPersonSelect(personId){
    dispatch(appActions.setPersonId(personId));
  }

  function personItem(person){
    return person ? (<Profile key={person.id+generateUUID()} name={person.name} sync={false} id={person.id} onDelete={selectProfileToDelete} onSelect={onPersonSelect} />) :  (
      <></>
    );

}

  return (
    <>
      <NewProfileModalWindow isOpen={showAddProfileModal} onClose={onNewProfileWindowClose} />
      <DeleteProfileWarningModalWindow isOpen={showDeleteProfileModal} onClose={onDeleteProfileWindowClose} onConfirm={deleteProfile} />
      <PINModalWindow isOpen={showPINModal} onClose={onPINModalWindowClose} onSuccess={onPINSuccess} profileId={selectedPersonId} />
      <TopBar showProfiles={showProfiles} />
      <div className="profiles">
                <div className="container-fluid">
          <div className='mb-3 d-flex justify-content-center'>
              <img width={96} src={logoIcon} alt="logo" />
          </div>
          {
            isReady && !upgradeNeeded && (
                            <div className="row d-flex justify-content-center mb-2">
                <h3> Who's using OnePad? </h3> <br />
                <span className="text-muted d-none">
                  With OnePad profiles you can separate all of your stuff. Create
                  profiles for friends and family, or split between work and fun.
                </span>
              </div>
            )
          }

          {
            isReady && upgradeNeeded && (
              <div className="row d-flex justify-content-center mb-2">
                <span>
                  Your version of OnePad is out of date. Please update to the latest version.
                </span>
                <Button className="mt-3 updateButton" color="dark" onClick={checkForUpdates}>
                  Update
                </Button>
                <span className="mt-3">
                  or visit <a href="https://onepad.io" target="_blank" rel="noreferrer">onepad.io</a> to download the latest version.
                </span>
              </div>
            )
          }

          {
            !isReady && (
              <div className="row d-flex justify-content-center">
                <div className='mt-3 d-flex justify-content-center'>
                    <Spinner color='light' />
                </div>
              </div>
            )
          }

          {
            isReady && (
                            <div id="profilesList" className="row profile-list">
                <div className="col-12 d-flex justify-content-center">
                  <div className="row w-100">
                    {
                      persons.map((person) => personItem(person))
                    }

                                        <div id="addProfileButton" className="col-6 col-md-3 col-lg-2 addProfileButton">
                                                <div className="card p-3 text-center" onClick={() => handleAddProfile() }>
                            <br />
                            <div className="d-flex justify-content-center">
                                <Button
                                    width={72}
                                    height={72}
                                    className={clsx(
                                        "addButton transition-colors rounded-circle",
                                    )}
                                    title="Add Profile"
                                >
                                    <Icon.Plus size={36} />
                                </Button>
                                <div className="icon-middle">
                                    <div className="icon-text">Add Profile</div>
                                </div>
                            </div>

                            <div>
                                <br />
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        </div>
      </div>
    </>
  );
}
