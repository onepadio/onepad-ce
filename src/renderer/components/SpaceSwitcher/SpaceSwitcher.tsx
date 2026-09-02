import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Stage, Layer, Rect, Text } from "react-konva";
import log from "loglevel";
import "./SpaceSwitcher.css";
import { WorkspaceService } from "../../services/workspace";
import { UsersService } from "../../services/users";
import {
  processOpenTabsBeforePersist,
  processWindows,
} from "../../services/window";
import { House } from "react-bootstrap-icons";

function SpaceSwitcher() {
  const dispatch = useDispatch();

  const workspaces = useSelector((state: any) => state.workspace.workspaces);
  const currentWorkspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const homeWorkspaceId = useSelector((state: any) => state.user.homeWorkspace);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const activeDesktopWindows = useSelector(
    (state: any) => state.session.activeDesktopWindows
  );
  const activeTab = useSelector((state: any) => state.session.activeTab);
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const activeWindow = useSelector((state: any) => state.session.activeWindow);
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  const activeWindowTabs = useSelector((state: any) => state.session.activeWindowTabs);
  const activeBrowserWindowId = useSelector((state: any) => state.session.activeBrowserWindowId);
  const sessions = useSelector((state: any) => state.workspace.sessions);
  const userId = useSelector((state: any) => state.user.id);
  const workspaceState = useSelector((state: any) => state.workspace);
  const sessionStateData = useSelector((state: any) => state.session);

  // Check if a workspace has active tabs/windows
  const isActiveSpace = (workspaceId: string) => {
    const hasActiveTabs = Object.values(openTabs).some(
      (tab: any) => tab.workspace === workspaceId && tab.type !== "xapp"
    );

    const hasActiveWindows = Object.values(openWindows).some(
      (window: any) =>
        window.workspace === workspaceId && window.id !== undefined
    );

    return hasActiveTabs || hasActiveWindows;
  };

  // Get only active workspaces
  const activeWorkspaces = workspaces.filter((workspace: any) =>
    isActiveSpace(workspace.id)
  );

  const handleWorkspaceSwitch = (workspaceId: string) => {
    if (workspaceId === currentWorkspace.id) {
      return;
    }

    let _openTabs = processOpenTabsBeforePersist(
      currentWorkspace.id,
      openTabs
    );
    let _sessions: any = [];
    sessions.forEach((session: any) => {
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
      activeTab: activeTab,
      activeTabId: activeTabId,
      activeWindow: activeWindow,
      activeWindowId: activeWindowId,
      activeWindowTabs: activeWindowTabs,
      activeBrowserWindowId: activeBrowserWindowId,
      sessions: _sessions,
      currentSession: {},
    })
      .then((id) => {
        WorkspaceService.selectWorkspaceById(
          dispatch,
          workspaceId,
          workspaceState,
          sessionStateData,
          { restoreLastActive: true }
        );
        UsersService.setLastWorkspace(userId, workspaceId);
      })
      .catch((err) => {
        log.error("onWorkspaceSwitch", err);
      });
  };

  const handleHomeClick = () => {
    if (homeWorkspaceId) {
      handleWorkspaceSwitch(homeWorkspaceId);
    }
  };

  const renderSpaceIcon = (workspace: any) => {
    const isActive = workspace.id === currentWorkspace.id;

    if (workspace.config && workspace.config.iconType === "image") {
      return (
        <div
          className={`space-switcher-icon ${isActive ? "active" : ""}`}
          onClick={() => handleWorkspaceSwitch(workspace.id)}
          title={workspace.name}
        >
          <img
            width={28}
            height={28}
            className="space-icon-img"
            src={workspace.config.icon}
            alt={workspace.name}
          />
        </div>
      );
    } else {
      const color =
        workspace.config && workspace.config.color
          ? workspace.config.color
          : "#" +
            (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, "0");

      const alias =
        workspace.config && workspace.config.alias
          ? workspace.config.alias
          : workspace.name.toUpperCase().slice(0, 2);

      return (
        <div
          className={`space-switcher-icon ${isActive ? "active" : ""}`}
          onClick={() => handleWorkspaceSwitch(workspace.id)}
          title={workspace.name}
        >
          <Stage width={28} height={28}>
            <Layer>
              <Rect
                x={0}
                y={0}
                width={28}
                height={28}
                fill={color}
                cornerRadius={4}
              />
            </Layer>
            <Layer>
              <Text
                x={0}
                y={6}
                width={28}
                align="center"
                text={alias}
                fontSize={14}
                fill="white"
                fontStyle="bold"
              />
            </Layer>
          </Stage>
        </div>
      );
    }
  };

  return (
    <div className="space-switcher-container">
      <div
        className={`space-switcher-icon home-button ${currentWorkspace.id === homeWorkspaceId ? "active" : ""}`}
        onClick={handleHomeClick}
        title="Home"
      >
        <div className="space-switcher-home-icon">
          <House color="white" size={20} />
        </div>
      </div>
      {activeWorkspaces.filter((workspace: any) => workspace.id !== homeWorkspaceId).map((workspace: any) => (
        <React.Fragment key={workspace.id}>
          {renderSpaceIcon(workspace)}
        </React.Fragment>
      ))}
    </div>
  );
}

export default SpaceSwitcher;
