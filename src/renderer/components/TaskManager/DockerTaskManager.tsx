import React, { useEffect, useState } from "react";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";
import { dockerService } from "../../services/docker";
import { useDispatch } from "react-redux";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Spinner, UncontrolledDropdown, Collapse, Form, FormGroup, Label, Input } from "reactstrap";
import { PlayCircle, StopCircle, XCircle, ThreeDotsVertical, Plus, ChevronDown, ChevronRight } from "react-bootstrap-icons";

import { modalActions } from "../../store/modal-slice";
import Modal from "../lib/Modal";
import "./DockerTaskManager.css";
import { storeActions } from "../../store/store-slice";

function DockerTaskManager() {
  const dispatch = useDispatch();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [showAllContainers, setShowAllContainers] = useState(true);
  const [stoppingContainers, setStoppingContainers] = useState([]);

  useEffect(() => {
    refresh();
  }, [version, showAllContainers]);

  async function refresh() {
    try {
      log.debug("Fetching Docker containers...");
      const containerList = await dockerService.getContainers(showAllContainers);
      log.debug("Docker containers fetched:", containerList);
      // if container in stoppingContainers, set state to stopping
      const updatedContainers = containerList.map((container) => {
        if (stoppingContainers.includes(container.id)) {
          return { ...container, state: "stopping" };
        }
        return container;
      });
      setContainers(updatedContainers);
      setLoading(false);

      setTimeout(() => {
        setVersion(uuidv4());
      }, 5000);
    } catch (error) {
      log.error("Failed to fetch Docker containers:", error);
      setLoading(false);
    }
  }

  const toggleRow = (containerId) => {
    setExpandedRows(prev => ({
      ...prev,
      [containerId]: !prev[containerId]
    }));
  };

  const openRunContainerModal = () => {
    // dispatch(modalActions.toggleRunDockerModal());
    dispatch(modalActions.toggleTaskManager());
    dispatch(storeActions.setSelectedStore("docker"));
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.hideLaunchPad());
    dispatch(modalActions.setLocation("launchpad"));
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleAppStoreModal());
  };

  async function startContainer(containerId) {
    try {
      await dockerService.resumeContainer(containerId);
      refresh();
    } catch (error) {
      log.error("Failed to start container:", error);
      alert("Error starting container: " + error.message);
    }
  }

  async function stopContainer(containerId) {
    try {
      // update the container status to stopping
      const container = containers.find(c => c.id === containerId);
      container.state = "stopping";
      setStoppingContainers([...stoppingContainers, containerId]);
      await dockerService.stopContainer(containerId);
      setStoppingContainers(stoppingContainers.filter(id => id !== containerId));
      refresh();
    } catch (error) {
      log.error("Failed to stop container:", error);
      alert("Error stopping container: " + error.message);
    }
  }

  async function removeContainer(containerId) {
    const confirmed = window.confirm("Are you sure you want to remove this container?");
    if (!confirmed) return;

    try {
      await dockerService.removeContainer(containerId);
      refresh();
    } catch (error) {
      log.error("Failed to remove container:", error);
      alert("Error removing container: " + error.message);
    }
  }

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="d-flex flex-column w-100 h-100 mt-2 ml-2 mr-2">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form>
              <FormGroup switch className="mb-0 d-flex align-items-center">
                <Input
                  type="switch"
                  checked={showAllContainers}
                  onChange={() => setShowAllContainers(!showAllContainers)}
                />
                <Label check className="ms-2 mb-0">
                  Show all containers
                </Label>
              </FormGroup>
            </Form>
            <Button 
              color="primary" 
              onClick={openRunContainerModal}
              className="d-flex align-items-center"
            >
              <Plus className="mr-2"/> New Container
            </Button>
          </div>

          <div className="container-table">
            <div className="d-flex w-100 justify-content-between border-bottom border-secondary">
              <div className="d-flex justify-content-center align-items-center task-table-header expand-column"></div>
              <div className="d-flex justify-content-center align-items-center task-table-header">Container ID</div>
              <div className="d-flex justify-content-center align-items-center task-table-header">Name</div>
              <div className="d-flex justify-content-center align-items-center task-table-header">Ports</div>
              <div className="d-flex justify-content-center align-items-center task-table-header">State</div>
              <div className="d-flex justify-content-center align-items-center task-table-header"></div>
            </div>
            <div className="container-table-body">

              {containers.map((container) => (
                                <div key={container.id} className="container-row">
                  <div className="d-flex w-100 justify-content-between mt-2">
                    <div className="d-flex justify-content-center align-items-center expand-column">
                      <Button 
                        color="link" 
                        className="p-0" 
                        onClick={() => toggleRow(container.id)}
                      >
                        // @ts-expect-error
                        {expandedRows[container.id] ? <ChevronDown /> : <ChevronRight />}
                      </Button>
                    </div>
                    <div className="d-flex justify-content-center align-items-center task-table-column">
                      // @ts-expect-error TS(2339): Property 'id' does not exist on type 'never'.
                      {container.id.substring(0, 12)}
                    </div>
                    <div className="d-flex justify-content-center align-items-center task-table-column">
                      // @ts-expect-error TS(2339): Property 'names' does not exist on type 'never'.
                      {container.names[0].replace(/^\//, '').length > 15 
                        ? `${container.names[0].replace(/^\//, '').substring(0, 15)}...`
                        : container.names[0].replace(/^\//, '')}
                    </div>
                    <div className="d-flex justify-content-center align-items-center task-table-column">
                      // @ts-expect-error TS(2339): Property 'ports' does not exist on type 'never'.
                      {container.ports 
                        ? container.ports.replace(/0\.0\.0\.0:/g, '').replace(/\/tcp/g, '')
                        : 'None'}
                    </div>
                    <div className="d-flex justify-content-center align-items-center task-table-column">
                                            <span className={container.state === 'running' ? 'text-success' : ''}>
                        // @ts-expect-error TS(2339): Property 'state' does not exist on type 'never'.
                        {container.state.charAt(0).toUpperCase() + container.state.slice(1)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-center align-items-center task-table-column">
                      <UncontrolledDropdown>
                        <DropdownToggle color='dark'>
                          <ThreeDotsVertical />
                        </DropdownToggle>

                        <DropdownMenu dark>
                          // @ts-expect-error TS(2339): Property 'state' does not exist on type 'never'.
                          {container.state !== 'running' && (
                                                        <DropdownItem onClick={() => startContainer(container.id)}>
                              <div className="d-flex w-100 align-items-center justify-content-start">
                                <PlayCircle className="mr-1"/> Start
                              </div>
                            </DropdownItem>
                          )}
                          // @ts-expect-error TS(2339): Property 'state' does not exist on type 'never'.
                          {container.state === 'running' && (
                                                        <DropdownItem onClick={() => stopContainer(container.id)}>
                              <div className="d-flex w-100 align-items-center justify-content-start">
                                <StopCircle className="mr-1"/> Stop
                              </div>
                            </DropdownItem>
                          )}
                                                    <DropdownItem onClick={() => removeContainer(container.id)}>
                            <div className="d-flex w-100 align-items-center justify-content-start">
                              <XCircle className="mr-1"/> Remove
                            </div>
                          </DropdownItem>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </div>
                  </div>

                                    <Collapse isOpen={expandedRows[container.id]}>
                    <div className="container-details p-3">
                      <div className="detail-row">
                                                <strong>Full ID:</strong> {container.id}
                      </div>
                      <div className="detail-row">
                                                <strong>Image:</strong> {container.image}
                      </div>
                      <div className="detail-row">
                                                <strong>Created:</strong> {new Date(container.created).toLocaleString()}
                      </div>
                      <div className="detail-row">
                                                <strong>State:</strong> {container.state}
                      </div>
                      <div className="detail-row">
                                                <strong>Ports:</strong> {container.ports || 'None'}
                      </div>
                      <div className="detail-row">
                                                <strong>Status:</strong> {container.status}
                      </div>
                      <div className="detail-row">
                        <strong>Environment:</strong>
                        // @ts-expect-error
                        {container.environment && container.environment.length > 0 ? (
                          <ul className="mb-0 mt-1">
                            // @ts-expect-error
                            {container.environment.map((env, index) => (
                              <li key={index}>{env}</li>
                            ))}
                          </ul>
                        ) : (
                          ' None'
                        )}
                      </div>
                    </div>
                  </Collapse>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DockerTaskManager; 