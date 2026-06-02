import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import DesktopService from "../../services/desktop";
import { WorkspaceService } from "../../services/workspace";
import { SessionService } from "../../services/session";

import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from "../../store/workspace-slice";
import { sessionActions } from "../../store/session-slice";

import { Button, Form, FormGroup, Label, Input } from "reactstrap";
import Modal from "../lib/Modal";
import "./TerminateSessionModalWindow.css";

function TerminateSessionModalWindow(props: any) {
  const dispatch = useDispatch();

  const workspaceState = useSelector((state: any) => state.workspace);
  const sessionState = useSelector((state: any) => state.session);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const isEndSessionModalOpen = useSelector(
    (state: any) => state.modal.isEndSessionModalOpen
  );
  
  const currentSession = useSelector((state: any) => state.workspace.currentSession);

  function toggle() {
    dispatch(modalActions.toggleEndSessionModal({}));
  }

  function endSession(){
    SessionService.deleteSession(currentSession.id).then(() => {
        log.debug("Session Deleted");
        dispatch(sessionActions.endSession({}));
        dispatch(workspaceActions.setCurrentSession({}));
        SessionService.getSessionsByWorkspaceId(workspace.id).then((sessions: any) => {
            dispatch(workspaceActions.setSessions({ data: sessions }));
        });
        // switch to workspace
        WorkspaceService.selectWorkspaceById(dispatch, workspace.id, workspaceState, sessionState);
        toggle();
    }
    ).catch((err) => {
        log.error("onSaveSession",err);
    });
  }

  useEffect(() => {
    log.debug("useEffect");
  }, []);

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="Delete Task"
        className="end-session-modal"
        show={isEndSessionModalOpen}
        onClose={() => toggle()}
      >
        <Form>
          <FormGroup className="align-left">
            <Label for="desktopName">
              Are you sure you want to delete the current task? This will delete all data associated with this task.
            </Label>
          </FormGroup>
        </Form>
        <Button color="primary" onClick={endSession}>
          Delete
        </Button>{" "}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default TerminateSessionModalWindow;
