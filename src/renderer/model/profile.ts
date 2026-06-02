import { v4 as uuidv4 } from "uuid";

export class ProfileFactory{
    static createProfile(name: any){
        let id= uuidv4();
        return {
            id: id,
            name: name,
            user: '',
            data : {
                orgId: '',
                icon: 'default',
                color: 'default',
            },
            passCode: '',
            sync: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    }
}