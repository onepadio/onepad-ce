import React from "react";
import { useDispatch } from "react-redux";
import { modalActions } from "../../store/modal-slice";
import { storeActions } from "../../store/store-slice";
import { Button } from "reactstrap";
import * as Icon from 'react-feather';
import clsx from "clsx";
import "../AddButton/AddButton.css";

function AddDockerButton() {
  const dispatch = useDispatch();
  
  const toggle = () => {
    dispatch(storeActions.setSelectedStore("docker"));
    dispatch(modalActions.hideLaunchPad({}));
    dispatch(modalActions.setLocation("launchpad"));
    dispatch(modalActions.toggleAppStoreModal({}));
  }

  return (
    <div id="addDockerButton" className="addAppButton">
      <div className="card p-2 text-center">
        <div className="d-flex justify-content-center" onClick={() => toggle()}>
          <Button
            width={48}
            height={48}
            className={clsx(
              "addButton transition-colors",
            )}
            title="Add Docker Container"
          >
            <Icon.Plus size={24} />
          </Button>
          <div className="icon-middle">
            <div className="icon-text">Add Docker Container</div>
          </div>
        </div>
        <br />
        <div>
          <span className="text-white-50"></span>
        </div>
      </div>
    </div>
  );
}

export default AddDockerButton; 