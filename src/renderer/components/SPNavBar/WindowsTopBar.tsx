import React from "react";
import { Navbar, ListGroup, ListGroupItem, Button } from "reactstrap";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import { modalActions } from "../../store/modal-slice";
import { sessionActions } from "../../store/session-slice";
import { viewActions } from "../../store/view-slice";

import { Platform } from "../../enum";
// @ts-expect-error
import defaultIcon from "../../images/default_icon.png";
import AppService from "../../services/app";
import { appActions } from "../../store/app-slice";
import { openAppWindow } from "../../services/window";

import WorkspaceMenu from "../WorkspaceMenu/WorkspaceMenu";
import SessionSwitchMenu from "../SessionSwitchMenu/SessionSwitchMenu";
import WaffleMenuIcon from "../Icons/WaffleMenuIcon";
import {
  Activity,
  ChatDots,
  Download,
  EnvelopeAt,
  Grid3x3GapFill,
  Kanban,
  MusicNoteBeamed,
  Robot,
  Search,
  Terminal,
} from "react-bootstrap-icons";
import BrowserButton from "./BrowserButton";

import AddressBar from "./AddressBar";
import UtilitiesMenuDD from "../SideBar/UitilitesMenuDD";
import { utilityAppsActions } from "../../store/utility-slice";
import { chatActions } from "../../store/chat-slice";
import { musicPlayerActions } from "../../store/musicplayer-slice";
import isElectron from "is-electron";
import UserMenu from "../UserMenu/UserMenu";
import { windowServiceActions } from "../../store/window-service-slice";
import MemoryIndicator from "../MemoryIndicator/MemoryIndicator";
import SpaceSwitcher from "../SpaceSwitcher/SpaceSwitcher";

function WindowsTopBar() {
  const dispatch = useDispatch();
  const route = useSelector((state: any) => state.session.route);

  const version = useSelector((state: any) => state.app.version);

  const userState = useSelector((state: any) => state.user);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);


  const activeWindow = useSelector((state: any) => state.session.activeWindow);

  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);

  const openWindows = useSelector((state: any) => state.session.openWindows);

  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  const isExtendedMode = useSelector((state: any) => state.view.isExtendedMode);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const activeDownloadsCount = useSelector((state: any) => state.downloads.activeDownloadsCount);

  const [globalApps, setGlobalApps] = useState([]);
  const [apps, setApps] = useState([]);
  const [others, setOthers] = useState([]);
  const [windowsByWorkspace, setWindowsByWorkspace] = useState({});

  useEffect(() => {
    let _apps: any = [];
    let _others: any = [];
    let _globalApps: any = [];
    let _windowsByWorkspace = {};
    Object.values(openWindows).forEach((window: any) => {
      if (_windowsByWorkspace[window.workspace] === undefined) {
        _windowsByWorkspace[window.workspace] = {
          apps: 0,
          others: 0,
        };
      }

      if (window.type !== "browser") {
        _windowsByWorkspace[window.workspace].apps++;
        if (

          (window.category && window.type !== "remote") ||

          window.type === "app"
        ) {

          if (window.workspace === workspace.id) _apps.push(window);

          if (window.type === "xapp") _globalApps.push(window);
        } else {

          if (window.workspace === workspace.id) _apps.push(window);

          if (window.type === "xapp") _globalApps.push(window);
        }
      } else {
        _windowsByWorkspace[window.workspace].others++;
        _others.push(window);
      }
    });
    setApps(_apps);
    setGlobalApps(_globalApps);
    setOthers(_others);
    setWindowsByWorkspace(_windowsByWorkspace);
  }, [openWindows, workspace]);

  function navBarItem(item: any) {
    if (item.type === "browser") return <></>;
    let _icon = "";
    let _title = item.type === "app" ? item.data.name : item.data.title;

    try {
      if (item.data.startUrl.startsWith("https://google.com")) {
        _icon = item.data.icon;
      } else {
        _icon =
          localStorage.getItem(item.data.icon) == null
            ? item.data.icon.length === 0
              ? defaultIcon
              : item.data.icon
            : localStorage.getItem(item.data.icon);
        if (!(_icon.startsWith("http") || _icon.startsWith("data:"))) {
          _icon = "./images/store/icon/" + item.data.icon;
        }
      }

      if (item.id === activeWindowId) {
        return (
          <ListGroupItem
            key={uuidv4()}
            id={item.id}
            className="d-flex justify-content-center align-items-center nav-item mr-3 active"
          >
            <div
              className="appicon w-100 d-flex justify-content-center align-items-center"
              data-bs-toggle="tooltip"
              data-bs-placement="right"
              title={_title}
              data-bs-custom-className="custom-tooltip"
              onContextMenu={(e) => {
                e.preventDefault(); // prevent the default behaviour when right clicked
                // remove all other context menus
                document.querySelectorAll(".context-menu").forEach((menu) => {
                  document.body.removeChild(menu);
                });
                let _menu = document.createElement("div");
                _menu.className = "context-menu";
                _menu.innerHTML = `
                  <div className="context-menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pause-circle" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                      <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0z"/>
                    </svg>
                    <span>Pause</span>
                  </div>
                  <div className="context-menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                    </svg>
                    <span>Close</span>
                  </div>
                `;
                _menu.style.position = "fixed";
                _menu.style.top = "40px";
                _menu.style.left = (e.clientX-20) + "px";
                document.body.appendChild(_menu);

                _menu.querySelector(".context-menu-item:first-child").addEventListener("click", () => {
                  dispatch(windowServiceActions.sleepWindow(item.id));
                  document.body.removeChild(_menu);
                });

                _menu.querySelector(".context-menu-item:last-child").addEventListener("click", () => {
                  dispatch(windowServiceActions.closeWindow(item.id));
                  document.body.removeChild(_menu);
                });

                _menu.addEventListener("mouseleave", () => {
                  document.body.removeChild(_menu);
                });

                // Close menu when clicking outside
                const closeMenu = (e: any) => {
                  if (document.body.contains(_menu) && !_menu.contains(e.target)) {
                    document.body.removeChild(_menu);
                    document.removeEventListener("click", closeMenu);
                  }
                };

                // Delay adding the click listener to prevent immediate closure
                setTimeout(() => {
                  document.addEventListener("click", closeMenu);
                }, 0);
              }}
            >
              <img
                className="align-self-center launch-icon"
                width={24}
                src={_icon}
                alt=""
                onClick={() => handleSwitchWindow(item)}
              />
            </div>
          </ListGroupItem>
        );
      } else {
        return (
          <ListGroupItem
            key={uuidv4()}
            id={item.id}
            className="d-flex justify-content-center align-items-center nav-item mr-3"
          >
            <div
              className="appicon w-100 d-flex justify-content-center align-items-center"
              data-bs-toggle="tooltip"
              data-bs-placement="right"
              title={_title}
              data-bs-custom-className="custom-tooltip"
              onContextMenu={(e) => {
                e.preventDefault(); // prevent the default behaviour when right clicked
                // remove all other context menus
                document.querySelectorAll(".context-menu").forEach((menu) => {
                  document.body.removeChild(menu);
                });
                let _menu = document.createElement("div");
                _menu.className = "context-menu";
                _menu.innerHTML = `
                  <div className="context-menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pause-circle" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                      <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0z"/>
                    </svg>
                    <span>Pause</span>
                  </div>
                  <div className="context-menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                    </svg>
                    <span>Close</span>
                  </div>
                `;
                _menu.style.position = "fixed";
                _menu.style.top = "40px";
                _menu.style.left = (e.clientX-20) + "px";
                document.body.appendChild(_menu);

                _menu.querySelector(".context-menu-item:first-child").addEventListener("click", () => {
                  dispatch(windowServiceActions.sleepWindow(item.id));
                  document.body.removeChild(_menu);
                });

                _menu.querySelector(".context-menu-item:last-child").addEventListener("click", () => {
                  dispatch(windowServiceActions.closeWindow(item.id));
                  document.body.removeChild(_menu);
                });

                _menu.addEventListener("mouseleave", () => {
                  document.body.removeChild(_menu);
                });

                // Close menu when clicking outside
                const closeMenu = (e: any) => {
                  if (document.body.contains(_menu) && !_menu.contains(e.target)) {
                    document.body.removeChild(_menu);
                    document.removeEventListener("click", closeMenu);
                  }
                };

                // Delay adding the click listener to prevent immediate closure
                setTimeout(() => {
                  document.addEventListener("click", closeMenu);
                }, 0);
              }}
            >
              <img
                className="align-self-center launch-icon"
                width={24}
                src={_icon}
                alt=""
                onClick={() => handleSwitchWindow(item)}
              />
            </div>
          </ListGroupItem>
        );
      }
    } catch (error) {
      console.error(error);
      return <></>;
    }
  }

  function handleSwitchWindow(item: any) {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(appActions.hideTabsScreen());
    if (activeWindowId === item.id) {
      dispatch(
        sessionActions.getBackToLaunchPad({
          data: {
            desktopId: desktop.id,
          },
        })
      );
      return;
    }
    if (item.location === "external") {
      openAppWindow(
        item.id,
        item.start_url,
        item.window_type,
        item.is_stateful,
        item.show_controls
      );
      //let _tabId = windowTabs[item.id];
      //if(isElectron()){
      //  window.electronAPI.send("toMain", {
      //    action: "switch-to-external-tab",
      //    tabWindowId: item.id,
      //    tabId: _tabId,
      //    type: WindowType.External,
      //  });
      // }
    } else {
      dispatch(sessionActions.setActiveWindow({ data: item }));
      if (openWindows[item.id].sleeping === true) {
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(appActions.showSplashScreen());
        if (windowTabs[item.id]?.length > 1) {
          setTimeout(() => {
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            dispatch(appActions.showTabsScreen());
          }, 1000);
        }
      }
    }

  }

  function toggleShowLaunchPad() {
    //dispatch(sessionActions.getBackToLaunchPad({data: {
    //    desktopId: desktop.id,
    //}}));

    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleLaunchPad());
  }

  function onMouseEnter() {
    if (isExtendedMode) {
      dispatch(viewActions.setIsExtended(false));
    }
  }

  function onMouseLeave() {
    if (isExtendedMode) {
      dispatch(viewActions.setIsExtended(true));
    }
  }

  function onToggleDevTools() {
    if (isElectron()) {
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "toggle-dev-tools",
      });
    }
  }

  return (
    <Navbar
      className="sp-top navbar navbar-expand navbar-dark static-top"
      onMouseEnter={() => onMouseEnter()}
      onMouseLeave={() => onMouseLeave()}
    >
      <AddressBar />
      {}
      <div className="row top-menus w-100 h-100">
        {}
        <div className="col-3 d-flex justify-content-start"></div>
        {}
        <div className="col-6 d-flex justify-content-center align-items-center">
          <SpaceSwitcher />
        </div>
        {}
        <div className="col-3 d-flex justify-content-end">
          <ListGroup horizontal className="d-flex open-windows windows-menu">
            {(userState.product === "FREE" || route !== "authenticated") && (
              <>
                <ListGroupItem className="d-flex justify-content-end d-none">
                  <Button
                    className="align-top mr-1 upgrade-button"
                    color="dark"
                    onClick={() =>
                      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                      dispatch(modalActions.toggleUpgradeModalWindow())
                    }
                  >
                    Try OnePad+
                  </Button>
                </ListGroupItem>
              </>
            )}
            {version.includes("dev") &&
                (
                    <ListGroupItem className="d-flex justify-content-center">
                        <Button color="dark" onClick={onToggleDevTools}>
                        <Terminal color="white" size={18} />
                        </Button>
                    </ListGroupItem>
                )
            }
            <ListGroupItem className="d-flex justify-content-center">
              <MemoryIndicator />
            </ListGroupItem>
            <ListGroupItem className="d-flex justify-content-center">
              <Button
                color="dark"
                onClick={() => {
                  dispatch(modalActions.toggleDownloadManager());
                }}
                style={{ position: 'relative' }}
              >
                <Download color="white" size={18} />
                {activeDownloadsCount > 0 && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#007bff',
                      border: '2px solid #212529',
                    }}
                  />
                )}
              </Button>
            </ListGroupItem>
            <ListGroupItem className="d-flex justify-content-center">
              <Button
                color="dark"
                onClick={() => {
                  dispatch(modalActions.toggleTaskManager());
                  dispatch(utilityAppsActions.close());
                  dispatch(musicPlayerActions.close());
                  dispatch(chatActions.close());
                }}
              >
                <Activity color="white" size={18} />
              </Button>
            </ListGroupItem>
            <ListGroupItem>
              <UserMenu direction="down" />
            </ListGroupItem>
          </ListGroup>
        </div>
      </div>
    </Navbar>
  );
}

export default WindowsTopBar;
