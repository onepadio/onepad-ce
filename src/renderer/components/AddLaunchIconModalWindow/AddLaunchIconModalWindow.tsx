import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import log from "loglevel";

import { itemsDb } from "../../data/store";
import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";
import { appActions } from "../../store/app-slice";

import { updateWorkspaces } from "../../services/workspace";
import { updateWorkspaceItems } from "../../api/WorkspaceApi";

import { getAppDetails } from "../../services/switchpad-api";
import AppService from "../../services/app";
import XAppService from "../../services/xapp";
import { FavouritesService } from "../../services/favourites";
import { Window } from "../../model/window";
import { windowTypes, WindowType } from "../../services/window";
import { Button, Form, FormGroup, Label, Input, Row, Col } from "reactstrap";
import Modal from "../lib/Modal";

import "./AddLaunchIconModalWindow.css";

function AddLaunchIconModalWindow(props: any) {
  const dispatch = useDispatch();

  const isDesktopsEnabled = useSelector(

    (state: any) => state.settings.isDesktopsEnabled
  );

  const profileId = useSelector((state: any) => state.app.profileId);

  const xapps = useSelector((state: any) => state.app.xapps);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const userId = useSelector((state: any) => state.user.id);

  const items = useSelector((state: any) => state.workspace.items);

  const isLocal = useSelector((state: any) => state.workspace.isLocal);
  const selectedAppStoreItem = useSelector(

    (state: any) => state.modal.selectedAppStoreItem
  );
  const isAddLaunchIconModalOpen = useSelector(

    (state: any) => state.modal.isAddLaunchIconModalOpen
  );
  const toggle = () => {
    dispatch(modalActions.toggleAddLaunchIconModal({}));
  };


  const location = useSelector((state: any) => state.modal.location);

  const productName = useSelector((state: any) => state.user.product);

  const [withCustomUrl, setWithCustomUrl] = useState(false);
  const [allDesktops, setAllDesktops] = useState(false);
  const [withTabs, setWithTabs] = useState(true);
  const [windowSize, setWindowSize] = useState("fullscreen");
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [windowHeight, setWindowHeight] = useState(768);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [icon, setIcon] = useState("");
  const [defaultUrl, setDefaultUrl] = useState("");
  const [startUrl, setStartUrl] = useState("");
  const [customUrl, setCustomUrl] = useState("https://");
  const [storeId, setStoreId] = useState("");
  const [windowType, setWindowType] = useState("internal");
  const [isStateful, setIsStateful] = useState(0);
  const [autoSave, setAutoSave] = useState(true);
  const [showControls, setShowControls] = useState(0);
  const [suspendTabs, setSuspendTabs] = useState(false);
  const [isolated, setIsolated] = useState(false);
  const [useragent, setUseragent] = useState("");

  // Advanced accordion
  const [advancedOpen, setAdvancedOpen] = useState(false);


  const workspaces = useSelector((state: any) => state.workspace.workspaces);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    workspace?.id || "all"
  );

  function save() {
    if (name.length < 1 || startUrl.length < 1) {
      alert("Name or url can not be empty");
      return;
    }
    saveLocal();
  }

  function saveLocal() {
    let window = new Window() as any;
    window.fullScreen = isFullScreen;
    window.enableTabs = withTabs;
    window.type = windowType;
    if (!isFullScreen) {
      window.height = windowHeight;
      window.width = windowWidth;
    }
    let desktopId = desktop.id;
    if (allDesktops) {
      desktopId = "all";
    }

    let _customUrl = withCustomUrl ? customUrl : "";

    let _workspace =
      selectedWorkspaceId === "all" || selectedWorkspaceId === "private"
        ? workspace
        : workspaces.find((w: any) => w.id === selectedWorkspaceId);

    if (location === "launchpad") {
      let _workspaceId =
        selectedWorkspaceId === "all" ? profileId : workspace.id;
      AppService.save(
        _workspaceId,
        desktopId,
        name,
        startUrl,
        _customUrl,
        storeId,
        icon,
        window,
        autoSave,
        suspendTabs,
        isolated,
        useragent
      ).then((id) => {
        FavouritesService.save(id).then((favourites) => {
          AppService.getAppsByWorkspaceIdAndDesktopId(
            _workspace.id,
            desktop.id
          ).then((apps) => {
            dispatch(workspaceActions.setApps({ apps: apps }));
            toggle();
          });
        });
      });
    } else {
      XAppService.save(
        name,
        startUrl,
        _customUrl,
        storeId,
        icon,
        window,
        profileId,
        autoSave,
        suspendTabs,
        useragent
      )
        .then((id) => {
          log.debug("XAppService.save", id);
          let _xappIds =
            JSON.parse(localStorage.getItem("xappIds-" + profileId)) || [];
          _xappIds.push(id);
          localStorage.setItem(
            "xappIds-" + profileId,
            JSON.stringify(_xappIds)
          );

          FavouritesService.save(id).then((favourites) => {
            XAppService.getAll()
              .then((xapps: any) => {

                dispatch(appActions.setXApps(xapps.reverse() || []));
                let _xappsStore = {};

                xapps.forEach((xapp: any) => {
                  _xappsStore[xapp.id] = xapp;
                });

                dispatch(appActions.setXAppsStore(_xappsStore));
                toggle();
              })
              .catch((error) => {
                log.debug("Error getting xapps", error);
              });
          });
        })
        .catch((error) => {
          log.debug("Error saving xapp", error);
        });
    }
  }

  function saveRemote() {
    log.debug(items);
    let uuid = uuidv4();
    let _items = [...items];
    _items.push({
      id: uuid,
      name: name,
      code: code,
      start_url: startUrl,
      default_url: defaultUrl,
      icon: icon,
      window_type: windowType,
      is_stateful: isStateful,
      show_controls: showControls,
    });

    updateWorkspaceItems(userId, workspace.id, _items).then((response) => {
      dispatch(workspaceActions.setItems({ items: _items }));
      updateWorkspaces(userId, dispatch);
      toggle();
    });
  }

  function reset() {
    let _item = itemsDb[selectedAppStoreItem];
    setStoreId(_item.id);
    setName(_item.name);
    setCode(_item.code);
    setIcon(_item.icon);
    setWithCustomUrl(false);
    setCustomUrl("https://");
    setStartUrl(_item.login);
    setWindowType("internal");
    setIsStateful(_item.autoSave);
    setShowControls(_item.navigationControls);
    setUseragent(_item.useragent || "");
  }

  function refresh() {
    getAppDetails(selectedAppStoreItem.id).then((data: any) => {
      setStoreId(data.id);
      setName(data.name);
      setCode(data.code);
      setIcon(data.icon);
      setCustomUrl("https://");
      setStartUrl(data.login);
      setWindowType("internal");
      setIsStateful(data.autoSave);
      setShowControls(data.navigationControls);
      setUseragent(data.useragent || "");
    });
  }

  useEffect(() => {
    if (selectedAppStoreItem) {
      reset();
    }
  }, [selectedAppStoreItem]);

  function onLoad() {
    setStoreId(selectedAppStoreItem.id);
    setName(selectedAppStoreItem.name);
    setCode(selectedAppStoreItem.code);
    setIcon(selectedAppStoreItem.icon);
    setCustomUrl("https://");
    setStartUrl(selectedAppStoreItem.login);
    setWindowType("internal");
    setIsStateful(selectedAppStoreItem.autoSave);
    setShowControls(selectedAppStoreItem.navigationControls);
    setUseragent(selectedAppStoreItem.useragent || "");
  }

  useEffect(() => {
    const container = document.getElementById("custom-url");
    if (container == null) return;
    if (withCustomUrl) {
      setCustomUrl("https://");
      container.classList.remove("d-none");
    } else {
      container.classList.add("d-none");
    }
  }, [withCustomUrl]);

  useEffect(() => {
    if (isAddLaunchIconModalOpen) {
      reset();
    }
  }, [isAddLaunchIconModalOpen]);

  useEffect(() => {
    if (windowType === WindowType.Modal) {
      setIsFullScreen(false);
    }
  }, [windowType]);

  useEffect(() => {
    if (selectedWorkspaceId === "private") {
      setIsolated(true);
    }
  }, [selectedWorkspaceId]);

  function onWindowSizeChange(value: any) {
    const widthField = document.getElementById("windowWidth");
    const heightField = document.getElementById("windowHeight");
    setWindowSize(value);
    setWindowWidth(1280);
    setWindowHeight(1024);
    if (value === "fullscreen") {
      setIsFullScreen(true);
      setWindowWidth(0);
      setWindowHeight(0);
      widthField?.classList.add("d-none");
      heightField?.classList.add("d-none");
    } else if (value === "large") {
      setIsFullScreen(false);
      setWindowWidth(1920);
      setWindowHeight(1080);
      widthField?.classList.add("d-none");
      heightField?.classList.add("d-none");
    } else if (value === "medium") {
      setIsFullScreen(false);
      setWindowWidth(1280);
      setWindowHeight(1024);
      widthField?.classList.add("d-none");
      heightField?.classList.add("d-none");
    } else if (value === "small") {
      setIsFullScreen(false);
      setWindowWidth(1024);
      setWindowHeight(768);
      widthField?.classList.add("d-none");
      heightField?.classList.add("d-none");
    } else {
      setIsFullScreen(false);
      widthField?.classList.remove("d-none");
      heightField?.classList.remove("d-none");
    }
  }

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="Install App"
        className="add-app-modal"
        show={isAddLaunchIconModalOpen}
        onClose={() => toggle()}
      >
        <Form className="mb-3">
          <Row>
            <Col md={3} className="mt-4 d-flex justify-content-center">
              <FormGroup>
                <Label for="iconImg"></Label>
                <img
                  id="iconImg"
                  src={"./images/store/icon/" + icon}
                  width={64}
                  height={64}
                  alt={name}
                  className="app-icon"
                ></img>
              </FormGroup>
            </Col>
            <Col md={9}>
              <FormGroup className="align-left">
                <Label for="appName">Name</Label>
                <Input
                  id="appName"
                  name="appName"
                  placeholder=""
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormGroup>
              <FormGroup className="align-left">
                <Label for="startUrl">Web Address</Label>
                <Input
                  id="startUrl"
                  name="startUrl"
                  placeholder=""
                  type="text"
                  value={startUrl}
                  onChange={(e) => setStartUrl(e.target.value)}
                  readOnly={true}
                />
              </FormGroup>
            </Col>
          </Row>

          {isDesktopsEnabled && (
            <FormGroup switch className="pl-0 mt-3 align-left">
              <Row className="mr-1">
                <Col md={9}>
                  <Label check>All Desktops</Label>
                </Col>
                <Col className="container">
                  <div className="d-flex justify-content-end">
                    <Input
                      type="switch"
                      checked={allDesktops}
                      onChange={() => {
                        setAllDesktops(!allDesktops);
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </FormGroup>
          )}

          <FormGroup switch className="pl-0 mt-3 align-left">
            <Row className="mr-1">
              <Col md={9}>
                <Label check>Advanced</Label>
              </Col>
              <Col className="container">
                <div className="d-flex justify-content-end">
                  <Input
                    type="switch"
                    checked={advancedOpen}
                    onChange={() => {
                      setAdvancedOpen(!advancedOpen);
                    }}
                  />
                </div>
              </Col>
            </Row>
          </FormGroup>

          {advancedOpen && (
            <>
              <FormGroup switch className="pl-0 align-left ml-3 mt-3">
                <Row className="mr-1">
                  <Col md={9}>
                    <Label check>
                      Custom Web Address
                      <br />
                      <small className="text-muted">
                        Use a different web address for the application{" "}
                      </small>
                    </Label>
                  </Col>
                  <Col className="container">
                    <div className="d-flex justify-content-end">
                      <Input
                        type="switch"
                        checked={withCustomUrl}
                        onChange={() => {
                          setWithCustomUrl(!withCustomUrl);
                        }}
                      />
                    </div>
                  </Col>
                </Row>
              </FormGroup>
              <FormGroup id="custom-url" className="d-none ml-3">
                <Input
                  id="customUrl"
                  name="customUrl"
                  placeholder=""
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </FormGroup>
              <FormGroup switch className="pl-0 mt-3 align-left ml-3 d-none">
                <Row className="mr-1">
                  <Col md={9}>
                    <Label check>
                      Isolate <br />
                      <small className="text-muted">
                        Run the application in a separate container{" "}
                      </small>
                    </Label>
                  </Col>
                  <Col className="container">
                    <div className="d-flex justify-content-end">
                      <Input
                        type="switch"
                        checked={isolated}
                        onChange={() => {
                          setIsolated(!isolated);
                        }}
                      />
                    </div>
                  </Col>
                </Row>
              </FormGroup>
              <FormGroup switch className="pl-0 mt-3 align-left ml-3 d-none">
                <Row className="mr-1">
                  <Col md={9}>
                    <Label check>
                      Hibernate Tabs on Close <br />
                      <small className="text-muted">
                        Suspend tabs when the application is closed{" "}
                      </small>
                    </Label>
                  </Col>
                  <Col className="container">
                    <div className="d-flex justify-content-end">
                      <Input
                        type="switch"
                        checked={autoSave}
                        onChange={() => {
                          setAutoSave(!autoSave);
                        }}
                      />
                    </div>
                  </Col>
                </Row>
              </FormGroup>
              <FormGroup switch className="pl-0 mt-3 align-left ml-3 d-none">
                <Row className="mr-1">
                  <Col md={9}>
                    <Label check>
                      Suspend Inactive Tabs <br />
                      <small className="text-muted">
                        Suspend tabs when the application is inactive{" "}
                      </small>
                    </Label>
                  </Col>
                  <Col className="container">
                    <div className="d-flex justify-content-end">
                      <Input
                        type="switch"
                        checked={suspendTabs}
                        onChange={() => {
                          setSuspendTabs(!suspendTabs);
                        }}
                      />
                    </div>
                  </Col>
                </Row>
              </FormGroup>

              <FormGroup switch className="pl-0 mt-3 align-left ml-3">
                <Row>
                  <Col md={12}>
                    <Label check>
                      Container <br />
                      <small className="text-muted">
                        The application data, cookies and cache will be stored
                        in container{" "}
                      </small>{" "}
                      <br />
                      <small className="text-muted">
                        Space - all applications in the same space share the
                        space container{" "}
                      </small>{" "}
                      <br />
                      <small className="text-muted">
                        App - creates a new isolated container for the
                        application{" "}
                      </small>
                    </Label>
                  </Col>
                </Row>
              </FormGroup>
              <FormGroup>
                <select
                  id="workspaceSelect"
                  name="workspaceSelect"
                  className="ml-3"
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                >
                  <option value="private">App</option>
                  {
                    location === "launchpad" && (
                      <option key={workspace.id} value={workspace.id}>
                        Space
                      </option>
                    )
                  }
                </select>
              </FormGroup>

              <FormGroup className="mt-3 d-none">
                <Label
                  for="windowType"
                  className="d-flex w-100 justify-content-start ml-3"
                >
                  Open In
                </Label>
                <select
                  id="windowType"
                  name="windowType"
                  className="ml-3"
                  onChange={(e) => setWindowType(e.target.value)}
                >
                  {windowTypes.map((item) => (
                    <option key={uuidv4()} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </FormGroup>
              {windowType === WindowType.Modal && (
                <FormGroup className="mt-3 ml-3">
                  <Label
                    for="windowSize"
                    className="d-flex w-100 justify-content-start"
                  >
                    Window Size
                  </Label>
                  <select
                    id="windowSize"
                    name="windowSize"
                    value={windowSize}
                    onChange={(e) => onWindowSizeChange(e.target.value)}
                  >
                    <option value="small">Small - 1024x768</option>
                    <option value="medium">Medium - 1280x1024</option>
                    <option value="large">Large - 1920x1080</option>
                    <option value="custom">Custom</option>
                  </select>
                </FormGroup>
              )}
              <FormGroup id="windowWidth" className="d-none">
                <Label for="windowWidth">Width(px)</Label>
                <Input
                  id="windowWidth"
                  name="windowWidth"
                  placeholder=""
                  type="text"
                  value={windowWidth}
                  // @ts-expect-error
                  onChange={(e) => setWindowWidth(e.target.value)}
                />
              </FormGroup>
              <FormGroup id="windowHeight" className="d-none">
                <Label for="windowHeight">Height(px)</Label>
                <Input
                  id="windowHeight"
                  name="windowHeight"
                  placeholder=""
                  type="text"
                  value={windowHeight}
                  // @ts-expect-error
                  onChange={(e) => setWindowHeight(e.target.value)}
                />
              </FormGroup>
            </>
          )}
        </Form>
        <Button color="primary" onClick={save}>
          Add
        </Button>{" "}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default AddLaunchIconModalWindow;
