import { db } from "./db";
import {AES, enc}from 'crypto-js';

export class LinkRepository{
    static save(workspaceId: any, desktopId: any, categoryId: any, title: any, startUrl: any, icon: any, window: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'links' does not exist on type 'Dexie'.
            db.links.add({
                workspace: workspaceId,
                desktop: desktopId,
                category: categoryId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                data: {
                    title: title,
                    startUrl: startUrl,
                    icon: icon,
                    window: window,
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

    static update(id: any, desktopId: any, categoryId: any, title: any, startUrl: any, icon: any, window: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'links' does not exist on type 'Dexie'.
            db.links.update(id, {
                updatedAt: Date.now(),
                category: categoryId,
                desktop: desktopId,
                data: {
                    title: title,
                    startUrl: startUrl,
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
            // @ts-expect-error TS(2339): Property 'links' does not exist on type 'Dexie'.
            db.links.update(id, {
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
            // @ts-expect-error TS(2339): Property 'links' does not exist on type 'Dexie'.
            db.links.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'links' does not exist on type 'Dexie'.
            db.links.get(id).then((link: any) => {
                resolve(link);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'links' does not exist on type 'Dexie'.
            db.links.toArray().then((links: any) => {
                resolve(links);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getByDesktopIdAndCategoryId(desktopId: any, categoryId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'links' does not exist on type 'Dexie'.
            db.links.where({desktop: desktopId, category: categoryId}).sortBy('createdAt').then((links: any) => {
                resolve(links);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getByWorkspaceIdAndCategoryId(workspaceId: any, categoryId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'links' does not exist on type 'Dexie'.
            db.links.where({workspace: workspaceId, desktop: "all", category: categoryId}).sortBy('createdAt').then((links: any) => {
                resolve(links);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

}