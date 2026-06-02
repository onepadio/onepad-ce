import { API, Storage } from "../utils/api-client";

export default class P2PFileApi {
    static async sendRequest(sender: any, receiver: any, senderDeviceId: any, roomId: any) {
        const response = await API.post("p2pFileApi", `/p2pfile/ping`, {
            body: {
                sender: sender,
                receiver: receiver,
                device_id: senderDeviceId,
                room_id: roomId
            }
        });
        return response;
    }

    static async sendResponse(userEmail: any, senderDeviceId: any, roomId: any, answer: any) {
        const response = await API.post("p2pFileApi", `/p2pfile/pong`, {
            body: {
                receiver: userEmail,
                device_id: senderDeviceId,
                room_id: roomId,
                answer: answer
            }
        });
        return response;
    }
}