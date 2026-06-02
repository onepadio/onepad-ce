import { v4 as uuidv4 } from 'uuid';

import { addWorkspace as addWorkspaceApi, getWorkspaces, archiveWorkspace } from "../api/WorkspaceApi";
import { workspaceActions } from '../store/workspace-slice';
import { sessionActions } from '../store/session-slice';
import { db } from "../repository/db";
import SessionRepository from "../repository/session";
import WorkspaceRepository from "../repository/workspace";
import DesktopService from './desktop';
import AppService from './app';
import { LinkService } from './link';

import default_bg from "../images/default_bg.jpg";
import XAppService from './xapp';

export const LOCAL_WORKSPACE_ID = "device";
export const LOCAL_WORKSPACE_NAME = "Device";
export const LOCAL_USERNAME = "local.username";

export const localWorkspace =  {
    user: LOCAL_USERNAME,
    id: LOCAL_WORKSPACE_ID,
    name: LOCAL_WORKSPACE_NAME,
    bgImage: default_bg,
    data: [],
    desktop: "",
    desktops: [],
    archived: false,
};

export class SessionService{
    static async newSession(name: any,workpsaceId: any, sync = false, isolated = false) {
        let _sync = sync ? 1 : 0;
        let _isolated = isolated ? 1 : 0;
        let sessionId = await SessionRepository.save(name, workpsaceId, _sync, _isolated);
        return sessionId;
    }

    static async selectSessionById(dispatch: any, id: any){
        let session = await SessionRepository.get(id);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        let desktop = await DesktopService.getDefaultDesktopByWorkspaceId(session.workspace);
        dispatch(workspaceActions.selectDesktop({desktop: desktop}));
        try{
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            let _wt = Object.assign({}, session.state.windowTabs);
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            let _at = Object.assign({}, session.state.activeTabs);
            let _ow = {};
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            if(session.state.openWindows){
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                Object.keys(session.state.openWindows).forEach((windowId) => {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    if(session.state.openWindows[windowId].type !== "xapp"){
                        // @ts-expect-error
                        _ow[windowId] = session.state.openWindows[windowId];
                    }else{
                        delete _wt[windowId];
                        delete _at[windowId];
                    }
                });
                let _profileWindows = XAppService.loadWindowsFromSessionStorage();
                Object.values(_profileWindows).forEach((window) => {
                    // @ts-expect-error
                    _ow[window.id] = window;
                });
                dispatch(sessionActions.setOpenWindows({ data: _ow }));
            }

            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            if(session.state.openTabs){
                let _ot = {};
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                Object.keys(session.state.openTabs).forEach((tabId) => {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    if(session.state.openTabs[tabId].type !== "xapp" && _ow[session.state.openTabs[tabId].window] !== undefined){
                        // @ts-expect-error
                        let tab = session.state.openTabs[tabId];

                        // Ensure created and lastAccessed fields exist
                        if (!tab.created) {
                            // For old tabs without created field, use lastAccessed as it represents an older timestamp
                            // If lastAccessed also doesn't exist, use 0 to mark it as very old
                            tab.created = tab.lastAccessed || 0;
                        }
                        if (!tab.lastAccessed) {
                            // Use created if available, otherwise use 0
                            tab.lastAccessed = tab.created || 0;
                        }

                        // @ts-expect-error
                        _ot[tabId] = tab;
                    }
                });

                let _profileTabs = XAppService.loadTabsFromSessionStorage();
                Object.values(_profileTabs).forEach((tab) => {
                    // @ts-expect-error
                    // Ensure created and lastAccessed fields exist for profile tabs
                    if (!tab.created) {
                        // @ts-expect-error
                        // For old tabs, use lastAccessed as it's an older timestamp, or 0 if missing
                        tab.created = tab.lastAccessed || 0;
                    }
                    // @ts-expect-error
                    if (!tab.lastAccessed) {
                        // @ts-expect-error
                        tab.lastAccessed = tab.created || 0;
                    }

                    // @ts-expect-error
                    _ot[tab.id] = tab;
                });
                dispatch(sessionActions.setOpenTabs({ data: _ot }));
            }

            if(_wt){
                let _profileWindowTabs = XAppService.loadWindowTabsFromSessionStorage();
                Object.keys(_profileWindowTabs).forEach((windowId) => {
                    _wt[windowId] = _profileWindowTabs[windowId];
                });
                dispatch(sessionActions.setWindowTabs({ data: _wt }));
            }

            if(_at){
                let _profileActiveTabs = XAppService.loadActiveTabsFromSessionStorage();
                Object.keys(_profileActiveTabs).forEach((windowId) => {
                    _at[windowId] = _profileActiveTabs[windowId];
                });
                dispatch(sessionActions.setActiveTabs({ data: _at }));
            }

            dispatch(sessionActions.getBackToLaunchPad({data: {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                desktopId: desktop.id,
            }}));

            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            if(session.state.browserWindows){
                let bw: any = [];
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                session.state.browserWindows.forEach((windowId: any) => {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    if(session.state.openWindows[windowId]){
                        // @ts-expect-error TS(2571): Object is of type 'unknown'.
                        bw.push(session.state.openWindows[windowId]);
                    }
                });
                dispatch(sessionActions.setBrowserWindows({ data: bw }));
            }else{
                dispatch(sessionActions.setBrowserWindows({ data: [] }));
            }

            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            if(session.state.activeBrowserWindowId){
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                if(session.state.openWindows[session.state.activeBrowserWindowId] !== undefined && session.state.browserWindows.includes(session.state.activeBrowserWindowId)){
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    dispatch(sessionActions.setActiveBrowserWindowId({ data: session.state.activeBrowserWindowId }));
                }
            }

        }catch(e){
            dispatch(sessionActions.setOpenWindows({data: {}}));
            dispatch(sessionActions.setOpenTabs({data: {}}));
            dispatch(sessionActions.setActiveTabs({data: {}}));
            dispatch(sessionActions.setActiveTab({data: {}}));
            dispatch(sessionActions.getBackToLaunchPad({ data: {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                desktopId: desktop.id,
            }}));
            dispatch(sessionActions.setActiveWindowTabs({data: []}));
            dispatch(sessionActions.setActiveDesktopWindows({data: {}}));
        }
    }

    static async deleteSession(id: any){
        return await SessionRepository.delete(id);
    }

    static async getSession(id: any){
        return await SessionRepository.get(id);
    }

    static async getAllSessions(){
        return await SessionRepository.getAll();
    }

    static getSessionsByWorkspaceId(workspaceId: any) {
        return new Promise((resolve, reject) => {
            SessionRepository.getSessionsByWorkspaceId(workspaceId).then((sessions) => {
                resolve(sessions);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static async archiveSession(id: any){
        let _sessionId = await SessionRepository.setArchived(id);
        return _sessionId;
    }

    static async updateSession(id: any, name: any, archived: any , sync: any){
        let _archived = archived ? 1 : 0;
        let _sync = sync ? 1 : 0;

        // @ts-expect-error TS(2554): Expected 5 arguments, but got 4.
        let workspaceId = await SessionRepository.update(id, name, _archived, _sync);
        return workspaceId;
    }

    static async saveState(sessionId: any, state: any){
        let _sessionId = await SessionRepository.saveState(sessionId, state);
        return _sessionId;
    }

}
