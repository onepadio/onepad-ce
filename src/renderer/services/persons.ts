import { USER_TYPE } from "../model/user";
import { db } from "../repository/db";
import { PersonsRepository } from "../repository/person";
import { ProfilesRepository } from "../repository/profiles";
import log from "loglevel";


export class PersonsService {
    static create(name: any, pin = '', data = {}) {
        return new Promise((resolve, reject) => {
            PersonsRepository.save(name, pin, data).then((id) => {
                resolve(id);
                // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
                db.users.add({
                    email: "",
                    name: "Guest",
                    person: id,
                    type: USER_TYPE.GUEST,
                }).then((user_id: any) => {
                    PersonsRepository.setActiveUser(id, user_id);
                    log.debug("user added: ", user_id);
                    ProfilesRepository.add(user_id, "Profile 1");
                }).catch((error: any) => {
                    log.error("error adding user: ", error);
                    reject(error);
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static setActiveUser(personId: any, userId: any) {
        return new Promise((resolve, reject) => {
            PersonsRepository.setActiveUser(personId, userId).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static updateName(personId: any, name: any) {
        return new Promise((resolve, reject) => {
            PersonsRepository.updateName(personId, name).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static updatePin(personId: any, pin: any) {
        return new Promise((resolve, reject) => {
            PersonsRepository.updatePin(personId, pin).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static updateData(id: any, data: any) {
        return new Promise((resolve, reject) => {
            PersonsRepository.updateData(id, data).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }


    static delete(personId: any) {
        return new Promise((resolve, reject) => {
            PersonsRepository.delete(personId).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            PersonsRepository.get(id).then((person) => {
                resolve(person);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            PersonsRepository.getAll().then((persons) => {
                resolve(persons);
            }).catch((error) => {
                reject(error);
            });
        });
    }
}