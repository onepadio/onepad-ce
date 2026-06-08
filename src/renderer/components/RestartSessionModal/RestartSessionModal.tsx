import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import { WorkspaceService } from "../../services/workspace";
import BrowserStateService from "../../services/browsers";
import { SpaceService } from "../../services/space";

import { modalActions } from "../../store/modal-slice";
import { sessionActions } from "../../store/session-slice";

import { Button } from "reactstrap";
import Modal from "../lib/Modal";
import "./RestartSessionModal.css";

function RestartSessionModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const isRestartSessionModalOpen = useSelector(
    (state: any) => state.modal.isRestartSessionModalOpen
  );

  const selectedWorkspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const browserWindows = useSelector((state: any) => state.session.browserWindows);
  const activeBrowserWindowId = useSelector((state: any) => state.session.activeBrowserWindowId);
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  function toggle() {
    dispatch(modalActions.closeRestartSessionModal());
  }

  async function handleRestartSession() {
    try {
      const targetWorkspaceId = selectedWorkspace.id;
      
      // First, go back to launchpad
      if (desktop?.id) {
        dispatch(sessionActions.getBackToLaunchPad({
          data: {
            desktopId: desktop.id,
          }
        }));
      }

      // Get all browser windows for this workspace
      const workspaceBrowserWindows: string[] = [];
      if (browserWindows && Array.isArray(browserWindows)) {
        browserWindows.forEach((windowId: string) => {
          if (openWindows[windowId] && 
              openWindows[windowId].workspace === targetWorkspaceId) {
            workspaceBrowserWindows.push(windowId);
          }
        });
      }

      // Close all external browser windows and tabs for this workspace
      if (workspaceBrowserWindows.length > 0) {
        BrowserStateService.closeExternalWindowsAndTabs(workspaceBrowserWindows, openTabs);
      }

      // Delete any existing paused session data
      await SpaceService.deletePausedSession(targetWorkspaceId);

      // Clear the workspace state in the database (empty state)
      // This resets the default session but keeps saved sessions intact
      await WorkspaceService.saveState(targetWorkspaceId, {
        desktop: selectedWorkspace.state.desktop,
        openWindows: {},
        browserWindows: [],
        openTabs: {},
        windowTabs: {},
        activeDesktopWindows: {},
        activeTabs: {},
        activeTab: { id: "launchpad" },
        activeTabId: "launchpad",
        activeWindow: { id: "launchpad", data: {}, tabs: [{ id: "launchpad" }] },
        activeWindowId: "launchpad",
        activeWindowTabs: [],
        activeBrowserWindowId: "",
        sessions: selectedWorkspace.state.sessions || [], // Preserve saved sessions
        currentSession: {},
      });

      // Clear browser state from database
      await BrowserStateService.deleteBrowserStateByWorkspaceId(targetWorkspaceId);

      // Remove all tabs and windows for this workspace from Redux state
      const _openTabs: { [key: string]: any } = {};
      const _openWindows: { [key: string]: any } = {};
      const _windowTabs: { [key: string]: any } = { ...windowTabs };
      const _activeTabs: { [key: string]: any } = { ...activeTabs };

      // Keep only tabs that DON'T belong to this workspace
      Object.entries(openTabs).forEach(([tabId, tab]: [string, any]) => {
        if (!(tab.workspace === targetWorkspaceId && tab.type !== "xapp")) {
          _openTabs[tabId] = tab;
        }
      });

      // Keep only windows that DON'T belong to this workspace
      Object.entries(openWindows).forEach(([windowId, window]: [string, any]) => {
        if (!(window.workspace === targetWorkspaceId && window.id !== undefined)) {
          _openWindows[windowId] = window;
        } else {
          // Also remove related windowTabs and activeTabs
          delete _windowTabs[windowId];
          delete _activeTabs[windowId];
        }
      });

      // Remove browser windows that belong to this workspace
      const _browserWindows: string[] = [];
      if (browserWindows && Array.isArray(browserWindows)) {
        browserWindows.forEach((windowId: string) => {
          if (!workspaceBrowserWindows.includes(windowId)) {
            _browserWindows.push(windowId);
          }
        });
      }

      // Clear activeBrowserWindowId if it belongs to the restarted workspace
      let _activeBrowserWindowId = activeBrowserWindowId;
      if (workspaceBrowserWindows.includes(_activeBrowserWindowId)) {
        _activeBrowserWindowId = "";
      }

      // Update Redux store - tabs and windows are now REMOVED
      dispatch(sessionActions.setOpenTabs({ data: _openTabs }));
      dispatch(sessionActions.setOpenWindows({ data: _openWindows }));
      dispatch(sessionActions.setWindowTabs({ data: _windowTabs }));
      dispatch(sessionActions.setActiveTabs({ data: _activeTabs }));
      dispatch(sessionActions.setBrowserWindows({ data: _browserWindows }));
      if (_activeBrowserWindowId !== activeBrowserWindowId) {
        dispatch(sessionActions.setActiveBrowserWindowId({ data: _activeBrowserWindowId }));
      }

      toggle();

      // Stay on the current workspace, just with empty state
      log.info("Session restarted successfully");
    } catch (err) {
      log.error("Error restarting session:", err);
      alert("Error restarting session. Please try again.");
    }
  }

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="Restart Session?"
        className="restart-session-modal"
        show={isRestartSessionModalOpen}
        onClose={() => toggle()}
      >
        <div className="restart-session-content">
          <p className="mb-3">
            This will close all current tabs and windows and return you to a clean workspace.
          </p>
          <p className="mb-3">
            <strong>Your saved tasks will not be affected.</strong>
          </p>
          <p className="mb-0">
            Are you sure you want to restart?
          </p>
        </div>

        <Button color="primary" onClick={handleRestartSession}>
          Restart
        </Button>{" "}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default RestartSessionModal;
