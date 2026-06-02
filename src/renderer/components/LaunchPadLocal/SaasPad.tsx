import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import isElectron from "is-electron";

import { modalActions } from "../../store/modal-slice";
import SaasPadBody from "./SaasPadBody";
import "./SaasPad.css";
import { Grid } from "react-bootstrap-icons";

function SaasPad(props: any) {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(false);
  const [isCtrlHeld, setIsCtrlHeld] = useState(false);

  const isSaasPadOpen = useSelector((state: any) => state.modal.isSaasPadOpen);
  const saasPadSelectedIndex = useSelector((state: any) => state.modal.saasPadSelectedIndex);

  // Sync visibility with Redux state
  useEffect(() => {
    if (isSaasPadOpen) {
      // Delay setting visibility to trigger animation
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [isSaasPadOpen]);

  // Handle Ctrl+Tab from main process (global shortcut)
  useEffect(() => {
    if (!isElectron()) return;

    let isCtrlTabActive = false;

    // @ts-expect-error
    const handleMainMessage = (event, data) => {
      if (data.action === 'ctrl-tab-pressed' || data.action === 'ctrl-shift-tab-pressed') {
        isCtrlTabActive = true;
        const isReverse = data.action === 'ctrl-shift-tab-pressed';

        if (!isSaasPadOpen) {
          // First time pressing Ctrl+Tab - open SaasPad with first item selected
          dispatch(modalActions.setSaasPadSelectedIndex(0));
          // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
          dispatch(modalActions.showSaasPad());
        } else {
          // SaasPad is open - cycle to next/previous item
          const itemsContainer = document.querySelector('.saas-pad-modal .icons');
          const items = itemsContainer?.querySelectorAll('.launch-item, .browser-button-wrapper');
          const totalItems = items ? items.length : 0;

          if (totalItems > 0) {
            let nextIndex;
            if (isReverse) {
              // Shift+Ctrl+Tab: go backwards
              nextIndex = (saasPadSelectedIndex - 1 + totalItems) % totalItems;
            } else {
              // Ctrl+Tab: go forwards
              nextIndex = (saasPadSelectedIndex + 1) % totalItems;
            }
            dispatch(modalActions.setSaasPadSelectedIndex(nextIndex));
          }
        }
      }
    };

    // Track Ctrl key release to activate selected app
    const handleKeyUp = (event: KeyboardEvent) => {
      if ((event.key === 'Control' || event.key === 'Meta') && isCtrlTabActive) {
        isCtrlTabActive = false;
        setIsCtrlHeld(false);

        if (isSaasPadOpen) {
          // Small delay to ensure the key release is after the Tab press
          setTimeout(() => {
            // Get the selected item and click it
            const itemsContainer = document.querySelector('.saas-pad-modal .icons');
            const items = itemsContainer?.querySelectorAll('.launch-item, .browser-button-wrapper');

            if (items && items[saasPadSelectedIndex]) {
              const selectedItem = items[saasPadSelectedIndex] as HTMLElement;
              // Find the clickable element inside
              const clickable = selectedItem.querySelector('.card, button, .appicon') || selectedItem;
              if (clickable) {
                (clickable as HTMLElement).click();
              }
            }

            // Close the SaasPad
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            dispatch(modalActions.hideSaasPad());
          }, 50);
        }
      } else if (event.key === 'Control' || event.key === 'Meta') {
        setIsCtrlHeld(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control' || event.key === 'Meta') {
        setIsCtrlHeld(true);
      }
    };

    // @ts-expect-error
    window.electronAPI?.receive('fromMain', handleMainMessage);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // @ts-expect-error
      window.electronAPI?.removeListener('fromMain', handleMainMessage);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, isSaasPadOpen, saasPadSelectedIndex]);

  function hideSaasPad() {
    // Don't close if Ctrl is being held (user is switching)
    if (isCtrlHeld) return;

    setIsVisible(false);
    // Wait for animation to complete before dispatching hide action
    setTimeout(() => {
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.hideSaasPad());
    }, 300); // Match this with CSS transition duration
  }

  return (
    <>
      <div
        id="launchpad-backdrop"
        className={`launchpad-backdrop ${isVisible ? 'visible' : ''}`}
        onClick={() => hideSaasPad()}
      ></div>
      <div
        id="saas-pad-id"
        className={`saas-pad-modal ${isVisible ? 'visible' : ''}`}
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        onMouseEnter={() => dispatch(modalActions.showSaasPad())}
        onMouseLeave={() => hideSaasPad()}
      >
        <h2 className="saas-title d-flex align-items-center justify-content-center mt-3">
          <Grid color="white" size={24} />
          <span className="ms-2 text-white">Space Apps</span>
        </h2>
        <SaasPadBody />
      </div>
    </>
  );
}

export default SaasPad;
