import React, { useState, useEffect, version } from "react";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from 'uuid';
import log from "loglevel";

import { WorkspaceService } from "../../services/workspace";
import { sessionActions } from '../../store/session-slice';
import { modalActions } from '../../store/modal-slice';
import { appActions } from '../../store/app-slice';
import { processWindows, processOpenTabsBeforePersist } from '../../services/window';
import { openAppWindow } from '../../services/window'
import { Platform } from "../../enum";

import "./SpaceTopBar.css";
import { Button, ListGroup, ListGroupItem, Spinner, Tooltip } from "reactstrap";
import WaffleMenuIcon from '../Icons/WaffleMenuIcon';

import {
  House,
  Stack,
  Clouds,
  Tv,
 } from "react-bootstrap-icons";
import * as Icon from 'react-feather';
import clsx from "clsx";
import { spaceSideBarActions } from "../../store/space-sidebar-slice";
import { UsersService } from "../../services/users";
import { Stage, Layer, Circle, Text, Rect } from 'react-konva';
import WorkspaceMenu from "../WorkspaceMenu/WorkspaceMenu";

function SpaceTopBar(){
    const dispatch = useDispatch();

    const platform = useSelector((state: any) => state.app.platform);

    const route = useSelector((state: any) => state.session.route);

    const sessionStateData = useSelector((state: any) => state.session);

    const workspaceState = useSelector((state: any) => state.workspace);


    const personId = useSelector((state: any) => state.app.personId);

    const userId = useSelector((state: any) => state.user.id);

    const isOpen = useSelector((state: any) => state.spaceSideBar.isOpen);

    const isSplitWindowsEnabled = useSelector((state: any) => state.settings.isSplitWindowsEnabled);

    const workspaces = useSelector((state: any) => state.workspace.workspaces);

    const recentWorkspaces = useSelector((state: any) => state.workspace.recentWorkspaces);

    const openWindows = useSelector((state: any) => state.session.openWindows);

    const selectedWorkspace = useSelector((state: any) => state.workspace.selectedWorkspace);

    const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

    const desktopNames = useSelector((state: any) => state.workspace.desktopNames);

    const activeWindowId = useSelector((state: any) => state.session.activeWindowId);

    const activeTabs = useSelector((state: any) => state.session.activeTabs);

    const activeTab = useSelector((state: any) => state.session.activeTab);

    const activeWindow = useSelector((state: any) => state.session.activeWindow);

    const activeTabId = useSelector((state: any) => state.session.activeTabId);

    const activeWindowTabs = useSelector((state: any) => state.session.activeWindowTabs);

    const activeDesktopWindows = useSelector((state: any) => state.session.activeDesktopWindows);

    const isFullScreen = useSelector((state: any) => state.session.isFullScreen);

    const sessions = useSelector((state: any) => state.workspace.sessions);

    const isSyncing = useSelector((state: any) => state.app.isSyncing);


    const version = useSelector((state: any) => state.app.version);

    const windowTabs = useSelector((state: any) => state.session.windowTabs);

    const openTabs = useSelector((state: any) => state.session.openTabs);

    const [sideBarId, setSideBarId] = useState(uuidv4());
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");

    const[onElement, setOnElement] = useState("");
    const [tooltipOpen, setTooltipOpen] = useState(true);
    const toggle = () => setTooltipOpen(!tooltipOpen);


    const toggleShowLaunchPad = () => {
      dispatch(modalActions.toggleLaunchPad({}));
    }

    const toggleSettings = () => {
      dispatch(modalActions.toggleSettings({}));
    }

    const toggleAppStore = () => {
      dispatch(modalActions.toggleAppStoreModal({}));
    }

    const toggleFileSharingModal = () => {
      dispatch(modalActions.toggleFileSharingRequestModal({}));
    }

    const toggleDesktop = () => {
      dispatch(sessionActions.getBackToLaunchPad({data: {
        desktopId: desktop.id,
      }}));
    }


    function handleSwitchWindow(item){
      dispatch(appActions.hideTabsScreen({}));
      if(activeWindowId === item.id){
          //dispatch(sessionActions.getBackToLaunchPad({data: {
          //  desktopId: desktop.id,
          //}}));
          return;
      }
      if(item.location === "external"){
          openAppWindow(item.id, item.start_url, item.window_type, item.is_stateful, item.show_controls);
          //let _tabId = windowTabs[item.id];
          //if(isElectron()){
          //  window.electronAPI.send("toMain", {
          //    action: "switch-to-external-tab",
          //    tabWindowId: item.id,
          //    tabId: _tabId,
          //    type: WindowType.External,
          //  });
          // }
      }else{
        dispatch(sessionActions.setActiveWindow({data: item}));
        if(openWindows[item.id].sleeping === true){
          dispatch(appActions.showSplashScreen({}));
          setTimeout(() => {
              if(windowTabs[item.id].length > 1){
                dispatch(appActions.showTabsScreen({}));
              }
              dispatch(appActions.hideSplashScreen({}));
          }, 1000);
        }
      }
    }

    function showElement(spaceId){
      //let wsname = document.getElementById(elementId);
      //wsname.classList.remove("d-none");
      setOnElement(spaceId);

    }

    function hideElement(spaceId){
      setOnElement("");
    }

    function onWorkspaceSelect(workspaceId){
      if(workspaceId === selectedWorkspace.id){
          return;
      }
      log.debug("onWorkspaceSelect",openWindows);
      // toggle();
      setTimeout(() => {
          setSelectedWorkspaceId(workspaceId);
      }, 200);
    }

    function workspaceItem(workspace){
      let _icon = workspace.config && workspace.config.iconType === "image" ? (
                <img width={32} className="web-icon" src={workspace.config.icon} alt="" onClick={() => onWorkspaceSelect(workspace.id)}/>
      ) : (
                <Stage width={32} height={32} onClick={() => onWorkspaceSelect(workspace.id)}>
          <Layer>
            <Rect
              x={2}
              y={2}
              width={24}
              height={24}
              fill={workspace.config && workspace.config.color ? workspace.config.color : "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0")}
              shadowBlur={10}
              cornerRadius={5}
            />
          </Layer>
          <Layer>
            <Text x={3} y={8} text={workspace.config && workspace.config.alias ? workspace.config.alias : workspace.name.toUpperCase().slice(0,2)} fontSize={16} fill='white'/>
          </Layer>
        </Stage>
      );

      return(
        <ListGroupItem id={"ws-"+workspace.id}
          className={"d-flex justify-content-start align-items-center w-100 workspace-item" + (onElement === workspace.id ? "on":"")}
          onClick={() => onWorkspaceSelect(workspace.id)}
          onMouseEnter={()=> showElement(workspace.id)}
          onMouseLeave={() => hideElement(workspace.id)}
          >
          <div
            className={"workspace-icon "+ (workspace.id === selectedWorkspace.id ? "active":"")}
            onClick={() => onWorkspaceSelect(workspace.id)}
            >
            {
              _icon
            }
          </div>
          {
            onElement === workspace.id ? (
              <Tooltip
                isOpen={true}
                target={"ws-"+workspace.id}
                toggle={toggle}
              >
                {workspace.name}
              </Tooltip>
            ) : ( <></>)
          }

        </ListGroupItem>
      )
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
          WorkspaceService.loadWorkspaceById(
              dispatch,
              selectedWorkspaceId,
              workspaceState,
              sessionStateData,
              { restoreLastActive: true }
          );
          UsersService.setLastWorkspace(userId, selectedWorkspaceId);
          setSelectedWorkspaceId("");
      }).catch((err) => {
          log.error("onWorkspaceSelect",err);
      });
  }, [selectedWorkspaceId]);

    useEffect(() => {
      if(isOpen){
        document.getElementById(sideBarId)?.classList.add("show");
        document.getElementById("spacesidebar-offcanvas-"+sideBarId)?.classList.remove("hidden");
      }else{
        document.getElementById(sideBarId)?.classList.remove("show");
        document.getElementById("spacesidebar-offcanvas-"+sideBarId)?.classList.add("hidden");
      }
    }, [isOpen]);

    useEffect(() => {
      if(workspaces && workspaces.length > 0){
        workspaces.forEach((workspace) => {
          if(!workspace.config){
            WorkspaceService.updateConfig(workspace.id, {
              iconType: "color",
              color: "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0"),
              alias: workspace.name.split(" ").length > 1 ? workspace.name.split(" ")[0].toUpperCase().slice(0,1)+workspace.name.split(" ")[1].toUpperCase().slice(0,1) : workspace.name.toUpperCase().slice(0,2)
            }).then((id) => {
              log.debug("updateWorkspaceState", id);
            }).catch((err) => {
              log.error(err);
            });
          }
        });
      }
      return () => {
        log.debug("SpaceSideBar cleanup");
      }
    }
    ,[]);

    return (
          <>

          <div
            id={"spacesidebar-offcanvas-"+sideBarId}
            className={clsx(
              "!m-0 fixed inset-0 z-998",
              "items-end justify-end",
              "space-topbar-offcanvas",
              "flex hidden",
            )}
            onClick={() => dispatch(spaceSideBarActions.toggle())}
          >

        </div>
        <div id={sideBarId} className={clsx(
          "d-flex justify-content-start",
          "space-topbar"
        )}>
          <div
            className={clsx(
              "d-flex justify-content-center align-items-center h-100 ",
              platform === Platform.MacOS && !isFullScreen ? "left-menu" : "left-menu-windows"
            )}
          >
              <ListGroup horizontal className="w-100 ml-2">
                <ListGroupItem key={uuidv4()} className=" d-flex justify-content-center nav-item d-none">
                  <Button color="dark" onClick={() => toggleDesktop() }>
                                        <WaffleMenuIcon size={20}/>
                  </Button>
                </ListGroupItem>
                <ListGroupItem key={uuidv4()} className=" d-flex justify-content-center nav-item">
                  <Button color="dark"
                    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                    onClick={() => dispatch(modalActions.toggleSpacePad()) }
                    //onMouseLeave={() => dispatch(modalActions.hideSpacePad())}
                  >
                    <Stack size={20}/>
                  </Button>
                </ListGroupItem>
                <ListGroupItem key={uuidv4()} className=" d-flex justify-content-center nav-item">
                  <WorkspaceMenu direction="down"/>
                </ListGroupItem>
                <ListGroupItem key={uuidv4()} className=" d-flex justify-content-center align-items-center nav-item ml-2">
                  {
                    isSyncing && (
                      <Spinner size="sm" color="light" />
                    )
                  }
                </ListGroupItem>


              <ListGroupItem className="d-flex justify-content-center workspace-item h-100 d-none">
                <div className={"d-flex align-items-center"} onMouseEnter={()=> showElement("home-label")} onMouseLeave={() => hideElement("home-label")}>
                  <Button>
                    <House color="white" size={24} />
                  </Button>
                </div>
                <div className="space-gap"></div>
                {
                  onElement === "home-label" ? (
                    <div id="home-label" className="d-flex justify-content-start align-items-center workspace-name">
                      <div className="ml-1 w-100 ">Home</div>
                    </div>
                  ) : ( <></>)
                }
              </ListGroupItem>
              <ListGroupItem className="d-flex justify-content-center h-100 workspace-item d-none">
                  <div className={"d-flex align-items-center"} onMouseEnter={()=> showElement("discover-label")} onMouseLeave={() => hideElement("discover-label")}>
                    <Button color="dark" >
                      <Icon.Compass color="white" size={28} />
                    </Button>
                  </div>
                  <div className="space-gap"></div>
                  {
                    onElement === "discover-label" ? (
                      <div id="discover-label" className="d-flex justify-content-center align-items-center workspace-name">
                        <div className="ml-1 w-100 ">Discover</div>
                      </div>
                    ) : ( <></>)
                  }

              </ListGroupItem>
              <ListGroupItem className="d-flex justify-content-center h-100 workspace-item d-none">
                <div className={"d-flex align-items-center"} onMouseEnter={()=> showElement("expand-label")} onMouseLeave={() => hideElement("expand-label")}>
                  <Button color="dark" >
                    <Stack className="stack-icon" color="white" size={24}/>
                  </Button>
                  </div>
                  <div className="space-gap"></div>
                  {
                    onElement === "expand-label" ? (
                      <div id="expand-label" className="d-flex justify-content-center align-items-center workspace-name">
                        <div className="ml-1 w-100 ">My Library</div>
                      </div>
                    ) : ( <></>)
                  }


              </ListGroupItem>


              {
                /**
                recentWorkspaces[userId] ? (
                  recentWorkspaces[userId].map(workspace => (
                    workspaceItem(workspace)
                  ))
                ) : (
                  <></>
                )
                */
              }
            </ListGroup>
            {
              version.includes("dev") &&  route === "authenticated" && (
                <ListGroup horizontal>
                  <ListGroupItem key={uuidv4()} className=" d-flex justify-content-center nav-item">
                      <Button color="dark"
                        onClick={() => dispatch(modalActions.toggleCloudPad("apps")) }
                        //onMouseLeave={() => dispatch(modalActions.hideCloudPad())}
                      >
                        <Clouds size={20}/>
                      </Button>
                  </ListGroupItem>
                  <ListGroupItem key={uuidv4()} className=" d-flex justify-content-center nav-item">
                      <Button color="dark"
                        onClick={() => dispatch(modalActions.toggleCloudPad("pcs")) }
                        //onMouseLeave={() => dispatch(modalActions.hideCloudPad())}
                      >
                        <Tv size={20}/>
                      </Button>
                  </ListGroupItem>
                </ListGroup>
              )

            }

          </div>

        </div>

          </>
    )
}

export default SpaceTopBar;
