import { useEffect } from "react";
import {
  Navbar,
  ListGroup,
  ListGroupItem,
  Button,
} from "reactstrap";
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import log from "loglevel";

import { modalActions } from "../../store/modal-slice";

import UserMenu from "../UserMenu/UserMenu";
import { Activity, Terminal, Download } from "react-bootstrap-icons";
import BrowserButton from "./BrowserButton";
import { spaceSideBarActions } from "../../store/space-sidebar-slice";
import { viewActions } from "../../store/view-slice";
import AddressBar from "./AddressBar";
import { utilityAppsActions } from "../../store/utility-slice";
import { chatActions } from "../../store/chat-slice";
import { musicPlayerActions } from "../../store/musicplayer-slice";
import isElectron from "is-electron";
import NavBarApps from "../NavBarApps/NavBarApps";
import { windowServiceActions } from "../../store/window-service-slice";
import MemoryIndicator from "../MemoryIndicator/MemoryIndicator";
import SpaceSwitcher from "../SpaceSwitcher/SpaceSwitcher";

function MacTopBar() {
  const dispatch = useDispatch();

  const userState = useSelector((state: any) => state.user);

  const sessionState = useSelector((state: any) => state.session);

  const version = useSelector((state: any) => state.app.version);
  const isWorkspacesEnabled = useSelector(

    (state: any) => state.settings.isWorkspacesEnabled
  );
  const isSessionsEnabled = useSelector(

    (state: any) => state.settings.isSessionsEnabled
  );
  const lastGlobalWindowId = useSelector(

    (state: any) => state.session.lastGlobalWindowId
  );

  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);

  const activeWindow = useSelector((state: any) => state.session.activeWindow);

  const openWindows = useSelector((state: any) => state.session.openWindows);

  const openTabs = useSelector((state: any) => state.session.openTabs);

  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const isFullScreen = useSelector((state: any) => state.session.isFullScreen);

  const isExtended = useSelector((state: any) => state.view.isExtended);

  const isExtendedMode = useSelector((state: any) => state.view.isExtendedMode);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const activeDownloadsCount = useSelector((state: any) => state.downloads.activeDownloadsCount);

  const activeTab = useSelector((state: any) => state.session.activeTab);

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
    log.debug("_apps", _apps);
    log.debug("globalApps", globalApps);
    setApps(_apps);
    setGlobalApps(_globalApps);
    setOthers(_others);
    setWindowsByWorkspace(_windowsByWorkspace);
    log.debug("_windowsByWorkspace", _windowsByWorkspace);
  }, [openWindows, workspace]);

  function toggleShowLaunchPad() {
    dispatch(modalActions.toggleLaunchPad({}));
  }

  function togggleSpaceSideBar() {
    dispatch(spaceSideBarActions.toggle());
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
    <>
      <Navbar
        className="sp-top navbar navbar-expand navbar-dark static-top"
        onMouseEnter={() => onMouseEnter()}
        onMouseLeave={() => onMouseLeave()}
      >
        <div className="row top-menus w-100 h-100">
          <div className="col-3 d-flex justify-content-start align-items-center">
            <div className="text-white" style={{ marginLeft: "36px" }}></div>
          </div>
          <div className="col-6 d-flex justify-content-center align-items-center">
            <SpaceSwitcher />
          </div>
          {}
          <div className="col-3 d-flex justify-content-end">
            <ListGroup horizontal className="d-flex open-windows">
              {(userState.product === "FREE" || sessionState.route !== "authenticated") &&
                version.includes("dev") && (
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
              {version.includes("devx") && (
                <ListGroupItem className="d-flex justify-content-center">
                  <Button color="dark" onClick={onToggleDevTools}>
                    <Terminal color="white" size={18} />
                  </Button>
                </ListGroupItem>
              )}
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
      {activeTab.type !== "remote" && <AddressBar />}
    </>
  );
}

export default MacTopBar;
