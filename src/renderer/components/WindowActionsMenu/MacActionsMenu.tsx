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
} from "react-bootstrap-icons";

import "./MacActionsMenu.css"



function MacActionsMenu(props: any) {
    const dispatch = useDispatch();
    const [cornerMenuId, setCornerMenuId] = useState("cornerMenu-main");


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
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "toggle-full-screen",
                tabId: props.tabId,
            });
        }
    }

    return (
        <div id={cornerMenuId} className="window-corner-menu-left d-none">
        <ListGroup horizontal>
            <ListGroupItem>
            <div
              id={"close-main"}
              onClick={() => handleCloseWindow()}
            >
              <XCircleFill size={12} color="red" />
            </div>
          </ListGroupItem>
          <ListGroupItem className="ml-2">
            <div
              id={"minimize-main"}
              onClick={() => minimizeWindow()}
            >
              <DashCircleFill size={12} color="orange"/>
            </div>
          </ListGroupItem>
          <ListGroupItem className="ml-2">
            <div
              id={"switch-fullscreen-main"}
              onClick={() => switchToFullScreen()}
            >
              <ArrowUpRightCircleFill size={12} color="green"/>
            </div>
          </ListGroupItem>
        </ListGroup>
      </div>
    )

}

export default MacActionsMenu;