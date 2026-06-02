import isElectron from "is-electron";

import React, { useRef } from "react";
import { useSelector, useDispatch } from "react-redux";

import log from "loglevel";
import { v4 as uuidv4 } from "uuid";
import * as Icon from "react-feather";
import clsx from "clsx";

import { Stage, Layer, Circle, Text, Rect } from "react-konva";

import "./SpaceIcon.css";
import {
  processOpenTabsBeforePersist,
  processWindows,
} from "../../services/window";
import { WorkspaceService } from "../../services/workspace";
import { UsersService } from "../../services/users";

function SpaceIcon(props) {
  const dispatch = useDispatch();
  
  const items = useSelector((state: any) => state.workspace.apps);
  
  const isLaunchPadOpen = useSelector((state: any) => state.modal.isLaunchPadOpen);
  const isExternalWindowMode = useSelector(
    
    (state: any) => state.settings.isExternalWindowMode
  );
  
  const isLocal = useSelector((state: any) => state.workspace.isLocal);
  
  const sessionState = useSelector((state: any) => state.session);
  
  const openWindows = useSelector((state: any) => state.session.openWindows);
  
  const workspaceState = useSelector((state: any) => state.workspace);

  
  const sessionStateData = useSelector((state: any) => state.session);

  
  const personId = useSelector((state: any) => state.app.personId);
  
  const userId = useSelector((state: any) => state.user.id);
  
  const isOpen = useSelector((state: any) => state.spaceSideBar.isOpen);
  const isSplitWindowsEnabled = useSelector(
    
    (state: any) => state.settings.isSplitWindowsEnabled
  );
  
  const workspaces = useSelector((state: any) => state.workspace.workspaces);
  const recentWorkspaces = useSelector(
    
    (state: any) => state.workspace.recentWorkspaces
  );
  const currentWorkspace = useSelector(
    
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
  
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  
  const openTabs = useSelector((state: any) => state.session.openTabs);


  function handleOnClick() {
    if (props.id === currentWorkspace.id){
      props.toggle();
      return;
    }
    let _openTabs = processOpenTabsBeforePersist(currentWorkspace.id, openTabs);
    let _sessions = [];
    sessions.forEach((session) => {
      _sessions.push({
        id: session.id,
        name: session.name,
      });
    });

    let _windows = processWindows(
      currentWorkspace.id,
      openWindows,
      windowTabs,
      activeTabs,
      openTabs
    );

    WorkspaceService.saveState(currentWorkspace.id, {
      desktop: currentWorkspace.state.desktop,
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
          props.id,
          workspaceState,
          sessionStateData
        );
        UsersService.setLastWorkspace(userId, props.id);
      })
      .catch((err) => {
        log.error("onWorkspaceSelect", err);
      });
  }

  function icon() {
    let _workspace = workspaceState.workspaces.find((w) => w.id === props.id);

    if (_workspace.config && _workspace.config.iconType === "image") {
      return (
        <img
          width={48}
          className="web-icon"
          src={_workspace.config.icon}
          alt=""
          onClick={() => handleOnClick()}
        />
      );
    } else {
      return (
                // @ts-expect-error Konva Stage children type issue
                <Stage
          width={36}
          height={36}
          onClick={() => handleOnClick()}
        >
          <Layer>
            <Rect
              x={2}
              y={2}
              width={34}
              height={34}
              fill={
                _workspace.config && _workspace.config.color
                  ? _workspace.config.color
                  : "#" +
                    (((1 << 24) * Math.random()) | 0)
                      .toString(16)
                      .padStart(6, "0")
              }
              shadowBlur={10}
              cornerRadius={5}
            />
          </Layer>
          <Layer>
            <Text
              x={4}
              y={10}
              text={
                _workspace.config && _workspace.config.alias
                  ? _workspace.config.alias
                  : _workspace.name.toUpperCase().slice(0, 2)
              }
              fontSize={22}
              fill="white"
            />
          </Layer>
        </Stage>
      );
    }
  }

  return (
    <div
      className={clsx("space-icon-container")}
      draggable
      onContextMenu={(e) => {
        e.preventDefault(); // prevent the default behaviour when right clicked
        if (props.isOpen) {
          alert(
            "Please close the window first. After that you can edit the app."
          );
          return;
        }
      }}
    >
      <div
        className={clsx(
          "card p-2 text-center launch-item" +
            (openWindows[props.id] != null ? "" : "")
        )}
        onClick={() => handleOnClick()}
      >
        {}
        <div className="appicon d-flex justify-content-center">
          <div className="d-flex justify-content-center align-items-center w-100">
            {icon()}
          </div>
          {}
          <div className="icon-middle">
            {}
            <div className="icon-text">{props.name}</div>
          </div>
        </div>
        <div className="mt-1">
          {}
          <span className={"icon-text"}>{props.name}</span>
        </div>
      </div>
    </div>
  );
}

export default SpaceIcon;
