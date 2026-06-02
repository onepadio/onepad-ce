import { db } from "./db";

export class ProfilesRepository{
    static add(userId: any, name: any, data = {}, uid = '') {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.profiles.add({
                name: name,
                user: userId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                data : data,
                uid: uid
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
            db.profiles.update(id, {
                updatedAt: Date.now(),
                data: data
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateSettings(id: any, data: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.profiles.update(id, {
                updatedAt: Date.now(),
                settings: data
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateName(id: any, name: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.profiles.update(id, {
                updatedAt: Date.now(),
                name: name
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateUser(id: any, user: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.profiles.update(id, {
                updatedAt: Date.now(),
                user: user
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
            db.profiles.delete(id).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.profiles.get(id).then((profile: any) => {
                resolve(profile);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.profiles.toArray().then((profiles: any) => {
                resolve(profiles);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAllByUserId(userId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.profiles.where('user').equals(userId).toArray().then((profiles: any) => {
                resolve(profiles);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static findByUId(uid: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.profiles.where('uid').equals(uid).toArray().then((profiles: any) => {
                resolve(profiles);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

}