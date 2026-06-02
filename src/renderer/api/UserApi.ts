import { API, Storage } from "../utils/api-client";

export default class UserApi {
    static async createUser(userInput: any) {
        const response = await API.post("userApi", `/users`, {
            body: userInput
        });
        return response;
    }

    static async getUserById(user_id: any) {
        const response = await API.get("userApi", `/users/${user_id}`);
        return response;
    }

    static async updateUser(user_id: any, key: any, value: any) {
        const response = await API.put("userApi", `/users/${user_id}`, {
            body: {
                "key": key,
                "value": value
            }
        });
        return response;
    }
}