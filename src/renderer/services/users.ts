import { USER_TYPE } from "../model/user";
import { ProfilesRepository } from "../repository/profiles";
import { UsersRepository } from "../repository/user";
import log from "loglevel";


export class UsersService {
    static create(name: any, email: any, personId: any, type = USER_TYPE.GUEST, uid = '') {
        return new Promise((resolve, reject) => {
            UsersRepository.save(name, email, personId, type, uid).then((id) => {
                resolve(id);
                log.debug("user added: ", id);
                ProfilesRepository.add(id, "Profile 1");
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static updateName(userId: any, name: any) {
        return new Promise((resolve, reject) => {
            UsersRepository.updateName(userId, name).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static updateEmail(userId: any, email: any) {
        return new Promise((resolve, reject) => {
            UsersRepository.updateEmail(userId, email).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static setData(id: any, data: any) {
        return new Promise((resolve, reject) => {
            UsersRepository.setData(id, data).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static setLastWorkspace(userId: any, workspaceId: any) {
        return new Promise((resolve, reject) => {
            UsersRepository.setLastWorkspace(userId, workspaceId).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static setHomeWorkspace(userId: any, workspaceId: any) {
        return new Promise((resolve, reject) => {
            UsersRepository.setHomeWorkspace(userId, workspaceId).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static delete(userId: any) {
        return new Promise((resolve, reject) => {
            UsersRepository.delete(userId).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            UsersRepository.get(id).then((user) => {
                resolve(user);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getByEmail(email: any) {
        return new Promise((resolve, reject) => {
            UsersRepository.getByEmail(email).then((user) => {
                resolve(user);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getByEmailAndPerson(email: any, personId: any) {
        return new Promise((resolve, reject) => {
            UsersRepository.getByEmailAndPerson(email, personId).then((user) => {
                resolve(user);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getGuestUserByPerson(personId: any) {
        return new Promise((resolve, reject) => {
            UsersRepository.getAllByPerson(personId).then((users) => {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                let guestUser = users.find((user: any) => user.type === USER_TYPE.GUEST);
                resolve(guestUser);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            UsersRepository.getAll().then((persons) => {
                resolve(persons);
            }).catch((error) => {
                reject(error);
            });
        });
    }
}