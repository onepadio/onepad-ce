import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "reactstrap";

import { modalActions } from "../../store/modal-slice";
import { appActions } from "../../store/app-slice";
import VideoBgSelector from "../VideoBackground/VideoBgSelector";
import "../ChangeBackgroundModalWindow/ChangeBackgroundModalWindow.css";

function ChangeVideoBackgroundModalWindow() {
  const dispatch = useDispatch();
  const isOpen = useSelector(
    (state: any) => state.modal.isChangeVideoBackgroundModalOpen
  );
  const videoBgEnabled = useSelector((state: any) => state.app.videoBgEnabled);

  const toggle = () => {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleChangeVideoBackgroundModal());
  };

  function onSelect(encodedSource: string) {
    dispatch(appActions.enableVideoBg({ source: encodedSource }));
  }

  function turnOff() {
    dispatch(appActions.disableVideoBg());
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={toggle} />
      <div className="background-sidebar">
        <div className="sidebar-header">
          <h3>Video Library</h3>
          <button
            className="sidebar-close-btn"
            onClick={toggle}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="sidebar-body">
          {videoBgEnabled && (
            <div className="mb-3">
              <Button color="secondary" size="sm" block onClick={turnOff}>
                Turn off video
              </Button>
            </div>
          )}
          <VideoBgSelector onSelect={onSelect} />
        </div>
      </div>
    </>
  );
}

export default ChangeVideoBackgroundModalWindow;
