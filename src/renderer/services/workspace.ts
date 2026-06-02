import { v4 as uuidv4 } from 'uuid';
import log from "loglevel";

import { addWorkspace as addWorkspaceApi, getWorkspaces, archiveWorkspace } from "../api/WorkspaceApi";
import { workspaceActions } from '../store/workspace-slice';
import { sessionActions } from '../store/session-slice';
import { db } from "../repository/db";
import WorkspaceRepository from "../repository/workspace";
import DesktopService from './desktop';
import AppService from './app';
import BrowserStateService from './browsers';
import { SessionService } from './session';
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

export class WorkspaceService{
    static async init(userId: any){
        const workspaces: any[any] = await getWorkspaces(userId);
        workspaces.forEach((workspace: any) => {
            workspaceActions.addWorkspace(workspace);
        });
    }

    static async newWorkspace(name: any, isDefault = 0, sync = 0, profileDefault = 0, profile = "default", user: any, config: any, uid="") {
        let _isDefault = isDefault ? 1 : 0;
        let _sync = sync ? 1 : 0;
        let _profileDefault = profileDefault ? 1 : 0;
        let _config = config ? config : {
            iconType: "color",
            color: "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0"),
            alias: name.split(" ").length > 1 ? name.split(" ")[0].toUpperCase().slice(0,1) + name.split(" ")[1].toUpperCase().slice(0,1) : name.toUpperCase().slice(0,2)
        };
        let workspaceId = await WorkspaceRepository.save(name, _isDefault, _sync, _profileDefault, profile, user, _config, uid);
        // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
        let stateId = await BrowserStateService.createBrowserState(workspaceId);
        return workspaceId;
    }

    static async loadWorkspaceById(dispatch: any, id: any, workspaceState: any, sessionState: any){
        let workspace = await WorkspaceRepository.get(id);
        let desktops = await DesktopService.getDesktopsByWorkspaceId(id);
        let desktop = await DesktopService.getDefaultDesktopByWorkspaceId(id);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        dispatch(workspaceActions.setDefaultDesktopId({id: desktop.id}));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        if(workspace.state.desktop.length > 0){
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            desktop = await DesktopService.get(workspace.state.desktop);
        }
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        let _apps = await AppService.getAppsByWorkspaceIdAndDesktopId(id, desktop.id);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        _apps.map((app: any) => {
            // get domain from linkd.data.startUrl
            let _domain = new URL(app.data.startUrl).hostname;
            app.domain = _domain
        });

        log.debug("Apps:",_apps);

        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        let links = await LinkService.getLinksByWorkspaceIdAndDesktopId(id, desktop.id);
        dispatch(workspaceActions.selectWorkspace({ workspace: workspace }));
        dispatch(workspaceActions.setDesktops({ desktops: desktops }));
        dispatch(workspaceActions.selectDesktop({desktop: desktop}));
        dispatch(workspaceActions.setApps({ apps: _apps }));
        dispatch(workspaceActions.setLinks({ links: links }));

        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        let _activeWindowId = sessionState.activeDesktopWindows[desktop.id];
        let _activeWindow = sessionState.openWindows[_activeWindowId];

        //if(_activeWindow !== undefined){
        //    dispatch(sessionActions.setActiveWindow({ data: _activeWindow }));
        //}else{
            dispatch(sessionActions.getBackToLaunchPad({data: {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                desktopId: desktop.id,
            }}));
        //}

        //if(workspace.state.activeBrowserWindowId){
        //    if(workspace.state.openWindows[workspace.state.activeBrowserWindowId] !== undefined && workspace.state.browserWindows.includes(workspace.state.activeBrowserWindowId)){
        //        dispatch(sessionActions.setActiveBrowserWindowId({ data: workspace.state.activeBrowserWindowId }));
        //    }
        //}else{
        //    dispatch(sessionActions.setActiveBrowserWindowId({ data: "" }));
        //}

        // let browserState = await BrowserStateService.getBrowserStateByWorkspaceId(workspace.id);

        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        SessionService.getSessionsByWorkspaceId(workspace.id).then((sessions) => {
            dispatch(workspaceActions.setSessions({ data: sessions }));
        });
        dispatch(workspaceActions.setCurrentSession({}));

        return workspace;

    }

    static async selectWorkspaceById(dispatch: any, id: any, workspaceState: any, sessionState: any){
        let workspace = await WorkspaceRepository.get(id);
        let desktops = await DesktopService.getDesktopsByWorkspaceId(id);
        let desktop = await DesktopService.getDefaultDesktopByWorkspaceId(id);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        dispatch(workspaceActions.setDefaultDesktopId({id: desktop.id}));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        if(workspace.state.desktop.length > 0){
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            desktop = await DesktopService.get(workspace.state.desktop);
        }
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        let _apps = await AppService.getAppsByWorkspaceIdAndDesktopId(id, desktop.id);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        _apps.map((app: any) => {
            // get domain from linkd.data.startUrl
            let _url = app.data.customUrl && app.data.customUrl.length > 0 ? app.data.customUrl : app.data.startUrl;
            let _domain = new URL(_url).hostname;
            app.domain = _domain
        });

        log.debug("Apps:",_apps);

        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        let links = await LinkService.getLinksByWorkspaceIdAndDesktopId(id, desktop.id);
        dispatch(workspaceActions.selectWorkspace({ workspace: workspace }));
        dispatch(workspaceActions.setDesktops({ desktops: desktops }));
        dispatch(workspaceActions.selectDesktop({desktop: desktop}));
        dispatch(workspaceActions.setApps({ apps: _apps }));
        dispatch(workspaceActions.setLinks({ links: links }));

        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        let browserState = await BrowserStateService.getBrowserStateByWorkspaceId(workspace.id);

        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        SessionService.getSessionsByWorkspaceId(workspace.id).then((sessions) => {
            dispatch(workspaceActions.setSessions({ data: sessions }));
        });
        dispatch(workspaceActions.setCurrentSession({}));

        try{
            let _ow = {};
            let _openWindows = Object.assign({}, sessionState.openWindows);
            let _openTabs = Object.assign({}, sessionState.openTabs);
            let _windowTabs = Object.assign({}, sessionState.windowTabs);
            let _activeTabs = Object.assign({}, sessionState.activeTabs);
            let _activeDesktopWindows = Object.assign({}, sessionState.activeDesktopWindows);
            let _browserWindows = Object.assign([], sessionState.browserWindows);

            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            let _wt = Object.assign({}, workspace.state.windowTabs);
            if(_wt){
                Object.keys(_wt).forEach((windowId) => {
                    _windowTabs[windowId] = _wt[windowId];
                });
                dispatch(sessionActions.setWindowTabs({ data: _windowTabs }));
            }else{
                dispatch(sessionActions.setWindowTabs({ data: {} }));
            }

            let _profileWindowTabs = XAppService.loadWindowTabsFromSessionStorage();
            if(_profileWindowTabs){
                Object.keys(_profileWindowTabs).forEach((windowId) => {
                    _windowTabs[windowId] = _profileWindowTabs[windowId];
                });
            }

            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            if(workspace.state.activeDesktopWindows){
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                Object.keys(workspace.state.activeDesktopWindows).forEach((desktopId) => {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    _activeDesktopWindows[desktopId] = workspace.state.activeDesktopWindows[desktopId];
                });
                dispatch(sessionActions.setActiveDesktopWindows({ data: _activeDesktopWindows }));
            }else{
                dispatch(sessionActions.setActiveDesktopWindows({ data: {} }));
            }

            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            let _at = Object.assign({}, workspace.state.activeTabs);
            if(_at){
                let _profileActiveTabs = XAppService.loadActiveTabsFromSessionStorage();
                Object.keys(_profileActiveTabs).forEach((windowId) => {
                    _activeTabs[windowId] = _profileActiveTabs[windowId];
                });
                dispatch(sessionActions.setActiveTabs({ data: _activeTabs }));
            }else{
                dispatch(sessionActions.setActiveTabs({ data: {} }));
            }

            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            if(workspace.state.openWindows){
                // load workspace open windows
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                Object.keys(workspace.state.openWindows).forEach((windowId) => {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    if(workspace.state.openWindows[windowId].type !== "xapp"){
                        // @ts-expect-error TS(2571): Object is of type 'unknown'.
                        _openWindows[windowId] = workspace.state.openWindows[windowId];
                    }else{
                        // cleanup profile apps saved by mistake
                        delete _wt[windowId];
                        delete _at[windowId];
                    }
                });
                // load profile windows
                let _profileWindows =  XAppService.loadWindowsFromSessionStorage();
                Object.values(_profileWindows).forEach((window) => {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    _openWindows[window.id] = window;
                });
                dispatch(sessionActions.setOpenWindows({ data: _openWindows }));
            }


            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            if(workspace.state.openTabs){
                // load workspace open tabs
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                Object.keys(workspace.state.openTabs).forEach((tabId) => {
                    // check if the tabs are not global apps and the window exist
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    let _tab = Object.assign({}, workspace.state.openTabs[tabId]);
                    if(_tab.type !== "xapp" && _openWindows[_tab.window] !== undefined){
                        // Ensure created and lastAccessed fields exist
                        if (!_tab.created) {
                            // For old tabs, use lastAccessed as it's an older timestamp, or 0 if missing
                            _tab.created = _tab.lastAccessed || 0;
                        }
                        if (!_tab.lastAccessed) {
                            // Use created if available, otherwise use 0
                            _tab.lastAccessed = _tab.created || 0;
                        }

                        _openTabs[_tab.id] = _tab;
                    }
                });
                // load global tabs
                let _profileTabs = XAppService.loadTabsFromSessionStorage();
                Object.values(_profileTabs).forEach((tab) => {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
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

                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    _openTabs[tab.id] = tab;
                });
                dispatch(sessionActions.setOpenTabs({ data: _openTabs }));
            }else{
                dispatch(sessionActions.setOpenTabs({ data: {} }));
            }


            dispatch(sessionActions.getBackToLaunchPad({data: {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                desktopId: desktop.id,
            }}));
            /*
            if(workspace.state.browserWindows){
                let bw = [];
                workspace.state.browserWindows.forEach((windowId) => {
                    if(workspace.state.openWindows[windowId]){
                        _browserWindows.push(workspace.state.openWindows[windowId]);
                    }
                });
                dispatch(sessionActions.setBrowserWindows({ data: _browserWindows }));
            }else{
                dispatch(sessionActions.setBrowserWindows({ data: [] }));
            }

            if(workspace.state.activeBrowserWindowId){
                if(workspace.state.openWindows[workspace.state.activeBrowserWindowId] !== undefined && workspace.state.browserWindows.includes(workspace.state.activeBrowserWindowId)){
                    dispatch(sessionActions.setActiveBrowserWindowId({ data: workspace.state.activeBrowserWindowId }));
                }
            }
            */

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
            dispatch(workspaceActions.setSessions({ data: [] }));
            dispatch(workspaceActions.setCurrentSession({}));
        }

        return workspace;
    }

    static async selectProfileDefaultWorkspace(dispatch: any, workspaceState: any, sessionState: any){
        let workspace = await WorkspaceRepository.getProfileDefault();
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        let workspaceId = await WorkspaceService.selectWorkspaceById(dispatch, workspace.id, workspaceState, sessionState);
        return workspaceId;
    }

    static async selectDesktop(workspaceId: any, desktopId: any){
        let _workspaceId = await WorkspaceRepository.setDesktop(workspaceId, desktopId);
        let desktop = await DesktopService.get(desktopId);
        return desktop;
    }

    static async switchDesktop(workspaceId: any, desktopId: any){
        let desktop = await WorkspaceService.selectDesktop(workspaceId, desktopId);
        let apps = await AppService.getAppsByWorkspaceIdAndDesktopId(workspaceId, desktopId);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        let links = await LinkService.getLinksByWorkspaceIdAndDesktopId(workspaceId, desktop.id);
        return {
            desktop: desktop,
            apps: apps,
            links: links,
        };
    }

    static async deleteWorkspace(id: any){
        await WorkspaceRepository.delete(id);
        // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
        await archiveWorkspace(id);
        // @ts-expect-error
        workspaceActions.deleteWorkspace(id);
    }

    static async getWorkspace(id: any){
        return await WorkspaceRepository.get(id);
    }

    static async getWorkspaces(){
        return await WorkspaceRepository.getAll();
    }

    static async getAllSyncRequiredByUserId(userId: any){
        return await WorkspaceRepository.getAllSyncRequiredByUserId(userId);
    }

    static async getWorkspacesByProfileId(profileId: any){
        return await WorkspaceRepository.getAllByProfileId(profileId);
    }

    static async getActiveWorkspacesByProfileId(profileId: any){
        return await WorkspaceRepository.getAllActiveByProfileId(profileId);
    }

    static async getWorkspacesByUserId(userId: any){
        return await WorkspaceRepository.getAllByUserId(userId);
    }

    static async getActiveWorkspacesByUserId(userId: any){
        return await WorkspaceRepository.getAllActiveByUserId(userId);
    }

    static async getByUID(uid: any){
        return await WorkspaceRepository.getByUID(uid);
    }

    static async getByUIDAndProfileId(uid: any, profileId: any){
        return await WorkspaceRepository.getByUIDAndProfileId(uid, profileId);
    }

    static async updateWorkspaceUID(id: any, uid: any){
        return await WorkspaceRepository.updateUID(id, uid);
    }

    static async archiveWorkspace(id: any){
        let _workspaceId = await WorkspaceRepository.setArchived(id);
        return _workspaceId;
    }

    static async updateWorkspace(id: any, name: any, archived: any , isDefault: any, sync: any){
        let _archived = archived ? 1 : 0;
        let _isDefault = isDefault ? 1 : 0;
        let _sync = sync ? 1 : 0;

        let workspaceId = await WorkspaceRepository.update(id, name, _archived, _isDefault, _sync);
        return workspaceId;
    }

    static async updateProfile(id: any, profile: any){
        let _workspaceId = await WorkspaceRepository.updateProfile(id, profile);
        return _workspaceId;
    }

    static async updateUser(id: any, user: any){
        let _workspaceId = await WorkspaceRepository.updateUser(id, user);
        return _workspaceId;
    }

    static async saveState(workspaceId: any, state: any){
        let _openWindows = Object.assign({}, state.openWindows);
        // filter by workspaceId
        Object.keys(_openWindows).forEach((windowId) => {
            if(_openWindows[windowId].workspace === undefined || _openWindows[windowId].workspace !== workspaceId){
                delete _openWindows[windowId];
            }
        });

        let _openTabs = Object.assign({}, state.openTabs);
        // filter by workspaceId
        Object.keys(_openTabs).forEach((tabId) => {
            if(_openTabs[tabId].workspace !== workspaceId){
                delete _openTabs[tabId];
            }
        });

        let _windowTabs = Object.assign({}, state.windowTabs);
        // filter by workspaceId
        Object.keys(_windowTabs).forEach((windowId) => {
            if(_openWindows[windowId] === undefined){
                delete _windowTabs[windowId];
            }
        });

        let _activeTabs = Object.assign({}, state.activeTabs);
        // filter by workspaceId
        Object.keys(_activeTabs).forEach((windowId) => {
            if(_openWindows[windowId] === undefined){
                delete _activeTabs[windowId];
            }
        });


        let _workspaceId = await WorkspaceRepository.saveState(workspaceId, {
            desktop: state.desktop,
            openWindows: _openWindows,
            browserWindows: [],
            openTabs: _openTabs,
            windowTabs: _windowTabs,
            activeDesktopWindows: {
                [state.desktop]: state.activeWindowId,
            },
            activeTabs: _activeTabs,
            activeTab: state.activeTab.type === "xapp" ? { id: "launchpad" } : state.activeTab,
            activeTabId: state.activeTab.type === "xapp" ? "launchpad" : state.activeTabId,
            activeWindow: state.activeWindow.type === "xapp" ? { id: "launchpad" } : state.activeWindow,
            activeWindowId: state.activeWindow.type === "xapp" ? "launchpad" : state.activeWindowId,
            activeWindowTabs: state.activeWindow.type === "xapp" ? [] : state.activeWindowTabs,
            activeBrowserWindowId: "",
            sessions: state.sessions,
            currentSession: {},
        });
        return _workspaceId;
    }

    static async updateConfig(workspaceId: any, config: any){
        let _workspaceId = await WorkspaceRepository.updateConfig(workspaceId, config);
        return _workspaceId;
    }

}

export function getProfileDefaultWorkspace() {
    return new Promise((resolve, reject) => {
        WorkspaceRepository.getProfileDefault().then((workspace) => {
            resolve(workspace);
        }).catch((error) => {
            reject(error);
        });
    });
}

export async function addLocalWorkspace(dispatch: any, userId: any){
    let _localWorkspace =  {
        user: LOCAL_USERNAME,
        id: LOCAL_WORKSPACE_ID,
        name: LOCAL_WORKSPACE_NAME,
        bgImage: default_bg,
        data: [],
        desktop: "",
        desktops: [],
        archived: false,
    };

    // @ts-expect-error
    let _desktops = await db.desktops.toArray();
    if(_desktops.length === 0){
        let desktop_id = uuidv4();
        // @ts-expect-error
        await db.desktops.add({
            id: desktop_id,
            name: "Desktop-1",
            });
        desktop_id = uuidv4();
        // @ts-expect-error
        await db.desktops.add({
            id: desktop_id,
            name: "Desktop-2",
            });
    }
    // @ts-expect-error
    _desktops = await db.desktops.toArray();
    _localWorkspace.desktop = _desktops[0];
    _localWorkspace.desktops = _desktops;

    dispatch(
        workspaceActions.addWorkspace({
            workspace : _localWorkspace,
        })
    );

    return _localWorkspace;
}

export async function addWorkspace(workspace: any, dispatch: any){
    let response: any = await addWorkspaceApi(workspace);
    if(response.ResponseMetadata.HTTPStatusCode === 200){
        dispatch(
            workspaceActions.addWorkspace({
                workspace : workspace,
            })
        );
        return workspace;
    }
    return null;
}

export function archiveWorkspaceAndUpdateWorkspaces(userId: any, workspaceId: any, dispatch: any, oncomplete: any, onerror: any){
   archiveWorkspace(userId, workspaceId).then((data) => {
        dispatch(
            workspaceActions.removeWorkspace({
                id: workspaceId,
            })
        );
        oncomplete();
    }).catch((error) => {
        console.error(error);
        onerror();
    });
}

export function setBackgroundImageForLocalWorkspace(dispatch: any, workspace: any, bgImage: any){
    localStorage.setItem("bgImage", bgImage);
    dispatch(
        workspaceActions.updateWorkspace({
            id: workspace.id,
            workspace: {
                id: workspace.id,
                user: workspace.user,
                name: workspace.name,
                bgImage: bgImage,
                data: workspace.data,
            },
        })
    );
    selectWorkspaceById(workspace.id, dispatch);
}

export function updateWorkspacesOffline(dispatch: any){
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(workspaceActions.clearWorkspaces());
    let _workspace = addLocalWorkspace(dispatch, LOCAL_USERNAME);
    dispatch(
        workspaceActions.selectWorkspace({
            workspace: _workspace,
        })
    );
}

export function updateWorkspaces(userId: any, dispatch: any){
    getWorkspaces(userId).then((data: any) => {
        data.sort((a: any, b: any) => a.createdAt < b.createdAt ? 1 : -1)
        //data.filter((workspace) => workspace.id !== LOCAL_WORKSPACE_ID);
        dispatch(
            workspaceActions.setWorkspaces({
                workspaces: data,
            })
        )
        addLocalWorkspace(dispatch, userId);
    });
}

export function updateWorkspacesAndGoToSelected(userId: any, dispatch: any, selectedWorkspaceId: any){
    getWorkspaces(userId).then((data: any) => {
        data.sort((a: any, b: any) => a.createdAt < b.createdAt ? 1 : -1)
        dispatch(
            workspaceActions.setWorkspaces({
                workspaces: data,
            })
        )
        addLocalWorkspace(dispatch, userId);
        selectWorkspaceById(selectedWorkspaceId, dispatch);
    });
}

export function selectWorkspace(workspaces: any, workpsaceId: any, dispatch: any){
    console.debug("selectWorkspace: " + workpsaceId);
    console.debug(workspaces);
    let workspace = workspaces.find((workspace: any) => workspace.id === workpsaceId);
    dispatch(
        workspaceActions.selectWorkspace({
            workspace: workspace,
        })
    );
}

export function selectWorkspaceById(workpsaceId: any, dispatch: any){
    dispatch(
        workspaceActions.selectWorkspaceById({
            id: workpsaceId,
        })
    );
}

export function selectWorkspaceByName(workspaceName: any, dispatch: any){
    dispatch(
        workspaceActions.selectWorkspaceByName({
            name: workspaceName,
        })
    );
}

export function selectTheLatestWorkspace(workspaces: any, dispatch: any){
    dispatch(
      workspaceActions.selectWorkspace({
            workspace: workspaces[0],
      })
    );
  }

  export function selectDeviceWorkspace(workspaces: any, dispatch: any){
    dispatch(
      workspaceActions.selectWorkspace({
            workspace: workspaces[workspaces.length - 1],
      })
    );
  }

export async function setWorkspaces(workspaces: any, dispatch: any){
    dispatch(
        workspaceActions.setWorkspaces({
            workspaces: workspaces,
        })
    );
}
