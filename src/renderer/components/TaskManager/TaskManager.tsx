import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { modalActions } from "../../store/modal-slice";
import Modal from "../lib/Modal";
import DockerTaskManager from "./DockerTaskManager";
import RemoteTaskManager from "./RemoteTaskManager";
import { v4 as uuidv4 } from "uuid";
import classnames from "classnames";
import "./TaskManager.css";
import { Cloud, Terminal, Window } from "react-bootstrap-icons";
import { dockerService } from "../../services/docker";
import log from "loglevel";
import TabsManager from "./TabsManager";

function TaskManager() {
  const dispatch = useDispatch();
  
  const isOpen = useSelector((state: any) => state.modal.isTaskManagerOpen);
  
  const user = useSelector((state: any) => state.user);

  const [activeTab, setActiveTab] = useState('tabs');
  const [isDockerRunning, setIsDockerRunning] = useState(false);

  useEffect(() => {
    checkDockerStatus();
  }, []);

  const checkDockerStatus = async () => {
    try {
      const isRunning = await dockerService.isDockerRunning();
      setIsDockerRunning(isRunning);
    } catch (error) {
      log.warn("Failed to check Docker status:", error);
      setIsDockerRunning(false);
      setActiveTab('tabs');
    }
  };

  const toggle = () => {
    dispatch(modalActions.toggleTaskManager());
  };

  return (
    <Modal 
      id={uuidv4()} 
      heading="Task Manager" 
      className="task-manager" 
      show={isOpen} 
      onClose={() => toggle()}
    >
      <Nav tabs className="mb-3">
        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === 'tabs' })}
            onClick={() => setActiveTab('tabs')}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center">
              <Window className="mr-2"/> Tabs
            </div>
          </NavLink>
        </NavItem>
        {isDockerRunning && (
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === 'docker' })}
              onClick={() => setActiveTab('docker')}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-center">
                <Terminal className="mr-2"/> Docker
              </div>
            </NavLink>
          </NavItem>
        )}
        {
          user.uid !== "" && (
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === 'remote' })}
                onClick={() => setActiveTab('remote')}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center">
                  <Cloud className="mr-2"/> Cloud
                </div>
              </NavLink>
            </NavItem>
          )
        }
      </Nav>
      
      <TabContent activeTab={activeTab}>
        <TabPane tabId="tabs">
          <TabsManager />
        </TabPane>
        {isDockerRunning && (
          <TabPane tabId="docker">
            <DockerTaskManager />
          </TabPane>
        )}
        {
          user.uid !== "" && (
            <TabPane tabId="remote">
              <RemoteTaskManager />
            </TabPane>
          )
        }
      </TabContent>
    </Modal>
  );
}

export default TaskManager; 