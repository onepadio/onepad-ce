import { API, Storage } from "../utils/api-client";

export async function createProcess(processInput: any) {
    const response = await API.post("processApi", `/process`, {
        body: processInput
    });
    return response;
}

export async function archiveProcess(user_id: any, process_id: any) {
    const response = await API.put("processApi", `/process/${user_id}/${process_id}/archive`, {
        body: {}
    });
    return response;
}

export async function getProcessesByUser(user_id: any) {
    const response = await API.get("processApi", `/process/${user_id}`);
    return response;
}

export async function getProcessDetails(user_id: any, process_id: any) {
    const response = await API.get("processApi", `/process/${user_id}/${process_id}`);
    return response;
}

export async function deleteProcess(user_id: any, process_id: any) {
    const response = await API.del("processApi", `/process/${user_id}/${process_id}`);
    return response;
}

export async function updateProcess(user_id: any, process_id: any, processInput: any) {
    const response = await API.put("processApi", `/process/${user_id}/${process_id}`, {
        body: processInput
    });
    return response;
}

export async function logActivity(user_id: any, process_id: any) {
    const response = await API.put("processApi", `/process/${user_id}/${process_id}`, {
        body: {
            "action": "logactivity"
        }
    });
    return response;
}

export async function stopProcess(user_id: any, process_id: any) {
    const response = await API.post("processApi", `/process/stop`, {
        body: {
            "user_id": user_id,
            "id": process_id
        }
    });
    return response;
}

export async function resumeProcess(user_id: any, process_id: any) {
    const response = await API.post("processApi", `/process/resume`, {
        body: {
            "user_id": user_id,
            "id": process_id
        }
    });
    return response;
}

export async function terminateProcess(user_id: any, process_id: any) {
    const response = await API.post("processApi", `/process/terminate`, {
        body: {
            "user_id": user_id,
            "id": process_id
        }
    });
    return response;
}