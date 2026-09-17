import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { modalActions } from "../../store/modal-slice";
import Modal from "../lib/Modal";
import RemoteTaskManager from "./RemoteTaskManager";
import { v4 as uuidv4 } from "uuid";
import classnames from "classnames";
import "./TaskManager.css";
import { Cloud, Window } from "react-bootstrap-icons";
import TabsManager from "./TabsManager";

function TaskManager() {
  const dispatch = useDispatch();
  
  const isOpen = useSelector((state: any) => state.modal.isTaskManagerOpen);
  
  const user = useSelector((state: any) => state.user);

  const [activeTab, setActiveTab] = useState('tabs');

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
