import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { modalActions } from "../../store/modal-slice";
import { storeActions } from "../../store/store-slice";

import {
  Button,
} from "reactstrap";

import * as Icon from 'react-feather';
import clsx from "clsx";
import "../AddButton/AddButton.css";

function AddRemoteButton(props: any) {
  const dispatch = useDispatch();
  const toggle = () => {
    dispatch(storeActions.setSelectedStore("remote"));
    dispatch(modalActions.hideLaunchPad({}));
    dispatch(modalActions.setLocation("launchpad"));
    dispatch(modalActions.toggleAppStoreModal({}));
  }

  return (
    <>
      {}
      <div id="addAppButton" className="addAppButton">
        {}
        <div className="card p-2 text-center">
          {}
          <div className="d-flex justify-content-center" onClick={() => toggle()}>
            <Button
              width={48}
              height={48}
              className={clsx(
                "addButton transition-colors",
              )}
              title="Add Site"
            >
              <Icon.Plus size={24} />
            </Button>
            {}
            <div className="icon-middle">
              {}
              <div className="icon-text">Add a Site</div>
            </div>
          </div>
          <br />
          <div>
            {}
            <span className="text-white-50"></span>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddRemoteButton;
