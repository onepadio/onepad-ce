import { db } from "./db";
import {AES, enc}from 'crypto-js';

export default class DesktopRepository{
    static save(name: any, workspaceId: any, isDefault: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.desktops.add({
                name: name,
                workspace: workspaceId,
                default:isDefault,
                state: {
                    windows: [],
                    activeWindowId: "",
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

    static update(id: any, name: any, workspaceId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.desktops.update(id, {
                name: name,
                workspace: workspaceId,
                updatedAt: Date.now(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static rename(id: any, name: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.desktops.update(id, {
                name: name,
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
            db.desktops.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.desktops.get(id).then((desktop: any) => {
                resolve(desktop);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.desktops.toArray().then((desktops: any) => {
                resolve(desktops);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getDesktopsByWorkspaceId(workspaceId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.desktops.where("workspace").equals(workspaceId).toArray().then((desktops: any) => {
                resolve(desktops);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getDefaultDesktopByWorkspaceId(workspaceId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.desktops.where("workspace").equals(workspaceId).and((desktop: any) => {
                return desktop.default == 1;
            }).first().then((desktop: any) => {
                resolve(desktop);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateState(id: any, state: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.desktops.update(id, {
                state: state,
                updatedAt: Date.now(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static saveIconOrder(desktopId: any, iconOrder: string[]) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.desktops.get(desktopId).then((desktop: any) => {
                if (!desktop) {
                    reject(new Error("Desktop not found"));
                    return;
                }
                const newState = {
                    ...desktop.state,
                    iconOrder: iconOrder,
                };
                // @ts-expect-error
                db.desktops.update(desktopId, {
                    state: newState,
                    updatedAt: Date.now(),
                }).then((id: any) => {
                    resolve(id);
                }).catch((error: any) => {
                    reject(error);
                });
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static togglePinnedApp(desktopId: any, appId: string) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.desktops.get(desktopId).then((desktop: any) => {
                if (!desktop) {
                    reject(new Error("Desktop not found"));
                    return;
                }
                const pinnedApps = desktop.state.pinnedApps || [];
                const isPinned = pinnedApps.includes(appId);
                const newPinnedApps = isPinned
                    ? pinnedApps.filter((id: string) => id !== appId)
                    : [...pinnedApps, appId];

                const newState = {
                    ...desktop.state,
                    pinnedApps: newPinnedApps,
                };
                // @ts-expect-error
                db.desktops.update(desktopId, {
                    state: newState,
                    updatedAt: Date.now(),
                }).then((id: any) => {
                    resolve(id);
                }).catch((error: any) => {
                    reject(error);
                });
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

}
