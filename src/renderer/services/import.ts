import { WorkspaceService } from "./workspace";
import DesktopService from "./desktop";
import AppService from "./app";
import { LinkService } from "./link";
import XAppService from "./xapp";
import log from "loglevel";
import { Link } from "react-router-dom";
import WorkspaceRepository from "../repository/workspace";

export default class ImportService{

    static importData(data: any, profileId: any, callback: any) {
        if(profileId === "") return;
        data.workspaces.forEach((workspace: any) => {
            // @ts-expect-error TS(2554): Expected 7-8 arguments, but got 5.
            WorkspaceService.newWorkspace(workspace.name+"_Imported", false, workspace.sync, false, profileId).then(
                (workspaceId) => {
                    // WorkspaceRepository.updateBackgroundImage(workspaceId, workspace.bgImage);
                    DesktopService.newDesktop("Default", workspaceId, true).then(
                        (desktop) => {
                            workspace.apps.forEach((app: any) => {
                                log.debug("ImportService.importData app", app);
                                // @ts-expect-error TS(2554): Expected 10-11 arguments, but got 8.
                                AppService.save(workspaceId, "all", app.data.name, app.data.startUrl, app.data.customUrl, app.storeId, app.data.icon, app.data.window).then(
                                    (appId) => {
                                        AppService.updateState(appId, app.state);
                                    }
                                );
                            });
                            workspace.links.forEach((link: any) => {
                                log.debug("ImportService.importData link", link);
                                LinkService.save(workspaceId, "all", link.category, link.data.title, link.data.startUrl, link.data.icon, link.data.window).then(
                                    (linkId) => {
                                        LinkService.updateState(linkId, link.state);
                                    }
                                );
                            });
                            let _xappIds: any = [];
                            data.xapps.forEach((xapp: any) => {
                                // @ts-expect-error TS(2554): Expected 9 arguments, but got 7.
                                XAppService.save(xapp.data.name, xapp.data.startUrl, xapp.data.customUrl, xapp.storeId, xapp.data.icon, xapp.data.window, profileId).then(
                                    (xappId) => {
                                        _xappIds.push(xappId);
                                        if(_xappIds.length === data.xapps.length){
                                            localStorage.setItem("xappIds-"+profileId, JSON.stringify(_xappIds));
                                        }
                                    }
                                );
                            });
                            setTimeout(() => {
                                callback();
                            }, 500);
                    });
                });
            });
        
    }

}