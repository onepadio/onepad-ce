import { db } from "./db";
import {AES, enc}from 'crypto-js';

export default class BrowserRepository{
    static save(workspaceId: any, state: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.browsers.add({
                workspace: workspaceId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                state: state
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static update(id: any, state: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.browsers.update(id, {
                updatedAt: Date.now(),
                state:state
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
            db.browsers.delete(id).then(() => {
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
            db.browsers.get(id).then((browser: any) => {
                resolve(browser);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.browsers.toArray().then((browsers: any) => {
                resolve(browsers);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getBrowserStateByWorkspaceId(workspaceId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.browsers.where("workspace").equals(workspaceId).first().then((browsers: any) => {
                resolve(browsers);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

}