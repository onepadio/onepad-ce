import { API } from "../utils/api-client";

export async function getSiteIcon(url: any) {
    // encode url to base64
    let encodedUrl = btoa(url);
    const response = await API.post("iconApi", `/icons`, {
        body: {
            url: encodedUrl
        }
    });
    return response;
}