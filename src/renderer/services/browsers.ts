import BrowserRepository from "../repository/browsers";
import isElectron from "is-electron";

export default class BrowserStateService {
    static procesState( browserWindows: any, openWindows: any, windowTabs: any, activeTabs: any, openTabs: any, activeBrowserWindowId: any){
        let state = {
            browserWindows: browserWindows,
            openWindows: {},
            windowTabs: {},
            activeTabs: {},
            openTabs: {},
            activeBrowserWindowId: activeBrowserWindowId,
        }
        let _openTabs = Object.assign({},openTabs);
        browserWindows.forEach((windowId: any) => {
            if (openWindows.hasOwnProperty(windowId)) {
                state.openWindows[windowId] = openWindows[windowId];
            }
            if (windowTabs.hasOwnProperty(windowId)) {
                state.windowTabs[windowId] = windowTabs[windowId];
            }
        
            if (activeTabs.hasOwnProperty(windowId)) {
                state.activeTabs[windowId] = activeTabs[windowId];
            }
            Object.values(_openTabs).forEach((tab) => {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                if(tab.window === windowId){
                    //update tab url with current url
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    let _tab = Object.assign({}, _openTabs[tab.id]);
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    _tab.url = tab.state.url;
                    //sleep tab
                    _tab.sleeping = true;
                    // @ts-expect-error
                    state.openTabs[tab.id] = _tab;
                }
            });
        });

        return state;
    }

    static closeExternalWindowsAndTabs(browserWindows: any, openTabs: any){
        browserWindows.forEach((windowId: any) => {
            Object.values(openTabs).forEach((tab) => {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                if(tab.window === windowId){
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    if(tab.location === "external"){
                        if(isElectron()){
                            // @ts-expect-error
                            window.electronAPI.send("toMain", {
                                action: "close-tab",
                                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                                closeTabWindowId: tab.window,
                                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                                closeTabId: tab.id,
                            });
                        }
                    }
                }
            });
            
            if(isElectron()){
                // @ts-expect-error
                window.electronAPI.send("toMain", {
                    action: "close-window",
                    id: windowId,
                });
            }
        });
    }

    static async createBrowserState(workspaceId: any, state: any) {
        let _state = {
            browserWindows: [],
            openWindows: {},
            windowTabs: {},
            activeTabs: {},
            openTabs: {},
            activeBrowserWindowId: "",
        };

        if(state){
            _state = state;
        }
        return await BrowserRepository.save(workspaceId, _state);
    }
    
    static async updateBrowserState(id: any, state: any) {
        return await BrowserRepository.update(id, state);
    }
    
    static async deleteBrowserStateById(id: any) {
        return await BrowserRepository.delete(id);
    }

    static async deleteBrowserStateByWorkspaceId(workspaceId: any) {
        let ws = await BrowserRepository.getBrowserStateByWorkspaceId(workspaceId);
        if(ws) {
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            return await BrowserRepository.delete(ws.id);
        }else{
            return false;
        }
    }
    
    static async get(id: any) {
        return await BrowserRepository.get(id);
    }
    
    static async getAll() {
        return await BrowserRepository.getAll();
    }

    static async getBrowserStateByWorkspaceId(workspaceId: any) {
        return await BrowserRepository.getBrowserStateByWorkspaceId(workspaceId);
    }

    static async patchTabNavHistory(workspaceId: any, tabId: any, navState: any) {
        const browserState: any = await BrowserRepository.getBrowserStateByWorkspaceId(workspaceId);
        if (!browserState?.state?.openTabs?.[tabId]) {
            return null;
        }

        const state = Object.assign({}, browserState.state);
        const openTabs = Object.assign({}, state.openTabs);
        const tab = Object.assign({}, openTabs[tabId]);
        const tabState = Object.assign({}, tab.state);

        tabState.url = navState.url ?? tabState.url;
        if (navState.title !== undefined) {
            tabState.title = navState.title;
        }
        tabState.history = navState.history ?? tabState.history ?? [];
        tabState.historyIndex =
            navState.historyIndex ?? tabState.historyIndex ?? -1;

        tab.state = tabState;
        tab.url = tabState.url;
        openTabs[tabId] = tab;
        state.openTabs = openTabs;

        return BrowserRepository.update(browserState.id, state);
    }

}