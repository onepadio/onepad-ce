import AppRepository from "../repository/app";

export default class AppService {
    static async save(workspaceId: any, desktopId: any, name: any, startUrl: any, customUrl: any, storeId: any, icon: any, window: any, autoSave: any, suspendTabs: any, isolated = false) {
        return await AppRepository.save(workspaceId, desktopId, name, startUrl, customUrl, storeId, icon, window, autoSave, suspendTabs, isolated);
    }
    
    static async update(id: any, desktopId: any, name: any, startUrl: any, customUrl: any, icon: any, window: any) {
        return await AppRepository.update(id, desktopId, name, startUrl, customUrl, icon, window);
    }

    static async updateState(id: any, state: any) {
        return await AppRepository.updateState(id, state);
    }
    
    static async delete(id: any) {
        return await AppRepository.delete(id);
    }
    
    static async get(id: any) {
        return await AppRepository.get(id);
    }
    
    static async getAll() {
        return await AppRepository.getAll();
    }

    static async getAppsByDesktopId(desktopId: any) {
        return await AppRepository.getAppsByDesktopId(desktopId);
    }

    static async getAppsByWorkspaceId(workspaceId: any) {
        return await AppRepository.getAppsByWorkspaceId(workspaceId);
    }

    static async getAllByWorkspaceId(workspaceId: any) {
        return await AppRepository.getAllByWorkspaceId(workspaceId);
    }

    static async getAppsByWorkspaceIdAndDesktopId(workspaceId: any, desktopId: any) {
        let allApps = await AppRepository.getAppsByWorkspaceId(workspaceId);
        //let desktopApps = await AppRepository.getAppsByDesktopId(desktopId);
        return allApps;
    }
}