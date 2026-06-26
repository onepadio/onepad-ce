import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import { useNavigate } from 'react-router-dom';

// Services
import ExportService from '../../services/export';
import { WorkspaceService } from '../../services/workspace';
import DesktopService from '../../services/desktop';
import AppService from '../../services/app';
import LinkService from '../../services/link';
import XAppService from '../../services/xapp';

// Reducers
import { userActions } from '../../store/user-slice';
import { workspaceActions } from '../../store/workspace-slice';
import { modalActions } from '../../store/modal-slice';
import { appActions } from '../../store/app-slice';
import { sessionActions } from '../../store/session-slice';
import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Button,
    ListGroup,
    ListGroupItem
  } from 'reactstrap';

import { Gear, PersonCircle, ThreeDotsVertical } from 'react-bootstrap-icons';

import PropTypes from 'prop-types';
import "./UserMenu.css"
import isElectron from 'is-electron';
import { USER_TYPE } from '../../model/user';
import { PersonsService } from '../../services/persons';
import { UsersService } from '../../services/users';
import { SpaceManager } from '../../model/SpaceManager';
import { passwordManagerActions } from '../../store/passwordmanager-slice';

import {
    processOpenTabsBeforePersist,
    processWindows,
  } from "../../services/window";

function UserMenu(props: any){
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const route = useSelector((state: any) => state.session.route);

    const isLoggedIn = useSelector((state: any) => state.user.isLoggedIn);

    const userState = useSelector((state: any) => state.user);

    const sessionState = useSelector((state: any) => state.session);

    const workspaceState = useSelector((state: any) => state.workspace);

    const userName = useSelector((state: any) => state.user.name);

    const userEmail = useSelector((state: any) => state.user.email);

    const userId = useSelector((state: any) => state.user.id);

    const version = useSelector((state: any) => state.app.version);

    const profile = useSelector((state: any) => state.app.selectedProfile);

    const profilesLimit = useSelector((state: any) => state.app.profilesLimit);

    const person = useSelector((state: any) => state.app.selectedPerson);


    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen((prevState) => !prevState);
    const [exportData, setExportData] = useState(undefined);

    const toggleSettings = () => {
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(modalActions.toggleSettings());
    }

    function logOut() {
        try {
            //signOut();
            let spaceManager = new SpaceManager();
            UsersService.getGuestUserByPerson(person.id).then((_user: any) => {
                dispatch(userActions.setUser({

                    id: _user.id,

                    email: _user.email,

                    name: _user.name,

                    userType: _user.type,
                }));
                // load workspaces by user
                // select active workspace if exist
                // if not select first workspace

                spaceManager.switchToUser(_user.id, dispatch, workspaceState, sessionState, (userId: any) => {
                    PersonsService.setActiveUser(person.id, userId);
                    log.debug("switched to user: ", userId);
                });
            });
        } catch (error) {
            log.error('error signing out: ', error);
        }

        return;
    }

    function signIn(){
        dispatch(modalActions.setOpenStripeModalWhenLoggedIn(false));
        dispatch(modalActions.setShowLoginPage(true));
    }

    function quit(){
        saveActiveWorkspace(() => {
            dispatch(appActions.setSaveAndQuitState(true));
        });
    }

    useEffect(() => {

    }, []);

    function checkForUpdates(){
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "check-for-updates",
            });
        }
    }

    function saveActiveWorkspace(oncomplete: any){
        let _openTabs = processOpenTabsBeforePersist(workspaceState.selectedWorkspace.id, sessionState.openTabs);
        let _sessions: any = [];
        workspaceState.sessions.forEach((session: any) => {
            _sessions.push({
                id: session.id,
                name: session.name,
            });
        });

        let _windows = processWindows(
            workspaceState.selectedWorkspace.id,
            sessionState.openWindows,
            sessionState.windowTabs,
            sessionState.activeTabs,
            sessionState.openTabs
        );

        WorkspaceService.saveState(workspaceState.selectedWorkspace.id, {
            desktop: workspaceState.selectedWorkspace.state.desktop,
            openWindows: _windows.openWindows,
            browserWindows: [],
            openTabs: _openTabs,
            windowTabs: _windows.windowTabs,
            activeDesktopWindows: sessionState.activeDesktopWindows,
            activeTabs: _windows.activeTabs,
            activeTab: { id: "launchpad" },
            activeTabId: "launchpad",
            activeWindow: { id: "launchpad" },
            activeWindowId: "launchpad",
            activeWindowTabs: [],
            activeBrowserWindowId: "",
            sessions: _sessions,
            currentSession: {},
        })
        .then((id) => {
            oncomplete();
        });
    }

    function profiles(){
        saveActiveWorkspace(() => {
            dispatch(userActions.setUserId(""));
            dispatch(appActions.setProfileId(""));
            dispatch(sessionActions.setLocation("profiles"));
            navigate('/');
        });
    }

    // @ts-expect-error TS(2393): Duplicate function implementation.
    function onToggleDevTools(){
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "toggle-dev-tools",
            });
        }
    }

    function sendFeedback(){
        alert("You can share your feedback with us by sending an email to contact@onepad.io");
    }

    function myAccount(){
        window.open("https://billing.stripe.com/p/login/test_7sI02Pfu6fxc5ZC3cc", "_blank");
    }

    function upgrade(){
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(modalActions.toggleUpgradeModalWindow());
    }

    function _exportProfile(){
        log.debug("exporting profile: ", profile);
        let _workspaces: any = [];
        let _xapps = {};
        log.debug("ExportService.exportByProfileId", profile.id);
        XAppService.getAllByProfileId(profile.id).then((__xapps) => {
            log.debug("ExportService.exportByProfileId __xapps", __xapps);
            _xapps = __xapps;

            WorkspaceService.getWorkspacesByProfileId(profile.id).then((__workspaces: []) => {
                log.debug("ExportService.exportByProfileId _workspaces", __workspaces);

                __workspaces.forEach((_workspace: any) => {
                    _workspace.bgImage = "";
                    DesktopService.getDesktopsByWorkspaceId(_workspace.id).then((_desktops) => {
                        _workspace.desktops = _desktops;
                        AppService.getAllByWorkspaceId(_workspace.id).then((_apps) => {
                            _workspace.apps = _apps;
                            LinkService.getAllByWorkspaceId(_workspace.id).then((_links) => {
                                _workspace.links = _links;
                                _workspaces.push(_workspace);

                                if(_workspaces.length === __workspaces.length){
                                    log.debug("ExportService.exportByProfileId _workspaces", _workspaces);
                                    log.debug("ExportService.exportByProfileId _xapps", _xapps);
                                    if(isElectron()){
                                        // @ts-expect-error
                                        window.electronAPI.send("toMain", {
                                            action: "save-to-disk",
                                            val: {
                                                workspaces: _workspaces,
                                                xapps: _xapps,
                                            },
                                        });
                                    }
                                }
                            });
                        });
                    });
                });

            });

        }).catch((error) => {
            log.error("ExportService.exportByProfileId error", error);
        });
    }

    function exportProfile(){
        ExportService.exportProfile(profile.id, (data: any) => {
            if(isElectron()){
                // @ts-expect-error
                window.electronAPI.send("toMain", {
                    action: "save-to-disk",
                    val: data,
                });
            }
        });
    }

    function importData(){
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "import-from-disk",
            });
        }
    }

    function userSignIn(){
        return (
            <>

                <DropdownItem divider />

                <DropdownItem header>
                    {userState.name} - (dev)
                </DropdownItem>
                {
                    userState.userType === USER_TYPE.USER ? (
                        <DropdownItem onClick={logOut}>
                            Sign Out
                        </DropdownItem>
                    ) : (
                        <DropdownItem onClick={signIn}>
                            Sign In
                        </DropdownItem>
                    )

                }

            </>
        )
    }

    function togglePasswordManager(){
        dispatch(passwordManagerActions.togglePasswordManager());
    }

    // @ts-expect-error TS(2393): Duplicate function implementation.
    function onToggleDevTools() {
        if (isElectron()) {
            // @ts-expect-error
            window.electronAPI.send("toMain", {
            action: "toggle-dev-tools",
            });
        }
    }

    useEffect(() => {
        log.debug("UserMenu useEffect", userState);
    }, [userState]);

    let userMenu = null;

    userMenu = (
        <Dropdown className="userMenu" isOpen={dropdownOpen} toggle={toggle} direction={props.direction} onMouseLeave={() => setDropdownOpen(false) }>
            <DropdownToggle color="dark">
                <Gear size={16}/>
            </DropdownToggle>
            <DropdownMenu dark>
                <DropdownItem onClick={toggleSettings}>
                    Settings
                </DropdownItem>

                {
                    version.includes("dev") && (
                        <DropdownItem onClick={togglePasswordManager}>
                            Passwords (dev)
                        </DropdownItem>
                    )
                }
                <DropdownItem divider />
                <DropdownItem header>
                    {person.name}
                </DropdownItem>
                <DropdownItem onClick={profiles} >
                    Switch Profile
                </DropdownItem>
                {
                    version.includes("dev") ? userSignIn() : null
                }
                <DropdownItem divider />
                {
                    isUpdateAvailable ? (
                        <DropdownItem>
                            Update and Restart
                        </DropdownItem>
                    ) : (
                        <DropdownItem onClick={() => checkForUpdates()}>
                            Check for Updates
                        </DropdownItem>
                    )
                }
                <DropdownItem onClick={sendFeedback} >
                    Share Feedback
                </DropdownItem>

                <DropdownItem onClick={quit} >
                    Quit
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );

    return userMenu;

}

UserMenu.propTypes = {
    direction: PropTypes.string,
};

export default UserMenu;
