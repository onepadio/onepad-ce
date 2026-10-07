import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";

import { BG_IMAGE_STORE_KEY } from "../../services/unsplash";
import { setItem } from "../../services/persist";

import { modalActions } from "../../store/modal-slice";

import default_bg from "../../images/default_bg.jpg";
import BgSelectorDropDown from "../BgSelectorDropDown/BgSelectorDropDown";
import "./ChangeBackgroundModalWindow.css";
import WorkspaceRepository from "../../repository/workspace";
import { appActions } from "../../store/app-slice";

function ChangeBackgroundModalWindow(props: any) {
  const dispatch = useDispatch();

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const desktopVisualMode = useSelector(
    (state: any) =>
      state.settings.desktopVisualMode ||
      state.settings.launchpadVisualMode ||
      "2d"
  );
  const is3d = desktopVisualMode === "3d";
  const [bgImage, setBgImage] = useState("");

  const isChangeBackgroundModalOpen = useSelector(
    (state: any) => state.modal.isChangeBackgroundModalOpen
  );
  
  const toggleChangeBackgroundModal = () => {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleChangeBackgroundModal());
  };

  function save(image: any) {
    if (!workspace?.id) return;
    setItem(BG_IMAGE_STORE_KEY, image);

    if (is3d) {
      WorkspaceRepository.updateBackgroundImage3d(workspace.id, image)
        .then(() => {
          dispatch(appActions.setBgImage3d({ bgImage3d: image }));
        })
        .catch((error) => {
          log.error(error);
          dispatch(appActions.setBgImage3d({ bgImage3d: default_bg }));
        });
      return;
    }

    WorkspaceRepository.updateBackgroundImage(workspace.id, image)
      .then(() => {
        dispatch(appActions.setBgImage({ bgImage: image }));
      })
      .catch((error) => {
        log.error(error);
        dispatch(appActions.setBgImage({ bgImage: default_bg }));
      });
  }

  function onBgSelected(value: any) {
    save(value);
  }

  useEffect(() => {
    if (isChangeBackgroundModalOpen) {
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
          <h3>{is3d ? "3D Desktop Background" : "Background Image"}</h3>
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
            onClick={(value: any) => onBgSelected(value)}
          />
        </div>
      </div>
    </>
  );
}

export default ChangeBackgroundModalWindow;
