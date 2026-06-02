import { db } from "./db";
import { VersionRepository } from "./versions";
const TABLE_NAME = "passwords";

export class PasswordRepository{
    static save(personId: any, hostname: any, username: any, password: any, notes: any, workspace: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.add({
                person: personId,
                hostname: hostname,
                username: username,
                password: password,
                notes: notes,
                workspace: workspace,
            }).then((id: any) => {
                VersionRepository.increase(TABLE_NAME).then(() => {
                    resolve(id);
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error: any) => {
                reject(error);
            });
        }); 
    }

    static update(id: any, personId: any, hostname: any, username: any, password: any, notes: any, workspace: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.update(id, {
                person: personId,
                hostname: hostname,
                username: username,
                password: password,
                notes: notes,
                workspace: workspace
            }).then((id: any) => {
                VersionRepository.increase(TABLE_NAME).then(() => {
                    resolve(id);
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static delete(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.delete(id).then(() => {
                VersionRepository.increase(TABLE_NAME).then(() => {
                    // @ts-expect-error
                    resolve();
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.get(id).then((password: any) => {
                resolve(password);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.toArray().then((passwords: any) => {
                resolve(passwords);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAllByPerson(personId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.where('person').equals(personId).toArray().then((passwords: any) => {
                resolve(passwords);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAllByPersonAndWorkspace(personId: any, workspace: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.where({ person: personId, workspace: workspace }).toArray().then((passwords: any) => {
                resolve(passwords);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getByPersonAndHostname(personId: any, hostname: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.where({ person: personId, hostname: hostname }).toArray().then((passwords: any) => {
                resolve(passwords);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static search(personId: any, search: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.where('person').equals(personId).filter((password: any) => {
                return password.hostname.includes(search) || password.username.includes(search) || password.notes.includes(search);
            }).toArray().then((passwords: any) => {
                resolve(passwords);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static searchByHostname(personId: any, search: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.where('person').equals(personId).filter((password: any) => {
                return password.hostname.includes(search);
            }).toArray().then((passwords: any) => {
                resolve(passwords);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static searchByUsername(personId: any, search: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.where('person').equals(personId).filter((password: any) => {
                return password.username.includes(search);
            }).toArray().then((passwords: any) => {
                resolve(passwords);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static searchByWorkspace(personId: any, workspace: any, search: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.passwords.where({ person: personId, workspace: workspace }).filter((password: any) => {
                return password.hostname.includes(search) || password.username.includes(search) || password.notes.includes(search);
            }
            ).toArray().then((passwords: any) => {
                resolve(passwords);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }
    
}