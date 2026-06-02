import DesktopRepository from "../repository/desktop";
import { WorkspaceService } from "./workspace";

import { workspaceActions } from "../store/workspace-slice";

export default class DesktopService{
    static save(name: any, workspaceId: any, isDefault: any) {
        return new Promise((resolve, reject) => {
            let _isDefault = isDefault ? 1 : 0;
            DesktopRepository.save(name, workspaceId, _isDefault).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static async newDesktop(name: any, workspaceId: any, isDefault: any){
        let id = await DesktopRepository.save(name, workspaceId, isDefault);
        let desktop = await DesktopRepository.get(id);
        return desktop;
    }

    static update(id: any, name: any, workspaceId: any) {
        return new Promise((resolve, reject) => {
            DesktopRepository.update(id, name, workspaceId).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static rename(id: any, name: any) {
        return new Promise((resolve, reject) => {
            DesktopRepository.rename(id, name).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static delete(id: any) {
        return new Promise((resolve, reject) => {
            DesktopRepository.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            DesktopRepository.get(id).then((desktop) => {
                resolve(desktop);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            DesktopRepository.getAll().then((desktops) => {
                resolve(desktops);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getDefaultDesktopByWorkspaceId(workspaceId: any) {
        return new Promise((resolve, reject) => {
            DesktopRepository.getDefaultDesktopByWorkspaceId(workspaceId).then((desktop) => {
                resolve(desktop);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static setDefault(id: any) {
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            DesktopRepository.setDefault(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static getDesktopsByWorkspaceId(workspaceId: any) {
        return new Promise((resolve, reject) => {
            DesktopRepository.getDesktopsByWorkspaceId(workspaceId).then((desktops) => {
                resolve(desktops);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static updateState(id: any, state: any) {
        return new Promise((resolve, reject) => {
            DesktopRepository.updateState(id, state).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static saveIconOrder(desktopId: any, iconOrder: string[]) {
        return new Promise((resolve, reject) => {
            DesktopRepository.saveIconOrder(desktopId, iconOrder).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static togglePinnedApp(desktopId: any, appId: string) {
        return new Promise((resolve, reject) => {
            DesktopRepository.togglePinnedApp(desktopId, appId).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }
}
