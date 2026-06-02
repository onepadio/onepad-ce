import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import {v4 as uuidv4} from 'uuid';

import { modalActions } from "../../store/modal-slice";

import { updateWorkspace } from "../../api/WorkspaceApi";
import { updateWorkspacesAndGoToSelected, selectWorkspaceById, WorkspaceService } from "../../services/workspace";
import { workspaceActions } from '../../store/workspace-slice';

import { 
  Button,
  Form,
  FormGroup,
  Label,
  Input
 } from 'reactstrap';
 import Modal from "../lib/Modal";

 import "./RenameSpaceModalWindow.css";

function RenameSpaceModalWindow(props: any) {
  const dispatch = useDispatch();
  
  const userId = useSelector((state: any) => state.user.id);
  
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const toggle = () => props.toggle(!props.isOpen);
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [sync, setSync] = useState(false);

  
  const isRenameSpaceModalOpen = useSelector((state: any) => state.modal.isRenameSpaceModalOpen);
  const toggleRenameSpaceModal = () => {
    onOpened();
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleRenameSpaceModal());
  }

  function old_save(){
    if (name.length < 1) {
      return;
    }
    updateWorkspace(userId, workspace.id,{
      name: name,
      bgImage: workspace.bgImage
    }).then((data) => {
      log.debug(data);
      updateWorkspacesAndGoToSelected(userId, dispatch, workspace.id);
      toggleRenameSpaceModal();
    });
  }
  function save(){
    if (name.length < 1) {
      return;
    }
    WorkspaceService.updateWorkspace(workspace.id, name, false , workspace.isDefault, workspace.sync).then((workspaceId) => {
      WorkspaceService.getWorkspace(workspace.id).then((_workspace) => {
        dispatch(workspaceActions.updateWorkspace({ workspace: _workspace }));
        dispatch(workspaceActions.renameWorkspace({ name: name }));
        toggleRenameSpaceModal();
      });
      
    });
    
  }

  function onOpened(){
    setName(workspace.name);
  }

  useEffect(() => {
    setName(workspace.name);
  }, [workspace]);

  return (
    <div>
      <Modal id={uuidv4()} heading="Rename Space" className="rename-space-modal" show={isRenameSpaceModalOpen} onClose={() => toggleRenameSpaceModal()}>
        <Form>
          <FormGroup className='align-left'>
            <Label for="workspaceName">
              Name
            </Label>
            <Input
              id="workspaceName"
              name="workspaceName"
              placeholder=""
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormGroup>
        </Form>
        <Button color="primary" onClick={save}>
          Save
        </Button>{' '}
        <Button color="secondary" onClick={() => toggleRenameSpaceModal()}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default RenameSpaceModalWindow;