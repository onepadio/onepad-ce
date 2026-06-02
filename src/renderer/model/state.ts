export class SessionStateFactory{
    static create(){
        return {
            openWindows: {},
            activeDesktopWindows: {},
            openTabs: {},
            externalTabs: {},
            windowTabs: {},
            activeWindow: {
            id: "launchpad",
            data: {}, 
            tabs: [
                {id: "launchpad"},
                ]
            },
            remoteTabs: {},
            activeWindowId: "launchpad",
            windowHistory: [],
            activeWindowTabs: [],
            activeTab: {},
            activeTabId: "",
            previousTabId: "",
            activeTabs: {},
            browserWindows: [],
            activeBrowserWindowId: "",
            bookmarks: {},
            favourites: {},
            isInSession: false,
            zoomLevel: 1,
            closedExternalTabId: "",
            sync: false,
            lastGlobalWindowId: "",
            isFullScreen: false,
            ssDict: {},
            ssDictVersion: 0,
            route: "",
        };
    }
}

export class WorkspaceStateFactory{
    static create(){
        return {
            workspaces: [],
            recentWorkspaces: {},
            selectedWorkspace: {},
            desktops: [],
            desktopNames: {},
            defaultDesktopId: "",
            selectedDesktop: {},
            selectedDesktopId: "",
            selectedCategory: "",
            apps: [],
            links: [],
            items: [],
            sessions: [],
            currentSession: {},
            widgetConfig: {},
            selectedWidgetId: 0,
        };
    }
}


export class SessionState{
    activeBrowserWindowId: any;
    activeDesktopWindows: any;
    activeTab: any;
    activeTabId: any;
    activeTabs: any;
    activeWindow: any;
    activeWindowId: any;
    activeWindowTabs: any;
    bookmarks: any;
    browserWindows: any;
    favourites: any;
    isFullScreen: any;
    location: any;
    openTabs: any;
    openWindows: any;
    previousTabId: any;
    ssDict: any;
    ssDictVersion: any;
    sync: any;
    windowHistory: any;
    windowTabs: any;
    constructor(){
        this.openWindows = {};
        this.activeDesktopWindows = {};
        this.openTabs = {};
        this.windowTabs = {};
        this.activeWindow = {
        id: "launchpad",
        data: {}, 
        tabs: [
            {id: "launchpad"},
            ]
        };
        this.activeWindowId = "launchpad";
        this.activeWindowTabs = [];
        this.activeTab = {};
        this.activeTabId = "";
        this.previousTabId= "";
        this.activeTabs = {};
        this.browserWindows = [];
        this.activeBrowserWindowId = "";
        this.bookmarks = {};
        this.favourites = {};
        this.location = "";
        this.sync = false;
        this.isFullScreen = false;
        this.ssDict = {};
        this.ssDictVersion = 0;
    }

    toDict(){
        return {
            openWindows: this.openWindows,
            activeDesktopWindows: this.activeDesktopWindows,
            openTabs: this.openTabs,
            windowTabs: this.windowTabs,
            activeWindow: this.activeWindow,
            activeWindowId: this.activeWindowId,
            windowHistory: this.windowHistory,
            activeWindowTabs: this.activeWindowTabs,
            activeTab: this.activeTab,
            activeTabId: this.activeTabId,
            previousTabId: this.previousTabId,
            activeTabs: this.activeTabs,
            browserWindows: this.browserWindows,
            activeBrowserWindowId: this.activeBrowserWindowId,
            bookmarks: this.bookmarks,
            favourites: this.favourites,
            location: this.location,
            sync: this.sync,
            isFullScreen: this.isFullScreen,
            ssDict: this.ssDict,
            ssDictVersion: this.ssDictVersion,
        }
    }
}

export class BrowserState{
    activeBrowserWindowId: any;
    activeTabs: any;
    browserWindows: any;
    openTabs: any;
    openWindows: any;
    windowTabs: any;
    constructor(){
        this.browserWindows = [];
        this.openWindows = {};
        this.windowTabs = {};
        this.activeTabs = {};
        this.openTabs = {};
        this.activeBrowserWindowId = "";
    }

    toDict(){
        return {
            browserWindows: this.browserWindows,
            activeBrowserWindowId: this.activeBrowserWindowId,
            openWindows: this.openWindows,
            windowTabs: this.windowTabs,
            activeTabs: this.activeTabs,
            openTabs: this.openTabs,
        }
    }
}

export class BrowserStateFactory{
    static new(){
        return new BrowserState();
    }
}