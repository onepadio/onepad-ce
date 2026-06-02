import { v4 as uuidv4 } from "uuid";

export const USER_TYPE = {
    GUEST: "guest",
    USER: "user",
    ADMIN: "admin"
};


export class UserFactory{
    static createUser(name: any, email: any){
        let id= uuidv4();
        return {
            id: id,
            name: name,
            email: email,
            isDefault: true,
            isGuest: false,
            icon: 'default',
            color: 'default',
            passCode: '',
            orgId: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    }
}