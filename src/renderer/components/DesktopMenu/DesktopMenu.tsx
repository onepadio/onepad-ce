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
import { Gear, Image } from "react-bootstrap-icons";

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
      WorkspaceRepository.updateBackgroundImage(workspace.id, url).then((workspaceId) => {
        dispatch(appActions.setBgImage({
          bgImage: url
        }));
      }).catch((error) => {
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
            Random Background
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
      <Button color="dark" onClick={
        () => {
          // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
          dispatch(modalActions.toggleChangeBackgroundModal());
        }} data-bs-toggle="tooltip" data-bs-placement="left" title="Set Background" data-bs-custom-className="custom-tooltip">
        <Image size={24} color="white" />
      </Button>
    </div>
  );
}

DesktopMenu.propTypes = {
  direction: PropTypes.string,
};

export default DesktopMenu;
