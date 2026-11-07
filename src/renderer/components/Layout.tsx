import React, { useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";
import log from "loglevel";

import { appActions } from '../store/app-slice';

import WorkspaceRepository from '../repository/workspace';
import UpdateAvailableToast from './UpdateAvailableToast/UpdateAvailableToast';
import VideoBackground from './VideoBackground/VideoBackground';
import {
  isYoutubeBackground,
} from '../services/youtubeBackground';

import defaultBG from '../images/default_bg.jpg';

function normalizeImageBg(value: unknown): string {
  if (typeof value !== "string" || value === "") return defaultBG;
  if (isYoutubeBackground(value)) return defaultBG;
  return value;
}

export function Layout() {
  const dispatch = useDispatch();

  const bgImage = useSelector((state: any) => state.app.bgImage);
  const bgImage3d = useSelector((state: any) => state.app.bgImage3d);
  const videoBgEnabled = useSelector((state: any) => state.app.videoBgEnabled);
  const videoBgSource = useSelector((state: any) => state.app.videoBgSource);
  const desktopVisualMode = useSelector(
    (state: any) =>
      state.settings.desktopVisualMode ||
      state.settings.launchpadVisualMode ||
      "2d"
  );

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const location = useSelector((state: any) => state.session.location);

  const is3d = desktopVisualMode === "3d";
  const activeBg = is3d
    ? normalizeImageBg(bgImage3d || bgImage)
    : normalizeImageBg(bgImage);

  // Global YouTube webview (2D launchpad only) — independent of space wallpaper
  const showVideoBg =
    !is3d &&
    location === "launchpad" &&
    videoBgEnabled &&
    isYoutubeBackground(videoBgSource);

  useEffect(() => {
    if(location !== "launchpad"){
      dispatch(appActions.setBgImage({
        bgImage: defaultBG
      }));
      dispatch(appActions.setBgImage3d({
        bgImage3d: defaultBG
      }));
      // Video player stays enabled in state but is not rendered off launchpad
      return;
    }

    if (!workspace?.id) return;

    WorkspaceRepository.get(workspace.id).then((ws: any) => {
      const rawBg = ws?.bgImage;
      // Migrate any legacy youtube wallpaper off the space into the global player
      if (isYoutubeBackground(rawBg)) {
        dispatch(appActions.enableVideoBg({ source: rawBg }));
        WorkspaceRepository.updateBackgroundImage(workspace.id, defaultBG).catch(() => {});
        dispatch(appActions.setBgImage({ bgImage: defaultBG }));
      } else if (rawBg == null || rawBg === undefined || rawBg === "") {
        dispatch(appActions.setBgImage({
          bgImage: defaultBG
        }));
      } else {
        dispatch(appActions.setBgImage({
          bgImage: rawBg
        }));
      }

      const rawBg3d = ws?.bgImage3d;
      if (isYoutubeBackground(rawBg3d)) {
        WorkspaceRepository.updateBackgroundImage3d(workspace.id, defaultBG).catch(() => {});
        dispatch(appActions.setBgImage3d({ bgImage3d: defaultBG }));
      } else if (
        rawBg3d == null ||
        rawBg3d === undefined ||
        rawBg3d === ""
      ) {
        dispatch(appActions.setBgImage3d({
          bgImage3d: normalizeImageBg(rawBg),
        }));
      } else {
        dispatch(appActions.setBgImage3d({
          bgImage3d: rawBg3d
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

  }, [location, workspace?.id, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {showVideoBg ? (
        <VideoBackground source={videoBgSource} />
      ) : (
        <div
          className="bg-image"
          style={{ backgroundImage: activeBg ? `url(${activeBg})` : 'none' }}
          onKeyDown={(e) => handleKeyDown(e)}
        >
          {" "}
        </div>
      )}
      <div id="wrapper"  onKeyDown={(e) => handleKeyDown(e)}>
        {}
        <div id="content-wrapper" className="d-flex flex-column"  onKeyDown={(e) => handleKeyDown(e)}>
          {/* @ts-expect-error TS(2322): Type '{ onKeyDown: (e: any) => void; }' is not ass... Remove this comment to see the full error message */}
          <Outlet  onKeyDown={(e) => handleKeyDown(e)}/>
        </div>
      </div>
      <UpdateAvailableToast />
    </div>
  </>;
}
