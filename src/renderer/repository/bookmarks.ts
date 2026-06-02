import { db } from "./db";
import {AES, enc}from 'crypto-js';

export class BookmarksRepository{
    static save(parentId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.bookmarks.add({
                parent: parentId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                data:[]
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static update(id: any, data: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.bookmarks.update(id, {
                updatedAt: Date.now(),
                data: data
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
            db.bookmarks.delete(id).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.bookmarks.get(id).then((bookmarks: any) => {
                resolve(bookmarks);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static findByParentId(parentId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.bookmarks.where('parent').equals(parentId).toArray().first().then((bookmarks: any) => {
                resolve(bookmarks);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }
}