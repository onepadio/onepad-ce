import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import { addWorkspace } from "../../api/WorkspaceApi";
import {
  updateWorkspaces,
  selectTheLatestWorkspace,
} from "../../services/workspace";
import { WorkspaceService } from "../../services/workspace";
import DesktopService from "../../services/desktop";
import { UsersService } from "../../services/users";
import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";

import { Button, Form, FormGroup, Label, Input, Row, Col } from "reactstrap";
import Modal from "../lib/Modal";
import { Stage, Layer, Circle, Text, Rect } from 'react-konva';

import "./NewWorkspaceModalWindow.css";
import { getGoogleFavicon } from "../../services/favicon";
// @ts-expect-error
import defaultIcon from '../../images/default_icon.png'
import { RefreshCcw } from "react-feather";

function NewWorkspaceModalWindow(props: any) {
  const dispatch = useDispatch();

  const isNewWorkspaceModalOpen = useSelector(

    (state: any) => state.modal.isNewWorkspaceModalOpen
  );

  const profileId = useSelector((state: any) => state.app.profileId);

  const userId = useSelector((state: any) => state.user.id);

  const userUID = useSelector((state: any) => state.user.uid);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(defaultIcon);
  const [siteUrl, setSiteUrl] = useState("https://");
  const [isCustomIconUrl, setIsCustomIconUrl] = useState(false);
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [iconType, setIconType] = useState("color");
  const [color, setColor] = useState("#000000");
  const [spaceAlias, setSpaceAlias] = useState("");
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);

  function save() {
    if (name.length < 1) {
      return;
    }

    let _config = iconType === "color" ? {
      iconType: iconType,
      color: color,
      alias: spaceAlias,
    } : {
      iconType: iconType,
      icon: icon,
      alias: spaceAlias,
    };
    // @ts-expect-error
    WorkspaceService.newWorkspace(name, false, isSyncEnabled, false, profileId, userId, _config).then(
      (workspaceId) => {
        DesktopService.newDesktop("Default", workspaceId, true).then(
          (desktop) => {
            WorkspaceService.getWorkspace(workspaceId).then((workspace) => {
              dispatch(workspaceActions.addWorkspace({ workspace: workspace }));
              //WorkspaceService.selectWorkspaceById(dispatch, workspaceId, workspaceState, sessionStateData).then(
              //  () => {
              //    UsersService.setLastWorkspace(userId, workspaceId);
              //    toggle();
              //  }
              //);
              toggle();
              props.onClose(true);
            });
          }
        );
      }
    );
  }

  function toggle() {
    refresh();
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleNewWorkspaceModal());
  }

  function refresh() {
    log.debug("refresh");
    setName("");
    setIcon(defaultIcon);
    setSiteUrl("https://");
    setIsCustomIconUrl(false);
    setCustomIconUrl("");
  }

  function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }

  function onCustomIconUrlSwitchChange() {
    log.debug("Icon search url switch changed ", isCustomIconUrl);
    const customIconUrlField = document.getElementById("customIconUrlInput");
    const fetchIcon = document.getElementById("space-fetch-icon");
    if(!isCustomIconUrl){
      customIconUrlField.classList.remove("d-none");
      fetchIcon.classList.add("d-none");
    }else{
      customIconUrlField.classList.add("d-none");
      fetchIcon.classList.remove("d-none");
    }
    setIsCustomIconUrl(!isCustomIconUrl);
  }

  function onIconLoadError(error) {
    log.debug("Errror:" + error);
    setIcon("");
  }

  function randomColor() {
    setColor("#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0"));
  }

  function onSyncSwitchChange() {
    setIsSyncEnabled(!isSyncEnabled);
  }

  useEffect(() => {
    log.debug("useEffect");
    const fetchIcon = document.getElementById("space-fetch-icon");
    const iconUrl = document.getElementById("space-icon-url");
    const customIconUrlField = document.getElementById("customIconUrlInput");
    if (iconType === "image") {
      iconUrl.classList.remove("d-none");
      if(isCustomIconUrl){
        customIconUrlField.classList.remove("d-none");
      }else{
        fetchIcon.classList.remove("d-none");
      }
    } else {
      randomColor();
      fetchIcon.classList.add("d-none");
      iconUrl.classList.add("d-none");
      customIconUrlField.classList.add("d-none");
    }
  }, [iconType]);

  useEffect(() => {
    // check if name single word
    if (name.split(" ").length > 1) {
      setSpaceAlias(name.split(" ")[0].toUpperCase().charAt(0) + name.split(" ")[1].toUpperCase().charAt(0));
    } else {
      setSpaceAlias(name.toUpperCase().slice(0, 2));
    }
  }, [name]);

  useEffect(() => {
    try {
      if(isCustomIconUrl){
        if(validURL(isCustomIconUrl)){
          setIcon(customIconUrl);
        }
      }else{
        if(validURL(siteUrl)){
          setIcon(getGoogleFavicon(siteUrl));
        }
      }
    } catch (error) {
      log.error("Invalid URL:", error);
    }
  }, [siteUrl, customIconUrl, isCustomIconUrl]);

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="New Space"
        className="new-workspace-modal"
        show={isNewWorkspaceModalOpen}
        onClose={() => {
          toggle();
          props.onClose(false);
        }}
      >
        <Form>
          <Row>
                <Col md={3} className="mt-4 mb-2 d-flex justify-content-center">
                  <FormGroup>
                    <Label for="iconImg"></Label>
                        {
                          iconType === "image" ? (
                            <img
                              id="iconImg"
                              src={icon}
                              width={48}
                              height={48}
                              onError={(e) => onIconLoadError(e)}
                            ></img>
                          ) : (
                                                        // @ts-expect-error Konva Stage children type issue
                                                        <Stage width={40} height={40}>
                              <Layer>
                                <Rect
                                  x={5}
                                  y={5}
                                  width={30}
                                  height={30}
                                  fill={color}
                                  shadowBlur={10}
                                  cornerRadius={5}
                                />
                              </Layer>
                              <Layer>
                                <Text x={10} y={14} text={spaceAlias} fontSize={16} fill='white'/>
                              </Layer>
                            </Stage>
                          )
                        }
                  </FormGroup>
                </Col>
                <Col md={9}>
                  <FormGroup className="align-left">
                    <Label for="workspaceName">Name</Label>
                    <Input
                      id="workspaceName"
                      name="workspaceName"
                      placeholder=""
                      type="text"
                      value={name}
                      onChange={(e) => {
                        if (e.target.value.length > 20) {
                          alert("Workspace name must be less than 20 characters.");
                          return;
                        }
                        setName(e.target.value)
                      }}
                    />
                  </FormGroup>
                  <FormGroup className="align-left">
                    <Label for="iconType">Icon</Label>
                    <div className="d-flex">
                      <Input
                        type="select"
                        name="iconType"
                        id="iconType"
                        value={iconType}
                        onChange={(e) => setIconType(e.target.value)}
                      >
                        <option value="color">Random Color</option>
                        <option value="image">Image</option>
                      </Input>
                      <Button className="ml-2" onClick={() => randomColor()}>
                        <RefreshCcw size={16} />
                      </Button>
                    </div>
                  </FormGroup>
                  <FormGroup id={"space-fetch-icon"} className="align-left d-none">
                    <Label for="startUrl">
                      Fetch from site
                    </Label>
                    <Input
                      id="addLinkStartUrl"
                      name="startUrl"
                      placeholder=""
                      type="text"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup id={"space-icon-url"} switch className="pl-0 align-left d-none">
                    <Row className="mr-1">
                      <Col id="addLinkCustomIcon" md={9}>
                        <Label check>
                         Custom Icon Link
                        </Label>
                      </Col>
                      <Col className="container">
                        <div className="d-flex justify-content-end">
                          <Input
                            type="switch"
                            checked={isCustomIconUrl}
                            onChange={() => onCustomIconUrlSwitchChange()}
                          />
                        </div>
                      </Col>
                    </Row>
                  </FormGroup>
                  <FormGroup id="customIconUrlInput" className="d-none">
                    <Input
                      id="customIconUrl"
                      name="customIconUrl"
                      type="text"
                      value={customIconUrl}
                      onChange={(e) => setCustomIconUrl(e.target.value)}
                      placeholder="Paste the link here.(ex. https://google.com)"
                    />
                  </FormGroup>
                  {
                    userUID !== "" && userUID !== undefined && userUID !== null && (
                      <FormGroup id={"space-sync"} switch className="pl-0 align-left">
                        <Row className="mr-1">
                          <Col id="space-sync-label" md={9}>
                            <Label check>
                            Sync <br />
                            <small className="text-muted">
                              Enable to sync this space between devices{" "}
                            </small>
                            </Label>
                          </Col>
                          <Col className="container">
                            <div className="d-flex justify-content-end">
                              <Input
                                type="switch"
                                checked={isSyncEnabled}
                                onChange={() => onSyncSwitchChange()}
                              />
                            </div>
                          </Col>
                        </Row>
                      </FormGroup>
                    )
                  }
                </Col>
          </Row>
        </Form>
        <div className="d-flex justify-content-center mt-3">
          <Button color="primary" onClick={save}>
            Save
          </Button>
          <Button color="secondary ml-2" onClick={toggle}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default NewWorkspaceModalWindow;
