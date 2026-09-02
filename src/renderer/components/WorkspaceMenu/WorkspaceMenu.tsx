import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from 'react-router';
import log from 'loglevel';

import { modalActions } from '../../store/modal-slice';
import { appActions } from '../../store/app-slice';
import { workspaceActions } from '../../store/workspace-slice';
import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    UncontrolledDropdown
  } from 'reactstrap';
import * as Icon from 'react-feather';

import PropTypes from 'prop-types';
import SingInModalWindow from '../SignInModalWindow/SignInModalWindow';
import { WorkspaceService } from '../../services/workspace';
import { SpaceService } from '../../services/space';
import isElectron from 'is-electron';
import { sessionActions } from '../../store/session-slice';
import XAppService from '../../services/xapp';
import BrowserStateService from '../../services/browsers';
import ExportService from '../../services/export';
import { processWindows, processOpenTabsBeforePersist } from '../../services/window';

import "./WorkspaceMenu.css";
import SessionSwitchMenu from '../SessionSwitchMenu/SessionSwitchMenu';
import { UsersService } from '../../services/users';
import _ from 'lodash';

function WorkspaceMenu({
    direction,
    ...args
}: any){
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const route = useSelector((state: any) => state.session.route);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");


    const sessionStateData = useSelector((state: any) => state.session);

    const workspaceState = useSelector((state: any) => state.workspace);


    const personId = useSelector((state: any) => state.app.personId);

    const profile = useSelector((state: any) => state.app.selectedProfile);

    const userId = useSelector((state: any) => state.user.id);

    const version = useSelector((state: any) => state.app.version);

    const workspacesLimit = useSelector((state: any) => state.app.workspacesLimit);

    const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

    const workspaces = useSelector((state: any) => state.workspace.workspaces);

    const recentWorkspaces = useSelector((state: any) => state.workspace.recentWorkspaces);

    const selectedWorkspace = useSelector((state: any) => state.workspace.selectedWorkspace);


    const openWindows = useSelector((state: any) => state.session.openWindows);

    const browserWindows = useSelector((state: any) => state.session.browserWindows);

    const activeBrowserWindowId = useSelector((state: any) => state.session.activeBrowserWindowId);

    const activeDesktopWindows = useSelector((state: any) => state.session.activeDesktopWindows);

    const openTabs = useSelector((state: any) => state.session.openTabs);

    const windowTabs = useSelector((state: any) => state.session.windowTabs);

    const activeTabs = useSelector((state: any) => state.session.activeTabs);

    const activeWindow = useSelector((state: any) => state.session.activeWindow);

    const activeWindowId = useSelector((state: any) => state.session.activeWindowId);

    const activeWindowTabs = useSelector((state: any) => state.session.activeWindowTabs);

    const activeTab = useSelector((state: any) => state.session.activeTab);

    const activeTabId = useSelector((state: any) => state.session.activeTabId);

    const sessions = useSelector((state: any) => state.workspace.sessions);

    const currentSession = useSelector((state: any) => state.workspace.currentSession);

    const isInSession = useSelector((state: any) => state.session.isInSession);

    const isSessionsEnabled = useSelector((state: any) => state.settings.isSessionsEnabled);

    // Check if space is paused
    const isSpacePaused = SpaceService.isSpacePaused(selectedWorkspace.id, openTabs, openWindows);

    function toggle(){
        setDropdownOpen((prevState) => !prevState);
        setIsCurrentSpaceMenuOpen(false);
        setIsExportMenuOpen(false);
        setIsImportMenuOpen(false);
        setIsSpacesMenuOpen(false);
    }

    const toggleRenameSpaceModal = () => {
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(modalActions.toggleRenameSpaceModal());
        toggle();
    };

    const toggleArchiveSpaceModal = () => {
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(modalActions.toggleArchiveSpaceModal());
        toggle();
    };

    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
    const toggleSignInModal = () => setIsSignInModalOpen(!isSignInModalOpen);
    const [visibleWorkspaces, setVisibleWorkspaces] = useState([]);

    function toggleNewWorkspaceModal() {
        if(workspacesLimit > 0 && workspaces.length > (workspacesLimit-1)){
            setTimeout(() => {
                //alert("You have reached the maximum number of workspaces. Please sign in to create more workspaces.");
                // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                dispatch(modalActions.toggleUpgradeModalWindow());
            }, 100);
            return;
        }
        let _sessions = [];
        sessions.forEach((session) => {
            _sessions.push({
                id: session.id,
                name: session.name,
            });
        });

        let _openTabs = processOpenTabsBeforePersist(selectedWorkspace.id, openTabs);
        let _windows = processWindows(selectedWorkspace.id, openWindows, windowTabs, activeTabs, openTabs);
        WorkspaceService.saveState(selectedWorkspace.id,{
            desktop: selectedWorkspace.state.desktop,
            openWindows: _windows.openWindows,
            browserWindows: [],
            openTabs: _openTabs,
            windowTabs: _windows.windowTabs,
            activeDesktopWindows: activeDesktopWindows,
            activeTabs: _windows.activeTabs,
            activeTab: activeTab.type === "xapp" ? { id: "launchpad" } : activeTab,
            activeTabId: activeTab.type === "xapp" ? "launchpad" : activeTabId,
            activeWindow: activeWindow.type === "xapp" ? { id: "launchpad" } : activeWindow,
            activeWindowId: activeWindow.type === "xapp" ? "launchpad" : activeWindowId,
            activeWindowTabs: activeWindow.type === "xapp" ? [] : activeWindowTabs,
            activeBrowserWindowId: "",
            sessions: _sessions,
            currentSession: {},
          }).then((id) => {
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            dispatch(modalActions.toggleNewWorkspaceModal());
          }).catch((err) => {
              log.error("WorkspaceManu.saveWorkspace:",err);
          });

    }



    function onWorkspaceSelect(event){
        let _id = event.target.getAttribute("value");
        if(_id === selectedWorkspace.id){
            toggle();
            return;
        }
        log.debug("onWorkspaceSelect",openWindows);

        toggle();
        setTimeout(() => {
            setSelectedWorkspaceId(_id);
        }, 200);
    }

    useEffect(() => {
        if(selectedWorkspaceId === ""){
            return;
        }

        let _openTabs = processOpenTabsBeforePersist(selectedWorkspace.id, openTabs);
        let _sessions = [];
        sessions.forEach((session) => {
            _sessions.push({
                id: session.id,
                name: session.name,
            });
        });

        let _windows = processWindows(selectedWorkspace.id, openWindows, windowTabs, activeTabs, openTabs);

        WorkspaceService.saveState(selectedWorkspace.id,{
            desktop: selectedWorkspace.state.desktop,
            openWindows: _windows.openWindows,
            browserWindows: [],
            openTabs: _openTabs,
            windowTabs: _windows.windowTabs,
            activeDesktopWindows: activeDesktopWindows,
            activeTabs: _windows.activeTabs,
            activeTab: activeTab.type === "xapp" ? { id: "launchpad" } : activeTab,
            activeTabId: activeTab.type === "xapp" ? "launchpad" : activeTabId,
            activeWindow: activeWindow.type === "xapp" ? { id: "launchpad" } : activeWindow,
            activeWindowId: activeWindow.type === "xapp" ? "launchpad" : activeWindowId,
            activeWindowTabs: activeWindow.type === "xapp" ? [] : activeWindowTabs,
            activeBrowserWindowId: "",
            sessions: _sessions,
            currentSession: {},
        }).then((id) => {
            let _isOpen = workspaceState.recentWorkspaces[userId].find((workspace) => workspace.id === selectedWorkspaceId) ? true : false;
            if(_isOpen) {
                WorkspaceService.loadWorkspaceById(
                    dispatch,
                    selectedWorkspaceId,
                    workspaceState,
                    sessionStateData,
                    { restoreLastActive: true }
                );
                UsersService.setLastWorkspace(userId, selectedWorkspaceId);
                setSelectedWorkspaceId("");
                return;
            }
            let state = BrowserStateService.procesState(browserWindows, openWindows, windowTabs, activeTabs, openTabs, activeBrowserWindowId);
            BrowserStateService.closeExternalWindowsAndTabs(browserWindows, openTabs);
            BrowserStateService.getBrowserStateByWorkspaceId(selectedWorkspace.id).then((res: any) => {
                if(res){

                  BrowserStateService.updateBrowserState(res.id, state).then((res: any) => {
                    log.debug("updateBrowserState", res);
                  }).catch((err) => {
                    log.error(err);
                  });
                }else{
                  BrowserStateService.createBrowserState(selectedWorkspace.id, state).then((res: any) => {
                    log.debug("createBrowserState", res);
                  }).catch((err) => {
                    log.error(err);
                  });
                }
              }).catch((err) => {
                log.error(err);
              });

            XAppService.saveStateToSessionStorage(openWindows, openTabs, windowTabs, activeTabs);
            WorkspaceService.selectWorkspaceById(
                dispatch,
                selectedWorkspaceId,
                workspaceState,
                sessionStateData,
                { restoreLastActive: true }
            );
            UsersService.setLastWorkspace(userId, selectedWorkspaceId)
            setSelectedWorkspaceId("");
        }).catch((err) => {
            log.error("onWorkspaceSelect",err);
        });
    }, [selectedWorkspaceId]);

    useEffect(() => {
        log.debug("WorkspaceMenu.useEffect workspacesLimit:",workspacesLimit);
        if(workspacesLimit > 0){
            setVisibleWorkspaces(workspaces.slice(0, workspacesLimit));
        }else{
            setVisibleWorkspaces(workspaces);
        }
    }, [workspaces, route, workspacesLimit]);


    function saveWorkspace(){
        dispatch(appActions.setSaveState(true));
        toggle();
        return;
    }

    function pauseCurrentSpace(){
        dispatch(modalActions.openPauseSpaceModal({ workspaceId: null, defaultOption: null }));
        toggle();
    }

    function closeCurrentSpace(){
        dispatch(modalActions.openPauseSpaceModal({ workspaceId: null, defaultOption: "closeWithoutSaving" }));
        toggle();
    }

    function restartSession(){
        dispatch(modalActions.openRestartSessionModal());
        toggle();
    }

    async function resumeCurrentSpace(){
        try {
            // Use SpaceService to resume the paused session
            // This will merge with current state and delete the paused session from DB
            const resumed = await SpaceService.resumePausedSession(
                selectedWorkspace.id,
                sessionStateData,
                dispatch
            );
            
            if (!resumed) {
                // Fallback to regular resume if no paused session
                SpaceService.resumeSpace(selectedWorkspace.id, openTabs, openWindows, dispatch);
            }
            
            toggle();
        } catch (err) {
            log.error("Error resuming space:", err);
            // Fallback to regular resume
            SpaceService.resumeSpace(selectedWorkspace.id, openTabs, openWindows, dispatch);
            toggle();
        }
    }

    function exportWorkspace(){
        ExportService.exportWorkspace(selectedWorkspace.id, (data) => {
            log.debug("exportWorkspace",data);
            if(isElectron()){
                // @ts-expect-error
                window.electronAPI.send("toMain", {
                    action: "save-to-disk",
                    val: data,
                });
            }
        });
        toggle();
    }

    function onClearCache(){
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "clear-cache",
            });
        }
        alert("Cache Cleared");
        toggle();
    }

    function exportProfile(){
        ExportService.exportProfile(profile.id, (data) => {
            if(isElectron()){
                // @ts-expect-error
                window.electronAPI.send("toMain", {
                    action: "save-to-disk",
                    val: data,
                });
            }
        });
        toggle();
    }

    function importData(){
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "import-from-disk",
            });
        }
        toggle();
    }

    function onResetBrowser(){
        let _openWindows = Object.assign({}, openWindows);
        let _windowTabs = Object.assign({}, windowTabs);
        let _activeTabs = Object.assign({}, activeTabs);
        let _openTabs = Object.assign({}, openTabs);
        browserWindows.forEach((windowId) => {
            _windowTabs[windowId].forEach((tabId) => {
                delete _openTabs[tabId];
            });
            delete _openWindows[windowId];
            delete _windowTabs[windowId];
            delete _activeTabs[windowId];
        });

        dispatch(sessionActions.setOpenWindows({data: _openWindows}));
        dispatch(sessionActions.setOpenTabs({data: _openTabs}));
        dispatch(sessionActions.setBrowserWindows({data: []}));
        dispatch(sessionActions.setActiveBrowserWindowId({data: ""}));
    }

    const [isSpacesMenuOpen, setIsSpacesMenuOpen] = useState(false);
    function recents(){
        return (
            <>
                {
                    visibleWorkspaces.length > 1 && (
                                                <Dropdown disabled={isInSession} direction="end"  className='recentTasks' isOpen={isSpacesMenuOpen}
                            onMouseOver={() => {
                                setIsSpacesMenuOpen(true)
                            }}
                            onMouseOut={() => {
                                setIsSpacesMenuOpen(false)
                            }}
                        >
                            <DropdownToggle caret disabled={isInSession}>
                                Spaces&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </DropdownToggle>
                            <DropdownMenu dark>
                            {
                                visibleWorkspaces.map(workspace => (
                                                                                <DropdownItem key={workspace.id}
                                            onClick={(e) => onWorkspaceSelect(e)}
                                            value={workspace.id}
                                            active={workspace.id === selectedWorkspace.id}
                                            disabled={isInSession}
                                        >
                                            // @ts-expect-error TS(2339): Property 'name' does not exist on type 'never'.
                                            {workspace.name}
                                        </DropdownItem>
                                    )
                                )
                            }
                            </DropdownMenu>
                        </Dropdown>
                    )
                }

            </>
        );
    }

    const [isCurrentSpaceMenuOpen, setIsCurrentSpaceMenuOpen] = useState(false);
    function currentSpaceMenu(){
        return (
            <Dropdown
                // @ts-expect-error TS(2769): No overload matches this call.
                disabled={isInSession} direction="right" isOpen={isCurrentSpaceMenuOpen}
                className='recentTasks' onMouseOver={() => setIsCurrentSpaceMenuOpen(true)}
                onMouseLeave={() => setIsCurrentSpaceMenuOpen(false)}
                >
            <DropdownToggle caret disabled={isInSession}>
                Edit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </DropdownToggle>
            <DropdownMenu dark>
                <DropdownItem disabled={isInSession} onClick={toggleRenameSpaceModal}>
                    Rename
                </DropdownItem>
                {
                    selectedWorkspace.isDefault !== 1 && (
                        <DropdownItem onClick={toggleArchiveSpaceModal} disabled={isInSession}>
                            Delete
                        </DropdownItem>
                    )
                }
            </DropdownMenu>
        </Dropdown>
        )
    }

    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    function exportMenu(){
        return (
            <Dropdown
                // @ts-expect-error TS(2769): No overload matches this call.
                direction="right"  className='recentTasks' isOpen={isExportMenuOpen}
                onMouseOver={() => setIsExportMenuOpen(true)} onMouseLeave={() => setIsExportMenuOpen(false)}
                >
            <DropdownToggle caret disabled={isInSession}>
                Export&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </DropdownToggle>
            <DropdownMenu dark>
                <DropdownItem onClick={exportProfile} disabled={isInSession}>
                    All
                </DropdownItem>
                <DropdownItem onClick={exportWorkspace} disabled={isInSession}>
                    {selectedWorkspace.name}
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
        )
    }
    const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
    function importMenu(){
        return (
                        <Dropdown direction="end"  className='recentTasks' isOpen={isImportMenuOpen}
                onMouseOver={() => setIsImportMenuOpen(true)} onMouseLeave={() => setIsImportMenuOpen(false)}
            >
            <DropdownToggle caret disabled={isInSession}>
                Import&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </DropdownToggle>
            <DropdownMenu dark>
                <DropdownItem onClick={() => importData()} disabled={isInSession}>
                    From File
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
        )
    }

    return (
        <div id="spacesTopMenu" className='spacesTopMenu align-left'>
            <Dropdown className='ml-2' isOpen={dropdownOpen} toggle={toggle} direction={direction ? direction : "down"}>
                <DropdownToggle caret color="dark">
                    <span className="workspace-name">{selectedWorkspace.name}</span>
                    {isInSession && (
                        <span className="task-badge">{currentSession.name}</span>
                    )}
                </DropdownToggle>

                <DropdownMenu dark>
                    <DropdownItem header>
                        Session
                    </DropdownItem>
                    <DropdownItem onClick={() => restartSession()}>
                        Restart Session
                    </DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem header>
                        Space
                    </DropdownItem>
                    {isSpacePaused ? (
                        <DropdownItem onClick={() => resumeCurrentSpace()}>
                            Resume Space
                        </DropdownItem>
                    ) : (
                        <DropdownItem onClick={() => pauseCurrentSpace()}>
                            Pause Space
                        </DropdownItem>
                    )}
                    <DropdownItem onClick={() => closeCurrentSpace()} disabled={isInSession}>
                        Close Space
                    </DropdownItem>
                    {
                        // recents()
                    }
                    {
                        currentSpaceMenu()
                    }

                    {
                        version.includes("dev") && (
                            <>
                                <DropdownItem divider />
                                <DropdownItem header>
                                    Dev Only
                                </DropdownItem>
                                {importMenu()}
                                {exportMenu()}
                                <DropdownItem divider />
                                {/* @ts-expect-error TS(2322): Type '{ toggleParent: () => void; }' is not assign... Remove this comment to see the full error message */}
                                <SessionSwitchMenu toggleParent={toggle}/>
                                <DropdownItem divider />
                                <DropdownItem header>
                                    Dev Tools - (dev)
                                </DropdownItem>
                                <DropdownItem onClick={onClearCache}>
                                    Clear Space Cache
                                </DropdownItem>
                                <DropdownItem onClick={onResetBrowser}>
                                    Reset Space Browser
                                </DropdownItem>
                            </>
                        )
                    }
                </DropdownMenu>
            </Dropdown>
        </div>
    )
}

WorkspaceMenu.propTypes = {
    direction: PropTypes.string,
  };

export default WorkspaceMenu;
