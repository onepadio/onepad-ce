import React from 'react';
import { v4 as uuidv4 } from "uuid";

import './DesktopContainer.css';
import { useDispatch, useSelector } from 'react-redux';

function DesktopContainer(props: any) {
  const dispatch = useDispatch();
  
  const workspaceId = useSelector((state: any) => state.workspace.selectedWorkspace.id);
  
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  
  const webViewId = "webview-" + uuidv4();


  return (
    <div id={"spaceos-"+props.id} className={"desktop-container " + (activeTabId !== "launchpad" || props.id !== desktop.id ? "d-none": "") } >
      <webview
        id={webViewId}
        className="webview"
        // @ts-expect-error
        autosize="on"
        src="https://dustinbrett.com"
        // @ts-expect-error
        nodeintegration="true"
        // @ts-expect-error
        allowpopups="true"
        partition={"persist:"+workspaceId}
      ></webview>
    </div>
  );
}

export default DesktopContainer;