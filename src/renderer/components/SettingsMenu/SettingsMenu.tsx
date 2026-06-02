import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import { useNavigate } from 'react-router-dom';
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

import { 
    Gear,
    BoxArrowRight, 
} from 'react-bootstrap-icons';

import PropTypes from 'prop-types';
import "./SettingsMenu.css"
import isElectron from 'is-electron';

function SettingsMenu(props: any){
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const route = useSelector((state: any) => state.session.route);

    
    const isLoggedIn = useSelector((state: any) => state.user.isLoggedIn);
    
    const userName = useSelector((state: any) => state.user.name);
    
    const userEmail = useSelector((state: any) => state.user.email);
    
    const userId = useSelector((state: any) => state.user.id);
    
    const version = useSelector((state: any) => state.app.version);

    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen((prevState) => !prevState);

    const toggleSettings = () => {
        dispatch(modalActions.toggleSettings({}));
    }

    function logOut() {
        try {
            //signOut();
            let _user = {
                id: "",
                email: "",
                name: "",
            }
            dispatch(
                userActions.setUser(_user)
            );
            localStorage.setItem("user", JSON.stringify(_user));
            dispatch(
                workspaceActions.clearWorkspaces({})
            );
            dispatch(appActions.setProfileId(""));
            dispatch(sessionActions.setLocation("profiles"));
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
        <Dropdown className="settings-menu-button" isOpen={dropdownOpen} toggle={toggle} direction='start'>
            <DropdownToggle color="dark">
                <Gear size={20}/>
            </DropdownToggle>
            <DropdownMenu dark>
                <DropdownItem header>
                    Settings
                </DropdownItem>
                <DropdownItem onClick={toggleSettings}>
                    Settings
                </DropdownItem>
                <DropdownItem onClick={onToggleDevTools}>
                    Toggle Dev Tools
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );

    return (
        <>
            <Button className="settings-menu-button" color="dark" onClick={toggleSettings}>
                <Gear color="white" size={18}/>
            </Button>
        </>
    );
    
}

SettingsMenu.propTypes = {
    direction: PropTypes.string,
};

export default SettingsMenu;