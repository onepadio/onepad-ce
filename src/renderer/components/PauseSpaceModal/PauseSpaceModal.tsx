import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import { SpaceService } from "../../services/space";
import { SessionService } from "../../services/session";
import { WorkspaceService } from "../../services/workspace";
import BrowserStateService from "../../services/browsers";

import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from "../../store/workspace-slice";
import { sessionActions } from "../../store/session-slice";

import { processWindows, processOpenTabsBeforePersist } from "../../services/window";

import { 
  Button, 
  Form, 
  FormGroup, 
  Label, 
  Input,
} from "reactstrap";
import Modal from "../lib/Modal";
import "./PauseSpaceModal.css";

function PauseSpaceModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const isPauseSpaceModalOpen = useSelector(
    (state: any) => state.modal.isPauseSpaceModalOpen
  );

  const pauseSpaceWorkspaceId = useSelector(
    (state: any) => state.modal.pauseSpaceWorkspaceId
  );

  const pauseSpaceDefaultOption = useSelector(
    (state: any) => state.modal.pauseSpaceDefaultOption
  );

  const selectedWorkspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  
  // Determine which workspace to pause - either from modal state or current workspace
  const targetWorkspaceId = pauseSpaceWorkspaceId || selectedWorkspace?.id;
  const workspaces = useSelector((state: any) => state.workspace.workspaces);
  const targetWorkspace = workspaces.find((w: any) => w.id === targetWorkspaceId) || selectedWorkspace;
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const activeDesktopWindows = useSelector((state: any) => state.session.activeDesktopWindows);
  const activeTab = useSelector((state: any) => state.session.activeTab);
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const activeWindow = useSelector((state: any) => state.session.activeWindow);
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  const activeWindowTabs = useSelector((state: any) => state.session.activeWindowTabs);
  const stateData = useSelector((state: any) => state.session);
  const sessions = useSelector((state: any) => state.workspace.sessions);
  const isInSession = useSelector((state: any) => state.session.isInSession);
  const currentSession = useSelector((state: any) => state.workspace.currentSession);
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const browserWindows = useSelector((state: any) => state.session.browserWindows);
  const activeBrowserWindowId = useSelector((state: any) => state.session.activeBrowserWindowId);

  const [pauseOption, setPauseOption] = useState<"saveAsTask" | "justPause" | "closeWithoutSaving">(
    pauseSpaceDefaultOption || "justPause"
  );
  const [taskName, setTaskName] = useState("");

  // Update pauseOption when modal opens with a default option
  React.useEffect(() => {
    if (isPauseSpaceModalOpen && pauseSpaceDefaultOption) {
      setPauseOption(pauseSpaceDefaultOption);
    }
  }, [isPauseSpaceModalOpen, pauseSpaceDefaultOption]);

  function toggle() {
    refresh();
    dispatch(modalActions.closePauseSpaceModal());
  }

  function refresh() {
    setPauseOption(pauseSpaceDefaultOption || "justPause");
    setTaskName("");
  }

  async function saveWorkspace(){
    let _openTabs = Object.assign({}, openTabs);
    Object.values(_openTabs).forEach((tab: any) => {
        let _tab = Object.assign({}, tab);
        _tab.location = "main";
        _tab.sleeping = true;
        
        _openTabs[tab.id] = _tab;
    });
    let _sessions: any = [];
    sessions.forEach((session: any) => {
        _sessions.push({
            id: session.id,
            name: session.name,
        });
    });
    let workspaceId = await WorkspaceService.saveState(selectedWorkspace.id, {
      desktop: selectedWorkspace.state.desktop,
      openWindows: openWindows,
      openTabs: _openTabs,
      windowTabs: windowTabs,
      activeDesktopWindows: activeDesktopWindows,
      activeTabs: activeTabs,
      activeTab: activeTab,
      activeTabId: activeTabId,
      activeWindow: activeWindow,
      activeWindowId: activeWindowId,
      activeWindowTabs: activeWindowTabs,
      activeBrowserWindowId: stateData.activeBrowserWindowId,
      sessions: _sessions,
      currentSession: {},
    });

    return workspaceId;
  }

  // Helper function to find another active workspace after pausing
  function findNextActiveWorkspace() {
    // After pause, the paused workspace's tabs/windows will be removed from Redux
    // So we need to check CURRENT state for other workspaces
    const otherWorkspaces = new Set<string>();
    
    // Check tabs for other workspaces
    Object.values(openTabs).forEach((tab: any) => {
      if (tab.workspace && tab.workspace !== targetWorkspaceId && tab.type !== "xapp") {
        otherWorkspaces.add(tab.workspace);
      }
    });
    
    // Check windows for other workspaces
    Object.values(openWindows).forEach((window: any) => {
      if (window.workspace && window.workspace !== targetWorkspaceId && window.id !== undefined) {
        otherWorkspaces.add(window.workspace);
      }
    });
    
    // Return first found workspace, or null if none
    const workspaceIds = Array.from(otherWorkspaces);
    if (workspaceIds.length > 0) {
      // Find the workspace object
      return workspaces.find((w: any) => w.id === workspaceIds[0]);
    }
    
    return null;
  }

  async function handleContinue() {
    // If pausing the currently active space, go to launchpad first
    const isPausingActiveSpace = targetWorkspaceId === selectedWorkspace?.id;
    
    if (isPausingActiveSpace && desktop?.id) {
      dispatch(sessionActions.getBackToLaunchPad({
        data: {
          desktopId: desktop.id,
        }
      }));
    }

    // Handle close without saving option
    if (pauseOption === "closeWithoutSaving") {
      try {
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
          sessions: [],
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

        // Clear activeBrowserWindowId if it belongs to the closed workspace
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

        // Find another active workspace to switch to
        const otherWorkspaces = new Set<string>();
        
        // Check remaining tabs for other workspaces
        Object.values(_openTabs).forEach((tab: any) => {
          if (tab.workspace && tab.workspace !== targetWorkspaceId && tab.type !== "xapp") {
            otherWorkspaces.add(tab.workspace);
          }
        });
        
        // Check remaining windows for other workspaces
        Object.values(_openWindows).forEach((window: any) => {
          if (window.workspace && window.workspace !== targetWorkspaceId && window.id !== undefined) {
            otherWorkspaces.add(window.workspace);
          }
        });
        
        // Navigate to another workspace or spaces screen
        const workspaceIds = Array.from(otherWorkspaces);
        if (workspaceIds.length > 0) {
          const nextWorkspace = workspaces.find((w: any) => w.id === workspaceIds[0]);
          if (nextWorkspace) {
            dispatch(workspaceActions.selectWorkspace({ workspace: nextWorkspace }));
          } else {
            navigate("/spaces");
          }
        } else {
          navigate("/spaces");
        }
      } catch (err) {
        log.error("Error closing space:", err);
        alert("Error closing space. Please try again.");
      }
      return;
    }
    
    if (isInSession) {
      // If already in a session/task, save it and pause
      const currentSessionData = {
        openWindows: openWindows,
        browserWindows: [],
        openTabs: openTabs,
        windowTabs: windowTabs,
        activeDesktopWindows: activeDesktopWindows,
        activeTabs: activeTabs,
        activeTab: activeTab,
        activeTabId: activeTabId,
        activeWindow: activeWindow,
        activeWindowId: activeWindowId,
        activeWindowTabs: activeWindowTabs,
        activeBrowserWindowId: stateData.activeBrowserWindowId,
      };
      
      SessionService.saveState(currentSession.id, currentSessionData).then(async () => {
        // Pause space and save as paused session
        await SpaceService.pauseSpaceAsSession(targetWorkspaceId, stateData, dispatch);
        toggle();
        
        // If pausing the currently active space, navigate appropriately
        if (isPausingActiveSpace) {
          const nextWorkspace = findNextActiveWorkspace();
          if (nextWorkspace) {
            // Switch to another active workspace
            dispatch(workspaceActions.selectWorkspace({ workspace: nextWorkspace }));
          } else {
            // No other active workspaces, go to space selection
            navigate("/spaces");
          }
        }
      }).catch((err) => {
        log.error("Error saving session:", err);
      });
    } else {
      // Not in a session
      if (pauseOption === "saveAsTask") {
        if (taskName.length < 1) {
          alert("Please enter a task name.");
          return;
        }

        // Create a new task from current work
        saveWorkspace().then(async (workspaceId) => {
          log.debug("WorkspaceID", workspaceId);
          SessionService.newSession(taskName, targetWorkspaceId, false, false).then(async (sessionId) => {
            SessionService.getSessionsByWorkspaceId(targetWorkspaceId).then(async (sessions: any) => {
              dispatch(workspaceActions.setSessions({ data: sessions }));
              
              // Pause the space and save as paused session
              await SpaceService.pauseSpaceAsSession(targetWorkspaceId, stateData, dispatch);
              toggle();
              
              // If pausing the currently active space, navigate appropriately
              if (isPausingActiveSpace) {
                const nextWorkspace = findNextActiveWorkspace();
                if (nextWorkspace) {
                  // Switch to another active workspace
                  dispatch(workspaceActions.selectWorkspace({ workspace: nextWorkspace }));
                } else {
                  // No other active workspaces, go to space selection
                  navigate("/spaces");
                }
              }
            });
          });
        });
      } else {
        // Just pause - save as paused session
        SpaceService.pauseSpaceAsSession(targetWorkspaceId, stateData, dispatch).then(() => {
          toggle();
          
          // If pausing the currently active space, navigate appropriately
          if (isPausingActiveSpace) {
            const nextWorkspace = findNextActiveWorkspace();
            if (nextWorkspace) {
              // Switch to another active workspace
              dispatch(workspaceActions.selectWorkspace({ workspace: nextWorkspace }));
            } else {
              // No other active workspaces, go to space selection
              navigate("/spaces");
            }
          }
        }).catch((err) => {
          log.error("Error pausing space:", err);
        });
      }
    }
  }

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading={pauseOption === "closeWithoutSaving" ? `Close ${targetWorkspace?.name || 'Space'}` : `Pause ${targetWorkspace?.name || 'Space'}`}
        className="pause-space-modal"
        show={isPauseSpaceModalOpen}
        onClose={() => toggle()}
      >
        <div className="pause-space-content">
          <p className="mb-3">
            {pauseOption === "closeWithoutSaving" 
              ? "What would you like to do with this space?" 
              : "You have active work. What would you like to do?"}
          </p>
          
          <Form>
            <FormGroup className="align-left">
              {!isInSession && (
                <>
                  <div className="mb-3">
                    <Label check>
                      <Input
                        type="radio"
                        name="pauseOption"
                        checked={pauseOption === "saveAsTask"}
                        onChange={() => setPauseOption("saveAsTask")}
                      />{" "}
                      Save as a new task (you can resume it later)
                    </Label>
                  </div>
                  
                  {pauseOption === "saveAsTask" && (
                    <FormGroup className="ml-4 mb-3">
                      <Label for="taskName">Task Name</Label>
                      <Input
                        id="taskName"
                        name="taskName"
                        placeholder="e.g., Client Work, Personal"
                        type="text"
                        value={taskName}
                        onChange={(e) => {
                          if (e.target.value.length > 20) {
                            alert("Task name must be less than 20 characters.");
                            return;
                          }
                          setTaskName(e.target.value);
                        }}
                      />
                    </FormGroup>
                  )}
                </>
              )}

              <div className="mb-3">
                <Label check>
                  <Input
                    type="radio"
                    name="pauseOption"
                    checked={pauseOption === "justPause"}
                    onChange={() => setPauseOption("justPause")}
                  />{" "}
                  {isInSession 
                    ? "Pause and save current task" 
                    : "Just pause (you'll return to base workspace)"}
                </Label>
              </div>

              <div className="mb-3">
                <Label check className={pauseOption === "closeWithoutSaving" ? "text-danger" : ""}>
                  <Input
                    type="radio"
                    name="pauseOption"
                    checked={pauseOption === "closeWithoutSaving"}
                    onChange={() => setPauseOption("closeWithoutSaving")}
                  />{" "}
                  Close without saving
                </Label>
                {pauseOption === "closeWithoutSaving" && (
                  <div className="ml-4 mt-2 close-warning">
                    <p className="mb-1">
                      <strong>⚠️ Warning:</strong> You will lose all unsaved data.
                    </p>
                    <p className="mb-0">
                      All windows, browser tabs, and work in progress will be permanently closed.
                    </p>
                  </div>
                )}
              </div>
            </FormGroup>
          </Form>
        </div>

        <Button 
          color={pauseOption === "closeWithoutSaving" ? "danger" : "primary"} 
          onClick={handleContinue}
        >
          Continue
        </Button>{" "}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default PauseSpaceModal;
