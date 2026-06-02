import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import {v4 as uuidv4} from 'uuid';

import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from '../../store/workspace-slice';

import DesktopService from '../../services/desktop';

import { 
  Button, 
  Form,
  FormGroup,
  Label,
  Input
 } from 'reactstrap';

import Modal from "../lib/Modal";
import "./RenameDesktopModalWindow.css";

function RenameDesktopModalWindow(props: any) {
  const dispatch = useDispatch();
  
  const userId = useSelector((state: any) => state.user.id);
  
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  
  const [name, setName] = useState("");

  
  const isRenameDesktopModalWindowOpen = useSelector((state: any) => state.modal.isRenameDesktopModalWindowOpen);

  function toggleRenameDesktopModalWindow(){
    onOpened();
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleRenameDesktopModalWindow());
  }

  function save(){
    if (name.length < 1) {
      return;
    }
    //save new name to database
    DesktopService.rename(desktop.id, name).then((desktopId) => {
      log.debug("DesktopID",desktopId);
      DesktopService.get(desktop.id).then((_desktop) => {
        dispatch(workspaceActions.updateDesktop({ desktop: _desktop }));
        dispatch(workspaceActions.renameDesktop({ name: name }));
        toggleRenameDesktopModalWindow();
      });
    });
    
  }

  function onOpened(){
    setName(desktop.name);
  }

  useEffect(() => {
    log.debug("useEffect");
    setName(desktop.name);
  }, [desktop]);

  return (
    <div>
      <Modal id={uuidv4()} heading="Rename Desktop" className="rename-desktop-modal" show={isRenameDesktopModalWindowOpen} onClose={() => toggleRenameDesktopModalWindow()}>
        <Form>
          <FormGroup className="align-left">
            <Label for="desktopName">
              Name
            </Label>
            <Input
              id="desktopName"
              name="desktopName"
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
        <Button color="secondary" onClick={toggleRenameDesktopModalWindow}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default RenameDesktopModalWindow;