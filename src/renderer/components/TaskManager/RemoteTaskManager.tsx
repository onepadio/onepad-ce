import React, { useEffect, useState } from "react";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import { modalActions } from "../../store/modal-slice";
import { useDispatch, useSelector } from "react-redux";
import { getProcessesByUser, resumeProcess, stopProcess, terminateProcess } from "../../api/ProcessApi";
import { instanceTypes, RemoteStore } from "../../data/remote";

import "./RemoteTaskManager.css";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Spinner, UncontrolledDropdown } from "reactstrap";
import Modal from "../lib/Modal";
import { windowServiceActions } from "../../store/window-service-slice";
import { ArrowUpRightSquare, Eye, PlayCircle, Stop, StopCircle, ThreeDots, ThreeDotsVertical, XCircle } from "react-bootstrap-icons";
import { set } from "lodash";

function RemoteTaskManager() {
  const dispatch = useDispatch();
  
  const user = useSelector((state: any) => state.user);
  const isOpen = true;

  // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
  const toggle = () => dispatch(modalActions.toggleRemoteTaskManager());

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState("");

  useEffect(() => {
    refresh();
  }, [version]);

  function refresh() {
    if(!isOpen) return;
    log.debug("Fetching tasks...");
    if (user && user.uid) {
      let _tasks = [];
      getProcessesByUser(user.uid).then((response: []) => {
        log.debug("RemoteTaskManager.js: getProcessesByUser", response);
        let order = 0;
        response.forEach((process: any) => {
          process.order = order;
          if(process.instanceType && process.status !== "TERMINATED") {
            if(process.status === "STOP") {
              process.status = "STOPPING";
            }
            if(process.status === "TERMINATE") {
              process.status = "TERMINATING";
            }

            if(process.status === "RESUME") {
              process.status = "STARTING";
            }
            if(process.status === "CREATE" || process.status === "CREATING") {
              process.status = "INSTALLING";
            }
            _tasks.push(process);
            order++;
          }
        });
        setTasks(_tasks);
        setLoading(false);
      });
      setTimeout(() => {
        setVersion(uuidv4());
      }, 50000);
    }
  }


  function resume(processId) {
    resumeProcess(user.uid, processId)
      .then((response: any) => {
        log.debug("App.js: resumeProcess", response);
        if(response.ResponseMetadata.HTTPStatusCode === 200) {
          let storeData = Object.assign({}, RemoteStore.itemsDb[response.Attributes.applicationId]);
          dispatch(windowServiceActions.openRemoteApp({
            application: response.Attributes.application,
            processId: response.Attributes.id,
            url: "http://"+response.Attributes.id+".onepad.io",
            storeData: storeData
          }));
          tasks.forEach((task) => {
            if(task.id === processId) {
              task.status = "STARTING";
            }
          });
        }
      })
      .catch((err) => {
        log.error("App.js: resumeProcess", err);
      });
  }

  function stop(processId) {
    stopProcess(user.uid, processId)
      .then((response) => {
        log.debug("App.js: stopProcess", response);
        tasks.forEach((task) => {
          if(task.id === processId) {
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

  function terminate(processId) {
    let _res = window.confirm("You're deleting a remote appliaction. Are you sure?");
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

  function openWindow(application, applicationId, processId, url) {
    let storeData = Object.assign({}, RemoteStore.itemsDb[applicationId]);
    dispatch(windowServiceActions.openRemoteApp({
      application: application,
      processId: processId,
      url: "http://"+url,
      storeData: storeData
    }));
    toggle();
  }

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="d-flex flex-column w-100 h-100 mt-2 ml-2 mr-2">
          <div className="d-flex w-100 justify-content-between border-bottom border-secondary">
                <div className="d-flex justify-content-center align-items-center task-table-header">Process</div>
                <div className="d-flex justify-content-center align-items-center task-table-header">CPU</div>
                <div className="d-flex justify-content-center align-items-center task-table-header">Memory</div>
                <div className="d-flex justify-content-center align-items-center task-table-header">Disk</div>
                <div className="d-flex justify-content-center align-items-center task-table-header">Price</div>
                <div className="d-flex justify-content-center align-items-center task-table-header">TimeOut</div>
                <div className="d-flex justify-content-center align-items-center task-table-header">Status</div>
                
                <div className="d-flex justify-content-center align-items-center task-table-header"></div>
              </div>
          {tasks.map((task) => (
                            <div key={task.id} className="d-flex w-100 justify-content-between mt-2">
                {
                  false && ( task.status === "STOPPED" ||  task.status === "RESUME_FAILED" ) &&(
                    <div className="d-flex justify-content-center align-items-center task-table-column">
                      <Button
                          onClick={() => {
                            resume(task.id);
                          }}
                          color={"success"}
                        >
                        <div className="d-flex w-100 align-items-center justify-content-between"><PlayCircle className="mr-1"/> Start</div>
                      </Button>
                    </div>
                  )
                }
                {
                  false && (task.status === "RUNNING" ||  task.status === "CREATE") && (
                    <div className="d-flex justify-content-center align-items-center task-table-column">
                      <Button
                          onClick={() => {
                            stop(task.id);
                          }}
                          color={"warning"}
                        >
                        <div className="d-flex w-100 align-items-center justify-content-between"><StopCircle className="mr-1"/> Stop</div>
                      </Button>
                    </div>
                  )
                }

                {
                  false && (task.status === "STOPPING" ||  task.status === "TERMINATING" || task.status === "STARTING" || task.status === "RESUMING" || task.status === "INSTALLING" ) && (
                    <div className="d-flex justify-content-center align-items-center task-table-column">
                      <Spinner color="primary" size="sm"/>
                    </div>
                  )
                }
                <div className="d-flex justify-content-center align-items-center task-table-column">
                                        <div>{task.name}</div>
                </div>
                        <div className="d-flex justify-content-center align-items-center task-table-column">{instanceTypes[task.instanceType].cpu}</div>
                        <div className="d-flex justify-content-center align-items-center task-table-column">{instanceTypes[task.instanceType].memory} GB</div>
                        <div className="d-flex justify-content-center align-items-center task-table-column">{task.diskSize} GB</div>
                                <div className="d-flex justify-content-center align-items-center task-table-column">${instanceTypes[task.instanceType].price}/hour</div>
                        <div className="d-flex justify-content-center align-items-center task-table-column">{task.timeOut === 0 ? "Never" : task.timeOut+" min"}</div>
                        <div className="d-flex justify-content-center align-items-center task-table-column">{task.status}</div>
                  
                <div className="d-flex justify-content-center align-items-center task-table-column">
                  <UncontrolledDropdown>
                    <DropdownToggle color='dark'>
                      <ThreeDotsVertical />
                    </DropdownToggle>

                    <DropdownMenu dark>
                                            <DropdownItem onClick={() => openWindow(task.application, task.applicationId, task.id, task.url)}><div className="d-flex w-100 align-items-center justify-content-start"><Eye className="mr-1"/> Open</div></DropdownItem>
                                            <DropdownItem onClick={() => stop(task.id)}><div className="d-flex w-100 align-items-center justify-content-start"><StopCircle className="mr-1"/> Stop</div></DropdownItem>
                                            <DropdownItem onClick={() => terminate(task.id)}><div className="d-flex w-100 align-items-center justify-content-start"><XCircle className="mr-1"/> Uninstall</div></DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                  
                </div>
                 
                
              </div>
              
          ))}
        </div>
      )}
    </div>
  );
}

export default RemoteTaskManager;
