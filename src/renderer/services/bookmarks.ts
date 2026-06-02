import { BookmarksRepository } from "../repository/bookmarks";

export class BookmarksService {
    static save(parentId: any) {
        return new Promise((resolve, reject) => {
            BookmarksRepository.save(parentId).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static update(id: any, data: any) {
        return new Promise((resolve, reject) => {
            BookmarksRepository.update(id, data).then((id) => {
                resolve(id);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static delete(id: any) {
        return new Promise((resolve, reject) => {
            BookmarksRepository.delete(id).then(() => {
                // @ts-expect-error
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static get(id: any) {
        return new Promise((resolve, reject) => {
            BookmarksRepository.get(id).then((bookmarks) => {
                resolve(bookmarks);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static findByParentId(parentId: any) {
        return new Promise((resolve, reject) => {
            BookmarksRepository.findByParentId(parentId).then((bookmarks) => {
                resolve(bookmarks);
            }).catch((error) => {
                reject(error);
            });
        });
    }
}