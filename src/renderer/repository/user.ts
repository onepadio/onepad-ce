import { USER_TYPE } from "../model/user";
import { db } from "./db";

export class UsersRepository{
    static save(name: any, email: any, personId: any, type = USER_TYPE.GUEST, uid = '') {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
            db.users.add({
                name: name,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                email: email,
                person: personId,
                type: type,
                uid: uid
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateName(id: any, name: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
            db.users.update(id, {
                updatedAt: Date.now(),
                name: name
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateEmail(id: any, email: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
            db.users.update(id, {
                updatedAt: Date.now(),
                email: email
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }


    static setData(id: any, data: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
            db.users.update(id, {
                updatedAt: Date.now(),
                data: data
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static setLastWorkspace(id: any, workspaceId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
            db.users.update(id, {
                updatedAt: Date.now(),
                lastWorkspace: workspaceId
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static delete(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
            db.users.delete(id).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
            db.users.get(id).then((profile: any) => {
                resolve(profile);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getByEmail(email: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
            db.users.where("email").equals(email).first().then((user: any) => {
                resolve(user);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getByEmailAndPerson(email: any, personId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
            db.users.where("email").equals(email).and((user: any) => {
                return user.person === personId;
            }).first().then((user: any) => {
                resolve(user);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAllByPerson(personId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
            db.users.where("person").equals(personId).toArray().then((users: any) => {
                resolve(users);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
            db.users.toArray().then((profiles: any) => {
                resolve(profiles);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }
}