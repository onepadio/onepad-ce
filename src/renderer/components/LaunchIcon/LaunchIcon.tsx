import isElectron from 'is-electron';
import React, { useRef } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from 'uuid';
import * as Icon from 'react-feather';
import clsx from "clsx";
import log from "loglevel";
import {
    Button,
} from "reactstrap";


import { openAppWindow, openInternalWindow, handleWindowClosed, WindowType} from '../../services/window'
import { closeWindow } from "../../services/window";
import defaultIcon from '../../images/default_icon.png'
import './LaunchIcon.css'
import { localStorageKeyForSiteIcon } from '../../services/icon';
import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from '../../store/workspace-slice';
import { windowActions } from '../../store/window-slice';
import { sessionActions } from '../../store/session-slice';
import { appActions } from '../../store/app-slice';
import AppService from '../../services/app';
import { selectWorkspace } from '../../services/workspace';
import { spaceAppActions } from '../../store/spaceapp-slice';
import { windowServiceActions } from '../../store/window-service-slice';

function LaunchIcon(props: any) {
    const dispatch = useDispatch();
    const items = useSelector((state: any) => state.workspace.apps);
    const isLaunchPadOpen = useSelector((state: any) => state.modal.isLaunchPadOpen);
    const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);
    const isLocal = useSelector((state: any) => state.workspace.isLocal);
    const sessionState = useSelector((state: any) => state.session);
    const openWindows = useSelector((state: any) => state.session.openWindows);
    const openTabs = useSelector((state: any) => state.session.openTabs);
    const windowTabs = useSelector((state: any) => state.session.windowTabs);
    const activeTabs = useSelector((state: any) => state.session.activeTabs);
    const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
    const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
    const workspaceState = useSelector((state: any) => state.workspace);
    const user = useSelector((state: any) => state.user);
    const route = useSelector((state: any) => state.session.route);


    var name_class = "text-white-50";
    // props.icon for backward compatibility
    var iconData = props.icon;

    // Check if icon is a data URL, blob URL, or http URL
    if (iconData && (iconData.startsWith("data:") || iconData.startsWith("blob:") || iconData.startsWith("http"))) {
        // Use the icon directly
    } else {
        // Try localStorage
        iconData = localStorage.getItem(props.icon) || localStorage.getItem(localStorageKeyForSiteIcon(props.url));

        if((iconData == null || iconData.length === 0) && props.icon && props.icon.length > 0){
            iconData = "./images/store/icon/"+props.icon;
        }
    }

    if(iconData == null || iconData.length == 0){
        iconData = defaultIcon;
    }

    if(props.isOpen){
        name_class = "text-red-50";
    }

    function edit(){
        dispatch(modalActions.setLocation("launchpad"));
        dispatch(
            modalActions.selectIcon(props.data)
        );
        setTimeout(() => {
            dispatch(
                // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                modalActions.toggleEditIconModal()
            );
        }, 100);
    }

    function handleCloseWindow(){
        closeWindow(dispatch, sessionActions, props.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
      }

    function newTab(windowId: any, url: any, icon: any, title: any, isolated = false){
        const now = new Date().getTime();
        return {
            id: uuidv4(),
            url: url,
            location: "main",
            type: "app",
            desktop: desktop.id,
            workspace: workspace.id,
            window: windowId,
            state:{
                url: url,
                title: title,
                icon: icon,
            },
            created: now,
            lastAccessed: now,
            sleeping: true,
            isolated: isolated,
        }
    }

    function resumeTab(windowId: any, tabId: any, url: any, icon: any, title: any, isolated = false){
        let _tabId = tabId ? tabId : uuidv4();
        const now = new Date().getTime();
        return {
            id: _tabId,
            url: url,
            location: "main",
            type: "app",
            desktop: desktop.id,
            workspace: workspace.id,
            window: windowId,
            state:{
                url: url,
                title: title,
                icon: icon,
            },
            created: now,
            lastAccessed: now,
            sleeping: true,
            isolated: isolated,
        }
    }

    function getPartitionId(workspaceId: any){
        let partition = "";
        if(route === "authenticated"){
          partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+user.username+"_"+workspaceState.currentSession.id : "persist:"+user.username+"_"+workspaceId;
        }else{
          partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+workspaceState.currentSession.id : "persist:"+workspaceId;
        }

        if(props.data.workspace === "all" || (props.isolated ? props.isolated : false)){
            partition = "persist:"+props.id;
        }

        return partition;
      }

    function moveTabToExternalWindow(url: any, windowId: any, tabId: any, partition: any, windowType: any){
        let _window = openWindows[windowId];
        if(isElectron()){
          // @ts-expect-error
          window.electronAPI.send("toMain", {
            action: "open-external-window",
            tabWindowId: windowId,
            tabId: tabId,
            url: url,
            partition: getPartitionId(workspace.id),
            type: windowType,
          });

          let _openTabs = Object.assign({}, openTabs);
          let _tab = Object.assign({}, _openTabs[tabId]);

          _tab.location = "external";
          _openTabs[tabId] = _tab;
          dispatch(
            sessionActions.setOpenTabs({
              data: _openTabs,
            })
          );
        }
      }

    function handleOnClick2(){
        dispatch(spaceAppActions.setUrl(props.url));
        dispatch(spaceAppActions.setTitle(props.name));
        dispatch(spaceAppActions.setIsOpen(true));
    }

    function handleOnClick(){
        if(isLaunchPadOpen){
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            dispatch(modalActions.hideLaunchPad());
        }
        if(props.isInEditMode) return;
        log.debug("props.data:",props.data);
        let _autoSave = props.autoSave !== undefined ? props.autoSave : false;
        if(isExternalWindowMode || props.windowConfig.type === "workspace" || (openWindows[props.id] != null && openWindows[props.id].location === "external")){
            openAppWindow(props.id, props.url, props.windowConfig.type, props.isStateful, props.showControls);
        }else if(props.windowConfig.type === WindowType.Modal){
            if(isElectron()){
                // @ts-expect-error
                window.electronAPI.send("toMain", {
                    action: "open-modal",
                    url: props.url,
                    isFullScreen: props.windowConfig.isFullScreen,
                    width: props.windowConfig.width,
                    height: props.windowConfig.height,
                });
            }
        }else if(props.windowConfig.type === WindowType.SystemBrowser){
            window.open(props.url, "_blank");
        }else{

            log.debug("openInternalWindow:"+props.url);
            log.debug("openWindows:",openWindows);
            if(openWindows[props.id] != null && openWindows[props.id].workspace !== null && (openWindows[props.id].workspace === workspace.id || openWindows[props.id].workspace === "all")){
                dispatch(sessionActions.setActiveWindow({data: openWindows[props.id]}));
                if(openWindows[props.id] && openWindows[props.id].sleeping === true){
                    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                    dispatch(appActions.showSplashScreen());
                    setTimeout(() => {
                        //dispatch(appActions.showTabsScreen());
                        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                        dispatch(appActions.hideSplashScreen());
                    }, 1000);
                }
                return;
            }
            let window = {
                workspace: props.workspaceId,
                id: props.id,
                url: props.url,
                location: "main",
            }

            let _openWindows = Object.assign({}, openWindows);
            let _openTabs = Object.assign({}, openTabs);
            let _windowTabs = Object.assign({}, windowTabs);
            openInternalWindow(
                window,
                items,
                _openWindows,
                isLocal,
                (result: any) => {
                    if(result === undefined || result === null){
                      return;
                    }
                    AppService.get(props.id).then((app: any) => {
                        log.debug("app:",app);
                        if(app == null){
                            return;
                        }

                        let _result = Object.assign({}, app);

                        _result.type = "app";

                        _result.url = props.url;

                        _result.location = props.windowConfig.type === WindowType.External ? "external":"main";

                        _result.desktop = desktop.id;

                        _result.partition = getPartitionId(workspace.id);

                        log.debug("Result:",_result);

                        // Openwindows
                        _openWindows[props.id] = _result;
                        dispatch(
                            sessionActions.setOpenWindows({
                            data: _openWindows,
                        })
                        );
                        let _tabIds = [];
                        // OpenTabs
                        let _tab = newTab(props.id, props.url, _result.data.icon, "", props.isolated);
                        _tab.location = props.windowConfig.type === WindowType.External ? "external":"main";
                        _tab.partition = getPartitionId(workspace.id);
                        _openTabs[_tab.id] = _tab;
                        _tabIds.push(_tab.id);

                        dispatch(
                            sessionActions.setOpenTabs({
                            data: _openTabs,
                        }));
                        // WindowTabs
                        _windowTabs[_result.id] = _tabIds;
                        dispatch(
                            sessionActions.setWindowTabs({
                            data: _windowTabs,
                        }));

                        dispatch(sessionActions.setActiveWindow({data: _result}));
                        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                        dispatch(appActions.showSplashScreen());
                        setTimeout(() => {
                            //if(_tabIds.length > 1){
                            // dispatch(appActions.showTabsScreen());
                            //}
                            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                            dispatch(appActions.hideSplashScreen());
                        }, 1000);

                        if(props.windowConfig.type === WindowType.External){
                            // @Todo: Move to external window
                            // @ts-expect-error TS(2339): Property 'id' does not exist on type '{}'.
                            moveTabToExternalWindow(props.url, _result.id, _tab.id, props.partition, WindowType.External);
                        }

                    }).catch((error) => {
                        log.error("Error:",error);
                    });

                  },
              );
        }
    }

    return (
        <div
        className={clsx(
            "launch-icon-container",
        )}
        draggable={props.draggable !== undefined ? props.draggable : true}
        onDragStart={props.onDragStart}
        onDragOver={props.onDragOver}
        onDragEnd={props.onDragEnd}
        style={props.style}
        onContextMenu={(e) => {
            e.preventDefault(); // prevent the default behaviour when right clicked
            const isWindowOpen = openWindows[props.id] != null;
            let _menu = document.createElement("div");
            _menu.className = "context-menu";
            _menu.innerHTML = `
              <div class="context-menu-item${isWindowOpen ? '' : ' disabled'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                </svg>
                <span>Close</span>
              </div>
              <div class="context-menu-item${isWindowOpen ? ' disabled' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                </svg>
                <span>Edit</span>
              </div>
              <div class="context-menu-item${isWindowOpen ? ' disabled' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                </svg>
                <span>Remove</span>
              </div>
            `;
            _menu.style.position = "fixed";
            _menu.style.top = (e.clientY) + "px";
            _menu.style.left = (e.clientX+20) + "px";
            document.body.appendChild(_menu);

            _menu.querySelector(".context-menu-item:first-child")?.addEventListener("click", () => {
                dispatch(windowServiceActions.closeWindow(props.id));
                document.body.removeChild(_menu);
            });

            _menu.querySelector(".context-menu-item:nth-child(2)")?.addEventListener("click", () => {
                document.body.removeChild(_menu);
                if(props.isOpen){
                    alert("Please close the window first. After that you can edit the app.");
                    return;
                }
                edit();
            });

            _menu.querySelector(".context-menu-item:nth-child(3)")?.addEventListener("click", () => {
                document.body.removeChild(_menu);
                if(props.isOpen){
                    alert("Please close the window first. After that you can remove the app.");
                    return;
                }
                if(window.confirm("Are you sure you want to remove this app?")){
                    AppService.delete(props.id).then(
                        (id) => {
                            AppService.getAppsByWorkspaceIdAndDesktopId(workspace.id, desktop.id).then((apps) => {
                                dispatch(workspaceActions.setApps({apps: apps}));
                            });
                        }
                    );
                }
            });

            // Close menu when clicking outside
            const closeMenu = (e: any) => {
              if (document.body.contains(_menu) && !_menu.contains(e.target)) {
                document.body.removeChild(_menu);
                document.removeEventListener("click", closeMenu);
              }
            };

            // Delay adding the click listener to prevent immediate closure
            setTimeout(() => {
              document.addEventListener("click", closeMenu);
            }, 0);
          }}

        >
            {
                props.isInEditMode && !props.isOpen && (
                    <>
                        {}
                        <div onClick={()=> edit()} className={clsx(
                            "rounded-full p-2 overflow-hidden",
                            "bg-white/50 dark:bg-gray-600/50",
                            "text-gray-700 dark:text-gray-200",
                            "disabled:opacity-60 hover:opacity-80",
                            "shadow hover:shadow-lg transition-all",
                            "absolute left-5 !p-1.5 edit-button"
                        )}>
                            <Icon.Edit2 size={16}/>
                        </div>
                    </>
                )
            }
            {
                false && (
                    <>
                        {}
                        <div onClick={()=> handleCloseWindow()} className={clsx(
                            "rounded-full p-1 overflow-hidden",
                            "bg-white/50 dark:bg-gray-600/50",
                            "text-gray-700 dark:text-gray-200",
                            "disabled:opacity-60 hover:opacity-80",
                            "shadow hover:shadow-lg transition-all",
                            "absolute top-2 right-5 !p-1.5 !bg-red-200/80 delete-button"
                        )}>
                            {}
                            <Icon.X className="text-red-500" size={12}/>
                        </div>
                    </>
                )
            }
            <div
                className={clsx(
                    "card p-2 text-center launch-item" + (openWindows[props.id] != null ? "" : ""),
                )}
                onClick= {() => handleOnClick()}
                >
                {}
                <div className="appicon d-flex justify-content-center">
                    {}
                    <img
                        className="launch-icon"
                        src={iconData}
                        width={48}
                        alt=""
                        onError={(e: any) => {
                            e.target.src = defaultIcon;
                        }}
                    />
                    {}
                    <div className="icon-middle">
                        {}
                        <div className="icon-text">{props.name}</div>
                    </div>
                </div>
                <div className="d-flex justify-content-center flex-column align-items-center mt-1">
                    <div className='d-flex'>
                        {
                            props.isOpen && props.showStatusDot && (
                                <span className="status-dot"></span>
                            )
                        }
                        {}
                        <span className={"icon-text ml-1"}>{props.name}</span>
                    </div>
                </div>
            </div>
        </div>
    );


}

export default LaunchIcon;
