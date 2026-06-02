import { WorkspaceService } from "./workspace";
import DesktopService from "./desktop";
import AppService from "./app";
import { LinkService } from "./link";
import XAppService from "./xapp";
import log from "loglevel";

import isElectron from 'is-electron';


export default class ExportService {
    
    static async exportByProfileId(profileId: any) {
        let workspaces = {};
        let xapps = {};
        log.debug("ExportService.exportByProfileId", profileId);
        XAppService.getAllByProfileId(profileId).then((_xapps) => {
            log.debug("ExportService.exportByProfileId _xapps", _xapps);
            xapps = _xapps;

            WorkspaceService.getWorkspacesByProfileId(profileId).then((_workspaces) => {
                log.debug("ExportService.exportByProfileId _workspaces", _workspaces);
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                _workspaces.forEach((workspace: any) => {
                    workspace.desktops = DesktopService.getDesktopsByWorkspaceId(workspace.id);
                    workspace.apps = AppService.getAllByWorkspaceId(workspace.id);
                    workspace.links = LinkService.getAllByWorkspaceId(workspace.id);
                });
                workspaces = _workspaces;
            });

        
        }).catch((error) => {
            log.error("ExportService.exportByProfileId error", error);
        });

        // wait until all promises are resolved
        while (Object.keys(workspaces).length === 0 || Object.keys(xapps).length === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return {
            workspaces: workspaces,
            xapps: xapps,
        };

    }

    static exportProfile(profileId: any, callback: any){
        log.debug("exporting profile: ", profileId);
        let _workspaces: any = [];
        let _xapps: any = [];
        log.debug("ExportService.exportByProfileId", profileId);
        XAppService.getAllByProfileId(profileId).then((__xapps) => {
            log.debug("ExportService.exportByProfileId __xapps", __xapps);
            _xapps = __xapps;

            WorkspaceService.getActiveWorkspacesByProfileId(profileId).then((__workspaces) => {
                log.debug("ExportService.exportByProfileId _workspaces", __workspaces);
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                __workspaces.forEach((_workspace: any) => {
                    // if(_workspace.archived === 1) return;
                    _workspace.bgImage = "";
                    DesktopService.getDesktopsByWorkspaceId(_workspace.id).then((_desktops) => {
                        _workspace.desktops = _desktops;
                        AppService.getAllByWorkspaceId(_workspace.id).then((_apps) => {
                            _workspace.apps = _apps;
                            LinkService.getAllByWorkspaceId(_workspace.id).then((_links) => {
                                _workspace.links = _links;
                                _workspaces.push(_workspace);
                                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                                if(_workspaces.length === __workspaces.length){
                                    log.debug("ExportService.exportByProfileId _workspaces", _workspaces);
                                    log.debug("ExportService.exportByProfileId _xapps", _xapps);
                                    callback({
                                        workspaces: _workspaces.filter((w) => w.archived === 0),
                                        xapps: _xapps
                                });
                                }
                            });
                        });
                    });
                });
                
            });
        
        }).catch((error) => {
            log.error("ExportService.exportByProfileId error", error);
        });
    }

    static async exportWorkspace(workspaceId: any, callback: any){
        let _workspaces: any = [];
        WorkspaceService.getWorkspace(workspaceId).then((_workspace) => {
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            _workspace.bgImage = "";
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            DesktopService.getDesktopsByWorkspaceId(_workspace.id).then((_desktops) => {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                _workspace.desktops = _desktops;
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                AppService.getAllByWorkspaceId(_workspace.id).then((_apps) => {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    _workspace.apps = _apps;
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    LinkService.getAllByWorkspaceId(_workspace.id).then((_links) => {
                        log.debug("ExportService.exportWorkspace _links", _links);
                        // @ts-expect-error TS(2571): Object is of type 'unknown'.
                        _workspace.links = _links;
                        _workspaces.push(_workspace);
                        log.debug("ExportService.exportWorkspace _workspaces", _workspaces);
                        callback({
                                workspaces: _workspaces,
                                xapps: []
                        });
                    });
                });
            });
        });
    }

}