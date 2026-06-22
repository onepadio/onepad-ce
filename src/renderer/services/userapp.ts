import { UserAppRepository } from "../repository/userapp";
import log from "loglevel";

export class UserAppService {
    static save(userId: any, name: any, url: any, icon: any, description: any, company: any) {
        return new Promise((resolve, reject) => {
            UserAppRepository.save(userId, name, url, icon, description, company).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static update(id: any, name: any, url: any, icon: any, description: any, company: any) {
        return new Promise((resolve, reject) => {
            UserAppRepository.update(id, name, url, icon, description, company).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static delete(id: any) {
        return new Promise((resolve, reject) => {
            UserAppRepository.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            UserAppRepository.get(id).then((userApp) => {
                resolve(userApp);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            UserAppRepository.getAll().then((userApps) => {
                resolve(userApps);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getAllByUserId(userId: any) {
        return new Promise((resolve, reject) => {
            UserAppRepository.getAllByUserId(userId).then((userApps) => {
                resolve(userApps);
            }).catch((error) => {
                reject(error);
            });
        });
    }
}

export default UserAppService;
