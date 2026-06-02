import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";

import { Button } from "reactstrap";
import { Globe2 } from "react-bootstrap-icons";
import clsx from "clsx";

import { toggleLaunchPad } from "../LaunchPadLocal/LaunchPadLocal";
import { activateBrowser } from "../../hubs/WindowService";

import "./BrowserButton.css";

function BrowserButton(props: { showStatusDot?: boolean }) {
  const dispatch = useDispatch();

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const items = useSelector((state: any) => state.workspace.links);
  const isLocal = useSelector((state: any) => state.workspace.isLocal);
  const browserWindows = useSelector((state: any) => state.session.browserWindows);
  const activeWindow = useSelector((state: any) => state.session.activeWindow);
  const isLaunchPadOpen = useSelector((state: any) => state.modal.isLaunchPadOpen);

  const [homePage, setHomePage] = useState("https://www.google.com/");

  function handleOnClick() {
    activateBrowser(
      homePage,
      workspace,
      desktop,
      openWindows,
      items,
      isLocal,
      dispatch
    );
    // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
    if (isLaunchPadOpen) toggleLaunchPad(dispatch);
  }

  return (
    <div id="browserButton" className="browserButton launch-item">
      <div className="card p-2 text-center">
        <div
          className="d-flex justify-content-center"
          onClick={() => handleOnClick()}
        >
          <Button
            width={48}
            height={48}
            className={clsx("transition-colors")}
            title="Open Browser"
          >
            <Globe2 size={24} color="white" />
          </Button>
          <div className="icon-middle">
            <div className="icon-text">Open search engine</div>
          </div>
        </div>
        <div className="d-flex justify-content-center flex-column align-items-center mt-1">
          <div className="d-flex">
            {browserWindows.length > 0 && props.showStatusDot && (
              <span className="status-dot"></span>
            )}
            <span className={"icon-text ml-1"}>Space Browser</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrowserButton;
