import { db } from "./db";

export default class SessionRepository {
    static save(name: any, workspaceId: any, sync = 0, isolated = 0) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.sessions.add({
                name: name,
                archived: 0,
                sync: sync,
                workspace: workspaceId,
                isolated: isolated,
                state: {
                    openWindows: {},
                    activeDesktopWindows: {},
                    openTabs:{},
                    windowTabs: {},
                    activeWindow: {
                        id: "launchpad",
                        data: {}, 
                        tabs: [
                            {id: "launchpad"},
                            ],
                    },
                    activeWindowId: "launchpad",
                    activeWindowTabs: [],
                    activeTab: {},
                    activeTabId: "",
                    previousTabId: "",
                    activeTabs: {},
                    browserWindows: [],
                    activeBrowserWindowId: "",
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static update(id: any, name: any, archived: any, isDefault: any, sync: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.sessions.update(id, {
                name: name,
                archived: archived,
                isDefault: isDefault,
                sync: sync,
                updatedAt: Date.now(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static delete(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.sessions.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getSessionsByWorkspaceId(workspaceId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.sessions.where("workspace").equals(workspaceId).toArray().then((sessions: any) => {
                resolve(sessions);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.sessions.get(id).then((workspace: any) => {
                resolve(workspace);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.sessions.toArray().then((workspaces: any) => {
                resolve(workspaces);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAllActive() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.sessions.where("archived").equals(0).toArray().then((workspaces: any) => {
                resolve(workspaces);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static setArchived(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.sessions.update(id, {
                archived: 1,
                updatedAt: Date.now(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static saveState(id: any, state: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.sessions.update(id, {
                state: state,
                updatedAt: Date.now(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static async patchTabNavHistory(id: any, tabId: any, navState: any) {
        const session: any = await SessionRepository.get(id);
        if (!session?.state?.openTabs?.[tabId]) {
            return null;
        }

        const state = Object.assign({}, session.state);
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
        openTabs[tabId] = tab;
        state.openTabs = openTabs;

        return SessionRepository.saveState(id, state);
    }

}