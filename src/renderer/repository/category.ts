import { db } from "./db";
import {AES, enc}from 'crypto-js';

export class CategoryRepository{
    static save(name: any, workspaceId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.categories.add({
                name: name,
                workspace: workspaceId,
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
            db.categories.update(id, {
                name: name,
                workspace: workspaceId,
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
            db.categories.delete(id).then(() => {
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
            db.categories.get(id).then((category: any) => {
                resolve(category);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.categories.toArray().then((categories: any) => {
                resolve(categories);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getByWorkspace(workspaceId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.categories.where('workspace').equals(workspaceId).toArray().then((categories: any) => {
                resolve(categories);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

}