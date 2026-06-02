import { FavouritesRepository } from "../repository/favourites";

export class FavouritesService {
    static save(parentId: any) {
        return new Promise((resolve, reject) => {
            FavouritesRepository.save(parentId).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static update(id: any, data: any) {
        return new Promise((resolve, reject) => {
            FavouritesRepository.update(id, data).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static delete(id: any) {
        return new Promise((resolve, reject) => {
            FavouritesRepository.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            FavouritesRepository.get(id).then((favourite) => {
                resolve(favourite);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static findByParentId(parentId: any) {
        return new Promise((resolve, reject) => {
            FavouritesRepository.findByParentId(parentId).then((favourites) => {
                resolve(favourites);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static updateByParentId(parentId: any, data: any) {
        return new Promise((resolve, reject) => {
            FavouritesRepository.findByParentId(parentId).then((favourites) => {
                if (favourites) {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    FavouritesRepository.update(favourites.id, data).then((id) => {
                        resolve(id);
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    FavouritesRepository.save(parentId).then((id) => {
                        FavouritesRepository.update(id, data).then((id) => {
                            resolve(id);
                        }).catch((error) => {
                            reject(error);
                        });
                    }).catch((error) => {
                        reject(error);
                    });
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }
    
    static updateByParentIdAndFolderId(parentId: any, folderId: any, data: any) {
        return new Promise((resolve, reject) => {
            FavouritesRepository.findByParentId(parentId).then((favourites) => {
                if (favourites) {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    let folder = favourites.data.find((item: any) => {
                        return item.id === folderId;
                    });

                    if (folder) {
                        folder.children = data;
                    } else {
                        // @ts-expect-error TS(2571): Object is of type 'unknown'.
                        favourites.data.push({
                            id: folderId,
                            name: "New Folder",
                            icon: "folder",
                            children: data
                        });
                    }

                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    FavouritesRepository.update(favourites.id, favourites.data).then((id) => {
                        resolve(id);
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    FavouritesRepository.save(parentId).then((id) => {
                        FavouritesRepository.update(id, [{
                            id: folderId,
                            data: data
                        }]).then((id) => {
                            resolve(id);
                        }).catch((error) => {
                            reject(error);
                        });
                    }).catch((error) => {
                        reject(error);
                    });
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static deleteByParentIdAndId(parentId: any, id: any) {
        return new Promise((resolve, reject) => {
            FavouritesRepository.findByParentId(parentId).then((favourites) => {
                if (favourites) {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    let data = favourites.data.filter((item: any) => {
                        return item.id !== id;
                    });

                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    FavouritesRepository.update(favourites.id, data).then((id) => {
                        resolve(id);
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    // @ts-expect-error
                    resolve();
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static deleteByParentIdAndFolderId(parentId: any, folderId: any, id: any) {
        return new Promise((resolve, reject) => {
            FavouritesRepository.findByParentId(parentId).then((favourites) => {
                if (favourites) {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    let folder = favourites.data.find((item: any) => {
                        return item.id === folderId;
                    });

                    if (folder) {
                        let data = folder.children.filter((item: any) => {
                            return item.id !== id;
                        });

                        folder.children = data;
                    }

                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    FavouritesRepository.update(favourites.id, favourites.data).then((id) => {
                        resolve(id);
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    // @ts-expect-error
                    resolve();
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }
}