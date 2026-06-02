import { API, Storage } from "../utils/api-client";

export default class WorkspaceApi {
    static async createWorkspace(workspaceInput: any) {
        const response = await API.post("workspaceApi", `/workspaces`, {
            body: workspaceInput
        });
        return response;
    }

    static async getWorkspacesByUser(user_id: any) {
        const response = await API.get("workspaceApi", `/workspaces/${user_id}`);
        return response;
    }

    static async getWorkspaceByUserAndId(user_id: any, workspace_id: any) {
        const response = await API.get("workspaceApi", `/workspaces/${user_id}/${workspace_id}`);
        return response;
    }

    static async updateWorkspace(user_id: any, workspace_id: any, workspaceInput: any) {
        const response = await API.put("workspaceApi", `/workspaces/${user_id}/${workspace_id}`, {
            body: workspaceInput
        });
        return response;
    }

    static async updateWorkspaceItems(user_id: any, workspace_id: any, items: any) {
        const response = await API.put("workspaceApi", `/workspaces/data/${user_id}/${workspace_id}`, {
            body: {
                data: items
            }
        });
        return response;
    }

    static async deleteWorkspace(user_id: any, workspace_id: any) {
        const response = await API.del("workspaceApi", `/workspaces/${user_id}/${workspace_id}`);
        return response;
    }
}

export async function addWorkspace(workspace: any) {
    const response = await API.post("workspaceApi", `/workspaces`, {
        body: workspace
    });
    return response;
}

export async function archiveWorkspace(user_id: any, workspace_id: any) {
    const response = await API.put("workspaceApi", `/workspaces/archive/${user_id}/${workspace_id}`, {
        body: {}
    });
    return response;
}

export async function getWorkspaces(user_id: any) {
    const response = await API.get("workspaceApi", `/workspaces/${user_id}`);
    return response;
}

export async function getWorkspaceDetails(user_id: any, workspace_id: any) {
    const response = await API.get("workspaceApi", `/workspaces/${user_id}/${workspace_id}`);
    return response;
}

export async function deleteWorkspace(user_id: any, workspace_id: any) {
    const response = await API.del("workspaceApi", `/workspaces/${user_id}/${workspace_id}`);
    return response;
}

export async function updateWorkspace(user_id: any, workspace_id: any, workspace: any) {
    const response = await API.put("workspaceApi", `/workspaces/${user_id}/${workspace_id}`, {
        body: workspace
    });
    return response;
}

export async function updateWorkspaceItems(user_id: any, workspace_id: any, items: any) {
    const response = await API.put("workspaceApi", `/workspaces/${user_id}/${workspace_id}/data`, {
        body: {
            data: items
        }
    });
    return response;
}