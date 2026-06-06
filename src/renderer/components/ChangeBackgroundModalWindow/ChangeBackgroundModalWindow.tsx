import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";

import { getRandomImage, BG_IMAGE_STORE_KEY } from "../../services/unsplash";
import { setItem } from "../../services/persist";

import { modalActions } from "../../store/modal-slice";

import { updateWorkspace } from "../../api/WorkspaceApi";
import {
  updateWorkspacesAndGoToSelected,
  setBackgroundImageForLocalWorkspace,
} from "../../services/workspace";

import {
  Button,
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

  function onBgSelected(value: any) {
    save(value);
  }

  useEffect(() => {
    if (isChangeBackgroundModalOpen) {
      setName("");
      setBgImage(default_bg);
    }
  }, [isChangeBackgroundModalOpen]);

  if (!isChangeBackgroundModalOpen) {
    return null;
  }

  return (
    <>
      <div 
        className="sidebar-overlay" 
        onClick={toggleChangeBackgroundModal}
      />
      <div className="background-sidebar">
        <div className="sidebar-header">
          <h3>Background Image</h3>
          <button 
            className="sidebar-close-btn" 
            onClick={toggleChangeBackgroundModal}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="sidebar-body">
          <BgSelectorDropDown
            bgImage={bgImage}
            onClick={(value) => onBgSelected(value)}
          />
        </div>
      </div>
    </>
  );
}

export default ChangeBackgroundModalWindow;
