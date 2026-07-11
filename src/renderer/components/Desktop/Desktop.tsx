import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";

import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from "../../store/workspace-slice";
import { chatAssistantActions } from "../../store/chat-assistant-slice";
import { appActions } from "../../store/app-slice";

import LaunchPadLocal from "../../components/LaunchPadLocal/LaunchPadLocal";

import "./Desktop.css";
import DateTime from "../DateTime/DateTime";
import SearchBar from "../SearchBar/SearchBar";
import DesktopMenu from "../DesktopMenu/DesktopMenu";
import { Button } from "reactstrap";
import { Robot } from "react-bootstrap-icons";

import Widget from "./Widget";
import LaunchPadBody from "../LaunchPadLocal/LaunchPadBody";
import { aiAppsActions } from "renderer/store/ai-slice";
import SpaceStatsWidget from "../SpaceStatsWidget/SpaceStatsWidget";
import Pages from "../Pages/Pages";
import AppsOverlayMenu from "../NavBarApps/AppsOverlayMenu";
import { sessionActions as sessionActionsImport } from "../../store/session-slice";
import { windowServiceActions } from "../../store/window-service-slice";
import { openAppWindow } from "../../services/window";
import { activateBrowser } from "../../hubs/WindowService";

function Desktop(props) {
  const dispatch = useDispatch();
  const personId = useSelector((state: any) => state.app.personId);
  const profileId = useSelector((state: any) => state.app.profileId);
  const isLocal = useSelector((state: any) => state.workspace.isLocal);
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const workspaceId = useSelector(
    (state: any) => state.workspace.selectedWorkspace.id
  );
  const homeWorkspaceId = useSelector((state: any) => state.user.homeWorkspace);
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const isDesktopsEnabled = useSelector(
    (state: any) => state.settings.isDesktopsEnabled
  );
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const items = useSelector((state: any) => state.workspace.items);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);

  const user = useSelector((state: any) => state.user);
  const route = useSelector((state: any) => state.session.route);
  const sessionState = useSelector((state: any) => state.session);
  const workspaceState = useSelector((state: any) => state.workspace);

  const widgetConfig = useSelector((state: any) => state.workspace.widgetConfig);
  const selectedWidgetId = useSelector(
    (state: any) => state.workspace.selectedWidgetId
  );
  const isAIAssistantOpen = useSelector((state: any) => state.ai.isOpen || false);

  const toggleRenameDesktopModalWindow = () => {
    dispatch(modalActions.toggleRenameDesktopModalWindow({}));
  };

  const [name, setName] = useState(props.name);
  const [widgets, setWidgets] = useState([]);
  const [partition, setPartition] = useState("");
  const [isLaunchpadActive, setIsLaunchpadActive] = useState(true);

  useEffect(() => {
    setName(desktop.name.charAt(0).toUpperCase() + desktop.name.slice(1));
  }, [desktop]);

  useEffect(() => {
    const container = document.getElementById(props.id);
    if (
      (workspace.state.desktop != null ||
        workspace.state.desktop !== undefined) &&
      props.id === workspace.state.desktop
    ) {
      // container.classList.remove("d-none");
    } else {
      // container.classList.add("d-none");
    }
    if (localStorage.getItem("widget-config-v2") !== null) {
      let _widgetConfig = JSON.parse(localStorage.getItem("widget-config-v2"));
      if (_widgetConfig)
        dispatch(workspaceActions.setWidgetConfig(_widgetConfig));
    }

    const desktopBody = document.getElementById("desktop-body");
    if (desktopBody === null) return;
    if (desktopBody.classList.contains("scaled")) {
      desktopBody.classList.remove("scaled");
      setTimeout(() => {
        desktopBody.classList.add("scaled");
      }, 300);
    } else {
      setTimeout(() => {
        desktopBody.classList.add("scaled");
      }, 300);
    }
  }, [workspace, workspaceId]);

  useEffect(() => {
    if (activeTabId === null && activeTabId === undefined) return;
    const lpcontainer = document.getElementById(props.id);
    const spaceRight = document.getElementById("space-right");
    if (spaceRight === null) return;
    if (activeTabId === "launchpad") {
      //lpcontainer.classList.remove("d-none");
      spaceRight.classList.remove("d-none");
    } else {
      //lpcontainer.classList.add("d-none");
      spaceRight.classList.add("d-none");
    }
  }, [activeTabId]);

  useEffect(() => {
    if (activeWindowId === "launchpad") {
      setIsLaunchpadActive(true);
    } else {
      setIsLaunchpadActive(false);
    }
  }, [activeWindowId]);

  useEffect(() => {
    log.info("widgetConfig", widgetConfig);
    let _partition = "";
    if (route === "authenticated") {
      _partition =
        sessionState.isInSession &&
        workspaceState.currentSession &&
        workspaceState.currentSession.isolated
          ? "persist:" + user.username + "_" + workspaceState.currentSession.id
          : "persist:" + user.username + "_" + workspace.id;
    } else {
      _partition =
        sessionState.isInSession &&
        workspaceState.currentSession &&
        workspaceState.currentSession.isolated
          ? "persist:" + workspaceState.currentSession.id
          : "persist:" + workspace.id;
    }
    setPartition(_partition);
    if (widgetConfig && widgetConfig[workspaceId]) {
      setWidgets(widgetConfig[workspaceId].widgets);
      if (widgetConfig[workspaceId].widgets.length > 0) {
        dispatch(
          workspaceActions.setSelectedWidgetId(
            widgetConfig[workspaceId].widgets[0].id
          )
        );
      }
    }
  }, [widgetConfig]);

  useEffect(() => {
    log.debug("selectedWidgetId", selectedWidgetId);
    const _widgets = document.getElementsByClassName("widget");
    const _webviews = document.getElementsByClassName("widget-webview");
    for (let i = 0; i < _webviews.length; i++) {
      _webviews[i].classList.remove("selected");
    }
    for (let i = 0; i < _widgets.length; i++) {
      _widgets[i].classList.remove("selected");
    }

    const _widget = document.getElementById("widget-item-" + selectedWidgetId);
    const _webview = document.getElementById(
      "widget-webview-" + selectedWidgetId
    );
    if (_webview) {
      _webview.classList.add("selected");
      _widget.classList.add("selected");
    }
  }, [selectedWidgetId]);

  useEffect(() => {
    const spaceContainer = document.getElementById(props.id);

    if (spaceContainer) {
      if (isAIAssistantOpen) {
        spaceContainer.classList.add("chat-assistant-open");
      } else {
        spaceContainer.classList.remove("chat-assistant-open");
      }
    }
  }, [isAIAssistantOpen, props.id]);

  function onLayoutChange(layout) {
    log.debug("Layout changed", layout);
  }

  function onClickBackDrop() {
    const _space_top = document.getElementById("space-top");
    const _space_right = document.getElementById("space-right");
    //hide
    _space_top.classList.remove("d-none");
    _space_right.classList.remove("long");
    const _widgets = document.getElementsByClassName("widget");
    for (let i = 0; i < _widgets.length; i++) {
      if (_widgets[i].classList.contains("d-none")) {
        _widgets[i].classList.remove("d-none");
      } else {
        // @ts-expect-error TS(2339): Property 'style' does not exist on type 'Element'.
        _widgets[i].style.transform =
          "perspective(300px) rotateX(30deg) scale(0.9) translateY(0px) translateX(0px);";
      }
    }

    dispatch(workspaceActions.setSelectedWidgetId(0));

    setTimeout(() => {
      const widgetsRow = document.getElementById("widgets-row-id");
      const widgetsBackdrop = document.getElementById("widget-backdrop");
      widgetsRow.classList.remove("noscroll");
      widgetsBackdrop.classList.remove("active");
    }, 500);
  }

  function handleSelectApp(appId: string) {
    const app = openWindows[appId];
    if (app) {
      if (activeWindowId === appId) {
        dispatch(
          sessionActionsImport.goBackToPreviousWindow({
            data: {
              desktopId: desktop.id,
            },
          })
        );
        return;
      }
      if (app.location === "external") {
        openAppWindow(
          app.id,
          app.start_url,
          app.window_type,
          app.is_stateful,
          app.show_controls
        );
      } else {
        dispatch(sessionActionsImport.setActiveWindow({ data: app }));
        if (openWindows[app.id].sleeping === true) {
          dispatch(appActions.showSplashScreen({}));
          setTimeout(() => {
            dispatch(appActions.hideSplashScreen({}));
          }, 1000);
        }
      }
    }
  }

  function handleLaunchpadClick() {
    setIsLaunchpadActive(true);
    dispatch(
      sessionActionsImport.getBackToLaunchPad({
        data: {
          desktopId: desktop.id,
        },
      })
    );
  }

  function handleBrowserClick() {
    const homePage = "https://www.google.com/";
    activateBrowser(
      homePage,
      workspace,
      desktop,
      openWindows,
      items,
      isLocal,
      dispatch
    );
  }

  // Build apps array from open windows
  // Include workspace-specific apps and home workspace apps (always visible)
  const isHomeWorkspace = workspace.id === homeWorkspaceId;
  
  const filteredApps = Object.values(openWindows).filter(
    (window: any) => {
      const isValidType = window.type === "app" || window.type === "link" || window.type === "xapp";
      if (!isValidType) return false;
      
      // For xapp type, check desktop property; for others, check workspace property
      if (window.type === "xapp") {
        // In home workspace, show only home workspace apps
        if (isHomeWorkspace) {
          return window.desktop === homeWorkspaceId;
        }
        // In other workspaces, show both current workspace apps and home workspace apps
        return window.desktop === homeWorkspaceId || window.desktop === workspace.id;
      }
      
      // In home workspace, show only home workspace apps
      if (isHomeWorkspace) {
        return window.workspace === homeWorkspaceId;
      }
      // In other workspaces, show both current workspace apps and home workspace apps
      return window.workspace === workspace.id || window.workspace === homeWorkspaceId;
    }
  );

  // Get home workspace app IDs to mark them with badge
  const homeAppIds = Object.values(openWindows)
    .filter((window: any) => {
      if (window.type === "xapp") {
        return window.desktop === homeWorkspaceId;
      }
      return window.workspace === homeWorkspaceId;
    })
    .map((window: any) => window.id);

  // Sort apps: home apps first, then regular apps
  const sortedApps = [...filteredApps].sort((a: any, b: any) => {
    const aIsHome = homeAppIds.includes(a.id);
    const bIsHome = homeAppIds.includes(b.id);
    
    // If both are home or both are not, maintain original order
    if (aIsHome === bIsHome) return 0;
    
    // Home apps come first
    return aIsHome ? -1 : 1;
  });
  
  const apps: any[] = sortedApps;

  // Calculate browser tabs count
  const browserTabsCount = Object.values(openTabs).filter(
    (tab: any) => tab.type === "browser" && tab.workspace === workspace.id
  ).length;

  return (
    <>
      {activeTabId === "launchpad" && (
        <div
          id={props.id}
          className={`w-100 space-container ${isAIAssistantOpen ? 'chat-assistant-open' : ''}`}
        >
          <DesktopMenu />
          <div className={`desktop-top-controls d-flex justify-content-center align-items-center ${isAIAssistantOpen ? 'chat-assistant-open' : ''}`}>

            <Button
              color="dark"
              onClick={() => dispatch(aiAppsActions.toggle("ai"))}
              className="chat-assistant-button"
              title="AI Assistant"
            >
              <Robot size={16} />
            </Button>
          </div>
          <div
            id="desktop-body"
            className="d-flex flex-column justify-content-between align-items-center w-100 space-body scaled"
          >
            <div
              id="space-top"
              className="d-flex flex-column justify-content-center space-top"
            >
              <div className="d-flex justify-content-center">
                <DateTime />
              </div>
              <div className="d-flex w-100 justify-content-center">
                {isLaunchpadActive ? (
                  <SearchBar id="searchBar" />
                ) : (
                  <></>
                )}
              </div>
            </div>

            <div
              id="space-right"
              className="d-flex justify-content-center align-items-center space-right p-0"
            >
              <div 
                id="launchpad-idx" 
                className={`launchpad-desktop ${!isLaunchpadActive ? 'd-none' : ''}`}
              >
                <div className="container-fluid launchpad-container">
                  {isDesktopsEnabled ? (
                    <div className="row">
                      <div className="col">
                        <div className="d-flex justify-content-center mt-3">
                          {isDesktopsEnabled ? (
                            <span
                              className="desktop-name"
                              onClick={() => toggleRenameDesktopModalWindow()}
                            >
                              {name}
                            </span>
                          ) : (
                            <span className="desktop-name">
                              {" "}
                              <br />{" "}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <></>
                  )}
                  <div className="row">
                    <div className="col">
                      <LaunchPadBody />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pages-wrapper d-none">
                <Pages onLaunchpadActive={setIsLaunchpadActive} />
              </div>
              <div className="d-none">
                <div
                  id="widget-backdrop"
                  className="widget-backdrop"
                  onClick={() => onClickBackDrop()}
                ></div>
                <div className="container-fluid h-100 widgets-container">
                  <div
                    id="widgets-row-id"
                    className="row widgets-row w-100 h-100 d-flex justify-content-center align-items-start"
                  >
                    {widgets.map((widget) => {
                      return partition !== "" ? (
                        <Widget
                          key={widget.id}
                          id={widget.id}
                          name={widget.name}
                          url={widget.url}
                          partition={partition}
                        />
                      ) : (
                        <></>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <SpaceStatsWidget />
        </div>
      )}
      
      <AppsOverlayMenu
        apps={apps}
        activeWindowId={activeWindowId}
        onSelectApp={handleSelectApp}
        onLaunchpadClick={handleLaunchpadClick}
        onBrowserClick={handleBrowserClick}
        isLaunchpadActive={isLaunchpadActive}
        browserTabsCount={browserTabsCount}
        homeAppIds={homeAppIds}
      />
    </>
  );
}

export default Desktop;
