import React from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import * as Icon from 'react-feather';
import clsx from "clsx";
import { Progress } from "reactstrap";

import { modalActions } from "../../store/modal-slice";
import { dockerService } from "../../services/docker";
// @ts-expect-error
import defaultIcon from '../../images/default_icon.png'
import './DockerLaunchIcon.css';

function DockerLaunchIcon(props: any) {
    const dispatch = useDispatch();
    
    const isLaunchPadOpen = useSelector((state: any) => state.modal.isLaunchPadOpen);

    // Use default Docker icon if none provided
    const iconData = props.icon || defaultIcon;

    function edit() {
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(modalActions.hideLaunchPad());
        dispatch(
            modalActions.selectIcon(props.data)
        );
        dispatch(
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            modalActions.toggleEditIconModal()
        );
    }

    async function handleStop() {
        try {
            await dockerService.stopContainer(props.containerId);
            // Optionally refresh container list or update UI
        } catch (error) {
            log.error("Failed to stop container:", error);
            alert("Error stopping container: " + error.message);
        }
    }

    async function handleOnClick() {
        if (props.isInEditMode || props.status === "creating") return;
        if (isLaunchPadOpen) {
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            dispatch(modalActions.hideLaunchPad());
        }

        try {
            if (props.status === "stopped") {
                // @ts-expect-error
                await dockerService.startContainer(props.containerId);
            } else if (props.status === "running") {
                // Open container logs or details view
                // @ts-expect-error
                dispatch(modalActions.toggleDockerContainerDetails({
                    containerId: props.containerId,
                    name: props.name
                }));
            }
        } catch (error) {
            log.error("Container action failed:", error);
            alert("Error performing container action: " + error.message);
        }
    }

    return (
        <div 
            className={clsx(
                "launch-icon-container",
            )}
            onContextMenu={(e) => {
                e.preventDefault();
            }}
        >
            {props.isInEditMode && !props.isOpen && (
                <div onClick={() => edit()} className={clsx(
                    "rounded-full p-2 overflow-hidden",
                    "bg-white/50 dark:bg-gray-600/50",
                    "text-gray-700 dark:text-gray-200",
                    "disabled:opacity-60 hover:opacity-80",
                    "shadow hover:shadow-lg transition-all",
                    "absolute left-5 !p-1.5 edit-button"
                )}>
                    <Icon.Circle size={16}/>
                </div>
            )}
            
            {props.status === "running" && (
                <div onClick={() => handleStop()} className={clsx(
                    "rounded-full p-1 overflow-hidden",
                    "bg-white/50 dark:bg-gray-600/50",
                    "text-gray-700 dark:text-gray-200",
                    "disabled:opacity-60 hover:opacity-80",
                    "shadow hover:shadow-lg transition-all",
                    "absolute top-2 right-5 !p-1.5 !bg-red-200/80 stop-button"
                )}>
                    <Icon.Square className="text-red-500" size={12}/>
                </div>
            )}

            <div 
                className={clsx(
                    "card p-2 text-center launch-item",
                    props.status === "running" && "active"
                )}
                onClick={() => handleOnClick()}
            >
                <div className="appicon d-flex justify-content-center">
                    <img className="launch-icon" src={iconData} width={48} alt=""/>
                    <div className="icon-middle">
                        <div className="icon-text">{props.name}</div>
                    </div>
                </div>
                <div className="mt-1">
                    <span className="icon-text">
                        {
                            (props.status === "creating" || props.status === "stopping") ? (
                                <Progress className="mt-1" animated color="success" value={100}>
                                    {props.status.charAt(0).toUpperCase() + props.status.slice(1).toLowerCase()}
                                </Progress>
                            ) : (
                                props.name
                            )
                        }
                    </span>
                </div>
                <div className="d-flex justify-content-center flex-column align-items-center">
                    {props.status === "running" && (
                        <div className="status-dot"></div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DockerLaunchIcon; 