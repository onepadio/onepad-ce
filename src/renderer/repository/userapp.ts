import { db } from "./db";
import log from "loglevel";

export class UserAppRepository {
    static save(userId: any, name: any, url: any, icon: any, description: any, company: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'userapps' does not exist on type 'Dexie'.
            db.userapps.add({
                user: userId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                name: name,
                url: url,
                icon: icon,
                description: description || "",
                company: company || "",
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                log.error("Error saving user app:", error);
                reject(error);
            });
        });
    }

    static update(id: any, name: any, url: any, icon: any, description: any, company: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'userapps' does not exist on type 'Dexie'.
            db.userapps.update(id, {
                updatedAt: Date.now(),
                name: name,
                url: url,
                icon: icon,
                description: description,
                company: company,
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                log.error("Error updating user app:", error);
                reject(error);
            });
        });
    }

    static delete(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'userapps' does not exist on type 'Dexie'.
            db.userapps.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error: any) => {
                log.error("Error deleting user app:", error);
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'userapps' does not exist on type 'Dexie'.
            db.userapps.get(id).then((userApp: any) => {
                resolve(userApp);
            }).catch((error: any) => {
                log.error("Error getting user app:", error);
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'userapps' does not exist on type 'Dexie'.
            db.userapps.toArray().then((userApps: any) => {
                resolve(userApps);
            }).catch((error: any) => {
                log.error("Error getting all user apps:", error);
                reject(error);
            });
        });
    }

    static getAllByUserId(userId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'userapps' does not exist on type 'Dexie'.
            db.userapps.where({user: userId}).sortBy('createdAt').then((userApps: any) => {
                resolve(userApps);
            }).catch((error: any) => {
                log.error("Error getting user apps by user:", error);
                reject(error);
            });
        });
    }
}
