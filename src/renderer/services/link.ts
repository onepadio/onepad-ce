import { LinkRepository } from "../repository/link";
import log from "loglevel";

export class LinkService {
    static save(workspaceId: any, desktopId: any, categoryId: any, title: any, startUrl: any, icon: any, window: any) {
        return new Promise((resolve, reject) => {
            LinkRepository.save(workspaceId, desktopId, categoryId, title, startUrl, icon, window).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static update(id: any, desktopId: any, categoryId: any, title: any, startUrl: any, icon: any, window: any) {
        return new Promise((resolve, reject) => {
            LinkRepository.update(id, desktopId, categoryId, title, startUrl, icon, window).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static async updateState(id: any, state: any) {
        return await LinkRepository.updateState(id, state);
    }

    static delete(id: any) {
        return new Promise((resolve, reject) => {
            LinkRepository.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            LinkRepository.get(id).then((link) => {
                resolve(link);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            LinkRepository.getAll().then((links) => {
                resolve(links);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getAllByWorkspaceId(workspaceId: any) {
        return new Promise((resolve, reject) => {
            LinkRepository.getByWorkspaceIdAndCategoryId(workspaceId, "links").then((links) => {
                resolve(links);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getByWorkspaceIdAndCategoryId(workspaceId: any, categoryId: any) {
        return new Promise((resolve, reject) => {
            LinkRepository.getByWorkspaceIdAndCategoryId(workspaceId, categoryId).then((links) => {
                resolve(links);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static getByDesktopIdAndCategoryId(desktopId: any, categoryId: any) {
        return new Promise((resolve, reject) => {
            LinkRepository.getByDesktopIdAndCategoryId(desktopId, categoryId).then((links) => {
                resolve(links);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static async getLinksByWorkspaceIdAndDesktopId(workspaceId: any, desktopId: any) {
        let allLinks = await LinkService.getByWorkspaceIdAndCategoryId(workspaceId, "links");
        let desktopLinks = await LinkService.getByDesktopIdAndCategoryId(desktopId, "links");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        let _links = allLinks.concat(desktopLinks);
        _links.map((link: any) => {
            // get domain from linkd.data.startUrl
            let _domain = new URL(link.data.startUrl).hostname;
            link.domain = _domain
        });
        return _links;
    }
}

export default LinkService;