import { API } from "../utils/api-client";

export default class ClipboardApi {
    static async update(userId: any, deviceId: any, text: any) {
        const response = await API.post("clipboardApi", `/clipboard/update`, {
            body: {
                user_id: userId,
                device_id: deviceId,
                text
            }
        });
        return response;
    }
}