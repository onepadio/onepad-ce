import { useDispatch } from "react-redux";


import { modalActions } from "../../store/modal-slice";

import "./LaunchPadLocal.css";

import "react-tabs/style/react-tabs.css";
import { addressBarId } from "../WindowContainter/shared";

import LaunchPadBody from "./LaunchPadBody";

function LaunchPadLocal(props: any) {
  const dispatch = useDispatch();

  function hideLaunchPad() {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.hideLaunchPad());
  }

  return (
    <>
      <div id="launchpad-backdrop" className="launchpad-backdrop" onClick={() => hideLaunchPad()}></div>
      {/* @ts-expect-error TS(2554): Expected 1 arguments, but got 0. */}
      <div id="launchpad-id" className="launchpad" onMouseEnter={() => dispatch(modalActions.showLaunchPad())} onMouseLeave={() => dispatch(modalActions.hideLaunchPad())}>
        <LaunchPadBody />
      </div>
    </>
  );
}

export default LaunchPadLocal;

export function toggleLaunchPad(dispatch: any, state: any) {
  let _addressBar = document.getElementById(addressBarId);
  // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
  dispatch(modalActions.toggleLaunchPad());

}
