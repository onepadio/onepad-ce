import { API, Storage } from "../utils/api-client";

export default class ProfileApi {
    static async createProfile(profileInput: any) {
        const response = await API.post("profileApi", `/profiles`, {
            body: profileInput
        });
        return response;
    }

    static async getProfilesByUser(user_id: any) {
        const response = await API.get("profileApi", `/profiles/${user_id}`);
        return response;
    }

    static async getProfileByUserAndId(user_id: any, profile_id: any) {
        const response = await API.get("profileApi", `/profiles/${user_id}/${profile_id}`);
        return response;
    }
}