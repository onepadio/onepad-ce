import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from "is-electron";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import { workspaceActions } from "../store/workspace-slice";

function WorkspaceHub() {
    const dispatch = useDispatch();
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const workspaceId = useSelector((state) => state.workspace.selectedWorkspace.id);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const workspaces = useSelector((state) => state.workspace.workspaces);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const recentWorkspaces = useSelector((state) => state.workspace.recentWorkspaces);
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const userId = useSelector((state) => state.user.id);

    function pushToRecents(workspaceId: any){
        if(recentWorkspaces[userId] && recentWorkspaces[userId].find((workspace: any) => workspace.id === workspaceId)) return;
        let _workspace = workspaces.find((workspace: any) => workspace.id === workspaceId);
        let _recents = Object.assign({}, recentWorkspaces);
        let _workspaces = Object.assign([], _recents[userId]);
        if(!_recents[userId]){
            _workspaces = [];
        }
        if(_workspaces.length > 0){
          let _index = _workspaces.findIndex((workspace: any) => workspace.id === workspaceId);
          if(_index > -1){
            _workspaces.splice(_index, 1);
          }
        }
        _workspaces.unshift(_workspace);
        //if(_workspaces.length > 6){
        //    _workspaces.pop();
        //}

        log.debug("pushToRecents",_recents);
        _recents[userId] = _workspaces;

        dispatch(workspaceActions.setRecentWorkspaces(_recents));
    }

    useEffect(() => {
        if(workspaceId === "" || workspaceId === undefined ) return;
        setTimeout(() => {
            pushToRecents(workspaceId);
        }, 200);
    }, [workspaceId]);

    return (
        <></>
    );
}

export default WorkspaceHub;