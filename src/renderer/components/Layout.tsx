import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";
import log from "loglevel";

import { getItem, setItem } from "../services/persist"
import { getRandomImage, BG_IMAGE_STORE_KEY } from "../services/unsplash";
import { appActions } from '../store/app-slice';

import DesktopRepository from '../repository/desktop';
import WorkspaceRepository from '../repository/workspace';


import defaultBG from '../images/default_bg.jpg';

export function Layout() {
  const dispatch = useDispatch();

  const bgImage = useSelector((state: any) => state.app.bgImage);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const location = useSelector((state: any) => state.session.location);

  useEffect(() => {
    if(location !== "launchpad"){
      dispatch(appActions.setBgImage({
        bgImage: defaultBG
      }));
      return;
    }

    WorkspaceRepository.get(workspace.id).then((workspace: any) => {

      if(workspace == null || workspace.bgImage == null || workspace.bgImage === undefined || workspace.bgImage === ""){
        dispatch(appActions.setBgImage({
          bgImage: defaultBG
        }));
      } else {

        if(workspace.bgImage !== null && workspace.bgImage !== undefined && workspace.bgImage !== ""){
          dispatch(appActions.setBgImage({

            bgImage: workspace.bgImage
          }));
        }
      }
    }).catch((error) => {
      dispatch(appActions.setBgImage({
        bgImage: defaultBG
      }));
    });

  }, [location, workspace]);

  function handleKeyDown(e: any){
    if(e.key === "Tab"){
      //e.preventDefault();
    }
    if(e.keyCode === 13){
      e.preventDefault();
    }

    // detect ctrl+tab
    if(e.ctrlKey && e.key === "Tab"){
      e.preventDefault();
      log.debug("ctrl+tab");
    }

    // detect command+t
    if(e.metaKey && e.key === "t"){
      e.preventDefault();
      log.debug("command+tab");
    }

    // detect command+n
    if(e.metaKey && e.key === "n"){
      e.preventDefault();
      log.debug("command+n");
    }
  }

  function onContextMenu(e: any){
    log.debug("Layout.js - onContextMenu");
    e.preventDefault();
  }

  return <>
    <div
      className="App"
      onContextMenu={(e) => onContextMenu(e)}
      onKeyDown={(e) => handleKeyDown(e)}
    >
      <div className="bg-image" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}  onKeyDown={(e) => handleKeyDown(e)}>
        {" "}
      </div>
      <div id="wrapper"  onKeyDown={(e) => handleKeyDown(e)}>
        {}
        <div id="content-wrapper" className="d-flex flex-column"  onKeyDown={(e) => handleKeyDown(e)}>
          {/* @ts-expect-error TS(2322): Type '{ onKeyDown: (e: any) => void; }' is not ass... Remove this comment to see the full error message */}
          <Outlet  onKeyDown={(e) => handleKeyDown(e)}/>
        </div>
      </div>
    </div>
  </>;
}
