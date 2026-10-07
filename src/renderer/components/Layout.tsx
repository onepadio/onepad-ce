import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";
import log from "loglevel";

import { appActions } from '../store/app-slice';

import WorkspaceRepository from '../repository/workspace';

import defaultBG from '../images/default_bg.jpg';

export function Layout() {
  const dispatch = useDispatch();

  const bgImage = useSelector((state: any) => state.app.bgImage);
  const bgImage3d = useSelector((state: any) => state.app.bgImage3d);
  const desktopVisualMode = useSelector(
    (state: any) =>
      state.settings.desktopVisualMode ||
      state.settings.launchpadVisualMode ||
      "2d"
  );

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const location = useSelector((state: any) => state.session.location);

  const activeBg =
    desktopVisualMode === "3d"
      ? bgImage3d || bgImage || defaultBG
      : bgImage || defaultBG;

  useEffect(() => {
    if(location !== "launchpad"){
      dispatch(appActions.setBgImage({
        bgImage: defaultBG
      }));
      dispatch(appActions.setBgImage3d({
        bgImage3d: defaultBG
      }));
      return;
    }

    WorkspaceRepository.get(workspace.id).then((workspace: any) => {

      if(workspace == null || workspace.bgImage == null || workspace.bgImage === undefined || workspace.bgImage === ""){
        dispatch(appActions.setBgImage({
          bgImage: defaultBG
        }));
      } else {
        dispatch(appActions.setBgImage({
          bgImage: workspace.bgImage
        }));
      }

      if (
        workspace == null ||
        workspace.bgImage3d == null ||
        workspace.bgImage3d === undefined ||
        workspace.bgImage3d === ""
      ) {
        // Fall back to 2D wallpaper until a dedicated 3D image is set
        dispatch(appActions.setBgImage3d({
          bgImage3d:
            workspace?.bgImage && workspace.bgImage !== ""
              ? workspace.bgImage
              : defaultBG,
        }));
      } else {
        dispatch(appActions.setBgImage3d({
          bgImage3d: workspace.bgImage3d
        }));
      }
    }).catch((error) => {
      dispatch(appActions.setBgImage({
        bgImage: defaultBG
      }));
      dispatch(appActions.setBgImage3d({
        bgImage3d: defaultBG
      }));
    });

  }, [location, workspace, dispatch]);

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
      <div className="bg-image" style={{ backgroundImage: activeBg ? `url(${activeBg})` : 'none' }}  onKeyDown={(e) => handleKeyDown(e)}>
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
