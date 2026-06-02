import { db } from "./db";

export class SyncRepository{
    static save(action: any,data: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'sync' does not exist on type 'Dexie'.
            db.sync.add({
                action: action,
                data: data,
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static update(id: any, action: any, data: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'sync' does not exist on type 'Dexie'.
            db.sync.update(id, {
                action: action,
                data: data,
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static delete(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'sync' does not exist on type 'Dexie'.
            db.sync.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'sync' does not exist on type 'Dexie'.
            db.sync.get(id).then((sync: any) => {
                resolve(sync);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'sync' does not exist on type 'Dexie'.
            db.sync.toArray().then((syncs: any) => {
                resolve(syncs);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

}