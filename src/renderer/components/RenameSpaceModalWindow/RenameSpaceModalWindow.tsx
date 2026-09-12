import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import {v4 as uuidv4} from 'uuid';
import { RefreshCcw } from "react-feather";

import { modalActions } from "../../store/modal-slice";
import { WorkspaceService } from "../../services/workspace";
import { workspaceActions } from '../../store/workspace-slice';

import { 
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
 } from 'reactstrap';
 import Modal from "../lib/Modal";
 import {
  WORKSPACE_ICON_LIST,
  WorkspaceBootstrapIcon,
  WorkspaceBootstrapIconBadge,
 } from "../WorkspaceConfigIcon/WorkspaceBootstrapIcon";

 import "./RenameSpaceModalWindow.css";

function generateRandomColor() {
  return "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0");
}

function RenameSpaceModalWindow(props: any) {
  const dispatch = useDispatch();
  
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const isRenameSpaceModalOpen = useSelector((state: any) => state.modal.isRenameSpaceModalOpen);

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Folder");
  const [color, setColor] = useState(generateRandomColor);

  const toggleRenameSpaceModal = () => {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleRenameSpaceModal());
  }

  function loadFromWorkspace(ws: any) {
    if (!ws) {
      return;
    }
    setName(ws.name || "");
    const config = ws.config || {};
    if (config.iconType === "bootstrap" && config.icon) {
      setSelectedIcon(config.icon);
    } else {
      setSelectedIcon("Folder");
    }
    setColor(config.color || generateRandomColor());
  }

  function save(){
    if (name.length < 1) {
      return;
    }

    const config = {
      iconType: "bootstrap",
      icon: selectedIcon,
      color: color,
      ...(workspace.config?.alias ? { alias: workspace.config.alias } : {}),
    };

    WorkspaceService.updateWorkspace(workspace.id, name, false , workspace.isDefault, workspace.sync).then(() => {
      WorkspaceService.updateConfig(workspace.id, config).then(() => {
        WorkspaceService.getWorkspace(workspace.id).then((_workspace) => {
          dispatch(workspaceActions.updateWorkspace({ workspace: _workspace }));
          dispatch(workspaceActions.selectWorkspace({ workspace: _workspace }));
          toggleRenameSpaceModal();
        });
      }).catch((err) => {
        log.error("Failed to update space config", err);
      });
    }).catch((err) => {
      log.error("Failed to update space", err);
    });
  }

  function randomColor() {
    setColor(generateRandomColor());
  }

  useEffect(() => {
    if (isRenameSpaceModalOpen) {
      loadFromWorkspace(workspace);
    }
  }, [isRenameSpaceModalOpen, workspace]);

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="Edit Space"
        className="rename-space-modal"
        show={isRenameSpaceModalOpen}
        onClose={() => toggleRenameSpaceModal()}
      >
        <Form>
          <Row className="align-items-center mb-2">
            <Col xs="auto">
              <WorkspaceBootstrapIconBadge
                name={selectedIcon}
                size={48}
                backgroundColor={color}
              />
            </Col>
            <Col>
              <FormGroup className='align-left mb-0'>
                <Label for="workspaceName">
                  Name
                </Label>
                <Input
                  id="workspaceName"
                  name="workspaceName"
                  placeholder=""
                  type="text"
                  value={name}
                  onChange={(e) => {
                    if (e.target.value.length > 20) {
                      alert("Workspace name must be less than 20 characters.");
                      return;
                    }
                    setName(e.target.value);
                  }}
                />
              </FormGroup>
            </Col>
          </Row>

          <FormGroup className='align-left'>
            <Label>Background color</Label>
            <div className="d-flex align-items-center">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="workspace-color-input"
              />
              <Button className="ml-2" onClick={() => randomColor()} title="Random color">
                <RefreshCcw size={16} />
              </Button>
            </div>
          </FormGroup>

          <FormGroup className='align-left'>
            <Label>Choose an icon</Label>
            <div className="icon-grid">
              {WORKSPACE_ICON_LIST.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  title={iconName}
                  className={`icon-button ${selectedIcon === iconName ? "selected" : ""}`}
                  onClick={() => setSelectedIcon(iconName)}
                >
                  <WorkspaceBootstrapIcon name={iconName} size={20} />
                </button>
              ))}
            </div>
          </FormGroup>
        </Form>
        <div className="d-flex justify-content-center mt-3">
          <Button color="primary" onClick={save}>
            Save
          </Button>
          <Button color="secondary ml-2" onClick={() => toggleRenameSpaceModal()}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default RenameSpaceModalWindow;
