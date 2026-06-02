import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";

import { getRandomImage, BG_IMAGE_STORE_KEY } from "../../services/unsplash";

import { modalActions } from "../../store/modal-slice";

import { updateWorkspace } from "../../api/WorkspaceApi";
import {
  updateWorkspacesAndGoToSelected,
  setBackgroundImageForLocalWorkspace,
} from "../../services/workspace";

import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
} from "reactstrap";

import default_bg from "../../images/default_bg.jpg";
import BgSelectorDropDown from "../BgSelectorDropDown/BgSelectorDropDown";
import "./ChangeBackgroundModalWindow.css";
import WorkspaceRepository from "../../repository/workspace";
import { appActions } from "../../store/app-slice";

function ChangeBackgroundModalWindow(props: any) {
  const dispatch = useDispatch();

  const userId = useSelector((state: any) => state.user.id);

  const isLocal = useSelector((state: any) => state.workspace.isLocal);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const [name, setName] = useState("");
  const [bgImage, setBgImage] = useState("");

  const isChangeBackgroundModalOpen = useSelector(

    (state: any) => state.modal.isChangeBackgroundModalOpen
  );
  const toggleChangeBackgroundModal = () => {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleChangeBackgroundModal());
  };

  function save(image: any) {
    setItem(BG_IMAGE_STORE_KEY, image);
    WorkspaceRepository.updateBackgroundImage(workspace.id, image).then((workspaceId) => {
      dispatch(appActions.setBgImage({
        bgImage: image
      }));
    }).catch((error) => {
      dispatch(appActions.setBgImage({
        bgImage: default_bg
      }));
    });
  }

  function onOpened() {
    setName("");
    setBgImage(default_bg);
  }

  function onBgSelected(value: any) {
    //setBgImage(value);
    save(value);
  }

  useEffect(() => {
    log.debug("useEffect");
  }, [isChangeBackgroundModalOpen]);

  return (
    <div>
      <Modal
        onOpened={onOpened}
        className="change-background-modal-window"
        isOpen={isChangeBackgroundModalOpen}
        toggle={toggleChangeBackgroundModal}
        centered={true}
        {...props}
      >
        <ModalHeader toggle={toggleChangeBackgroundModal}>
          Background Image
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <BgSelectorDropDown
                bgImage={bgImage}
                onClick={(value) => onBgSelected(value)}
              />
            </FormGroup>
          </Form>
        </ModalBody>
      </Modal>
    </div>
  );
}

export default ChangeBackgroundModalWindow;
