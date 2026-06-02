import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";


import { modalActions } from "../../store/modal-slice";

import "./LaunchPadLocal.css";


import "react-tabs/style/react-tabs.css";



import CloudPadBody from "./CloudPadBody";

function CloudPad(props: any) {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay setting visibility to trigger animation
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  function hideCloudPad() {
    setIsVisible(false);
    // Wait for animation to complete before dispatching hide action
    setTimeout(() => {
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.hideCloudPad());
    }, 300); // Match this with CSS transition duration
  }

  return (
    <>
      <div 
        id="launchpad-backdrop" 
        className={`launchpad-backdrop ${isVisible ? 'visible' : ''}`} 
        onClick={() => hideCloudPad()}
      ></div>
      <div 
        id="launchpad-id" 
        className={`launchpad modal ${isVisible ? 'visible' : ''}`}
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        onMouseEnter={() => dispatch(modalActions.showCloudPad())} 
        onMouseLeave={() => hideCloudPad()}
      >
        <CloudPadBody />
      </div>
    </>
  );
}

export default CloudPad;