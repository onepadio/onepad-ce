import React, { useEffect, useState } from "react";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import { modalActions } from "../../store/modal-slice";
import { useDispatch, useSelector } from "react-redux";
import {
  getProcessesByUser,
  resumeProcess,
  stopProcess,
  terminateProcess,
} from "../../api/ProcessApi";
import { instanceTypes, RemoteStore } from "../../data/remote";

import { Button, Spinner } from "reactstrap";
import Modal from "../lib/Modal";
import { windowServiceActions } from "../../store/window-service-slice";
import { ArrowUpRightSquare, XCircle } from "react-bootstrap-icons";
import { set } from "lodash";
import RemoteLaunchIcon from "../RemoteLaunchIcon/RemoteLaunchIcon";
import AddRemoteButton from "../AddRemoteButton/AddRemoteButton";

function RemoteDesktops() {
  const dispatch = useDispatch();
  
  const user = useSelector((state: any) => state.user);
  
  const openWindows = useSelector((state: any) => state.session.openWindows);
  
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const selectedDesktop = useSelector(
    
    (state: any) => state.workspace.selectedDesktop
  );
  
  const isOpen = useSelector((state: any) => state.modal.isRemoteTaskManagerOpen);

  // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
  const toggle = () => dispatch(modalActions.toggleRemoteTaskManager());

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState("");

  useEffect(() => {
    refresh();
  }, [version]);

  function refresh() {
    log.debug("Fetching tasks...");
    if (user && user.uid) {
      let _tasks: any = [];
      getProcessesByUser(user.uid).then((response: []) => {
        log.debug("RemoteTaskManager.js: getProcessesByUser", response);
        let order = 0;
        response.forEach((process: any) => {
          process.order = order;
          process.storeData = Object.assign({}, RemoteStore.itemsDb[process.applicationId]);
          if (process.instanceType && process.status !== "TERMINATED") {
            if (process.status === "STOP") {
              process.status = "STOPPING";
            }
            if (process.status === "TERMINATE") {
              process.status = "TERMINATING";
            }

            if (process.status === "RESUME") {
              process.status = "STARTING";
            }

            if (process.status === "CREATE" || process.status === "CREATING") {
                process.status = "INSTALLING";
            }
            if (process.storeData.category === "Operating Systems") {
                _tasks.push(process);
                order++;
            }
          }
        });
        setTasks(_tasks);
        setLoading(false);
      });
    }
  }

  function resume(processId: any) {
    resumeProcess(user.uid, processId)
      .then((response: any) => {
        log.debug("App.js: resumeProcess", response);
        if (response.ResponseMetadata.HTTPStatusCode === 200) {
          dispatch(
            windowServiceActions.openRemoteApp({
              application: response.Attributes.application,
              processId: response.Attributes.id,
              url: "http://" + response.Attributes.id + ".onepad.io",
            })
          );
          tasks.forEach((task) => {
            if (task.id === processId) {
              task.status = "STARTING";
            }
          });
        }
      })
      .catch((err) => {
        log.error("App.js: resumeProcess", err);
      });
  }

  function stop(processId: any) {
    stopProcess(user.uid, processId)
      .then((response) => {
        log.debug("App.js: stopProcess", response);
        tasks.forEach((task) => {
          if (task.id === processId) {
            task.status = "STOPPING";
          }
        });
        dispatch(windowServiceActions.stoppedRemoteProcess(processId));
      })
      .catch((err) => {
        log.error("App.js: stopProcess", err);
        // @ts-expect-error TS(2554): Expected 0-1 arguments, but got 2.
        alert("Error stopping process.", err);
      });
  }

  function terminate(processId: any) {
    let _res = window.confirm(
      "You're deleting a remote appliaction. Are you sure?"
    );
    if (!_res) {
      return;
    }
    terminateProcess(user.uid, processId)
      .then((response) => {
        log.debug("App.js: terminateProcess", response);
        dispatch(windowServiceActions.stoppedRemoteProcess(processId));
        alert("Application  deleted.");
      })
      .catch((err) => {
        log.error("App.js: terminateProcess", err);
      });
  }

  function openWindow(application: any, processId: any) {
    dispatch(
      windowServiceActions.openRemoteApp({
        application: application,
        processId: processId,
        url: "http://" + processId + ".onepad.io",
      })
    );
  }

  return (
    <>
      {loading ? (
        <div className="d-flex flex-fluid justify-content-center">
            <Spinner color="primary" />
        </div>
      ) : (
        <> 
            {
                tasks?.map((task) => (
                    <RemoteLaunchIcon
                      key={uuidv4()}
                      id={task.id}
                      data={task.storeData}
                      iconid={task.storeData.id}
                      uuid={task.storeData.id}
                      localid={task.storeData.id}
                      name={task.name}
                      url={task.url}
                      icon={task.storeData.icon}
                      isOpen={openWindows.hasOwnProperty(task.id)}
                      windowType="internal"
                      isStateful={true}
                      showControls={true}
                      isInEditMode={false}
                      workspaceId={workspace.id}
                      desktopId={selectedDesktop.id}
                      application={task.application}
                      applicationId={task.applicationId}
                      status={task.status}
                    />
                  ))
            }
        <AddRemoteButton />
        </>
      )}
    </>
  );
}

export default RemoteDesktops;
