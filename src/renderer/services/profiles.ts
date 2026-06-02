import { ProfilesRepository } from "../repository/profiles";

export class ProfilesService {
    static save(userId: any, name: any, data = {}, uid = '') {
        return new Promise((resolve, reject) => {
            ProfilesRepository.add(userId, name,  data, uid).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static update(userId: any, data: any) {
        return new Promise((resolve, reject) => {
            ProfilesRepository.update(userId, data).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static updateSettings(id: any, data: any) {
        return new Promise((resolve, reject) => {
            ProfilesRepository.updateSettings(id, data).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static updateName(id: any, name: any) {
        return new Promise((resolve, reject) => {
            ProfilesRepository.updateName(id, name).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static updateUser(id: any, user: any) {
        return new Promise((resolve, reject) => {
            ProfilesRepository.updateUser(id, user).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static delete(userId: any) {
        return new Promise((resolve, reject) => {
            ProfilesRepository.delete(userId).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            ProfilesRepository.get(id).then((profile) => {
                resolve(profile);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static async getAllProfiles(){
        return await ProfilesRepository.getAll();
    }

    static getAllByUserId(userId: any) {
        return new Promise((resolve, reject) => {
            ProfilesRepository.getAllByUserId(userId).then((profiles) => {
                resolve(profiles);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static findByUId(uid: any) {
        return new Promise((resolve, reject) => {
            ProfilesRepository.findByUId(uid).then((profiles) => {
                resolve(profiles);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static updateByUserId(userId: any, data: any) {
        return new Promise((resolve, reject) => {
            ProfilesRepository.getAllByUserId(userId).then((profiles) => {
                if (profiles) {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    ProfilesRepository.update(profiles.id, data).then((id) => {
                        resolve(id);
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    // @ts-expect-error TS(2554): Expected 2-4 arguments, but got 1.
                    ProfilesRepository.add(userId).then((id) => {
                        ProfilesRepository.update(id, data).then((id) => {
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

    static deleteByUserIdAndId(userId: any, id: any) {
        return new Promise((resolve, reject) => {
            ProfilesRepository.getAllByUserId(userId).then((profiles) => {
                if (profiles) {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    let data = profiles.data.filter((item: any) => {
                        return item.id !== id;
                    });

                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    ProfilesRepository.update(profiles.id, data).then((id) => {
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

    static deleteByUserIdAndProfileId(userId: any, profileId: any, id: any) {
        return new Promise((resolve, reject) => {
            ProfilesRepository.getAllByUserId(userId).then((profiles) => {
                if (profiles) {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    let profile = profiles.data.find((item: any) => {
                        return item.id === profileId;
                    });

                    if (profile) {
                        let data = profile.children.filter((item: any) => {
                            return item.id !== id;
                        });

                        profile.children = data;
                    }

                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    ProfilesRepository.update(profiles.id, profiles.data).then((id) => {
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