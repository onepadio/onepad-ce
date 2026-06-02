import { db } from "./db";

export class PersonsRepository{
    static save(name: any, pin = '', data = {}) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
            db.persons.add({
                name: name,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                data : {},
                pin: pin,
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static setActiveUser(id: any, userId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
            db.persons.update(id, {
                updatedAt: Date.now(),
                activeUser: userId
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateName(id: any, name: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
            db.persons.update(id, {
                updatedAt: Date.now(),
                name: name
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updatePin(id: any, pin: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
            db.persons.update(id, {
                updatedAt: Date.now(),
                pin: pin
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateData(id: any, data: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
            db.persons.update(id, {
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
            // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
            db.persons.delete(id).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
            db.persons.get(id).then((profile: any) => {
                resolve(profile);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
            db.persons.toArray().then((persons: any) => {
                // sort by createdAt
                persons.sort((a: any, b: any) => a.createdAt - b.createdAt);
                resolve(persons);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }
}