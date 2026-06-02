import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";

import "./SpacePad.css";

import { Button } from "reactstrap";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import {
  Grid,
  PlusCircle,
} from "react-bootstrap-icons";

import { WorkspaceService } from "../../services/workspace";
import { UsersService } from "../../services/users";
import {
  processOpenTabsBeforePersist,
  processWindows,
} from "../../services/window";
import SpaceIcon from "./SpaceIcon";

function SpacePad(props: any) {
  const dispatch = useDispatch();
  
  const sessionStateData = useSelector((state: any) => state.session);
  
  const workspaceState = useSelector((state: any) => state.workspace);

  
  const personId = useSelector((state: any) => state.app.personId);
  
  const profileId = useSelector((state: any) => state.app.profileId);
  
  const userId = useSelector((state: any) => state.user.id);
  
  const isOpen = useSelector((state: any) => state.modal.isSpacePadOpen);
  const isSplitWindowsEnabled = useSelector(
    
    (state: any) => state.settings.isSplitWindowsEnabled
  );
  
  const workspaces = useSelector((state: any) => state.workspace.workspaces);
  const recentWorkspaces = useSelector(
    
    (state: any) => state.workspace.recentWorkspaces
  );
  
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const selectedWorkspace = useSelector(
    
    (state: any) => state.workspace.selectedWorkspace
  );
  
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  
  const desktopNames = useSelector((state: any) => state.workspace.desktopNames);
  
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  
  const activeTab = useSelector((state: any) => state.session.activeTab);
  
  const activeWindow = useSelector((state: any) => state.session.activeWindow);
  
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const activeWindowTabs = useSelector(
    
    (state: any) => state.session.activeWindowTabs
  );
  const activeDesktopWindows = useSelector(
    
    (state: any) => state.session.activeDesktopWindows
  );
  
  const browserWindows = useSelector((state: any) => state.session.browserWindows);
  const activeBrowserWindowId = useSelector(
    
    (state: any) => state.session.activeBrowserWindowId
  );
  
  const sessions = useSelector((state: any) => state.workspace.sessions);

  
  const version = useSelector((state: any) => state.app.version);
  
  const platform = useSelector((state: any) => state.app.platform);
  
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  
  const openTabs = useSelector((state: any) => state.session.openTabs);

  const [sideBarId, setSideBarId] = useState(uuidv4());
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    log.debug("Selected tab: " + tabIndex);
    switch (tabIndex) {
      case 0:
        log.debug("Selected Apps tab");
        dispatch(workspaceActions.selectCategory({ category: "apps" }));
        break;
      case 1:
        //dispatch(workspaceActions.selectCategory({ category: "links" }));
        log.debug("Selected Remote tab");
        break;
      default:
        dispatch(workspaceActions.selectCategory({ category: "none" }));
        log.debug("Selected unknown tab");
    }
  }, [tabIndex]);

  useEffect(() => {
    const _spacePad = document.getElementById("spacepad-id");
    const _backdrop = document.getElementById("spacepad-backdrop");
    if (!_spacePad || !_backdrop) return;

    if (isOpen) {
      _spacePad.style.display = "block";
      _backdrop.style.display = "block";
    } else {
      _spacePad.style.display = "none";
      _backdrop.style.display = "none";
    }
  }, [isOpen]);


  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      workspaces.forEach((workspace: any) => {
        if (!workspace.config) {
          WorkspaceService.updateConfig(workspace.id, {
            iconType: "color",
            color:
              "#" +
              (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, "0"),
            alias:
              workspace.name.split(" ").length > 1
                ? workspace.name.split(" ")[0].toUpperCase().slice(0, 1) +
                  workspace.name.split(" ")[1].toUpperCase().slice(0, 1)
                : workspace.name.toUpperCase().slice(0, 2),
          })
            .then((id) => {
              log.debug("updateWorkspaceState", id);
            })
            .catch((err) => {
              log.error(err);
            });
        }
      });
    }
    return () => {
      log.debug("SpaceSideBar cleanup");
    };
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId === "") {
      return;
    }

    let _openTabs = processOpenTabsBeforePersist(selectedWorkspace.id, openTabs);
    let _sessions: any = [];
    sessions.forEach((session: any) => {
      _sessions.push({
        id: session.id,
        name: session.name,
      });
    });

    let _windows = processWindows(
      selectedWorkspace.id,
      openWindows,
      windowTabs,
      activeTabs,
      openTabs
    );

    WorkspaceService.saveState(selectedWorkspace.id, {
      desktop: selectedWorkspace.state.desktop,
      openWindows: _windows.openWindows,
      browserWindows: [],
      openTabs: _openTabs,
      windowTabs: _windows.windowTabs,
      activeDesktopWindows: activeDesktopWindows,
      activeTabs: _windows.activeTabs,
      activeTab: { id: "launchpad" },
      activeTabId: "launchpad",
      activeWindow: { id: "launchpad" },
      activeWindowId: "launchpad",
      activeWindowTabs: [],
      activeBrowserWindowId: "",
      sessions: _sessions,
      currentSession: {},
    })
      .then((id) => {
        WorkspaceService.selectWorkspaceById(
          dispatch,
          selectedWorkspaceId,
          workspaceState,
          sessionStateData
        );
        UsersService.setLastWorkspace(userId, selectedWorkspaceId);
        setSelectedWorkspaceId("");
      })
      .catch((err) => {
        log.error("onWorkspaceSelect", err);
      });
  }, [selectedWorkspaceId]);

  return <>
    <div
      id="spacepad-backdrop"
      className="spacepad-backdrop"
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      onClick={() => dispatch(modalActions.hideSpacePad())}
    ></div>
    <div
      id="spacepad-id"
      className="spacepad"
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      onMouseEnter={() => dispatch(modalActions.showSpacePad())}
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      onMouseLeave={() => dispatch(modalActions.hideSpacePad())}
    >
      <div className="add-space-button">
        <Button color="primary" onClick={() => {
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            dispatch(modalActions.hideSpacePad())
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            dispatch(modalActions.toggleNewWorkspaceModal())
          }
        }>
          <PlusCircle />
        </Button>
      </div>
      <div className="container-fluid spacepad-container">
        {}
        <div className="row">
          {}
          <div className="col">
            <Tabs
              className="container-fluid spacepad-tabs"
              defaultFocus={true}
              selectedIndex={tabIndex}
              onSelect={(index) => setTabIndex(index)}
            >
              <TabList>
                <Tab>
                  <div
                    id="myApps"
                    className="d-flex align-items-center myApps"
                  >
                    <Grid className="mr-2" />
                    <span>Spaces</span>
                  </div>
                </Tab>
              </TabList>
              <TabPanel>
                {}
                <div className="container-fluid position-absolute start-0 icons-tab">
                  <div className="row icons w-100">

                          
                          {workspaces.map((workspace: any) => {
                              return (
                                  <SpaceIcon 
                                      key={workspace.id} 
                                      id={workspace.id}
                                      name={workspace.name}
                                      config={workspace.config}
                                      toggle={() => {
                                        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                                        dispatch(modalActions.hideSpacePad());
                                      }}
                                  />
                              )
                          })}
                  </div>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  </>;
}

export default SpacePad;
