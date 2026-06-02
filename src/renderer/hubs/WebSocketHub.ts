import socketIO from 'socket.io-client';
import useWebSocket from 'react-use-websocket';
import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from 'is-electron';
import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';
    

import UserApi from "../api/UserApi";

import { appActions } from '../store/app-slice';
import { userActions } from '../store/user-slice';
import { modalActions } from '../store/modal-slice';
import { p2pFileActions } from '../store/p2pfile-slice';
import { WorkspaceService } from '../services/workspace';
import DesktopService from '../services/desktop';
import { workspaceActions } from '../store/workspace-slice';

function WebSocketHub(){
    const dispatch = useDispatch();
    const route = useSelector((state: any) => state.session.route);
    const user = useSelector((state: any) => state.user);
    
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const version = useSelector((state) => state.app.version);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const userState = useSelector((state) => state.user);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const userId = useSelector((state) => state.user.id);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const wss = useSelector((state) => state.app.wss);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const deviceId = useSelector((state) => state.app.deviceId);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const profileId = useSelector((state) => state.user.profileId);

    const [socket, setSocket] = useState(null);
    const [socketUrl, setSocketUrl] = useState("");
    const [connected, setConnected] = useState(false);
    const isMounted = useRef(true);

    function onSocketOpened(){
        log.debug("Web socket connected...");
        setConnected(true);
    }
    
    function onSocketMessage(data: any){
        log.debug("onSocketMessage", data);
        if(data.action === "upgrade_completed"){
            log.debug("upgrade_completed");
            if(data.userId === user.username){
                UserApi.getUserById(data.userId).then((response: any) => {
                    dispatch(userActions.setProduct(response.productName));
                    updateLimits(response);
                    setTimeout(() => {
                        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                        dispatch(modalActions.toggleStripeModalWindow());
                    }, 100);
                }).catch((error) => {
                    console.error('Error:', error);
                });
            }
        }else if(data.action === "downgrade_completed"){
            log.debug("downgrade_completed");
            if(data.userId === userState.id){
                UserApi.getUserById(data.userId).then((response: any) => {
                    dispatch(userActions.setProduct(response.productName));
                    updateLimits(response);
                }).catch((error) => {
                    console.error('Error:', error);
                });
            }
        }else if(data.action === "clipboard_updated"){
            log.debug("clipboard_updated");
            // send to main process
            if(isElectron()){
                // @ts-expect-error
                window.electronAPI.send("toMain", {
                  action: "update-clipboard",
                  value: data.text,
                });
            }
        }else if(data.action === "p2pfile_session_request"){
            log.debug("p2pfile_session_request");
            dispatch(p2pFileActions.setFromData(data));
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            dispatch(modalActions.toggleFileSharingResponseModal());
        }else if(data.action === "p2pfile_session_response"){
            log.debug("p2pfile_session_response");
            if(data.answer === "accepted"){
                // Open file sharing window
                dispatch(p2pFileActions.setReceiverResponse("accepted"));
            }else{
                // Notify user that the request was denied
                dispatch(p2pFileActions.setReceiverResponse("rejected"));
            }
        }else if(data.action === "new_workspace"){
            log.debug("new_workspace");
            log.debug("data", data);
            WorkspaceService.getByUID(data.data.id)
                .then((workspace: any) => {
                    if (workspace) {
                        log.debug("workspace found", workspace);
                    } else {
                        // workspace not found, create it
                        // @ts-expect-error
                        WorkspaceService.newWorkspace(data.data.name, false, true, false, profileId, userId, {}, data.data.id).then((workspaceId) => {
                            log.debug("workspace created", workspaceId);
                            DesktopService.newDesktop("Default", workspaceId, true).then(
                                (desktop: any) => {
                                  WorkspaceService.getWorkspace(workspaceId).then((workspace) => {
                                    dispatch(workspaceActions.addWorkspace({ workspace: workspace }));
                                    setTimeout(() => {
                                      window.alert("New workspace created");
                                    }, 100);
                                  });
                                }
                              );
                        }).catch((error) => {
                            log.error("error creating workspace: ", error);
                        });
                    }
                })
                .catch((error) => {
                    log.error("error getting workspace: ", error);
                });
        }
        else{
            log.debug("Unknown action", data.action);
        }
    }

    function updateLimits(response: any){
        if(response.limits === undefined){
          return;
        }
        dispatch(userActions.setLimits(response.limits));
        dispatch(appActions.updateAccountLimits({
          workspaces: parseInt(response.limits.maxWorkspaces),
          profiles: parseInt(response.limits.maxProfiles),
          apps: parseInt(response.limits.maxApps),
          links: parseInt(response.limits.maxLinks),
        }));
    }

    useEffect(() => {
        if( !connected && version !== "" && userState.uid !== "" && deviceId !== ""){
            if(socket !== null){
                socket.close();
            }

            let _wssUrl = (version.includes("beta") || version.includes("dev")) ? wss.dev : wss.master;
            setSocketUrl(_wssUrl+'?user='+userState.uid+'&device='+deviceId+'&version='+version);
            setSocket(new WebSocket(
                _wssUrl+'?user='+userState.uid+'&device='+deviceId+'&version='+version
            ));
        }

        if(userState.uid === "" || deviceId === "" || version === ""){
            if(socket !== null){
                socket.close();
            }
            setSocket(null);
            setSocketUrl("");
        }
    }, [userState, version]);

    useEffect(() => {
        if(socket === null || socketUrl === ""){
            return;
        }
        socket.onopen = () => {
            log.info('websocket connected');
            onSocketOpened();
        }

        socket.onclose = () => {
            log.info('websocket disconnected');
            setConnected(false);
            if (isMounted.current) {
                setTimeout(() => {
                    log.debug("Reconnecting...");
                    setSocket(new WebSocket(socketUrl));
                }, 1000);
            }
        }

        socket.onmessage = (event: any) => {
            const data = JSON.parse(event.data);
            onSocketMessage(data);
        }

        socket.onerror = (event: any) => {
            log.error('error', event);
        }


        return () => {
            isMounted.current = false;
            if (socket) {
                socket.close();
            }
        }
    }, [socket]);

    useEffect(() => {
        return () => {
            isMounted.current = false;
            log.info('websocket closed on component unmount');
            if (socket) {
                socket.close();
            }
        };
    }, []);
    
}

export default WebSocketHub;