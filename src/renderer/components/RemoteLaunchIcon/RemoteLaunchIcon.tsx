import React from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import * as Icon from 'react-feather';
import clsx from "clsx";
import {
    Progress,
} from "reactstrap";


import { closeWindow } from "../../services/window";
// @ts-expect-error
import defaultIcon from '../../images/default_icon.png'
import './RemoteLaunchIcon.css'
import { localStorageKeyForSiteIcon } from '../../services/icon';
import { modalActions } from "../../store/modal-slice";
import { sessionActions } from '../../store/session-slice';
import AppService from '../../services/app';
import { toggleLaunchPad } from '../LaunchPadLocal/LaunchPadLocal';
import { windowServiceActions } from '../../store/window-service-slice';
import { resumeProcess } from '../../api/ProcessApi';
import { RemoteStore } from '../../data/remote';

function RemoteLaunchIcon(props) {
    const dispatch = useDispatch();

    const user = useSelector((state: any) => state.user);

    const items = useSelector((state: any) => state.workspace.apps);

    const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

    const isLocal = useSelector((state: any) => state.workspace.isLocal);

    const sessionState = useSelector((state: any) => state.session);

    const openWindows = useSelector((state: any) => state.session.openWindows);

    const openTabs = useSelector((state: any) => state.session.openTabs);

    const windowTabs = useSelector((state: any) => state.session.windowTabs);

    const activeTabs = useSelector((state: any) => state.session.activeTabs);

    const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

    const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

    const isLaunchPadOpen = useSelector((state: any) => state.modal.isLaunchPadOpen);

    const storeData = Object.assign({}, RemoteStore.itemsDb[props.applicationId]);

    var name_class = "text-white-50";
    // props.icon for backward compatibility
    var iconData =  localStorage.getItem(props.icon) || localStorage.getItem(localStorageKeyForSiteIcon(props.url));

    if((iconData == null || iconData.length === 0) && props.icon.length > 0){
        iconData = "./images/store/icon/"+props.icon;
    }
    if(iconData == null || iconData.length == 0){
        iconData = defaultIcon;
    }

    if(props.isOpen){
        name_class = "text-red-50";
    }

    function edit(){
        // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
        toggleLaunchPad(dispatch);
        dispatch(
            modalActions.selectIcon(props.data)
        );
        dispatch(
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            modalActions.toggleEditIconModal()
        );
    }

    function handleCloseWindow(){
        let _tabIds = Object.assign([], windowTabs[props.id]);
        let tabs = [];
        _tabIds.forEach((tabId) => {
            let _openTabs = Object.assign({}, openTabs);
            let _tab = Object.assign({}, _openTabs[tabId]);
            let _state = Object.assign({}, _tab.state);
            _state.id = tabId;
            tabs.push(_state);
        });
        if(sessionState.isInSession){
            closeWindow(dispatch, sessionActions, props.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
        }else{
            AppService.updateState(props.id, {
                tabs: tabs,
            }).then((res) => {
                log.debug("updateState", res);
                closeWindow(dispatch, sessionActions, props.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
            }).catch((err) => {
                log.error("updateState", err);
                closeWindow(dispatch, sessionActions, props.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
            });
        }

    }

    function resume() {
        resumeProcess(user.uid, props.id)
          .then((response: any) => {
            log.debug("ResumeProcess result:", response);
            if(response.ResponseMetadata.HTTPStatusCode === 200) {
              dispatch(windowServiceActions.openRemoteApp({
                application: response.Attributes.application,
                processId: response.Attributes.id,
                url: "http://"+response.Attributes.id+".onepad.io",
                storeData: storeData
              }));
            }
          })
          .catch((err) => {
            log.error("App.js: resumeProcess", err);
          });
      }


    function handleOnClick(){
        if(props.isInEditMode || props.status === "INSTALLING") return;
        if(isLaunchPadOpen) {
            // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
            toggleLaunchPad(dispatch);
        }

        log.debug("handleOnClick",props);
        log.debug("openWindows",openWindows);
        if(openWindows.hasOwnProperty(props.id) && props.status === "RUNNING"){
            dispatch(sessionActions.setActiveWindow({data: openWindows[props.id]}));
            return;
        }else{
            if(props.status === "STOPPED"){
                if(openWindows.hasOwnProperty(props.id)){
                    dispatch(windowServiceActions.closeWindowNoConfirmation(props.id));
                }
                resume();
            }else if(props.status === "RUNNING" || props.status === "STARTING"){
                log.debug("openRemoteApp",storeData);
                dispatch(windowServiceActions.openRemoteApp({
                    name: props.name,
                    application: props.application,
                    storeData: storeData,
                    processId: props.id,
                    url: "http://"+props.url,
                }));
            }else{
                alert("The application is not running.");
            }
            return;
        }
    }

    return(
        <div
        className={clsx(
            "remote-launch-icon-container",
        )}
        onContextMenu={(e) => {
            e.preventDefault(); // prevent the default behaviour when right clicked
        }}

        >
            {
                props.isInEditMode && !props.isOpen && (
                    <>
                                                <div onClick={()=> edit()} className={clsx(
                            "rounded-full p-2 overflow-hidden",
                            "bg-white/50 dark:bg-gray-600/50",
                            "text-gray-700 dark:text-gray-200",
                            "disabled:opacity-60 hover:opacity-80",
                            "shadow hover:shadow-lg transition-all",
                            "absolute left-5 !p-1.5 edit-button"
                        )}>
                            <Icon.Circle size={16}/>
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
                {props.status === "STOPPED" && (
                <div className={clsx(
                    "rounded-full p-1 overflow-hidden",
                    "bg-white/50 dark:bg-gray-600/50",
                    "text-gray-700 dark:text-gray-200",
                    "disabled:opacity-60 hover:opacity-80",
                    "shadow hover:shadow-lg transition-all",
                    "absolute top-1 left-1 !p-1.5 !bg-green-400/80 delete-button"
                )}>
                    <Icon.Play className="text-white" size={12}/>
                </div>
                )}

                {
                    openWindows[props.id] !== undefined && props.status === "RUNNING" && (
                        <>
                                                        <div onClick={()=> dispatch(windowServiceActions.closeWindow(props.id))} className={clsx(
                                "rounded-full p-1 overflow-hidden",
                                "bg-white/50 dark:bg-gray-600/50",
                                "text-gray-700 dark:text-gray-200",
                                "disabled:opacity-60 hover:opacity-80",
                                "shadow hover:shadow-lg transition-all",
                                "absolute top-1 left-1 !p-1.5 !bg-red-200/80 delete-button"
                            )}>
                                <Icon.Pause className="text-red-500" size={12}/>
                            </div>
                        </>
                    )
                }
                <div className="appicon d-flex justify-content-center position-relative">
                    <img className="launch-icon " src={iconData} width={48} alt=""/>
                    <div className="icon-middle">
                        <div className="icon-text">{props.name}</div>
                    </div>
                </div>
                <div className="mt-1">
                    <span className={"icon-text"}>
                        {
                            (props.status === "STARTING" ||  props.status === "INSTALLING" ||  props.status === "STOPPING")? (
                                <Progress className="mt-1" animated color="success" value={100} >
                                    {props.status.charAt(0).toUpperCase() + props.status.slice(1).toLowerCase()}
                                </Progress>
                            ):(
                                props.name
                            )
                        }
                    </span>
                </div>
                <div className="d-flex justify-content-center flex-column align-items-center">
                    {
                        props.status === "RUNNING" && (
                            <div className="status-dot"></div>
                        )
                    }
                </div>
            </div>
        </div>
    )


}

export default RemoteLaunchIcon;
