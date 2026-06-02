import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';

import {SessionService} from '../../services/session';
import {WorkspaceService} from '../../services/workspace';

import { userActions } from '../../store/user-slice';
import { workspaceActions } from '../../store/workspace-slice';
import { modalActions } from "../../store/modal-slice";
import { sessionActions } from "../../store/session-slice";

import { processWindows, processOpenTabsBeforePersist } from '../../services/window';

import { 
    Dropdown,
    DropdownToggle,
    DropdownMenu, 
    DropdownItem,
    UncontrolledDropdown
  } from 'reactstrap';
import * as Icon from 'react-feather';
import { PauseCircle, Stopwatch } from "react-bootstrap-icons";

import PropTypes from 'prop-types';

import "./SessionSwitchMenu.css";
import BrowserStateService from '../../services/browsers';
import XAppService from '../../services/xapp';

function SessionSwitchMenu({
    direction,
    ...args
}: any){
    const dispatch = useDispatch();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    //const [sessions, setSessions] = useState([]);
    const toggle = () => setDropdownOpen((prevState) => !prevState);

    const workspaceState = useSelector((state: any) => state.workspace);

    const sessionState = useSelector((state: any) => state.session);
    
    const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
    
    const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
    
    const stateData = useSelector((state: any) => state.session);

    
    const sessions = useSelector((state: any) => state.workspace.sessions);
    
    const currentSession = useSelector((state: any) => state.workspace.currentSession);
    
    const isInSession = useSelector((state: any) => state.session.isInSession);

    const toggleNewSessionModalWindow = () => dispatch(modalActions.toggleNewSessionModalWindow({}));

    useEffect(() => {
        if(workspace.sessions){
            // setSessions(workspace.sessions);
        }
    }, [workspace]);

    async function saveWorkspace(){
        let _openTabs = processOpenTabsBeforePersist(workspace.id, stateData.openTabs);
        let _sessions = [];
        sessions.forEach((session: any) => {
            _sessions.push({
                id: session.id,
                name: session.name,
            });
        });
        let _windows = processWindows(
            workspace.id,
            stateData.openWindows, 
            stateData.windowTabs, 
            stateData.activeTabs, 
            stateData.openTabs
            );
        let workspaceId = await WorkspaceService.saveState(workspace.id,{
            desktop: workspace.state.desktop,
            openWindows: _windows.openWindows,
            browserWindows: [],
            openTabs: _openTabs,
            windowTabs: _windows.windowTabs,
            activeDesktopWindows: stateData.activeDesktopWindows,
            activeTabs: _windows.activeTabs,
            activeTab: stateData.activeTab.type === "xapp" ? { id: "launchpad" } : stateData.activeTab,
            activeTabId: stateData.activeTab.type === "xapp" ? "launchpad" : stateData.activeTabId,
            activeWindow: stateData.activeWindow.type === "xapp" ? { id: "launchpad" } : stateData.activeWindow,
            activeWindowId: stateData.activeWindow.type === "xapp" ? "launchpad" : stateData.activeWindowId,
            activeWindowTabs: stateData.activeWindow.type === "xapp" ? [] : stateData.activeWindowTabs,
            activeBrowserWindowId: "",
            sessions: _sessions,
            currentSession: {},
        });

        let state = BrowserStateService.procesState(
            stateData.browserWindows, stateData.openWindows, stateData.windowTabs, 
            stateData.activeTabs, stateData.openTabs, stateData.activeBrowserWindowId
            );
        BrowserStateService.closeExternalWindowsAndTabs(stateData.browserWindows, stateData.openTabs);
        BrowserStateService.getBrowserStateByWorkspaceId(workspace.id).then((res: any) => {
            if(res){
              
              BrowserStateService.updateBrowserState(res.id, state).then((res: any) => {
                log.debug("updateBrowserState", res);
              }).catch((err) => {
                log.error(err);
              });
            }else{
              BrowserStateService.createBrowserState(workspace.id, state).then((res: any) => {
                log.debug("createBrowserState", res);
              }).catch((err) => {
                log.error(err);
              });
            }
          }).catch((err) => {
            log.error(err);
          });

        XAppService.saveStateToSessionStorage(stateData.openWindows, stateData.openTabs, stateData.windowTabs, stateData.activeTabs);

    return workspaceId;
    }

    function onSessionSelect(_id){
        log.debug("onSessionSelect", _id);
        if(!_id || currentSession.id === _id){
            args.toggleParent();
            return;
        }
        dispatch(sessionActions.getBackToLaunchPad({data: {
            desktopId: desktop.id,
        }}));

        if(isInSession){
            SessionService.saveState(currentSession.id,stateData).then((id: any) => {
                log.debug("Session Saved");
                dispatch(sessionActions.endSession({}));
                dispatch(workspaceActions.setCurrentSession({}));
                // switch to session
                SessionService.getSession(_id).then((session: any) => {
                    log.debug("Session", session);
                    dispatch(workspaceActions.setCurrentSession(
                        {
                            
                            id: session.id,
                            
                            name: session.name,
                            
                            isolated: session.isolated,
                        }
                    ));
                
                    
                    SessionService.selectSessionById(dispatch, session.id);
                    dispatch(sessionActions.resumeSession({
                        
                        state: session.state
                    }));
                });
            
            }).catch((err) => {
                log.error("onSaveSession",err);
            });
        }else{
            saveWorkspace().then((workspaceId) => {
                SessionService.getSession(_id).then((session: any) => {
                    log.debug("Session", session);
                    dispatch(workspaceActions.setCurrentSession(
                        {
                            
                            id: session.id,
                            
                            name: session.name,
                            
                            isolated: session.isolated,
                        }
                    ));
                
                    
                    SessionService.selectSessionById(dispatch, session.id);
                    dispatch(sessionActions.resumeSession({
                        
                        state: session.state
                    }));
                });
            });
        }

        args.toggleParent();
        
    }

    function pauseSession(){
        // Save sesion state
        let _openTabs = Object.assign({},stateData.openTabs);
        Object.values(_openTabs).forEach((tab: any) => {
            let _tab = Object.assign({},tab);
            _tab.location = "main";
            _tab.sleeping = true;
            
            _openTabs[tab.id] = _tab;
        });
        SessionService.saveState(currentSession.id,stateData).then((id: any) => {
            log.debug("Session Saved");
            
            dispatch(sessionActions.endSession({}));
            dispatch(workspaceActions.setCurrentSession({}));
            // switch to workspace
            WorkspaceService.selectWorkspaceById(dispatch, workspace.id, workspaceState, sessionState);
        }).catch((err) => {
            log.error("onSaveSession",err);
        });
        args.toggleParent();
    }

    function endSession(){
        SessionService.deleteSession(currentSession.id).then(() => {
            log.debug("Session Deleted");
            dispatch(sessionActions.endSession({}));
            dispatch(workspaceActions.setCurrentSession({}));
            SessionService.getSessionsByWorkspaceId(workspace.id).then((sessions: any) => {
                dispatch(workspaceActions.setSessions({ data: sessions }));
            });
            // switch to workspace
            WorkspaceService.selectWorkspaceById(dispatch, workspace.id, workspaceState, sessionState);
        }
        ).catch((err) => {
            log.error("onSaveSession",err);
        });
    }

    function reload(){
        // Reload sessions
        SessionService.getSessionsByWorkspaceId(workspace.id).then((sessions) => {
            dispatch(workspaceActions.setSessions({ data: sessions }));
        });
    }

    // Apply https://www.youtube.com/watch?v=ZdNoyXqzCfw to replace the session with icon
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    function tasks(){
        return <>
            {
                sessions.length > 0 && (
                                        <Dropdown direction="end"  className='recentTasks' isOpen={isMenuOpen}
                        toggle={() => setIsMenuOpen(!isMenuOpen)} onMouseOver={() => setIsMenuOpen(true)} onMouseLeave={() => setIsMenuOpen(false)}
                    >
                    <DropdownToggle caret>
                        Tasks &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </DropdownToggle>
                    <DropdownMenu dark>
                        {
                            sessions.map((session) => <DropdownItem key={session.id}
                                onClick={() => onSessionSelect(session.id)}
                                value={session.id}
                                active={session.id === currentSession.id}
                            >   
                                {session.name}
                                {
                                    session.isolated ? "*" : null
                                }
                            </DropdownItem>
                            )
                        }
                    </DropdownMenu>
                    </Dropdown>
                )
            }
            
        </>;
    }
    function stopMenu(){
        return (
            
            <>
                <DropdownItem onClick={pauseSession}>
                    Pause
                </DropdownItem>
            </>
        );
    }

    return (
        <>
            <DropdownItem header>
                Tasks - (dev)
            </DropdownItem>
            {
        
                isInSession ? 
                <DropdownItem onClick={pauseSession}>
                    Pause
                </DropdownItem> : 
                <DropdownItem onClick={toggleNewSessionModalWindow}>
                    New
                </DropdownItem>
            
            }
            
            {
                tasks()
            }


{
        
        isInSession ?  
            <DropdownItem onClick={() => 
                {
                    args.toggleParent();
                    setTimeout(() => {
                        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                        dispatch(modalActions.toggleEndSessionModal());
                    }, 100);
                }
                }>
                Delete
            </DropdownItem> : <></>
    
    }
        </>
    )
}

SessionSwitchMenu.propTypes = {
    direction: PropTypes.string,
  };

export default SessionSwitchMenu;