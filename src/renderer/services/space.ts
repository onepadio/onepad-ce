/**
 * Space Service
 * Shared service for space-related operations
 */

import { Dispatch } from '@reduxjs/toolkit';
import { sessionActions } from '../store/session-slice';

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
      if (tab.workspace === workspaceId && tab.type !== "xapp") {
        _openTabs[tabId] = { ...tab, sleeping: true };
      } else {
        _openTabs[tabId] = tab;
      }
    });

    // Create new window objects with spread operator
    const _openWindows: { [key: string]: any } = {};
    Object.entries(openWindows).forEach(([windowId, window]: [string, any]) => {
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
      if (tab.workspace === workspaceId && tab.type !== "xapp") {
        _openTabs[tabId] = { ...tab, sleeping: false };
      } else {
        _openTabs[tabId] = tab;
      }
    });

    // Create new window objects with sleeping set to false
    const _openWindows: { [key: string]: any } = {};
    Object.entries(openWindows).forEach(([windowId, window]: [string, any]) => {
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
    // Get all tabs in this workspace
    const workspaceTabs = Object.values(openTabs).filter(
      (tab: any) => tab.workspace === workspaceId && tab.type !== "xapp"
    );

    // Get all windows in this workspace
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
}

export default SpaceService;
