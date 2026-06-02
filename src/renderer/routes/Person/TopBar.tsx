import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import { useNavigate } from 'react-router-dom';
import isElectron from 'is-electron';

import { userActions } from '../../store/user-slice';
import { workspaceActions } from '../../store/workspace-slice';
import { modalActions } from '../../store/modal-slice';
import { appActions } from '../../store/app-slice';
import { sessionActions } from '../../store/session-slice';

import { Platform } from '../../enum';

import { 
    Navbar,
    Button,
    Fade, 
    ListGroup,
    ListGroupItem,
    Alert,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
  } from 'reactstrap';

import { PersonCircle } from 'react-bootstrap-icons';

import WindowsActionsMenu from '../../components/WindowActionsMenu/WindowsActionsMenu';
import MacActionsMenu from '../../components/WindowActionsMenu/MacActionsMenu';
import './TopBar.css';

function TopBar(props: any) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const route = useSelector((state: any) => state.session.route);
    const signOut = useSelector((state: any) => state.user.signOut);
    const userName = useSelector((state: any) => state.user.name);
    const userEmail = useSelector((state: any) => state.user.email);
    const userId = useSelector((state: any) => state.user.id);
    const version = useSelector((state: any) => state.app.version);
    const platform = useSelector((state: any) => state.app.platform);
    const userState = useSelector((state: any) => state.user);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen((prevState) => !prevState);

    function onToggleDevTools(){
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "toggle-dev-tools",
            });
        }
    }

    function sendFeedback(){
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "send-feedback",
            });
        }
    }

    function logOut() {
        try {
            let _user = {
                id: "",
                email: "",
                name: "",
            };
            dispatch(userActions.setUser(_user));
            localStorage.setItem("user", JSON.stringify(_user));
            dispatch(workspaceActions.clearWorkspaces({}));
            dispatch(appActions.resetLimits({}));
            signOut();
            navigate('/');
        } catch (error) {
            log.error('error signing out: ', error);
        }
    }

    function quit(){
        dispatch(appActions.setSaveAndQuitState(true));
    }

    function userMenu(){
        return (
            <ListGroup horizontal className='open-windows mt-1'>
                <ListGroupItem> 
                    <Dropdown className="userMenu" isOpen={dropdownOpen} toggle={toggle}>
                        <DropdownToggle color="dark">
                            <PersonCircle size={24} />
                        </DropdownToggle>
                        <DropdownMenu dark>
                            {
                                route === "authenticated" && (
                                    <DropdownItem header>
                                        {userName}
                                    </DropdownItem>
                                )
                            }
                            
                            <DropdownItem onClick={sendFeedback} >
                                Share Feedback
                            </DropdownItem>
                            <DropdownItem divider />
                            <DropdownItem onClick={onToggleDevTools}>
                                Toggle Dev Tools
                            </DropdownItem>
                            {
                                route === 'authenticated' ? (
                                    <DropdownItem onClick={logOut} >
                                        Sign Out
                                    </DropdownItem>
                                ) : (
                                    <DropdownItem onClick={() => navigate('/login')} >
                                        Sign In
                                    </DropdownItem>
                                )
                            }
                            <DropdownItem onClick={quit} >
                                Quit
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </ListGroupItem>
                </ListGroup>
        )
    }

    return(
        <>
          <div className="drag-bar"></div>
          {
            platform === "" ? <></> : (platform === Platform.MacOS ? <></> : <WindowsActionsMenu />)
          }
          <div className="profiles-sp-navbar">
              <div className='logo'>
                
              </div>
              <Navbar className='sp-top navbar navbar-expand navbar-dark static-top'>
                {}
                <div className="row top-menus ml-3">
                  {}
                  <div className="col-3 d-flex justify-content-start">
                    
                  </div>
                  {}
                  <div className="col-6 d-flex justify-content-center">
                    
                  </div>
                  {}
                  <div className="col-3 d-flex justify-content-end">
                    
                  </div>
                </div>
              
              </Navbar>
          </div>
        </>
      );
}
    
export default TopBar;
