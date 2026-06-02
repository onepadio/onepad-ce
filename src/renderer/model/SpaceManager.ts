import log from "loglevel";

import { WorkspaceService } from "../services/workspace";
import { ProfilesService } from "../services/profiles";
import DesktopService from "../services/desktop";

import { workspaceActions } from "../store/workspace-slice";
import { userActions } from "../store/user-slice";
import { appActions } from "../store/app-slice";
import { sessionActions } from "../store/session-slice";
import { settingsActions } from "../store/settings-slice";
import XAppService from "../services/xapp";
import { UsersService } from "../services/users";


export class SpaceManager{

    loadSettings(dispatch: any, profileId: any){
        ProfilesService.get(profileId).then((profile) => {
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          if(profile.settings !== undefined ){
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            dispatch(settingsActions.setSpaceBrowserEnabled(profile.settings.isSpaceBrowserEnabled));
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            dispatch(settingsActions.setAdvancedBackgroundEnabled(profile.settings.isAdvancedBackgroundEnabled));
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            dispatch(settingsActions.setSplitWindowsEnabled(profile.settings.isSplitWindowsEnabled));
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            dispatch(settingsActions.setSessionsEnabled(profile.settings.isSessionsEnabled));
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            dispatch(settingsActions.setDesktopsEnabled(profile.settings.isDesktopsEnabled));
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            dispatch(settingsActions.setWorkspacesEnabled(profile.settings.isWorkspacesEnabled));
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            dispatch(settingsActions.setSharedAppsEnabled(profile.settings.isSharedAppsEnabled));
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            dispatch(settingsActions.setDeveloperMode(profile.settings.isDeveloperMode));
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            dispatch(settingsActions.setExternalWindowMode(profile.settings.isExternalWindowMode));
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            dispatch(settingsActions.setEfficiencyModeEnabled(profile.settings.isEfficiencyModeEnabled));  
          }
        });
    }

    switchToUser(userId: any, dispatch: any,  workspaceState: any, sessionState: any, onComplete: any){
      WorkspaceService.getActiveWorkspacesByUserId(userId).then((workspaces) => {
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          if(workspaces.length === 0){
            // create new workspace
            ProfilesService.getAllByUserId(userId).then((profiles) => {
              let _profileId = profiles[0].id;        
              // @ts-expect-error TS(2554): Expected 7-8 arguments, but got 6.
              WorkspaceService.newWorkspace("Space-1", true, false, true, _profileId, userId).then((workspaceId) => {
                WorkspaceService.getActiveWorkspacesByUserId(userId).then((workspaces) => {
                  log.debug("Workspaces", workspaces);
                  dispatch(workspaceActions.setWorkspaces({
                    workspaces: workspaces
                  }));
                }).catch((error) => {
                  log.debug("Error getting workspaces", error);
                });
                dispatch(userActions.setDefaultWorkspace({ id: workspaceId }));
                DesktopService.newDesktop("Desktop-1", workspaceId, true).then((desktop) => {
                  WorkspaceService.selectWorkspaceById(dispatch, workspaceId, workspaceState, sessionState).then((workspace) => {
                    log.debug("Space-1 workspace ready...");
                    dispatch(sessionActions.setLocation("launchpad"));
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    localStorage.setItem("activeProfileId", workspace.profile);
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    dispatch(appActions.setProfileId(workspace.profile));
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    dispatch(appActions.setSelectProfile(workspace.profile));
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    this.loadSettings(dispatch, workspace.profile);
                    UsersService.setLastWorkspace(userId, workspaceId);
                    onComplete(userId);
                  });
                });
              });
            });
          }else{
            log.debug("Workspaces", workspaces);
            dispatch(workspaceActions.setWorkspaces({
              workspaces: workspaces
            }));
            UsersService.get(userId).then((user) => {
              // @ts-expect-error TS(2571): Object is of type 'unknown'.
              let _workspaceId = user.lastWorkspace || workspaces[0].id;
              WorkspaceService.selectWorkspaceById(dispatch, _workspaceId, workspaceState, sessionState ).then((workspace) => {
                  log.debug("Default workspace ready...");
                  dispatch(sessionActions.setLocation("launchpad"));
                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  localStorage.setItem("activeProfileId", workspace.profile);
                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  dispatch(appActions.setProfileId(workspace.profile));
                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  dispatch(appActions.setSelectProfile(workspace.profile));
                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  this.loadSettings(dispatch, workspace.profile);
                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  UsersService.setLastWorkspace(userId, workspace.id);

                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  XAppService.getAllByProfileId(workspace.profile).then((xapps) => {
                      // @ts-expect-error TS(2571): Object is of type 'unknown'.
                      dispatch(appActions.setXApps(xapps.reverse() || []));
                      let _xappsStore = {};
                      let _xappIds: any = [];
                      // @ts-expect-error TS(2571): Object is of type 'unknown'.
                      xapps.forEach((xapp: any) => {
                          _xappsStore[xapp.id] = xapp;
                          _xappIds.push(xapp.id);
                      });
                      // @ts-expect-error TS(2571): Object is of type 'unknown'.
                      if(localStorage.getItem("xappIds-"+workspace.profile) === null){
                          // @ts-expect-error TS(2571): Object is of type 'unknown'.
                          localStorage.setItem("xappIds-"+workspace.profile, JSON.stringify(_xappIds));
                      }
                      dispatch(appActions.setXAppsStore(_xappsStore));
                      onComplete(userId);
                  }).catch((error) => {
                      log.debug("Error getting xapps", error);
                  });
              });
            });
          }
      });
    }

    
}