import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import * as Icon from "react-feather";
import { v4 as uuidv4 } from "uuid";

import { sessionActions } from "../../store/session-slice";
import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";
import { viewActions } from "../../store/view-slice";
import { canvasActions } from "../../store/canvas-slice";
import { chatActions } from "../../store/chat-slice";
import { musicPlayerActions } from "../../store/musicplayer-slice";
import { utilityAppsActions } from "../../store/utility-slice";
import { cornerWindowActions } from "../../store/corner-window-slice";

import { selectWorkspaceByName } from "../../services/workspace";
import { WorkspaceService } from "../../services/workspace";
import { Platform } from "../../enum";

import { Navbar, Button, ListGroup, ListGroupItem } from "reactstrap";
import "./SPNavBar.css";
import UserMenu from "../UserMenu/UserMenu";
import { openAppWindow, openInternalWindow } from "../../services/window";
// @ts-expect-error
import defaultIcon from "../../images/default_icon.png";

import {
  Tv,
  TvFill,
  Plus,
  Collection,
  ChevronDown,
  ChevronUp,
  FileEarmarkArrowUp,
  PauseCircle,
  XCircle,
  Calculator,
  Robot,
  Search,
  Key,
} from "react-bootstrap-icons";

import DigitalClock from "../DigitalClock/DigitalClock";
import BrowserButton from "../BrowserButton/BrowserButton";
import WaffleMenuIcon from "../Icons/WaffleMenuIcon";
import { SessionService } from "../../services/session";
import XAppService from "../../services/xapp";
import MacTopBar from "./MacTopBar";
import WindowsTopBar from "./WindowsTopBar";
import SettingsMenu from "../SettingsMenu/SettingsMenu";
import { passwordManagerActions } from "../../store/passwordmanager-slice";

import UtilitiesMenu from "../SideBar/UtilitiesMenu";

function SPNavBar() {
  const dispatch = useDispatch();
  
  const profileId = useSelector((state: any) => state.app.profileId);
  
  const sync = useSelector((state: any) => state.app.sync);
  
  const platform = useSelector((state: any) => state.app.platform);
  
  const workspaceState = useSelector((state: any) => state.workspace);
  
  const sessionState = useSelector((state: any) => state.session);
  
  const isSharedAppsEnabled = useSelector(
    (state: any) => state.settings.isSharedAppsEnabled
  );

  const xapps = useSelector((state: any) => state.app.xapps);
  
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  
  const desktops = useSelector((state: any) => state.workspace.desktops);
  
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  
  const isLocal = useSelector((state: any) => state.workspace.isLocal);

  
  const openWindows = useSelector((state: any) => state.session.openWindows);
  
  const activeDesktopWindows = useSelector(
    (state: any) => state.session.activeDesktopWindows
  );
  
  const selectedDesktop = useSelector(
    (state: any) => state.workspace.selectedDesktop
  );
  
  const openTabs = useSelector((state: any) => state.session.openTabs);
  
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  
  const lastGlobalWindowId = useSelector(
    (state: any) => state.session.lastGlobalWindowId
  );

  
  const stateData = useSelector((state: any) => state.session);
  
  const session = useSelector((state: any) => state.workspace.currentSession);
  
  const isInSession = useSelector((state: any) => state.session.isInSession);

  const toggleFileSharingModal = () => {
    dispatch(modalActions.toggleFileSharingRequestModal({}));
  }


  function newTab(windowId: any, url: any, icon: any, title: any) {
    const now = new Date().getTime();
    return {
      id: uuidv4(),
      url: url,
      location: "main",
      type: "xapp",
      desktop: desktop.id,
      workspace: workspace.id,
      window: windowId,
      state: {
        url: url,
        title: title,
        icon: icon,
      },
      created: now,
      lastAccessed: now,
      sleeping: true,
    };
  }

  function resumeTab(
    windowId: any,
    tabId: any,
    type: any,
    url: any,
    icon: any,
    title: any
  ) {
    let _tabId = tabId ? tabId : uuidv4();
    const now = new Date().getTime();
    return {
      id: _tabId,
      url: url,
      location: "main",
      type: type,
      desktop: desktop.id,
      workspace: workspace.id,
      window: windowId,
      state: {
        url: url,
        title: title,
        icon: icon,
      },
      created: now,
      lastAccessed: now,
      sleeping: true,
    };
  }

  function desktopItem(item: any) {
    if (item === undefined) {
      return <></>;
    }
    if (item.id === selectedDesktop.id) {
      return (
        <ListGroupItem
          key={item.id}
          value={item.id}
          className="d-flex justify-content-center"
        >
          <Button value={item.id}>
            <Tv
              className="desktop-icon"
              values={item.id}
              color="white"
              size={32}
            />
          </Button>
        </ListGroupItem>
      );
    }

    return (
      <ListGroupItem
        key={item.id}
        value={item.id}
        className="d-flex justify-content-center"
        onClick={(e) => onSwitchDesktop(item.id)}
      >
        <Button
          value={item.id}
          onClick={(e) => onSwitchDesktop(item.id)}
          data-bs-toggle="tooltip"
          data-bs-placement="right"
          title={item.name}
          data-bs-custom-className="custom-tooltip"
        >
          <TvFill
            className="desktop-icon"
            values={item.id}
            color="white"
            size={32}
            onClick={(e) => onSwitchDesktop(item.id)}
          />
        </Button>
      </ListGroupItem>
    );
  }

  function onSwitchDesktop(value: any) {
    if (value === selectedDesktop.id || value === undefined) {
      return;
    }
    log.debug("SWITCHING DESKTOP TO:" + value);
    log.debug("ACTIVE DESKTOP WINDOWS:", activeDesktopWindows);
    let desktop = desktops.find((desktop: any) => desktop.id === value);
    WorkspaceService.switchDesktop(workspace.id, desktop.id).then((data) => {
      dispatch(workspaceActions.selectDesktop({ desktop: data.desktop }));
      dispatch(workspaceActions.setApps({ apps: data.apps }));
      dispatch(workspaceActions.setLinks({ links: data.links }));
      if (
        activeDesktopWindows.hasOwnProperty(value) &&
        activeDesktopWindows[value] !== "launchpad"
      ) {
        dispatch(
          sessionActions.setActiveWindow({
            data: openWindows[activeDesktopWindows[value]],
          })
        );
      } else {
        log.debug("NO ACTIVE WINDOW FOR DESKTOP:" + value);
        dispatch(
          sessionActions.getBackToLaunchPad({
            data: {
              desktopId: value,
            },
          })
        );
      }
    });
  }

  function endSession() {
    // Save sesion state
    SessionService.saveState(session.id, stateData)
      .then((id) => {
        log.debug("Session Saved");
        dispatch(sessionActions.endSession({}));
        dispatch(workspaceActions.setCurrentSession({}));
        // switch to workspace
        WorkspaceService.selectWorkspaceById(dispatch, workspace.id, workspaceState, sessionState);
      })
      .catch((err) => {
        log.error("onSaveSession", err);
      });
  }

  function pauseSession() {
    // Save sesion state
    let _openTabs = Object.assign({}, stateData.openTabs);
    Object.values(_openTabs).forEach((tab: any) => {
      let _tab = Object.assign({}, tab);
      _tab.location = "main";
      _tab.sleeping = true;
      
      _openTabs[tab.id] = _tab;
    });
    SessionService.saveState(session.id, stateData)
      .then((id) => {
        log.debug("Session Saved");
        
        dispatch(sessionActions.endSession({}));
        dispatch(workspaceActions.setCurrentSession({}));
        // switch to workspace
        WorkspaceService.selectWorkspaceById(dispatch, workspace.id, workspaceState, sessionState);
      })
      .catch((err) => {
        log.error("onSaveSession", err);
      });
  }

  function toggleShowLaunchPad() {
    dispatch(
      sessionActions.getBackToLaunchPad({
        data: {
          desktopId: desktop.id,
        },
      })
    );
  }

  function toggleBottomBar() {
    let _bar = document.querySelector(".sp-bottom-navbar");
    let _showButton = document.querySelector(".bottom-show-bar-button");
    let _hideButton = document.querySelector(".hide-button");

    if (_bar.classList.contains("hide-bar")) {
      _bar.classList.remove("hide-bar");
      _showButton.classList.add("d-none");
      dispatch(viewActions.setIsBottomNavBarVisible(true));
    } else {
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      _hideButton.blur();
      _bar.classList.add("hide-bar");
      dispatch(viewActions.setIsBottomNavBarVisible(false));
      setTimeout(() => {
        // remove focus from hide button
        _showButton.classList.remove("d-none");
      }, 500);
    }
  }

  useEffect(() => {
    const middleMenu = document.querySelector(".middle-menu");
    const appsMenu = document.querySelector(".shared-apps-menu");
    if (appsMenu === null) return;
    const items = appsMenu.querySelectorAll(".nav-item");
    const dragOver = (e: any) => {
      e.preventDefault();
      const draggingItem = document.querySelector(".dragging");
      if (draggingItem === null) return;
      // Getting all items except currently dragging and making array of them
      // @ts-expect-error
      let siblings = [...appsMenu.querySelectorAll(".nav-item:not(.dragging)")];
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      let middleMenuO = middleMenu.offsetLeft;
      // @ts-expect-error
      let appsMenuO = appsMenu.offsetLeft;
      // Finding the sibling after which the dragging item should be placed
      let nextSibling = siblings.find((sibling) => {
        // log.debug("sibling:",sibling.offsetLeft + sibling.offsetWidth / 2);
        return (
          e.clientX - middleMenuO <=
          sibling.offsetLeft + sibling.offsetWidth / 2
        );
      });

      // Inserting the dragging item before the found sibling
      if (nextSibling !== undefined && nextSibling !== null) {
        // check if dragging item is type of Node
        if (draggingItem !== null && draggingItem.nodeType === 1) {
          appsMenu.insertBefore(draggingItem, nextSibling);
        }
      } else {
        // if dragging item is not type of Node, find it inside draggingItem
        if (draggingItem !== null && draggingItem.nodeType === 1) {
          appsMenu.insertBefore(draggingItem, siblings[0]);
        }
      }
    };

    items.forEach((item) => {
      item.addEventListener("dragstart", () => {
        setTimeout(() => item.classList.add("dragging"), 0);
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
      });
    });

    appsMenu.addEventListener("dragover", dragOver);
    appsMenu.addEventListener("dragenter", (e) => e.preventDefault());
    appsMenu.addEventListener("drop", (e) => {
      e.preventDefault();
      // @ts-expect-error
      let siblings = [...appsMenu.querySelectorAll(".nav-item")];
      let _xapps: any = [];
      siblings.forEach((sibling) => {
        // sibling.style.transform = "translateY(0)";
        log.debug("id:", sibling.getAttribute("id"));
        _xapps.push(sibling.getAttribute("id"));
      });
      localStorage.setItem("xappIds", JSON.stringify(_xapps));
    });
  }, [xapps, isSharedAppsEnabled]);

  useEffect(() => {
    log.debug("Platform: ", platform);
  }, [platform]);

  function openAppStore() {
    dispatch(modalActions.setLocation("xapps"));
    dispatch(modalActions.toggleAppStoreModal({}));
  }

  function openTaskBoard() {
    dispatch(canvasActions.setTitle("Task Manager"));
    dispatch(canvasActions.setUrl("https://taskboard.onepad.io"));
    dispatch(canvasActions.setScopesBoth({}));
    dispatch(canvasActions.setWidth("50%"));
    dispatch(canvasActions.setIsOpen(true));
  }

  function openToDoListApp() {
    dispatch(canvasActions.setTitle("ToDo List"));
    dispatch(canvasActions.setUrl("https://todolist.onepad.io"));
    dispatch(canvasActions.setScopesBoth({}));
    dispatch(canvasActions.setWidth("50%"));
    dispatch(canvasActions.setIsOpen(true));
  }

  function openCalculator() {
    dispatch(cornerWindowActions.setUrl("https://calculator.onepad.io"));
    dispatch(cornerWindowActions.setWidth(400));
    dispatch(cornerWindowActions.setHeight(620));
    dispatch(cornerWindowActions.setIsOpen(true));
  }

  function openWhatsApp() {
    // dispatch(chatActions.setIsOpen(true));
    dispatch(chatActions.toggle());
  }

  function togglePasswordManager() {
    dispatch(passwordManagerActions.togglePasswordManager());
  }

  return (
    <>
      <div className="drag-bar"></div>
      <div className="sp-navbar">
        <div className="logo"></div>
        {platform === Platform.Windows ? <WindowsTopBar /> : <MacTopBar />}
        {
          <Navbar className="sp-bottom-navbar navbar navbar-expand navbar-light fixed-bottom shadow d-none">
            {}
            <div className="row">
              {}
              <div className="col-2 d-flex justify-content-start align-middle">
                <ListGroup horizontal className="open-windows ml-2">
                  <ListGroupItem>
                    <div className="mt-2">
                      <UserMenu direction="up" />
                    </div>
                  </ListGroupItem>
                  {isInSession && (
                    <>
                      <ListGroupItem className="pause-button">
                        <Button color="dark" onClick={() => pauseSession()}>
                          <PauseCircle color="white" size={16} />
                        </Button>
                      </ListGroupItem>
                      <ListGroupItem className="pause-button">
                        <Button
                          color="dark"
                          onClick={() =>
                            dispatch(modalActions.toggleEndSessionModal({}))
                          }
                        >
                          <XCircle color="white" size={16} />
                        </Button>
                      </ListGroupItem>
                    </>
                  )}
                </ListGroup>
                <ListGroup horizontal className="open-windows">
                  <ListGroupItem className="mt-2 mb-1 d-none">
                    <Button
                      color="dark"
                      onClick={() =>
                        dispatch(modalActions.toggleTabTilesModal({}))
                      }
                    >
                      <Collection color="white" size={20} />
                    </Button>
                  </ListGroupItem>
                  <ListGroupItem className="mt-2 mb-1 d-none">
                    <Button color="dark" onClick={() => toggleShowLaunchPad()}>
                      {}
                      <WaffleMenuIcon size={20} />
                    </Button>
                  </ListGroupItem>
                </ListGroup>
              </div>
              {}
              <div className="col-8 d-flex justify-content-center middle-menu"></div>
              {}
              <div className="col-2 d-flex justify-content-end pr-0">
                <ListGroup horizontal className="open-windows h-100">
                  {sync && (
                    <ListGroupItem>
                      <Button color="dark" className="ml-2">
                        <Icon.RefreshCcw size={16} />
                      </Button>
                    </ListGroupItem>
                  )}

                  <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
                    <Button
                      className="mb-2"
                      color="dark"
                      onClick={() =>
                        dispatch(utilityAppsActions.toggle("search"))
                      }
                    >
                      <Search color="white" size={18} />
                    </Button>
                  </ListGroupItem>
                  <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
                    <Button
                      className="mb-2"
                      title="OneAI"
                      color="dark"
                      onClick={() => dispatch(utilityAppsActions.toggle("ai"))}
                    >
                      <Robot color="white" size={20} />
                    </Button>
                  </ListGroupItem>
                  <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
                    <Button
                      className="mb-2"
                      color="dark"
                      onClick={() => togglePasswordManager()}
                    >
                      <Key color="white" size={18} />
                    </Button>
                  </ListGroupItem>
                  <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
                    <Button
                      className="mb-2"
                      color="dark"
                      onClick={() => openCalculator()}
                    >
                      <Calculator color="white" size={18} />
                    </Button>
                  </ListGroupItem>
                  <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
                    <Button
                      className="mb-2"
                      title="P2P File Transfer"
                      color="dark"
                      onClick={() => toggleFileSharingModal()}
                    >
                      <FileEarmarkArrowUp color="white" size={18} />
                    </Button>
                  </ListGroupItem>
                  <ListGroupItem className="h-100">
                    <DigitalClock />
                  </ListGroupItem>
                </ListGroup>
              </div>
            </div>
            <Button
              color="dark"
              className="hide-button"
              onClick={() => toggleBottomBar()}
            >
              <ChevronDown size={16} />
            </Button>
          </Navbar>
        }
      </div>
      {
        <Button
          color="dark"
          className="bottom-show-bar-button d-none"
          onClick={() => toggleBottomBar()}
        >
          <ChevronUp size={16} />
        </Button>
      }
    </>
  );
}

export default SPNavBar;
