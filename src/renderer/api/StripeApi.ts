import { API, Storage } from "../utils/api-client";

export default class StripeApi {
    static async createCheckoutSession(priceId: any, deviceId: any, userId: any, email: any) {
        const response = await API.post("stripeApi", `/create-checkout-session`, {
            body: {
                priceId: priceId,
                deviceId: deviceId,
                userId: userId,
                email: email
            }
        });
        return response;
    }

    static async sessionStatus(sessionId: any) {
        const response = await API.get("stripeApi", `/session-status?session_id=`+sessionId);
        return response;
    }
}