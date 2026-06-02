import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from "is-electron";
import { v4 as uuidv4 } from "uuid";
import log from "loglevel";

import { appActions } from "../../store/app-slice";

import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    ListGroup, 
    ListGroupItem, 
    Tooltip, 
    UncontrolledDropdown,
    Container,
    Row,
    Col,
    Spinner,
  } from "reactstrap";


import {
    ArrowUpRightCircleFill,
    DashCircleFill,
    XCircleFill,
    ArrowsFullscreen,
    XLg,
    XSquare,
    DashSquare,
    Fullscreen,
    X,
    DashLg,
    FullscreenExit,
    Square,
} from "react-bootstrap-icons";

import "./WindowsActionsMenu.css"



function WindowsActionsMenu(props: any) {
    const dispatch = useDispatch();
    const [cornerMenuId, setCornerMenuId] = useState("cornerMenu-main");
    const [isFullScreen, setIsFullScreen] = useState(false);


    function handleCloseWindow(){
        dispatch(appActions.setSaveAndQuitState(true));
    }

    function minimizeWindow(){
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "toggle-minimize",
            });
        }
    }

    function switchToFullScreen(){
        setIsFullScreen(!isFullScreen);
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "toggle-full-screen",
                tabId: props.tabId,
            });
        }
    }

    return (
        <div id={cornerMenuId} className="window-corner-menu-right">
        <ListGroup horizontal>
          
          <ListGroupItem>
            <div
              id={"minimize-main"}
              onClick={() => minimizeWindow()}
              className="action-button d-flex justify-content-center align-items-center"
            >
              <DashLg size={16}/>
            </div>
          </ListGroupItem>
          <ListGroupItem>
            <div
              id={"switch-fullscreen-main"}
              onClick={() => switchToFullScreen()}
              className="action-button d-flex justify-content-center align-items-center"
            >
              {isFullScreen ? <FullscreenExit size={14} /> : <Square size={14} />}
            </div>
          </ListGroupItem>
          <ListGroupItem>
            <div
              id={"close-main"}
              onClick={() => handleCloseWindow()}
              className="action-button d-flex justify-content-center align-items-center close-button"
            >
              <XLg size={16}/>
            </div>
          </ListGroupItem>
        </ListGroup>
      </div>
    )

}

export default WindowsActionsMenu;