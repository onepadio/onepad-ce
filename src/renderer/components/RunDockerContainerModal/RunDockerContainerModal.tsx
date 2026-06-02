import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import log from 'loglevel';

import { modalActions } from "../../store/modal-slice";
import { Button, Form, FormGroup, Label, Input, Spinner } from "reactstrap";
import Modal from "../lib/Modal";
import "./RunDockerContainerModal.css";
import { dockerService } from "../../services/docker";

function RunDockerContainerModal() {
  const dispatch = useDispatch();
  const isRunDockerModalOpen = useSelector(
    
    (state: any) => state.modal.isRunDockerModalOpen
  );

  const [containerConfig, setContainerConfig] = useState({
    dockerImage: "",
    name: "",
    ports: [],
    environment: [],
    volumes: []
  });

  const selectedDockerApp = useSelector(
    
    (state: any) => state.modal.selectedDockerApp
  );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedDockerApp) {
      setContainerConfig(selectedDockerApp);
    }
  }, [selectedDockerApp]);

  function toggle() {
    refresh();
    dispatch(modalActions.toggleRunDockerModal());
    dispatch(modalActions.setSelectedDockerApp(null));
  }
  
  async function runContainer() {
    if (containerConfig.dockerImage.length < 1) {
      return;
    }

    // @ts-expect-error
    const runCommand = containerConfig.runCommand;
    log.debug("Run Command:", runCommand);
    
    setIsLoading(true);
    try {
      const options = [];
      
      // Add container name if provided
      if (containerConfig.name) {
        options.push('--name', containerConfig.name);
      }

      let ports = ""
      // Add port mappings if provided
      if (containerConfig.ports) {
        containerConfig.ports.forEach(port => {
          ports += `-p ${port} `;
        });
      }
      let volumes = ""    
      // Add volumes if provided
      if (containerConfig.volumes) {
        containerConfig.volumes.forEach(volume => {
          volumes += `-v ${volume} `;
        });
      }

      let environment = ""
      // Add environment variables if provided
      if (containerConfig.environment) {
        containerConfig.environment.forEach(env => {
          if (env.trim()) {
            environment += `-e ${env.trim()} `;
          }
        });
      }

      // Run in detached mode
      options.push('-d');

      // replace <name> <ports> <volumes> <environment> <dockerImage> with actual values
      const runCommandWithValues = runCommand.replace('<name>', containerConfig.name).replace('<ports>', ports).replace('<volumes>', volumes).replace('<environment>', environment).replace('<dockerImage>', containerConfig.dockerImage);
      log.debug("Run Command with Values:", runCommandWithValues);


      await dockerService.runContainer(containerConfig.dockerImage, options, runCommandWithValues);

      // Close the modal after successful container creation
      toggle();
      
      // Reopen the Docker Task Manager
      dispatch(modalActions.toggleTaskManager());
    } catch (error) {
      log.error("Failed to run container:", error);
      alert("Error running container: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function refresh() {
    setContainerConfig({
      dockerImage: "",
      name: "",
      // @ts-expect-error TS(2322): Type 'string' is not assignable to type 'never[]'.
      ports: "",
      environment: [],
      volumes: []
    });
  }

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="Run Docker Container"
        className="run-docker-modal"
        show={isRunDockerModalOpen}
        onClose={() => {
          toggle();
          dispatch(modalActions.setSelectedDockerApp(null));
        }}
      >
        <Form>
          <FormGroup className="align-left">
            <Label for="dockerImage">Image</Label>
            <Input
              id="dockerImage"
              name="dockerImage"
              placeholder="nginx:latest"
              type="text"
              value={containerConfig.dockerImage}
              onChange={(e) => setContainerConfig({...containerConfig, dockerImage: e.target.value})}
            />
          </FormGroup>
          <FormGroup className="align-left">
            <Label for="containerName">Container Name (optional)</Label>
            <Input
              id="containerName"
              name="containerName"
              placeholder="my-container"
              type="text"
              value={containerConfig.name}
              onChange={(e) => setContainerConfig({...containerConfig, name: e.target.value})}
            />
          </FormGroup>
          <FormGroup className="align-left">
            <Label for="ports">Ports (optional)</Label>
            <Input
              id="ports"
              name="ports"
              placeholder="8080:80,8081:443"
              type="text"
              value={containerConfig.ports}
              onChange={(e) => setContainerConfig({...containerConfig, ports: e.target.value.split(',')})}
            />
          </FormGroup>
          <FormGroup className="align-left">
            <Label for="environment">Environment Variables (optional)</Label>
            <Input
              id="environment"
              name="environment"
              placeholder="KEY1=value1,KEY2=value2"
              type="textarea"
              value={containerConfig.environment}
              onChange={(e) => setContainerConfig({...containerConfig, environment: e.target.value.split(',')})}
            />
          </FormGroup>
          <FormGroup className="align-left">
            <Label for="volumes">Volumes (optional)</Label>
            <Input
              id="volumes"
              name="volumes"
              placeholder="volume1:/app/server/storage,volume2:/app/server/data"
              type="text"
              value={containerConfig.volumes}
              onChange={(e) => setContainerConfig({...containerConfig, volumes: e.target.value.split(',')})}
            />
          </FormGroup>
          <FormGroup className="align-left">
            <Label for="runCommand">Run Command</Label>
            <Input
              id="runCommand"
              name="runCommand"
              type="text"
              disabled={true}
              // @ts-expect-error
              value={containerConfig.runCommand}
              // @ts-expect-error
              onChange={(e) => setContainerConfig({...containerConfig, runCommand: e.target.value})}
            />
          </FormGroup>
        </Form>
        <Button 
          color="primary" 
          onClick={runContainer} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Creating...
            </>
          ) : (
            'Run'
          )}
        </Button>{" "}
        <Button color="secondary" onClick={toggle} disabled={isLoading}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default RunDockerContainerModal; 