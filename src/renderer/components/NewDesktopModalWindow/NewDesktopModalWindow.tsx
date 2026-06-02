import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import DesktopService from "../../services/desktop";
import { WorkspaceService } from "../../services/workspace";

import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from "../../store/workspace-slice";

import { Button, Form, FormGroup, Label, Input } from "reactstrap";
import Modal from "../lib/Modal";
import "./NewDesktopModalWindow.css";

function NewDesktopModalWindow(props: any) {
  const dispatch = useDispatch();
  
  const userId = useSelector((state: any) => state.user.id);
  
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const isNewDesktopModalWindowOpen = useSelector(
    
    (state: any) => state.modal.isNewDesktopModalWindowOpen
  );

  const [name, setName] = useState("");

  function toggle() {
    refresh();
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleNewDesktopModalWindow());
  }
  
  function save() {
    if (name.length < 1) {
      return;
    }

    DesktopService.newDesktop(name, workspace.id, false).then((desktop: any) => {
      dispatch(workspaceActions.addDesktop({ desktop: desktop }));
      
      WorkspaceService.selectDesktop(workspace.id, desktop.id).then(
        (desktop: any) => {
          dispatch(workspaceActions.selectDesktop({ desktop: desktop }));
          toggle();
        }
      );
    });
  }

  function refresh() {
    setName("");
  }

  useEffect(() => {
    log.debug("useEffect");
  }, []);

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="New Desktop"
        className="rename-desktop-modal"
        show={isNewDesktopModalWindowOpen}
        onClose={() => toggle()}
      >
        <Form>
          <FormGroup className="align-left">
            <Label for="desktopName">Name</Label>
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
        </Button>{" "}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default NewDesktopModalWindow;
