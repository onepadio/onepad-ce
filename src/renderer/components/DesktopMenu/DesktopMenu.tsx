import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createClient } from 'pexels';

import { appActions } from "../../store/app-slice";
import { modalActions } from "../../store/modal-slice";
import { getRandomImage, BG_IMAGE_STORE_KEY } from "../../services/unsplash";
import { getItem, setItem } from "../../services/persist";
import WorkspaceRepository from "../../repository/workspace";

import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Button,
} from "reactstrap";

import PropTypes from "prop-types";
import "./DesktopMenu.css";
import defaultBG from "../../images/default_bg.jpg";
import log from "loglevel";
import { CameraVideoFill, Gear, Image, MusicNoteBeamed } from "react-bootstrap-icons";
import {
  YOUTUBE_BG_HOME_URL,
  YOUTUBE_MUSIC_HOME_URL,
  isYoutubeMusicSource,
  readLastWatchVideoSource,
} from "../../services/youtubeBackground";

function DesktopMenu({
  direction,
  ...args
}: any) {
  const dispatch = useDispatch();

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const defaultDesktopId = useSelector((state: any) => state.workspace.defaultDesktopId);

  const isDesktopsEnabled = useSelector((state: any) => state.settings.isDesktopsEnabled);

  const isAIAssistantOpen = useSelector((state: any) => state.ai.isOpen);

  const videoBgEnabled = useSelector((state: any) => state.app.videoBgEnabled);
  const videoBgSource = useSelector((state: any) => state.app.videoBgSource);
  const isImagePickerOpen = useSelector(
    (state: any) => state.modal.isChangeBackgroundModalOpen
  );
  const isVideoPickerOpen = useSelector(
    (state: any) => state.modal.isChangeVideoBackgroundModalOpen
  );

  const desktopVisualMode = useSelector(
    (state: any) =>
      state.settings.desktopVisualMode ||
      state.settings.launchpadVisualMode ||
      "2d"
  );
  const is3d = desktopVisualMode === "3d";
  const bgMode: "image" | "video" | "music" =
    !is3d && videoBgEnabled
      ? isYoutubeMusicSource(videoBgSource)
        ? "music"
        : "video"
      : "image";

  function openImagePicker() {
    // Interactive video is a sibling of #wrapper (z-index 5) at z-index 90,
    // so it paints above the sidebar unless browse mode is cleared first.
    dispatch(appActions.setVideoBgInteractive({ interactive: false }));
    if (!isImagePickerOpen) {
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.toggleChangeBackgroundModal());
    }
  }

  function openVideoPicker() {
    dispatch(appActions.setVideoBgInteractive({ interactive: false }));
    if (!isVideoPickerOpen) {
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.toggleChangeVideoBackgroundModal());
    }
  }

  function onImageModeClick() {
    if (is3d) {
      openImagePicker();
      return;
    }
    // Already on image: open picker. Switching from video/music: show space wallpaper.
    if (bgMode === "image") {
      openImagePicker();
      return;
    }
    dispatch(appActions.disableVideoBg());
  }

  function onVideoModeClick() {
    // Already on video: open library picker
    if (bgMode === "video") {
      openVideoPicker();
      return;
    }
    // From image or music: resume last YouTube watch page (never stay on Music)
    let source = YOUTUBE_BG_HOME_URL;
    if (bgMode === "music") {
      source = readLastWatchVideoSource() || YOUTUBE_BG_HOME_URL;
      if (isYoutubeMusicSource(source)) {
        source = YOUTUBE_BG_HOME_URL;
      }
    } else if (videoBgSource && !isYoutubeMusicSource(videoBgSource)) {
      source = videoBgSource;
    }
    dispatch(appActions.setVideoBgInteractive({ interactive: false }));
    dispatch(appActions.enableVideoBg({ source }));
  }

  function onMusicModeClick() {
    // Already on music: enter browse mode
    if (bgMode === "music") {
      dispatch(appActions.setVideoBgInteractive({ interactive: true }));
      return;
    }
    dispatch(appActions.enableVideoBg({ source: YOUTUBE_MUSIC_HOME_URL }));
  }

  const client = createClient('4Qpo6sLZ2hjfUkyERXQrQzKbcbew6EQtIr3cPQLnMp26S9urGttwX8rg');

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const toggleRenameDesktopModalWindow = () => {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleRenameDesktopModalWindow());
  }

  const toggleDeleteDesktopModalWindow = () => {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleDeleteDesktopModalWindow());
  }

  useEffect(() => {}, []);

  function randomBackgroundImage() {
    const query = 'Nature Ocean';
    const orientation = 'landscape';

    client.photos.search({ query, orientation, per_page: 10 }).then(photos => {
      log.debug(photos);
      // @ts-expect-error
      const photo = photos.photos[Math.floor(Math.random() * photos.photos.length)];
      const url = photo.src.original;
      setItem(BG_IMAGE_STORE_KEY, url);
      if (is3d) {
        WorkspaceRepository.updateBackgroundImage3d(workspace.id, url).then(() => {
          dispatch(appActions.setBgImage3d({ bgImage3d: url }));
        }).catch(() => {
          dispatch(appActions.setBgImage3d({ bgImage3d: defaultBG }));
        });
        return;
      }
      WorkspaceRepository.updateBackgroundImage(workspace.id, url).then(() => {
        dispatch(appActions.setBgImage({
          bgImage: url
        }));
      }).catch(() => {
        dispatch(appActions.setBgImage({
          bgImage: defaultBG
        }));
      });
    });
  }

  function menu(){
    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle} direction={direction}>
        <DropdownToggle color="dark">
          <Gear size={16} color="white" />
        </DropdownToggle>
        <DropdownMenu dark>
          {/* @ts-expect-error TS(2554): Expected 1 arguments, but got 0. */}
          <DropdownItem onClick={() => dispatch(modalActions.toggleWidgetConfigurationModal())}>
            Widgets
          </DropdownItem>
          <DropdownItem onClick={randomBackgroundImage}>
            {is3d ? "Random 3D Background" : "Random Background"}
          </DropdownItem>
          { isDesktopsEnabled ?  (
            <>
              <DropdownItem onClick={toggleRenameDesktopModalWindow}>
                Rename
              </DropdownItem>
              {
                desktop.id !== defaultDesktopId ? (
                  <>
                    <DropdownItem onClick={toggleDeleteDesktopModalWindow}>
                      Delete
                    </DropdownItem>
                  </>
                ) : (
                  <></>
                )
              }
            </>
          ) : (
            <></>
          )}
        </DropdownMenu>
      </Dropdown>
    )
  }

  return (
    <div className={`desktopMenu ${isAIAssistantOpen ? 'chat-assistant-open' : ''}`}>
      {is3d ? (
        <Button
          color="dark"
          onClick={onImageModeClick}
          title="Set 3D Background"
        >
          <Image size={24} color="white" />
        </Button>
      ) : (
        <div className="desktop-bg-mode-toggle" role="group" aria-label="Background mode">
          <button
            type="button"
            className={`desktop-bg-mode-btn ${bgMode === "image" ? "active" : ""}`}
            onClick={onImageModeClick}
            title={bgMode === "image" ? "Change background image" : "Show background image"}
            aria-label="Image"
          >
            <Image size={16} aria-hidden />
          </button>
          <button
            type="button"
            className={`desktop-bg-mode-btn ${bgMode === "video" ? "active" : ""}`}
            onClick={onVideoModeClick}
            title={bgMode === "video" ? "Change background video" : "Play background video"}
            aria-label="Video"
          >
            <CameraVideoFill size={16} aria-hidden />
          </button>
          <button
            type="button"
            className={`desktop-bg-mode-btn ${bgMode === "music" ? "active" : ""}`}
            onClick={onMusicModeClick}
            title={
              bgMode === "music"
                ? "Browse YouTube Music"
                : "Play YouTube Music"
            }
            aria-label="Music"
          >
            <MusicNoteBeamed size={16} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

DesktopMenu.propTypes = {
  direction: PropTypes.string,
};

export default DesktopMenu;
