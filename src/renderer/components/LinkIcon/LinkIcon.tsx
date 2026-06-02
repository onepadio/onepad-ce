import isElectron from "is-electron";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';

import { windowActions } from '../../store/window-slice';
import { sessionActions } from '../../store/session-slice';
import { modalActions } from "../../store/modal-slice";
import { appActions } from '../../store/app-slice';

import { closeWindow } from "../../services/window";

import { getFavicon } from "../../services/favicon";
import { openInternalWindow, openAppWindow, handleWindowClosed } from "../../services/window";

import {
  Button,
} from "reactstrap";

import * as Icon from 'react-feather';
import clsx from "clsx";
import "./LinkIcon.css";
import { LinkService } from "../../services/link";
import { spaceAppActions } from "../../store/spaceapp-slice";
import { windowServiceActions } from "../../store/window-service-slice";
import { workspaceActions } from "../../store/workspace-slice";

function LinkIcon(props: any) {
  const dispatch = useDispatch();

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const openWindows = useSelector((state: any) => state.session.openWindows);

  const openTabs = useSelector((state: any) => state.session.openTabs);

  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  const activeTabs = useSelector((state: any) => state.session.activeTabs);

  const items = useSelector((state: any) => state.workspace.links);

  const isLocal = useSelector((state: any) => state.workspace.isLocal);

  const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

  const sessionState = useSelector((state: any) => state.session);

  function edit(){
    dispatch(
        modalActions.selectIcon(props.data)
    );
    dispatch(
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        modalActions.toggleEditLinkModal()
    );
  }

  function handleCloseWindow(){
    let _tabIds = Object.assign([], windowTabs[props.id]);
    let tabs: any = [];
    _tabIds.forEach((tabId: any) => {
        let _openTabs = Object.assign({}, openTabs);
        let _tab = Object.assign({}, _openTabs[tabId]);
        let _state = Object.assign({}, _tab.state);
        tabs.push(_state);
    });

    if(sessionState.isInSession){
      closeWindow(dispatch, sessionActions, props.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
    }else{
      LinkService.updateState(props.id, {
        tabs: tabs,
      }).then((res) => {
          log.debug("updateState", res);
          closeWindow(dispatch, sessionActions, props.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
      }).catch((err) => {
          log.error("updateState", err);
          closeWindow(dispatch, sessionActions, props.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
      });
    }
  }

  function newTab(windowId: any, url: any, icon: any, title: any){
    const now = new Date().getTime();
    return {
        id: uuidv4(),
        url: url,
        location: "main",
        type: "link",
        desktop: desktop.id,
        workspace: workspace.id,
        window: windowId,
        state:{
            url: url,
            title: title,
            icon: icon,
        },
        created: now,
        lastAccessed: now,
        sleeping: true,
    }
  }

  function handleOnClick2(){
    dispatch(spaceAppActions.setUrl(props.url));
    dispatch(spaceAppActions.setTitle(props.name));
    dispatch(spaceAppActions.setIsOpen(true));
  }

  function handleOnClick(){
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.hideLaunchPad());
    if(props.isInEditMode) return;
    log.debug("openLink");
    log.debug("openInternalWindow:"+props.url);
    if(openWindows[props.id] != null && openWindows[props.id].location === "external"){
      openAppWindow(props.id, props.url, "external", 0, 0);
      return;
    }

    if(openWindows[props.id] != null){
      dispatch(sessionActions.setActiveWindow({data: openWindows[props.id]}));
      if(openWindows[props.id].sleeping === true){
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(appActions.showSplashScreen());
        setTimeout(() => {
          //dispatch(appActions.showTabsScreen());
          // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
          dispatch(appActions.hideSplashScreen());
        }, 1000);
      }
      return;
    }

    let window = {
        workspace: props.workspaceId,
        id: props.id,
        url: props.url,
        location: "main",
    }

    let _openWindows = Object.assign({}, openWindows);
    let _openTabs = Object.assign({}, openTabs);
    let _windowTabs = Object.assign({}, windowTabs);
    openInternalWindow(
        window,
        items,
        openWindows,
        isLocal,
        (result: any) => {
          if(result === undefined || result === null){
              return;
          }

          LinkService.get(props.id).then((link: any) => {
            log.debug("link:",link);
            if(link == null){
                return;
            }

            let _result = Object.assign({}, link);

            _result.type = "link";

            _result.url = props.url;

            _result.location = "main";

            _result.desktop = desktop.id;

            log.debug("Result:",_result);

            // Openwindows
            _openWindows[props.id] = _result;
            dispatch(
                sessionActions.setOpenWindows({
                data: _openWindows,
            })
            );
            let _tabIds = [];
            // OpenTabs

            if(!sessionState.isInSession && link.state && link.state.tabs && link.state.tabs.length > 0){

                link.state.tabs.forEach((tabState: any) => {
                    log.debug("tabState:",tabState);
                    let _tab = newTab(props.id, tabState.url, tabState.icon, tabState.title);
                    _openTabs[_tab.id] = _tab;
                    _tabIds.push(_tab.id);
                });
            }else{

                let _tab = newTab(props.id, props.url, _result.data.icon, "");
                _openTabs[_tab.id] = _tab;
                _tabIds.push(_tab.id);
            }

            dispatch(
                sessionActions.setOpenTabs({
                data: _openTabs,
            }));
            // WindowTabs

            _windowTabs[_result.id] = _tabIds;
            dispatch(
                sessionActions.setWindowTabs({
                data: _windowTabs,
            }));

            dispatch(sessionActions.setActiveWindow({data: _result}));

            dispatch(appActions.showSplashScreen({}));
            setTimeout(() => {
              //if(_tabIds.length > 1){
              //  dispatch(appActions.showTabsScreen());
              //}

              dispatch(appActions.hideSplashScreen({}));
            }, 1000);

          }).catch((error) => {
              log.error("Error:",error);
          });
        },
    );
  }

  return <>
    <div
      className="launch-icon-container"
      draggable={props.draggable !== undefined ? props.draggable : true}
      onDragStart={props.onDragStart}
      onDragOver={props.onDragOver}
      onDragEnd={props.onDragEnd}
      style={props.style}
      onContextMenu={(e) => {
        e.preventDefault(); // prevent the default behaviour when right clicked
        const isWindowOpen = openWindows[props.id] != null;
        let _menu = document.createElement("div");
        _menu.className = "context-menu";
        _menu.innerHTML = `
          <div class="context-menu-item${isWindowOpen ? '' : ' disabled'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0z"/>
            </svg>
            <span>Pause</span>
          </div>
          <div class="context-menu-item${isWindowOpen ? '' : ' disabled'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
            </svg>
            <span>Close</span>
          </div>
          <div class="context-menu-item${isWindowOpen ? ' disabled' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
            </svg>
            <span>Edit</span>
          </div>
          <div class="context-menu-item${isWindowOpen ? ' disabled' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
            </svg>
            <span>Remove</span>
          </div>
        `;
        _menu.style.position = "fixed";
        _menu.style.top = (e.clientY) + "px";
        _menu.style.left = (e.clientX+20) + "px";
        document.body.appendChild(_menu);

        _menu.querySelector(".context-menu-item:first-child").addEventListener("click", () => {
            dispatch(windowServiceActions.sleepWindow(props.id));
            document.body.removeChild(_menu);
          });

        _menu.querySelector(".context-menu-item:nth-child(2)").addEventListener("click", () => {
            dispatch(windowServiceActions.closeWindow(props.id));
            document.body.removeChild(_menu);
        });

        _menu.querySelector(".context-menu-item:nth-child(3)").addEventListener("click", () => {
            document.body.removeChild(_menu);
            if(props.isOpen){
                alert("Please close the window first. After that you can edit the link.");
                return;
            }
            edit();
        });

        _menu.querySelector(".context-menu-item:nth-child(4)").addEventListener("click", () => {
            document.body.removeChild(_menu);
            if(props.isOpen){
                alert("Please close the window first. After that you can remove the link.");
                return;
            }
            if(window.confirm("Are you sure you want to remove this link?")){
                LinkService.delete(props.id).then(
                    (id) => {
                        LinkService.getLinksByWorkspaceIdAndDesktopId(workspace.id, desktop.id).then((links) => {
                            dispatch(workspaceActions.setLinks({links: links}));
                        });
                    }
                );
            }
        });

        // Close menu when clicking outside
        const closeMenu = (e: any) => {
          if (document.body.contains(_menu) && !_menu.contains(e.target)) {
            document.body.removeChild(_menu);
            document.removeEventListener("click", closeMenu);
          }
        };

        // Delay adding the click listener to prevent immediate closure
        setTimeout(() => {
          document.addEventListener("click", closeMenu);
        }, 0);
      }}
    >
          {
              props.isInEditMode && !props.isOpen && (
                  <>
                      {}
                      <div onClick={()=> edit()} className={clsx(
                          "rounded-full p-2 overflow-hidden",
                          "bg-white/50 dark:bg-gray-600/50",
                          "text-gray-700 dark:text-gray-200",
                          "disabled:opacity-60 hover:opacity-80",
                          "shadow hover:shadow-lg transition-all",
                          "absolute left-5 !p-1.5 edit-button"
                      )}>
                          <Icon.Edit2 size={16}/>
                      </div>
                  </>
              )
          }
          {
              false && (
                  <>
                      {}
                      <div onClick={()=> handleCloseWindow()} className={clsx(
                          "rounded-full p-1 overflow-hidden",
                          "bg-white/50 dark:bg-gray-600/50",
                          "text-gray-700 dark:text-gray-200",
                          "disabled:opacity-60 hover:opacity-80",
                          "shadow hover:shadow-lg transition-all",
                          "absolute top-2 right-5 !p-1.5 !bg-red-200/80 delete-button"
                      )}>
                          {}
                          <Icon.X className="text-red-500" size={12}/>
                      </div>
                  </>
              )
          }
      <div
      className={clsx(
        "card p-2 text-center launch-item linkIcon " + (openWindows[props.id] != null ? "" : ""),
      )}
      onClick={() => handleOnClick()}
      >
        {}
        <div className="d-flex justify-content-center">
            {}
            <img className="launch-icon" src={props.icon} width={48} alt=""/>
            {}
            <div className="icon-middle">
                {}
                <div className="icon-text">{props.name}</div>
            </div>
        </div>
        <div className="d-flex justify-content-center flex-column align-items-center mt-1">
                  <div className='d-flex'>
                      {
                          props.isOpen && props.showStatusDot && (
                              <span className="status-dot"></span>
                          )
                      }
                      {}
                      <span className={"icon-text ml-1"}>{props.title}</span>
                  </div>
              </div>
      </div>
    </div>
  </>;
}

export default LinkIcon;
