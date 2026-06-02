import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import isElectron from "is-electron";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import { modalActions } from "../store/modal-slice";
import { workspaceActions } from "../store/workspace-slice";
import { sessionActions } from '../store/session-slice';

import {
  createProcess,
  getProcessDetails,
  logActivity,
  stopProcess,
  terminateProcess,
} from "../api/ProcessApi";

// @ts-expect-error
import globe_icon from '../images/globe_icon_96.png';
import { windowServiceActions } from "../store/window-service-slice";

function CloudService() {
  const dispatch = useDispatch();
  const route = useSelector((state: any) => state.session.route);
  const user = useSelector((state: any) => state.user);

  const personId = useSelector((state: any) => state.app.personId);

  const userState = useSelector((state: any) => state.user);

  const sessionState = useSelector((state: any) => state.session);

  const workspaceState = useSelector((state: any) => state.workspace);

  const actionId = useSelector((state: any) => state.cloudService.serviceActionId);

  const action = useSelector((state: any) => state.cloudService.serviceAction);
  
  const newProcessInput = useSelector((state: any) => state.cloudService.newProcessInput);

  useEffect(() => {
    if (action === "") return;
    switch (action) {
      case "installProcess":
        log.debug("installProcess action...");
        createProcess(newProcessInput).then(
            (response) => {
              log.debug("createProcess response: ", response);
              // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
              dispatch(modalActions.toggleRemoteTaskManager());
              //openWindow(newProcessInput.application, response.id, "http://"+response.id+".onepad.io");
            }
          ).catch(
            (error) => {
              log.debug("createProcess error: ", error);
              alert("Error creating process: " + error);
            }
          );
        break;
      case "startProcess":
        log.debug("startProcess action...");
        break;
      case "stopProcess":
        log.debug("startProcess action...");
        break;
      case "terminateProcess":
        log.debug("startProcess action...");
        break;
      default:
        break;
    }
  }, [actionId, action]);

  return <></>;
}

export default CloudService;
