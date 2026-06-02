import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import { useNavigate } from 'react-router-dom';
// Reducers
// @ts-expect-error
import { userActions } from '../../store/user-slice';
// @ts-expect-error
import { workspaceActions } from '../../store/workspace-slice';
// @ts-expect-error
import { modalActions } from '../../store/modal-slice';
// @ts-expect-error
import { appActions } from '../../store/app-slice';
// @ts-expect-error
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

import { PersonCircle } from 'react-bootstrap-icons';

import PropTypes from 'prop-types';
import "./UserMenu.css"
import isElectron from 'is-electron';

function UserMenu(props: any){
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const route = useSelector((state: any) => state.session.route);
    const signOut = useSelector((state: any) => state.user.signOut);
    const userName = useSelector((state: any) => state.user.name);
    const userEmail = useSelector((state: any) => state.user.email);
    const userId = useSelector((state: any) => state.user.id);
    const version = useSelector((state: any) => state.app.version);
    const userState = useSelector((state: any) => state.user);

    const isLoggedIn = useSelector((state: any) => state.user.isLoggedIn);

    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen((prevState) => !prevState);

    const toggleSettings = () => {
        dispatch(modalActions.toggleSettings());
    }

    function logOut() {
        try {
            signOut();
            let _user = {
                id: "",
                    email: "",
                    name: "",
              };
            dispatch(userActions.setUser(_user));
            localStorage.setItem("user", JSON.stringify(_user));
            
            dispatch(
                workspaceActions.clearWorkspaces({})
            );
            navigate('/');
        } catch (error) {
            log.error('error signing out: ', error);
        }
    }

    function quit(){
        dispatch(appActions.setSaveAndQuitState(true));
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
    
    function profiles(){
        dispatch(appActions.setProfileId(""));
        dispatch(sessionActions.setLocation("profiles"));
        navigate('/');
    }
    
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


    let userMenu = null;

    userMenu = (
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
                <DropdownItem onClick={toggleSettings}>
                    Settings
                </DropdownItem>
                {
                    isElectron() && (
                        <DropdownItem onClick={() => checkForUpdates()}>
                            Check for Updates
                        </DropdownItem>
                    )
                }
                {
                    isUpdateAvailable && (
                        <DropdownItem>
                            Update and Restart
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
                <DropdownItem onClick={profiles} >
                    Switch Profile
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
    );

    return userMenu;
    
}

UserMenu.propTypes = {
    direction: PropTypes.string,
};

export default UserMenu;