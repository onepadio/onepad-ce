/**
 * Space Service
 * Shared service for space-related operations
 */

import { Dispatch } from '@reduxjs/toolkit';
import { sessionActions } from '../store/session-slice';
import SessionRepository from '../repository/session';
import { processOpenTabsBeforePersist, processWindows } from './window';

export class SpaceService {
  /**
   * Pause all apps in a workspace/space
   * Sets all tabs and windows in the specified workspace to sleeping state
   * 
   * @param workspaceId - The ID of the workspace to pause
   * @param openTabs - Current open tabs object from Redux store
   * @param openWindows - Current open windows object from Redux store
   * @param dispatch - Redux dispatch function
   */
  static pauseSpace(
    workspaceId: string,
    openTabs: { [key: string]: any },
    openWindows: { [key: string]: any },
    dispatch: Dispatch
  ): void {
    // Create new tab objects with spread operator to avoid mutating Redux state
    const _openTabs: { [key: string]: any } = {};
    Object.entries(openTabs).forEach(([tabId, tab]: [string, any]) => {
      // Pause ALL tabs (apps + browsers) that belong to this workspace
      if (tab.workspace === workspaceId && tab.type !== "xapp") {
        _openTabs[tabId] = { ...tab, sleeping: true };
      } else {
        _openTabs[tabId] = tab;
      }
    });

    // Create new window objects with spread operator
    const _openWindows: { [key: string]: any } = {};
    Object.entries(openWindows).forEach(([windowId, window]: [string, any]) => {
      // Pause ALL windows (apps + browsers) that belong to this workspace
      if (window.workspace === workspaceId && window.id !== undefined) {
        _openWindows[windowId] = { ...window, sleeping: true };
      } else {
        _openWindows[windowId] = window;
      }
    });

    // Dispatch updates to Redux store
    dispatch(sessionActions.setOpenTabs({ data: _openTabs }));
    dispatch(sessionActions.setOpenWindows({ data: _openWindows }));
  }

  /**
   * Resume all apps in a workspace/space
   * Sets all tabs and windows in the specified workspace to active state
   * 
   * @param workspaceId - The ID of the workspace to resume
   * @param openTabs - Current open tabs object from Redux store
   * @param openWindows - Current open windows object from Redux store
   * @param dispatch - Redux dispatch function
   */
  static resumeSpace(
    workspaceId: string,
    openTabs: { [key: string]: any },
    openWindows: { [key: string]: any },
    dispatch: Dispatch
  ): void {
    // Create new tab objects with sleeping set to false
    const _openTabs: { [key: string]: any } = {};
    Object.entries(openTabs).forEach(([tabId, tab]: [string, any]) => {
      // Resume ALL tabs (apps + browsers) that belong to this workspace
      if (tab.workspace === workspaceId && tab.type !== "xapp") {
        _openTabs[tabId] = { ...tab, sleeping: false };
      } else {
        _openTabs[tabId] = tab;
      }
    });

    // Create new window objects with sleeping set to false
    const _openWindows: { [key: string]: any } = {};
    Object.entries(openWindows).forEach(([windowId, window]: [string, any]) => {
      // Resume ALL windows (apps + browsers) that belong to this workspace
      if (window.workspace === workspaceId && window.id !== undefined) {
        _openWindows[windowId] = { ...window, sleeping: false };
      } else {
        _openWindows[windowId] = window;
      }
    });

    // Dispatch updates to Redux store
    dispatch(sessionActions.setOpenTabs({ data: _openTabs }));
    dispatch(sessionActions.setOpenWindows({ data: _openWindows }));
  }

  /**
   * Check if a space is currently paused
   * 
   * @param workspaceId - The ID of the workspace to check
   * @param openTabs - Current open tabs object from Redux store
   * @param openWindows - Current open windows object from Redux store
   * @returns true if all apps in the space are sleeping, false otherwise
   */
  static isSpacePaused(
    workspaceId: string,
    openTabs: { [key: string]: any },
    openWindows: { [key: string]: any }
  ): boolean {
    // Get all tabs in this workspace (include apps + browsers)
    const workspaceTabs = Object.values(openTabs).filter(
      (tab: any) => tab.workspace === workspaceId && tab.type !== "xapp"
    );

    // Get all windows in this workspace (include apps + browsers)
    const workspaceWindows = Object.values(openWindows).filter(
      (window: any) => window.workspace === workspaceId && window.id !== undefined
    );

    // If there are no tabs or windows, consider it not paused
    if (workspaceTabs.length === 0 && workspaceWindows.length === 0) {
      return false;
    }

    // Check if all tabs are sleeping
    const allTabsSleeping = workspaceTabs.every((tab: any) => tab.sleeping === true);

    // Check if all windows are sleeping
    const allWindowsSleeping = workspaceWindows.every((window: any) => window.sleeping === true);

    return allTabsSleeping && allWindowsSleeping;
  }

  /**
   * Pause a space and save it as a session
   * Creates or updates a paused session with all the current state and REMOVES tabs/windows from memory
   * 
   * @param workspaceId - The ID of the workspace to pause
   * @param sessionState - Current session state from Redux store
   * @param dispatch - Redux dispatch function
   * @returns Promise<void>
   */
  static async pauseSpaceAsSession(
    workspaceId: string,
    sessionState: any,
    dispatch: Dispatch
  ): Promise<void> {
    // Get all tabs and windows for this workspace
    const workspaceTabs: { [key: string]: any } = {};
    const workspaceWindows: { [key: string]: any } = {};
    const workspaceWindowTabs: { [key: string]: any } = {};
    const workspaceActiveTabs: { [key: string]: any } = {};

    // Filter tabs for this workspace (these will be saved to DB)
    // Include ALL tabs (apps + browsers) that belong to this workspace
    Object.entries(sessionState.openTabs).forEach(([tabId, tab]: [string, any]) => {
      if (tab.workspace === workspaceId && tab.type !== "xapp") {
        workspaceTabs[tabId] = { ...tab };
      }
    });

    // Filter windows for this workspace (these will be saved to DB)
    // Include ALL windows (apps + browsers) that belong to this workspace
    Object.entries(sessionState.openWindows).forEach(([windowId, window]: [string, any]) => {
      if (window.workspace === workspaceId && window.id !== undefined) {
        workspaceWindows[windowId] = { ...window };
        
        // Also copy related windowTabs and activeTabs
        if (sessionState.windowTabs[windowId]) {
          workspaceWindowTabs[windowId] = sessionState.windowTabs[windowId];
        }
        if (sessionState.activeTabs[windowId]) {
          workspaceActiveTabs[windowId] = sessionState.activeTabs[windowId];
        }
      }
    });

    // Filter browser windows that belong to this workspace
    const workspaceBrowserWindows: string[] = [];
    if (sessionState.browserWindows && Array.isArray(sessionState.browserWindows)) {
      sessionState.browserWindows.forEach((windowId: string) => {
        // Check if this browser window belongs to this workspace
        if (sessionState.openWindows[windowId] && 
            sessionState.openWindows[windowId].workspace === workspaceId) {
          workspaceBrowserWindows.push(windowId);
        }
      });
    }

    // Save current activeBrowserWindowId if it belongs to this workspace
    let savedActiveBrowserWindowId = "";
    if (sessionState.activeBrowserWindowId && 
        workspaceBrowserWindows.includes(sessionState.activeBrowserWindowId)) {
      savedActiveBrowserWindowId = sessionState.activeBrowserWindowId;
    }

    // Create session state
    const pausedSessionState = {
      openWindows: workspaceWindows,
      openTabs: workspaceTabs,
      windowTabs: workspaceWindowTabs,
      activeTabs: workspaceActiveTabs,
      activeDesktopWindows: {},
      activeWindow: { id: "launchpad", data: {}, tabs: [{ id: "launchpad" }] },
      activeWindowId: "launchpad",
      activeWindowTabs: [],
      activeTab: {},
      activeTabId: "",
      previousTabId: "",
      browserWindows: workspaceBrowserWindows,
      activeBrowserWindowId: savedActiveBrowserWindowId,
    };

    // Check if a paused session already exists for this workspace
    const existingSessions: any = await SessionRepository.getSessionsByWorkspaceId(workspaceId);
    let pausedSession = existingSessions.find((s: any) => s.name === `__paused_${workspaceId}`);

    if (pausedSession) {
      // Update existing paused session
      await SessionRepository.saveState(pausedSession.id, pausedSessionState);
    } else {
      // Create new paused session
      await SessionRepository.save(`__paused_${workspaceId}`, workspaceId, 0, 0);
      const newSessions: any = await SessionRepository.getSessionsByWorkspaceId(workspaceId);
      pausedSession = newSessions.find((s: any) => s.name === `__paused_${workspaceId}`);
      if (pausedSession) {
        await SessionRepository.saveState(pausedSession.id, pausedSessionState);
      }
    }

    // NOW REMOVE tabs and windows from Redux state (not just mark as sleeping)
    const _openTabs: { [key: string]: any } = {};
    const _openWindows: { [key: string]: any } = {};
    const _windowTabs: { [key: string]: any } = { ...sessionState.windowTabs };
    const _activeTabs: { [key: string]: any } = { ...sessionState.activeTabs };

    // Keep only tabs that DON'T belong to this workspace
    // Remove ALL tabs (apps + browsers) that belong to this workspace
    Object.entries(sessionState.openTabs).forEach(([tabId, tab]: [string, any]) => {
      if (!(tab.workspace === workspaceId && tab.type !== "xapp")) {
        _openTabs[tabId] = tab;
      }
    });

    // Keep only windows that DON'T belong to this workspace
    // Remove ALL windows (apps + browsers) that belong to this workspace
    Object.entries(sessionState.openWindows).forEach(([windowId, window]: [string, any]) => {
      if (!(window.workspace === workspaceId && window.id !== undefined)) {
        _openWindows[windowId] = window;
      } else {
        // Also remove related windowTabs and activeTabs
        delete _windowTabs[windowId];
        delete _activeTabs[windowId];
      }
    });

    // Remove browser windows that belong to this workspace
    const _browserWindows: string[] = [];
    if (sessionState.browserWindows && Array.isArray(sessionState.browserWindows)) {
      sessionState.browserWindows.forEach((windowId: string) => {
        // Keep only browser windows that DON'T belong to this workspace
        if (!workspaceBrowserWindows.includes(windowId)) {
          _browserWindows.push(windowId);
        }
      });
    }

    // Clear activeBrowserWindowId if it belongs to the paused workspace
    let _activeBrowserWindowId = sessionState.activeBrowserWindowId;
    if (workspaceBrowserWindows.includes(_activeBrowserWindowId)) {
      _activeBrowserWindowId = "";
    }

    // Update Redux store - tabs and windows are now REMOVED from memory
    dispatch(sessionActions.setOpenTabs({ data: _openTabs }));
    dispatch(sessionActions.setOpenWindows({ data: _openWindows }));
    dispatch(sessionActions.setWindowTabs({ data: _windowTabs }));
    dispatch(sessionActions.setActiveTabs({ data: _activeTabs }));
    dispatch(sessionActions.setBrowserWindows({ data: _browserWindows }));
    if (_activeBrowserWindowId !== sessionState.activeBrowserWindowId) {
      dispatch(sessionActions.setActiveBrowserWindowId({ data: _activeBrowserWindowId }));
    }
  }

  /**
   * Get the paused session for a workspace if it exists
   * 
   * @param workspaceId - The ID of the workspace
   * @returns Promise<any> - The paused session or null
   */
  static async getPausedSession(workspaceId: string): Promise<any> {
    const sessions: any = await SessionRepository.getSessionsByWorkspaceId(workspaceId);
    return sessions.find((s: any) => s.name === `__paused_${workspaceId}`) || null;
  }

  /**
   * Resume a paused session for a workspace
   * Merges the paused session state with current state (does not override other workspaces)
   * 
   * @param workspaceId - The ID of the workspace
   * @param currentSessionState - Current session state from Redux store
   * @param dispatch - Redux dispatch function
   * @returns Promise<boolean> - true if resumed, false if no paused session
   */
  static async resumePausedSession(
    workspaceId: string,
    currentSessionState: any,
    dispatch: Dispatch
  ): Promise<boolean> {
    const pausedSession = await this.getPausedSession(workspaceId);
    
    if (!pausedSession) {
      return false;
    }

    // Load the paused session state
    const pausedState = pausedSession.state;

    // MERGE with current state (don't override other workspaces)
    const mergedOpenTabs = { ...currentSessionState.openTabs };
    const mergedOpenWindows = { ...currentSessionState.openWindows };
    const mergedWindowTabs = { ...currentSessionState.windowTabs };
    const mergedActiveTabs = { ...currentSessionState.activeTabs };

    // Add paused tabs back (set sleeping to false)
    if (pausedState.openTabs) {
      Object.entries(pausedState.openTabs).forEach(([tabId, tab]: [string, any]) => {
        mergedOpenTabs[tabId] = { ...tab, sleeping: false };
      });
    }

    // Add paused windows back (set sleeping to false)
    if (pausedState.openWindows) {
      Object.entries(pausedState.openWindows).forEach(([windowId, window]: [string, any]) => {
        mergedOpenWindows[windowId] = { ...window, sleeping: false };
      });
    }

    // Add paused windowTabs back
    if (pausedState.windowTabs) {
      Object.entries(pausedState.windowTabs).forEach(([windowId, tabs]: [string, any]) => {
        mergedWindowTabs[windowId] = tabs;
      });
    }

    // Add paused activeTabs back
    if (pausedState.activeTabs) {
      Object.entries(pausedState.activeTabs).forEach(([windowId, tabId]: [string, any]) => {
        mergedActiveTabs[windowId] = tabId;
      });
    }

    // Merge browser windows back
    const mergedBrowserWindows = [...(currentSessionState.browserWindows || [])];
    if (pausedState.browserWindows && Array.isArray(pausedState.browserWindows)) {
      pausedState.browserWindows.forEach((windowId: string) => {
        if (!mergedBrowserWindows.includes(windowId)) {
          mergedBrowserWindows.push(windowId);
        }
      });
    }

    // Restore activeBrowserWindowId if it was saved
    let mergedActiveBrowserWindowId = currentSessionState.activeBrowserWindowId;
    if (pausedState.activeBrowserWindowId) {
      mergedActiveBrowserWindowId = pausedState.activeBrowserWindowId;
    }

    // Update Redux store with merged state
    dispatch(sessionActions.setOpenTabs({ data: mergedOpenTabs }));
    dispatch(sessionActions.setOpenWindows({ data: mergedOpenWindows }));
    dispatch(sessionActions.setWindowTabs({ data: mergedWindowTabs }));
    dispatch(sessionActions.setActiveTabs({ data: mergedActiveTabs }));
    dispatch(sessionActions.setBrowserWindows({ data: mergedBrowserWindows }));
    if (mergedActiveBrowserWindowId !== currentSessionState.activeBrowserWindowId) {
      dispatch(sessionActions.setActiveBrowserWindowId({ data: mergedActiveBrowserWindowId }));
    }

    // Delete the paused session from DB (it's now restored)
    await this.deletePausedSession(workspaceId);

    return true;
  }

  /**
   * Delete the paused session for a workspace
   * 
   * @param workspaceId - The ID of the workspace
   * @returns Promise<void>
   */
  static async deletePausedSession(workspaceId: string): Promise<void> {
    const pausedSession = await this.getPausedSession(workspaceId);
    if (pausedSession) {
      await SessionRepository.delete(pausedSession.id);
    }
  }
}

export default SpaceService;
