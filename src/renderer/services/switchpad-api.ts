import { API } from "../utils/api-client";


export async function loadApps() {
    const response = await API.get("appCatalogApi", "/app");
    return response;
}

export async function getAppDetails(appId: any) {
    const response = await API.get("appCatalogApi", `/app/${appId}`);
    return response;
}

export async function searchApp(query: any) {
    const response = await API.get("appCatalogApi", `/search/${query.replace(/\s/g, '')}`);
    return response;
}