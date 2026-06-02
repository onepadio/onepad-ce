import { version } from "react";
import { db } from "./db";
import { v4 as uuidv4 } from "uuid";

export default class WorkspaceRepository {
    static save(name: any, isDefault = 0, sync = 0, profileDefault = 0, profile: any, user: any, config = {}, uid = "") {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.add({
                name: name,
                user: user,
                profile: profile,
                archived: 0,
                isDefault: isDefault,
                sync: sync,
                profileDefault: profileDefault,
                config: config,
                state: {
                    desktop: "",
                    openWindows: {},
                    openTabs: {},
                    windowTabs: {},
                    activeTabs: {},
                    activeTab: {},
                    activeTabId: "",
                    activeWindow: {},
                    activeWindowTabs: [],
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
                version: uuidv4(),
                lastSyncVersion: "",
                uid: uid,
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static update(id: any, name: any, archived: any, isDefault: any, sync: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.update(id, {
                name: name,
                archived: archived,
                isDefault: isDefault,
                sync: sync,
                updatedAt: Date.now(),
                version: uuidv4(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateProfile(id: any, profile: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.update(id, {
                profile: profile,
                updatedAt: Date.now(),
                version: uuidv4(),
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
            db.workspaces.update(id, {
                user: user,
                updatedAt: Date.now(),
                version: uuidv4(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateBackgroundImage(id: any, data: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.update(id, {
                bgImage: data,
                updatedAt: Date.now(),
                version: uuidv4(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateConfig(id: any, config: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.update(id, {
                config: config,
                updatedAt: Date.now(),
                version: uuidv4(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static updateUID(id: any, uid: any){
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.update(id, {
                uid: uid,
                updatedAt: Date.now(),
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
            db.workspaces.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.get(id).then((workspace: any) => {
                resolve(workspace);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.toArray().then((workspaces: any) => {
                resolve(workspaces);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAllActive() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.where("archived").equals(0).toArray().then((workspaces: any) => {
                resolve(workspaces);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAllByProfileId(profileId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.where("profile").equals(profileId).toArray().then((workspaces: any) => {
                resolve(workspaces);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAllActiveByProfileId(profileId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.where("profile").equals(profileId).toArray().then((workspaces: any) => {
                resolve(workspaces.filter((workspace: any) => workspace.archived === 0));
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAllByUserId(userId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.where("user").equals(userId).toArray().then((workspaces: any) => {
                resolve(workspaces);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getAllActiveByUserId(userId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.where("user").equals(userId).toArray().then((workspaces: any) => {
                resolve(workspaces.filter((workspace: any) => workspace.archived === 0));
            }).catch((error: any) => {
                reject(error);
            });
        });
        
    }

    static getAllSyncRequiredByUserId(userId: any){
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.where("user").equals(userId).toArray().then((workspaces: any) => {
                resolve(workspaces.filter((workspace: any) => workspace.version !== workspace.lastSyncVersion));
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getByUID(uid: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.where("uid").equals(uid).toArray().then((workspaces: any) => {
                resolve(workspaces[0]);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getByUIDAndProfileId(uid: any, profileId: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.where("uid").equals(uid).and((workspace: any) => workspace.profile === profileId).toArray().then((workspaces: any) => {
                resolve(workspaces[0]);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }


    static getDefault() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.where("default").equals(1).toArray().then((workspaces: any) => {
                resolve(workspaces[0]);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getProfileDefault() {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.where("profileDefault").equals(1).toArray().then((workspaces: any) => {
                resolve(workspaces[0]);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }


    static setDesktop(id: any, desktop: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.update(id, {
                state: {
                    desktop: desktop
                },
                updatedAt: Date.now(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static setArchived(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.update(id, {
                archived: 1,
                updatedAt: Date.now(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static saveState(id: any, state: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.workspaces.update(id, {
                state: state,
                updatedAt: Date.now(),
            }).then((id: any) => {
                resolve(id);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

}