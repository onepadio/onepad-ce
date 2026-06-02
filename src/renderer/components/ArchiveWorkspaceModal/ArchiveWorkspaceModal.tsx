import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import {v4 as uuidv4} from 'uuid';
import isElectron from "is-electron";

import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from "../../store/workspace-slice";

import { archiveWorkspaceAndUpdateWorkspaces } from "../../services/workspace";
import { WorkspaceService } from "../../services/workspace";

import {
  Button,
} from "reactstrap";
import Modal from "../lib/Modal";

function ArchiveWrokspaceModal(props: any) {
  const dispatch = useDispatch();

  const workspaceState = useSelector((state: any) => state.workspace);

  const sessionState = useSelector((state: any) => state.session);

  const isLocal = useSelector((state: any) => state.workspace.isLocal);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const defaultWorkspace = useSelector((state: any) => state.user.defaultWorkspace);

  const userId = useSelector((state: any) => state.user.id);

  const isArchiveSpaceModalOpen = useSelector(

    (state: any) => state.modal.isArchiveSpaceModalOpen
  );
  const toggle = () => {
    dispatch(modalActions.toggleArchiveSpaceModal({}));
  };

  function _archiveWorkspace() {
    log.debug("archiveWorkspace");
    archiveWorkspaceAndUpdateWorkspaces(
      userId,
      workspace.id,
      dispatch,
      onComplete,
      onError
    );
  }

  function archiveWorkspace() {
    WorkspaceService.archiveWorkspace(workspace.id).then((workspaceId) => {
      WorkspaceService.selectProfileDefaultWorkspace(dispatch, workspaceState, sessionState).then((defaultWorkspaceId) => {
        dispatch(workspaceActions.removeWorkspace({ id: workspace.id }));
        onComplete();
      });
    });
  }

  function onComplete() {
    log.debug("onComplete");
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
          action: "workspace-deleted",
          id: workspace.id,
      });
  }
    toggle();
  }

  function onError() {
    log.error("show alert and close modal");
    // close modal and show alert
  }

  useEffect(() => {
    log.debug("test");
  }, []);

  return (
    <div>
      <Modal id={uuidv4()} heading="Delete Space" className="archive-space-modal" show={isArchiveSpaceModalOpen} onClose={() => toggle()}>
        You are deleting the space. Are you sure you want to continue? <br/><br/>
        <Button color="danger" onClick={archiveWorkspace}>
          Delete
        </Button>{" "}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default ArchiveWrokspaceModal;
