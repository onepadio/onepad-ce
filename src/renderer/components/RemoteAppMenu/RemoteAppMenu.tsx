import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ReactSVG } from "react-svg";
import log from 'loglevel';
import {
  Activity,
  ArrowClockwise,
  ArrowUpRightCircle,
  BoxArrowUp,
  ChevronLeft,
  ChevronRight,
  Clouds,
  DashCircle,
  Display,
  PauseCircle,
  PlayCircle,
  Search,
  Share,
  StopCircle,
  Window,
  XCircle,
} from "react-bootstrap-icons";
import { Button, Tooltip } from "reactstrap";
import WaffleMenuIcon from "../Icons/WaffleMenuIcon";
import { toggleLaunchPad } from "../LaunchPadLocal/LaunchPadLocal";
import { windowServiceActions } from "../../store/window-service-slice";

import { getProcessesByUser, stopProcess } from "../../api/ProcessApi";

import "./RemoteAppMenu.css";
import { modalActions } from "../../store/modal-slice";
import { EyeOff } from "react-feather";
import isElectron from "is-electron";

function RemoteAppMenu() {
  const dispatch = useDispatch();
  
  const user = useSelector((state: any) => state.user);
  
  const openWindows = useSelector((state: any) => state.session.openWindows);
  
  const activeWindow = useSelector((state: any) => state.session.activeWindow);
  
  const activeTab = useSelector((state: any) => state.session.activeTab);
  const activeWindowTabs = useSelector(
    
    (state: any) => state.session.activeWindowTabs
  );

  const [disabled, setDisabled] = useState(false);
  const [onElement, setOnElement] = useState("");
  const [tooltipOpen, setTooltipOpen] = useState(true);
  const toggle = () => setTooltipOpen(!tooltipOpen);

  function reload() {
    // webview.reload();
    // get active tab
    let _webviewId = "webview-" + activeTab.id;
    let _webview = document.getElementById(_webviewId);
    // @ts-expect-error
    if (_webview) _webview.reload();
  }

  function close() {
    if(activeWindow.type === "browser"){
      dispatch(windowServiceActions.closeBrowser(activeWindow.id));
    }else{
      dispatch(windowServiceActions.closeWindow(activeWindow.id));
    }
  }

  function showElement(elementId: any) {
    //let wsname = document.getElementById(elementId);
    //wsname.classList.remove("d-none");
    setOnElement(elementId);
  }

  function hideElement(elementId: any) {
    setOnElement("");
  }

  function sleepWindow() {
    if(activeTab.type === "remote") {
      if (user && user.uid) {
        let _res = window.confirm("You're stopping a remote process. Are you sure?");
        if(_res) {
          stopProcess(user.uid, activeWindow.id).then((response: any) => {
            log.debug(response);
            if(response.ResponseMetadata.HTTPStatusCode === 200) {
              dispatch(windowServiceActions.stoppedRemoteProcess(activeWindow.id));
              // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
              dispatch(modalActions.toggleRemoteTaskManager());
            }
          });
        }
      }
    }else{
        dispatch(windowServiceActions.sleepWindow(activeWindow.id));
    }
  }

  function openInNewWindow() {
    dispatch(
        windowServiceActions.moveTabToExternalWindow(activeTab.id)
    );
  }

  function copyToClipboard(){
    if(isElectron()){
        // @ts-expect-error
        window.electronAPI.send("toMain", {
            action: "clipboard",
            text: activeTab.state.url,
        });
        alert(activeTab.state.url + " web link copied to clipboard.");
    }
  }

  useEffect(() => {
    if (activeTab.id === "launchpad") {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [activeTab, activeWindow]);

  return (
    <>
      <Button
        id="desktop-button"
        className="btn btn-primary d-none"
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        onMouseEnter={() => dispatch(modalActions.toggleGlobalAppsModal())}
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        onMouseLeave={() => dispatch(modalActions.toggleGlobalAppsModal())}
      >
        <Display color="white" size={20} />
        {onElement === "desktops" ? (
          <Tooltip isOpen={true} target={"desktop-button"} toggle={toggle}>
            Remote Desktops
          </Tooltip>
        ) : (
          <></>
        )}
      </Button>
      <Button
        id="launchpad-button"
        className="btn btn-primary d-none"
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        onMouseLeave={() => dispatch(modalActions.hideLaunchPad())}
        // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
        onMouseEnter={() => toggleLaunchPad(dispatch)}
      >
        {}
        <WaffleMenuIcon color="white" size={18} />
        {onElement === "launchpad" ? (
          <Tooltip isOpen={true} target={"launchpad-button"} toggle={toggle}>
            Launchpad
          </Tooltip>
        ) : (
          <></>
        )}
      </Button>
      <Button
        id={"reload-button"}
        className="btn btn-primary d-none"
        onClick={() => reload()}
        disabled={disabled}
        onMouseEnter={() => showElement("reload")}
        onMouseLeave={() => hideElement("reload")}
      >
        <ArrowClockwise color="white" size={20} />
        {onElement === "reload" ? (
          <Tooltip isOpen={true} target={"reload-button"} toggle={toggle}>
            Reload
          </Tooltip>
        ) : (
          <></>
        )}
      </Button>
      <Button
        id={"open-in-new-window-button"}
        className="btn btn-primary d-none"
        onClick={() => openInNewWindow()}
        disabled={disabled}
        onMouseEnter={() => showElement("open-in-new-window")}
        onMouseLeave={() => hideElement("open-in-new-window")}
      >
        <Window color="white" size={20} />
        {onElement === "open-in-new-window" ? (
          <Tooltip
            isOpen={true}
            target={"open-in-new-window-button"}
            toggle={toggle}
          >
            {activeTab.type === "remote" ? "Open in New Window" : "Open Tab in New Window"}
            
          </Tooltip>
        ) : (
          <></>
        )}
      </Button>
      <Button
        className="btn btn-primary d-none"
        onClick={() => copyToClipboard()}
        disabled={disabled}
      >
        <BoxArrowUp color="white" size={20} />
      </Button>
      {openWindows[activeWindow.id] && openWindows[activeWindow.id].sleeping ? (
        <Button
          id={"start-button"}
          className="btn btn-primary"
          onClick={() => {}}
          disabled={disabled}
          onMouseEnter={() => showElement("start")}
          onMouseLeave={() => hideElement("start")}
        >
          <PlayCircle color="white" size={20} />
          {onElement === "start" ? (
            <Tooltip isOpen={true} target={"start-button"} toggle={toggle}>
              Start
            </Tooltip>
          ) : (
            <></>
          )}
        </Button>
      ) : (
        <Button
          id={"stop-button"}
          className="btn btn-primary"
          onClick={() => sleepWindow()}
          disabled={activeTab.type === "browser"}
          onMouseEnter={() => showElement("stop")}
          onMouseLeave={() => hideElement("stop")}
        >
          
          {activeTab.type === "remote" ? <PauseCircle color="white" size={20} /> : <PauseCircle color="white" size={20} />}
          {onElement === "stop" ? (
            <Tooltip isOpen={true} target={"stop-button"} toggle={toggle}>
              {activeTab.type === "remote" ? "Pause" : "Pause Tab(s)"}
            </Tooltip>
          ) : (
            <></>
          )}
        </Button>
      )}

      <Button
        id={"close-button"}
        className="btn btn-primary"
        onClick={() => close()}
        disabled={disabled}
        onMouseEnter={() => showElement("close")}
        onMouseLeave={() => hideElement("close")}
      >
        {
          activeTab.type === "remote" ? <DashCircle color="white" size={20} /> : <XCircle color="white" size={20} />
        }
        {onElement === "close" ? (
          <Tooltip isOpen={true} target={"close-button"} toggle={toggle}>
            {activeTab.type === "remote" ? "Hide" : "Close Tab(s)"}
          </Tooltip>
        ) : (
          <></>
        )}
      </Button>
    </>
  );
}

export default RemoteAppMenu;
