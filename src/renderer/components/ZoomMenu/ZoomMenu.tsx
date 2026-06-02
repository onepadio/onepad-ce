import React, { useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import isElectron from 'is-electron';

import { sessionActions } from '../../store/session-slice';

import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem
} from 'reactstrap';

import "./ZoomMenu.css";


function ZoomMenu(){
    const dispatch = useDispatch();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen((prevState) => !prevState);
    
    const zoomLevel = useSelector((state: any) => state.session.zoomLevel);

    function setZoomLevel(event: any){
        log.debug("setZoomLevel");
        dispatch(sessionActions.setZoomLevel(event.target.getAttribute("value")));
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "set-zoom-level",
                level: event.target.getAttribute("value")
            });
        }
    }

    return(
        <>
            <div className="zoom-menu">
                <Dropdown isOpen={dropdownOpen} toggle={toggle} direction='up'>
                    <DropdownToggle caret color="dark">
                        {zoomLevel*100}%
                    </DropdownToggle>
                    <DropdownMenu dark>
                    <DropdownItem value={0.25} onClick={(e) => setZoomLevel(e) } >
                        25%
                    </DropdownItem>
                    <DropdownItem value={0.50} onClick={(e) => setZoomLevel(e) }>
                        50%
                    </DropdownItem>
                    <DropdownItem value={0.75} onClick={(e) => setZoomLevel(e) }>
                        75%
                    </DropdownItem>
                    <DropdownItem value={1.00} onClick={(e) => setZoomLevel(e) }>
                        100%
                    </DropdownItem>
                    <DropdownItem value={1.25} onClick={(e) => setZoomLevel(e) }>
                        125%
                    </DropdownItem>
                    <DropdownItem value={1.50} onClick={(e) => setZoomLevel(e) }>
                        150%
                    </DropdownItem>
                </DropdownMenu>
                </Dropdown>
            </div>
        </>
    )
}

export default ZoomMenu;