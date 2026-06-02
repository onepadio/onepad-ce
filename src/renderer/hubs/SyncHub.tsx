import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from "is-electron";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import WorkspaceApi from "../api/WorkspaceApi";
import { WorkspaceService } from "../services/workspace";
import DesktopService from "../services/desktop";
import { workspaceActions } from "../store/workspace-slice";
import { appActions } from "../store/app-slice";
import { userActions } from "../store/user-slice";
import UserApi from "../api/UserApi";

function SyncHub() {
    const dispatch = useDispatch();
    const [timer, setTimer] = useState("");
    
    const user = useSelector((state: any) => state.user);
    
    const userUID = useSelector((state: any) => state.user.uid);
    
    const profileId = useSelector((state: any) => state.app.profileId);
    
    const lastSync = useSelector((state: any) => state.user.lastSync);
    
    const lastSyncVersion = useSelector((state: any) => state.user.lastSyncVersion);

    useEffect(() => {
        if(lastSyncVersion === ""){
            return;
        }
        log.debug("SyncHub useEffect syncVersion", lastSyncVersion);
        UserApi.updateUser(user.uid, "syncVersion", lastSyncVersion);
    }, [lastSyncVersion]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            log.debug("SyncHub intervalId");
            if(user.uid === "" || user.uid === undefined){
                return;
            }

            UserApi.getUserById(user.uid).then((response: any) => {
                log.debug("SyncHub getUserById", response);
                let remoteVersion = response.syncVersion;
                log.debug("SyncHub remoteVersion", remoteVersion);
                log.debug("SyncHub lastSyncVersion", lastSyncVersion);
                if(remoteVersion !== lastSyncVersion){
                    //sync(remoteVersion);
                    log.debug("Sync needed...");
                }
            }).catch((error) => {
                log.error('Error:', error);
            });
            
        }, 60*60*1000);

        // Cleanup function to clear the interval when component unmounts
        return () => clearInterval(intervalId);
    }, [user, userUID, profileId, lastSyncVersion]); // Only depend on user and userUID, not timer

    function updateWorkspace(workspace: any){
        WorkspaceApi.updateWorkspace(user.id, workspace.uid, workspace).then((response) => {
            log.debug("SyncHub updateWorkspace", response);
            dispatch(userActions.setLastSync(Date.now()));
            //dispatch(userActions.setLastSyncVersion(_version));
        }).catch((error) => {
            log.error('Error:', error);
        });
    }

    function sync(remoteVersion: any){
        dispatch(appActions.setIsSyncing(true));
        let _version = uuidv4();
        // get all workspaces that are sync required from the database
        // compare the version with the remote version
        // if the version is different, update the workspace
        // if the version is the same, skip
        // update the lastSyncVersion
        // update the lastSync
        // set isSyncing to false
        // return

        // get all workspaces that are sync required
        WorkspaceService.getAllSyncRequiredByUserId(user.id).then((workspaces: []) => {
            
            workspaces.forEach((workspace: any) => {
                if(!workspace.sync){
                    log.debug("SyncHub workspace.sync is false, skipping");
                    return;
                }

                if(workspace.uid){
                    log.debug("SyncHub workspace.uid is not null, check if it's the same as the remote version");
                    WorkspaceApi.getWorkspaceByUserAndId(user.uid, workspace.uid).then((response: any) => {
                        log.debug("SyncHub getWorkspaceByUserAndId", response);
                        if(response.version !== workspace.version){
                            log.debug("SyncHub response.version !== response.lastSyncVersion, update workspace");
                            updateWorkspace(workspace);
                        }
                    });
                    return;
                }
                
                
                /**
                WorkspaceApi.getWorkspaceByUserAndId(user.uid, workspace.uid).then((response) => {
                    log.debug("SyncHub getWorkspaceByUserAndId", response);
                    
                    if(response.version !== response.lastSyncVersion){
                        WorkspaceApi.updateWorkspace(user.id, workspace.uid, response).then((response) => {
                            log.debug("SyncHub updateWorkspace", response);
                        }).catch((error) => {
                            log.error('Error:', error);
                        });
                    }
                    
                }).catch((error) => {
                    log.error('Error:', error);
                });
                */
            
                log.debug("SyncHub workspace.uid is null");
                
                WorkspaceApi.createWorkspace({
                    name: workspace.name,
                    user: user.uid,
                    bgImage: "",
                }).then((response: any) => {
                    log.debug("SyncHub createWorkspace", response);
                    WorkspaceService.updateWorkspaceUID(workspace.id, response.id);
                }).catch((error) => {
                    log.error('Error:', error);
                });
                dispatch(userActions.setLastSync(Date.now()));
                dispatch(userActions.setLastSyncVersion(_version));
            });
        }).catch((error) => {
            log.error('Error:', error);
        });
        log.debug("SyncHub timer", timer);
        WorkspaceApi.getWorkspacesByUser(user.uid).then((response: []) => {
            log.debug("SyncHub getWorkspacesByUser", response);
            // check if workspace exist locally
            response.forEach((workspace: any) => {
                if(workspace.id){
                    WorkspaceService.getByUIDAndProfileId(workspace.id, profileId).then((response) => {
                        log.debug("SyncHub getWorkspaceByUIDAndProfileId", response);
                        // if not exist, create it
                        if(!response){
                            let _alias = "";
                            if (workspace.name.split(" ").length > 1) {
                                _alias = workspace.name.split(" ")[0].toUpperCase().charAt(0) + workspace.name.split(" ")[1].toUpperCase().charAt(0);
                              } else {
                                _alias = workspace.name.toUpperCase().slice(0, 2);
                              }
                            let _config = {
                                iconType: "color",
                                color: "#000000",
                                alias: _alias,
                            }
                            // @ts-expect-error
                            WorkspaceService.newWorkspace(workspace.name, false, true, false, profileId, user.id, _config).then(
                                (workspaceId) => {
                                  DesktopService.newDesktop("Default", workspaceId, true).then(
                                    (desktop) => {
                                      WorkspaceService.updateWorkspaceUID(workspaceId, workspace.id).then((response) => {
                                        WorkspaceService.getWorkspace(workspaceId).then((workspace) => {
                                            dispatch(workspaceActions.addWorkspace({ workspace: workspace }));
                                            log.debug("SyncHub addWorkspace", workspace);
                                        });
                                      }).catch((error) => {
                                        log.error('Error:', error);
                                      });
                                    }
                                  );
                                }
                              );
                        }
                    }).catch((error) => {
                        log.error('Error:', error);
                    });
                }
            });
            dispatch(appActions.setIsSyncing(false));
        }).catch((error) => {
            log.error('Error:', error);
            dispatch(appActions.setIsSyncing(false));
        });
    }
    return (
        <></>
    );
}

export default SyncHub;