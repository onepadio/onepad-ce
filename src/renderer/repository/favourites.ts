import { db } from "./db";
import {AES, enc}from 'crypto-js';

export class FavouritesRepository{
    static save(parentId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.favourites.add({
                parent: parentId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                data: []
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
            db.favourites.update(id, {
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
            db.favourites.delete(id).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.favourites.get(id).then((favourite: any) => {
                resolve(favourite);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static findByParentId(parentId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.favourites.where('parent').equals(parentId).first().then((favourites: any) => {
                resolve(favourites);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static deleteByParentIdAndId(parentId: any, id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.favourites.where('parent').equals(parentId).first().then((favourites: any) => {
                if (favourites) {
                    let data = favourites.data;
                    let index = data.findIndex((item: any) => {
                        return item.id === id;
                    });
                    if (index > -1) {
                        data.splice(index, 1);
                        FavouritesRepository.update(favourites.id, data).then((id) => {
                            resolve(id);
                        }).catch((error) => {
                            reject(error);
                        });
                    } else {
                        // @ts-expect-error
                        resolve();
                    }
                } else {
                    // @ts-expect-error
                    resolve();
                }
            }).catch((error: any) => {
                reject(error);
            });
        });
    }
}