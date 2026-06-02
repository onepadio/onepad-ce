import XAppRepository from "../repository/xapp";

export default class XAppService {
    static async save(name: any, startUrl: any, customUrl: any, storeId: any, icon: any, window: any, profileId: any, autoSave: any, suspendTabs: any) {
        return await XAppRepository.save(name, startUrl, customUrl, storeId, icon, window, profileId, autoSave, suspendTabs);
    }
    
    static async update(id: any, name: any, startUrl: any, customUrl: any, icon: any, window: any) {
        return await XAppRepository.update(id, name, startUrl, customUrl, icon, window);
    }

    static async updateState(id: any, state: any) {
        return await XAppRepository.updateState(id, state);
    }
    
    static async delete(id: any) {
        return await XAppRepository.delete(id);
    }
    
    static async get(id: any) {
        return await XAppRepository.get(id);
    }
    
    static async getAll() {
        return await XAppRepository.getAll();
    }

    static async getAllByProfileId(profileId: any) {
        return await XAppRepository.getAllByProfileId(profileId);
    }

    static saveStateToSessionStorage(openWindows: any, openTabs: any, windowTabs: any, activeTabs: any) {
        let profileWindows = {};
        Object.values(openWindows).forEach((window) => {
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            if(window.type === "xapp") {
                // @ts-expect-error
                profileWindows[window.id] = window;
            }
        });
        sessionStorage.setItem("profileWindows", JSON.stringify(profileWindows));

        let profileTabs = {};
        Object.values(openTabs).forEach((tab) => {
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            if(tab.type === "xapp") {
                // @ts-expect-error
                profileTabs[tab.id] = tab;
            }
        });
        sessionStorage.setItem("profileTabs", JSON.stringify(profileTabs));

        let profileWindowTabs = {};
        Object.keys(windowTabs).forEach((windowId) => {
            if(openWindows.hasOwnProperty(windowId) && openWindows[windowId].type === "xapp" ) {
                profileWindowTabs[windowId] = windowTabs[windowId];
            }
        });
        sessionStorage.setItem("profileWindowTabs", JSON.stringify(profileWindowTabs));

        let profileActiveTabs = {};
        Object.keys(activeTabs).forEach((windowId) => {
            if(openWindows.hasOwnProperty(windowId) && openWindows[windowId].type === "xapp" ) {
                profileActiveTabs[windowId] = activeTabs[windowId];
            }
        });
        sessionStorage.setItem("profileActiveTabs", JSON.stringify(profileActiveTabs));
    }

    static loadWindowsFromSessionStorage() {
        let profileWindows = sessionStorage.getItem("profileWindows") ? JSON.parse(sessionStorage.getItem("profileWindows")) : {};
        return profileWindows;  
    }

    static loadTabsFromSessionStorage() {
        let profileTabs = sessionStorage.getItem("profileTabs") ? JSON.parse(sessionStorage.getItem("profileTabs")) : {};
        return profileTabs;
    }

    static loadWindowTabsFromSessionStorage() {
        let profileWindowTabs = sessionStorage.getItem("profileWindowTabs") ? JSON.parse(sessionStorage.getItem("profileWindowTabs")) : {};
        return profileWindowTabs;
    }

    static loadActiveTabsFromSessionStorage() {
        let profileActiveTabs = sessionStorage.getItem("profileActiveTabs") ? JSON.parse(sessionStorage.getItem("profileActiveTabs")) : {};
        return profileActiveTabs;
    }
}