import { db } from "./db";
import {AES, enc}from 'crypto-js';

export default class AppRepository{
    static save(workspaceId: any, desktopId: any, name: any, startUrl: any, customUrl: any, storeId: any, icon: any, window: any, autoSave: any, suspendTabs: any, isolated: any, useragent = "") {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'apps' does not exist on type 'Dexie'.
            db.apps.add({
                workspace: workspaceId,
                desktop: desktopId,
                storeId: storeId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                data: {
                    name: name,
                    startUrl: startUrl,
                    customUrl: customUrl,
                    icon: icon,
                    window: window,
                    autoSave: autoSave,
                    suspendTabs: suspendTabs,
                    isolated: isolated,
                    useragent: useragent
                },
                state:{
                    tabs: []
                }
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static update(id: any, desktopId: any, name: any, startUrl: any, customUrl: any, icon: any, window: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'apps' does not exist on type 'Dexie'.
            db.apps.update(id, {
                updatedAt: Date.now(),
                desktop: desktopId,
                data:{
                    name: name,
                    startUrl: startUrl,
                    customUrl: customUrl,
                    icon: icon,
                    window: window,
                }
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateState(id: any, state: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'apps' does not exist on type 'Dexie'.
            db.apps.update(id, {
                updatedAt: Date.now(),
                state: state
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static delete(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'apps' does not exist on type 'Dexie'.
            db.apps.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'apps' does not exist on type 'Dexie'.
            db.apps.get(id).then((app: any) => {
                resolve(app);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'apps' does not exist on type 'Dexie'.
            db.apps.toArray().then((apps: any) => {
                resolve(apps);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAppsByDesktopId(desktopId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'apps' does not exist on type 'Dexie'.
            db.apps.where('desktop').equals(desktopId).sortBy('createdAt').then((apps: any) => {
                resolve(apps);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAppsByWorkspaceId(workspaceId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'apps' does not exist on type 'Dexie'.
            db.apps.where('workspace').anyOf([workspaceId, "all"])
                .sortBy('createdAt')
                .then((apps: any) => {
                    resolve(apps);
                }).catch((error: any) => {
                    reject(error);
                });
        });
    }

    static getAllByWorkspaceId(workspaceId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'apps' does not exist on type 'Dexie'.
            db.apps.where({workspace: workspaceId}).sortBy('createdAt').then((apps: any) => {
                resolve(apps);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

}