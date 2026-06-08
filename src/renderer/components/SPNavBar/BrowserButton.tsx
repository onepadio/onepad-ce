import isElectron from "is-electron";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';

import { windowActions } from '../../store/window-slice';
import { sessionActions } from '../../store/session-slice';
import { modalActions } from "../../store/modal-slice";

import BrowserStateService from "../../services/browsers";
// @ts-expect-error
import globe_icon from '../../images/globe_icon_96.png';
import { openInternalWindow, openAppWindow, handleWindowClosed } from "../../services/window";

import { Button, ListGroupItem } from "reactstrap";
import { Collection, Globe, Layers, PlusLg, Search, WindowStack } from "react-bootstrap-icons";
import clsx from "clsx";

import { windowServiceActions } from "../../store/window-service-slice";

function BrowserButton(props) {
  const dispatch = useDispatch();
  const route = useSelector((state: any) => state.session.route);
  const user = useSelector((state: any) => state.user);

  const sessionState = useSelector((state: any) => state.session);

  const workspaceState = useSelector((state: any) => state.workspace);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const openWindows = useSelector((state: any) => state.session.openWindows);

  const openTabs = useSelector((state: any) => state.session.openTabs);

  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  const activeTabs = useSelector((state: any) => state.session.activeTabs);

  const items = useSelector((state: any) => state.workspace.links);

  const isLocal = useSelector((state: any) => state.workspace.isLocal);

  const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

  const browserWindows = useSelector((state: any) => state.session.browserWindows);

  const activeBrowserWindowId = useSelector((state: any) => state.session.activeBrowserWindowId);

  const activeWindow = useSelector((state: any) => state.session.activeWindow);


  const newTabUrl = useSelector((state: any) => state.browser.newTabUrl);

  const [homePage, setHomePage] = useState("https://www.google.com/");
  const [recentTabUrl, setRecentTabUrl] = useState("");


  function getPartitionId(workspaceId){
    let partition = "";
    if(route === "authenticated"){
      partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+user.username+"_"+workspaceState.currentSession.id : "persist:"+user.username+"_"+workspaceId;
    }else{
      partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+workspaceState.currentSession.id : "persist:"+workspaceId;
    }
    return partition;
  }

  function activateBrowser(isClick){
    let _openWindows = Object.assign({}, openWindows);
    let _openTabs = Object.assign({}, openTabs);
    let _windowTabs = Object.assign({}, windowTabs);
    let _activeTabs = Object.assign({}, activeTabs);

    let _id = "browser_".concat(workspace.id);
    log.debug("openLink");
    log.debug("openInternalWindow:"+homePage);
    if(openWindows[_id] != null && openWindows[_id].location === "external"){
      openAppWindow(_id, homePage, "external", 0, 0);
      return;
    }

    if (openWindows[_id] != null) {
      dispatch(
        sessionActions.setActiveWindow({
          data: openWindows[_id],
        })
      );
      return;
    }

    let window = {
        workspace: workspace.id,
        id: _id,
        url: ":browser",
        location: "main",
    }

    openInternalWindow(
        window,
        items,
        openWindows,
        isLocal,
        (result) => {
            if(result === undefined || result === null){
                return;
            }
            let _result = Object.assign({}, result);
            _result.type = "browser";
            _result.url = homePage;
            _result.location = "main";
            _result.desktop = desktop.id;
            _result.workspace = workspace.id;
            _result.partition = getPartitionId(workspace.id);

            log.debug("Result:"+_result);
            // OpenWindows
            _openWindows[result.id] = _result;
            dispatch(
              sessionActions.setOpenWindows({
              data: _openWindows,
            }));

            // Create initial tab using WindowService
            dispatch(windowServiceActions.openNewTab({
              windowId: _result.id,
              url: _result.data.startUrl
            }));

            dispatch(sessionActions.setActiveWindow({data: _result}));
            dispatch(sessionActions.addBrowserWindow({data: _id}));
            //dispatch(sessionActions.setActiveBrowserWindowId({data: _id}));

        },
    );
  }

  function handleOnClick(){

    // @ts-expect-error TS(2554): Expected 1 arguments, but got 11.
    activateBrowser(homePage, desktop, workspace, dispatch, openWindows, openTabs, windowTabs, activeTabs, items, isLocal, activeBrowserWindowId);
    //toggleLaunchPad(dispatch);
  }

  function handleRightClick(e){
    e.preventDefault();
    log.debug("handleRightClick");
  }

  useEffect(() => {
    log.debug("BrowserButton useEffect");
  }, []);

  const _globe = (
        <img id="browserImg" width={24} className="align-self-center launch-icon browserImg" src={globe_icon} alt=""/>
  )

  const _old= (
    <>
    {
      activeWindow.type === "browser" ? (
        <div className={"browsericon d-flex justify-content-center align-items-center border-1 border-white active border-"+props.activeMarkerPosition} onContextMenu={(e) => handleRightClick(e)} onClick={() => handleOnClick()}>

          <Collection color="white" size={20} />


          {
            props.showDot && (
                            <img className="align-self-center mt-1 invisible-dot" width={6} src="assets/images/icon/record.png" alt="" />
            )
          }
        </div>
      ) : (
        <>
          {
            openWindows[activeBrowserWindowId] !== undefined ? (
                            <div className="browsericon d-flex justify-content-center align-items-center browser" onClick={() => handleOnClick()}>

                <Collection color="white" size={20} />

                {
                  props.showDot && (
                                        <img className="align-self-center mt-1" width={6} src="assets/images/icon/record.png" alt="" />
                  )
                }
              </div>
            ) : (
                            <div className="appicon d-flex justify-content-center align-items-center browser" onClick={() => handleOnClick()}>
                <Collection color="white" size={20} />
                {
                  props.showDot && (
                                        <img className="align-self-center mt-1 invisible-dot" width={6} src="assets/images/icon/record.png" alt="" />
                  )
                }
              </div>
            )
          }
        </>
      )
    }
    </>
  )

  return (
    <ListGroupItem
      key={uuidv4()}
      id="browser-icon"
      className={clsx(
        'd-flex justify-content-center align-items-center nav-item mr-3',
        activeWindow?.type === 'browser' && 'active'
      )}
      onClick={() => handleOnClick()}
      onContextMenu={(e) => {
        e.preventDefault(); // prevent the default behaviour when right clicked
      }}
    >
      <div
          className="appicon w-100 d-flex justify-content-center align-items-center" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-custom-className="custom-tooltip"
          onContextMenu={(e) => {
            e.preventDefault(); // prevent the default behaviour when right clicked
            document.querySelectorAll(".context-menu").forEach((menu) => {
              document.body.removeChild(menu);
            });
            let _menu = document.createElement("div");
            _menu.className = "context-menu";
            _menu.innerHTML = `
              <div className="context-menu-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                </svg>
                <span>Close</span>
              </div>
            `;
            _menu.style.position = "fixed";
            _menu.style.top = "40px";
            _menu.style.left = (e.clientX-20) + "px";
            document.body.appendChild(_menu);

            _menu.querySelector(".context-menu-item:first-child").addEventListener("click", () => {
              // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
              dispatch(windowServiceActions.closeBrowser());
              document.body.removeChild(_menu);
            });

            _menu.addEventListener("mouseleave", () => {
              document.body.removeChild(_menu);
            });

            // Close menu when clicking outside
            const closeMenu = (e) => {
              if (document.body.contains(_menu) && !_menu.contains(e.target)) {
                document.body.removeChild(_menu);
                document.removeEventListener("click", closeMenu);
              }
            };

            // Delay adding the click listener to prevent immediate closure
            setTimeout(() => {
              document.addEventListener("click", closeMenu);
              // close menu when lost focus
              document.addEventListener("blur", () => {
                document.body.removeChild(_menu);
              });
            }, 0);
          }}
      >
                <Layers color="white" size={20} />
      </div>
    </ListGroupItem>
  );

}

export default BrowserButton;
