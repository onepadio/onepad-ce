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

import ProfileApi from "../../api/ProfileApi";

import {
    Button, Spinner,
} from "reactstrap";

import * as Icon from 'react-feather';
import clsx from "clsx";

import logoIcon from '../../images/icon_512x512_transparent.png';
import "./PersonsCatalog.css";
import "./FrostedDragBar.css";
import NewPersonModalWindow from "./NewPersonModal";
import DeleteProfileWarningModalWindow from "./DeleteProfileWarningModal";
import PINModalWindow from "./PINModal";
import Profile from "./Profle";
import { settingsActions } from "../../store/settings-slice";
import { modalActions } from "../../store/modal-slice";
import { db } from "../../repository/db";
import { generateUUID } from "three/src/math/MathUtils";
import { PersonsService } from "../../services/persons";
import { UsersService } from "../../services/users";
import { SpaceManager } from "../../model/SpaceManager";
import { USER_TYPE } from "../../model/user";
import { SessionStateFactory, WorkspaceStateFactory } from "../../model/state";

export default function PersonsCatalog() {
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
  const personId = useSelector((state) => state.app.personId);
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
    // If not running in Electron, version might be empty - use a default version
    const effectiveVersion = version || "1.0.999";
    
    log.debug("App.js: version", effectiveVersion);
    // split version to get the build number
    let _version = effectiveVersion.split(".");
    if(_version.length < 3) {
      // If version format is invalid, just load the data
      log.warn("Invalid version format, loading data anyway");
      // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
      db.persons.toArray().then((_persons) => {
        setPersons(_persons);
        setIsReady(true);
      }).catch((error) => {
        log.error("Error loading persons:", error);
        // Set ready anyway so the user can at least see the UI
        setIsReady(true);
      });
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(workspaceActions.reset());
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(sessionActions.reset());
      return;
    }
    
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
    }).catch((error) => {
      log.error("Error loading persons:", error);
      // Set ready anyway so the user can at least see the UI
      setIsReady(true);
    });
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(workspaceActions.reset());
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(sessionActions.reset());
  }, [version, minBuildNumber]);

  useEffect(() => {
    if(persons.length === 0) return;

  }, [persons]);

  useEffect(() => {
    log.debug("User ID: ", userId);
    dispatch(sessionActions.setLocation("profiles"));
    refreshData();
    if(userId !== "device"){
      //fetchProfiles();
    }
  }, [isLocal]);

  useEffect(() => {
    log.debug("User ID: ", userId);
    if(userId === "" || userId === undefined || personId === "" || personId === undefined ) return;

    let sm = new SpaceManager();
    let _workspaceState = WorkspaceStateFactory.create();
    let _sessionState = SessionStateFactory.create();
    sm.switchToUser(userId, dispatch, _workspaceState, _sessionState, (userId) => {
      log.debug("Switched to user: ", userId);
    });

  }, [personId, userId]);

  useEffect(() => {
    log.debug("Profile ID: ", profileId);
    if(profileId === "" || profileId === undefined) return;
    sessionStorage.clear();
    navigate("/spaces");

  }, [profileId]);

  function fetchProfiles(){
    ProfileApi.getProfilesByUser(userId).then((_profiles: []) => {
      log.debug("Profiles: ", _profiles);
      _profiles.forEach((p: any) => {
        ProfilesService.findByUId(p.id).then((p2) => {
          log.debug("Profile_: ", p2);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
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
          log.error("Error getting profile: ", error);
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
    PersonsService.getAll().then((_persons) => {
      // @ts-expect-error
      setPersons(_persons);
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
    PersonsService.delete(selectedPersonId).then(() => {
      log.debug("Profile deleted: ", selectedPersonId);
    });
    toggleDeleteProfileModal();
    refreshData();
  }

  function selectProfile(profileId){
    log.debug("Selecting profile: ", profileId);
    ProfilesService.get(profileId).then((profile) => {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      if(profile.sync && profile.sync === 1){
        log.debug("Profile sync enabled");
        dispatch(appActions.setSync(true));
      }else{
        log.debug("Profile sync disabled");
        dispatch(appActions.setSync(false));
      }
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
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
    ProfilesService.get(profileId).then((profile) => {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      if(profile.settings !== undefined ){
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        dispatch(settingsActions.setSpaceBrowserEnabled(profile.settings.isSpaceBrowserEnabled));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        dispatch(settingsActions.setAdvancedBackgroundEnabled(profile.settings.isAdvancedBackgroundEnabled));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        dispatch(settingsActions.setSplitWindowsEnabled(profile.settings.isSplitWindowsEnabled));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        dispatch(settingsActions.setSessionsEnabled(profile.settings.isSessionsEnabled));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        dispatch(settingsActions.setDesktopsEnabled(profile.settings.isDesktopsEnabled));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        dispatch(settingsActions.setWorkspacesEnabled(profile.settings.isWorkspacesEnabled));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        dispatch(settingsActions.setSharedAppsEnabled(profile.settings.isSharedAppsEnabled));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        dispatch(settingsActions.setDeveloperMode(profile.settings.isDeveloperMode));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        dispatch(settingsActions.setExternalWindowMode(profile.settings.isExternalWindowMode));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
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
    // get person
    // get user
    // set user data in redux
    log.debug("User ID: ", userId);
    PersonsService.get(personId).then((person) => {
      dispatch(appActions.setPersonId(personId));
      dispatch(appActions.setSelectedPerson(person));
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      if(person.activeUser){
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        UsersService.get(person.activeUser).then((_user) => {
          dispatch(userActions.setUser({
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            id: _user.id,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            email: _user.email,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            name: _user.name,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            userType: _user.type,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            uid: _user.type === USER_TYPE.GUEST ? "" : _user.uid,
          }));
          // Navigate to spaces after setting user
          navigate("/spaces");
        });
      }else{
        UsersService.getGuestUserByPerson(personId).then((_user) => {
          dispatch(userActions.setUser({
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            id: _user.id,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            email: _user.email,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            name: _user.name,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            userType: _user.type,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            uid: _user.type === USER_TYPE.GUEST ? "" : _user.uid,
          }));
          // Navigate to spaces after setting user
          navigate("/spaces");
        });
      }
    });

  }

  function personItem(person){
    return person ? (<Profile key={person.id+generateUUID()} name={person.name} sync={false} id={person.id} onDelete={selectProfileToDelete} onSelect={onPersonSelect} />) :  (
      <></>
    );

}

  return (
    <>
      <div className="frosted-drag-bar" />
      <NewPersonModalWindow isOpen={showAddProfileModal} onClose={onNewProfileWindowClose} />
      <DeleteProfileWarningModalWindow isOpen={showDeleteProfileModal} onClose={onDeleteProfileWindowClose} onConfirm={deleteProfile} />
      <PINModalWindow isOpen={showPINModal} onClose={onPINModalWindowClose} onSuccess={onPINSuccess} profileId={selectedPersonId} />
      <div className='d-flex justify-content-center mt-3 logo-container'>
          <img width={96} src={logoIcon} alt="logo" />
      </div>
      <div className="profiles">

          <div className="container-fluid">
          {
            isReady && (
                            <div className="row d-flex justify-content-center mb-2">
                <h3> Who's using OnePad? </h3> <br />
                <span className="text-white">
                  With OnePad profiles you can separate all of your stuff. Create
                  profiles for friends and family, or split between work and fun.
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
