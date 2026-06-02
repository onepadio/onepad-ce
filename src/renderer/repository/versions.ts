import { db } from "./db";
import { v4 as uuidv4 } from "uuid";

export const TABLES = {
    USERS: "users",
    PROFILES: "profiles",
    PASSWORDS: "passwords",
};

export class VersionRepository{
    static get(table: any){
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.tversions.where("table").equals(table).toArray().then((versions: any) => {
                if(versions.length === 0){
                    let _version = uuidv4();
                    // @ts-expect-error
                    db.tversions.add({table: table, version: _version}).then((id: any) => {
                        resolve(_version);
                    }).catch((error: any) => {
                        reject(error);
                    });
                }else{
                    resolve(versions[0].version);
                }
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static set(table: any, version: any){
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.tversions.where("table").equals(table).toArray().then((versions: any) => {
                if(versions.length === 0){
                    // @ts-expect-error
                    db.tversions.add({table: table, version: version}).then((id: any) => {
                        resolve(id);
                    }).catch((error: any) => {
                        reject(error);
                    });
                }else{
                    // @ts-expect-error
                    db.tversions.update(versions[0].id, {table: table, version: version}).then((id: any) => {
                        resolve(id);
                    }).catch((error: any) => {
                        reject(error);
                    });
                }
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    static increase(table: any){
        return new Promise((resolve, reject) => {
            // @ts-expect-error
            db.tversions.where("table").equals(table).toArray().then((versions: any) => {
                if(versions.length === 0){
                    // @ts-expect-error
                    db.tversions.add({table: table, version: 1}).then((id: any) => {
                        resolve(id);
                    }).catch((error: any) => {
                        reject(error);
                    });
                }else{
                    let _version = uuidv4();
                    // @ts-expect-error
                    db.tversions.update(versions[0].id, {table: table, version: _version }).then((id: any) => {
                        resolve(id);
                    }).catch((error: any) => {
                        reject(error);
                    });
                }
            }).catch((error: any) => {
                reject(error);
            });
        });
    }


}