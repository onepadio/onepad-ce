import { db } from "./db";
import {AES, enc}from 'crypto-js';

export default class XAppRepository{
    static save(name: any, startUrl: any, customUrl: any, storeId: any, icon: any, window: any, profileId: any, autoSave: any, suspendTabs: any, useragent = "") {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'xapps' does not exist on type 'Dexie'.
            db.xapps.add({
                profile: profileId,
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

    static update(id: any, name: any, startUrl: any, customUrl: any, icon: any, window: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'xapps' does not exist on type 'Dexie'.
            db.xapps.update(id, {
                updatedAt: Date.now(),
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
            // @ts-expect-error TS(2339): Property 'xapps' does not exist on type 'Dexie'.
            db.xapps.update(id, {
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
            // @ts-expect-error TS(2339): Property 'xapps' does not exist on type 'Dexie'.
            db.xapps.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'xapps' does not exist on type 'Dexie'.
            db.xapps.get(id).then((app: any) => {
                resolve(app);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'xapps' does not exist on type 'Dexie'.
            db.xapps.toArray().then((apps: any) => {
                resolve(apps);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAllByProfileId(profileId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'xapps' does not exist on type 'Dexie'.
            db.xapps.where("profile").equals(profileId).toArray().then((apps: any) => {
                resolve(apps);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

}