import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import { v4 as uuidv4 } from 'uuid';

import AppService from '../../services/app';
import XAppService from '../../services/xapp';

import { Window } from '../../model/window';
import {updateWorkspaceItems} from '../../api/WorkspaceApi';
import {updateWorkspaces} from '../../services/workspace';
import {workspaceActions} from '../../store/workspace-slice';
import { modalActions } from '../../store/modal-slice';
import { appActions } from '../../store/app-slice';
import { getFavicon, getGoogleFavicon } from '../../services/favicon';

import {
  db
} from '../../repository/db'
import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionBody,
  Row,
  Col,
 } from 'reactstrap';
import Modal from "../lib/Modal";
// @ts-expect-error
import defaultIcon from '../../images/default_icon.png';
import "./EditLaunchIconModalWindow.css";

function EditLaunchIconModalWindow(props: any) {
  const dispatch = useDispatch();

  const isDesktopsEnabled = useSelector((state: any) => state.settings.isDesktopsEnabled);

  const profileId = useSelector((state: any) => state.app.profileId);

  const userId = useSelector((state: any) => state.user.id);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const items = useSelector((state: any) => state.workspace.items);

  const isLocal = useSelector((state: any) => state.workspace.isLocal);

  const selectedIcon = useSelector((state: any) => state.modal.editIconSelectedItem);

  const isEditIconModalOpen = useSelector((state: any) => state.modal.isEditIconModalOpen);

  const location = useSelector((state: any) => state.modal.location);


  const toggle = () => dispatch(modalActions.toggleEditIconModal({}));
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [startUrl, setStartUrl] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [storeId, setStoreId] = useState("");
  const [windowType, setWindowType] = useState("");
  const [isStateful, setIsStateful] = useState(0);
  const [showControls, setShowControls] = useState(0);
  const [withCustomUrl, setWithCustomUrl] = useState(false);
  const [allDesktops, setAllDesktops] = useState(false);
  const [withTabs, setWithTabs] = useState(false);
  const [windowSize, setWindowSize] = useState("fullscreen");
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(800);
  const [windowHeight, setWindowHeight] = useState(600);
  const [isIconSearchUrlEnabled, setIsIconSearchUrlEnabled] = useState(false);
  const [iconSearchUrl, setIconSearchUrl] = useState("");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [isCustomIconUrl, setIsCustomIconUrl] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);

  // Advanced accordion
  const [advancedOpen, setAdvancedOpen] = useState('');
  const toggleAdvanced = (lid: any) => {
    if (advancedOpen === lid) {
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      setAdvancedOpen();
    } else {
      setAdvancedOpen(lid);
    }
  };

  function save(){
    if (name.length < 1 || startUrl.length < 1) {
      alert("Name or url can not be empty");
      return;
    }
    let window = new Window();
    window.fullScreen = isFullScreen;
    window.enableTabs = withTabs;
    if(!isFullScreen){
      window.height = windowHeight;
      window.width = windowWidth;
    }
    let desktopId = desktop.id;
    if(allDesktops){
      desktopId="all";
    }

    let _customUrl = withCustomUrl ? customUrl : "";

    if(location === "launchpad"){
      AppService.update(selectedIcon.id, desktopId, name, startUrl, _customUrl, icon, window).then(
        (id) => {
          AppService.getAppsByWorkspaceIdAndDesktopId(workspace.id, desktop.id).then((apps) => {
            dispatch(workspaceActions.setApps({apps: apps}));
            toggle();
          });
        }
      );
    }else{
      XAppService.update(selectedIcon.id, name, startUrl, _customUrl, icon, window).then(
        (id) => {
          XAppService.getAll().then((xapps: any[]) => {
            let _xappsStore = {};

            xapps.forEach((xapp: any) => {
              _xappsStore[xapp.id] = xapp;
            });

            dispatch(appActions.setXAppsStore(_xappsStore));
            toggle();
          }).catch((error) => {
            log.debug("Error getting xapps", error);
          });
        }
      );
    }
  }

  function saveRemote(){
    log.debug("saveRemote");
    let _items = [...items];
    // update items
    const newItems = _items.map((item: any) => {
      let _item = {...item};
      if(item.id === selectedIcon.id){
        _item.name = name;
        //_item.code = code;
        _item.icon = icon;
        //_item.default_url = defaultUrl;
        _item.start_url = startUrl;
        //_item.window_type = windowType;
        //_item.is_stateful = isStateful;
        //_item.show_controls = showControls;
      }
      return _item;
    });

    updateWorkspaceItems(userId, workspace.id, newItems).then(
      (response) => {
        dispatch(workspaceActions.setItems({items: newItems}));
        updateWorkspaces(userId, dispatch);
        toggle();
      }
    );

  }

  function deleteIcon(){
    if(location === "launchpad"){
      AppService.delete(selectedIcon.id).then(
        (id) => {
          AppService.getAppsByWorkspaceIdAndDesktopId(workspace.id, desktop.id).then((apps) => {
           dispatch(workspaceActions.setApps({apps: apps}));
            toggle();
          });
        }
      );
    }else {
      XAppService.delete(selectedIcon.id).then(
        (id) => {
          let _xappIds = JSON.parse(localStorage.getItem("xappIds-"+profileId)) || [];
          let _xappIdsNew = _xappIds.filter((xappId: any) => {
            return xappId !== selectedIcon.id;
          });
          localStorage.setItem("xappIds", JSON.stringify(_xappIdsNew));
          XAppService.getAll().then((xapps: any[]) => {
            let _xappsStore = {};

            xapps.forEach((xapp: any) => {
              _xappsStore[xapp.id] = xapp;
            });

            dispatch(appActions.setXAppsStore(_xappsStore));
            toggle();
          }).catch((error) => {
            log.debug("Error getting xapps", error);
          });
        }
      );
    }
  }

  function deleteLocal(){

    /* deleteApp(lid).then(
      () => {
        toggle();
      }
    ); */
  }

  function deleteRemote(){
    log.debug("deleteRemote");
    let _items = [...items];
    // update items
    const newItems = _items.filter((item: any) => {
      return item.id !== selectedIcon.id;
    });

    updateWorkspaceItems(userId, workspace.id, newItems).then(
      (response) => {
        dispatch(workspaceActions.setItems({items: newItems}));
        updateWorkspaces(userId, dispatch);
        toggle();
      }
    );
  }

  function reset(){
    setName(selectedIcon.data.name);
    setIcon(selectedIcon.data.icon);
    setStartUrl(selectedIcon.data.startUrl);
    setCustomUrl(selectedIcon.data.customUrl);
    if(selectedIcon.data.customUrl !== ""){
      setWithCustomUrl(true);
    }
    setIsFullScreen(selectedIcon.data.window.fullScreen);
    if(selectedIcon.data.window.fullScreen){
      setWindowSize("fullscreen");
    }else{
      setWindowSize("fixed");
    }
    setWithTabs(selectedIcon.data.window.enableTabs);
    setWindowWidth(selectedIcon.data.window.width);
    setWindowHeight(selectedIcon.data.window.height);

    if(selectedIcon.desktop === "all"){
      setAllDesktops(true);
    }
    setStoreId(selectedIcon.storeId);
    setIcon(selectedIcon.data.icon);
    setIsIconSearchUrlEnabled(false);
    setIconSearchUrl("");
    setIsCustomIconUrl(false);
    setCustomIconUrl("");
    setIconFile(null);
  }

  useEffect(() => {
    if(selectedIcon.data === null || selectedIcon.data === undefined){
      return;
    }
    reset();
  }, [selectedIcon]);

  function onClosed(){
    toggle();
    setName("");
    setIcon("");
    setStartUrl("");
    setCustomUrl("");
    setWithCustomUrl(false);
    setIsFullScreen(true);
    setWindowSize("fullscreen");
    setWithTabs(false);
    setWindowWidth(800);
    setWindowHeight(600);
    setAllDesktops(false);
    setIsIconSearchUrlEnabled(false);
    setIconSearchUrl("");
    setIsCustomIconUrl(false);
    setCustomIconUrl("");
    setIconFile(null);
  }


  function onWindowSizeChange(value: any) {
    const widthField = document.getElementById("windowWidth");
    const heightField = document.getElementById("windowHeight");
    setWindowSize(value);
    if(value === "fullscreen"){
      setIsFullScreen(true);
      setWindowHeight(0);
      setWindowWidth(0);
      widthField.classList.add("d-none");
      heightField.classList.add("d-none");
    }else{
      setIsFullScreen(false);
      widthField.classList.remove("d-none");
      heightField.classList.remove("d-none");
    }
  }

  useEffect(() => {
    log.debug("withCustomUrl", withCustomUrl);
    const curl = document.getElementById("edit-custom-url");
    if(curl == null) return;
    if(withCustomUrl){
      curl.classList.remove("d-none");
    }else{
      curl.classList.add("d-none");
    }
  }, [withCustomUrl]);

  useEffect(() => {
    if(isEditIconModalOpen){
      reset();
    }

  }, [isEditIconModalOpen]);

  useEffect(() => {
    const iconSearchUrlInput = document.getElementById("editIcon-iconSearchUrlInput");
    if(iconSearchUrlInput == null) return;
    if(isIconSearchUrlEnabled){
      iconSearchUrlInput.classList.remove("d-none");
    }else{
      iconSearchUrlInput.classList.add("d-none");
    }
  }, [isIconSearchUrlEnabled]);

  useEffect(() => {
    const customIconUrlInput = document.getElementById("editIcon-customIconUrlInput");
    if(customIconUrlInput == null) return;
    if(isCustomIconUrl){
      customIconUrlInput.classList.remove("d-none");
    }else{
      customIconUrlInput.classList.add("d-none");
    }
  }, [isCustomIconUrl]);

  useEffect(() => {
    // Update icon based on icon search URL or custom icon URL
    if (isCustomIconUrl && customIconUrl.length > 0) {
      setIcon(customIconUrl);
    } else if (isIconSearchUrlEnabled && iconSearchUrl.length > 0) {
      try {
        const searchUrl = new URL(iconSearchUrl);
        if (searchUrl.protocol === "http:" || searchUrl.protocol === "https:") {
          setIcon(getGoogleFavicon(searchUrl.toString()));
        }
      } catch (error) {
        log.debug("Invalid icon search URL:" + iconSearchUrl);
      }
    }
  }, [iconSearchUrl, isIconSearchUrlEnabled, customIconUrl, isCustomIconUrl]);

  function onIconSearchUrlSwitchChange() {
    setIsIconSearchUrlEnabled(!isIconSearchUrlEnabled);
    if (!isIconSearchUrlEnabled) {
      setIsCustomIconUrl(false);
    }
  }

  function onCustomIconUrlSwitchChange() {
    setIsCustomIconUrl(!isCustomIconUrl);
    if (!isCustomIconUrl) {
      setIsIconSearchUrlEnabled(false);
    }
  }

  function onIconLoadError(e: any) {
    e.target.src = defaultIcon;
  }

  function handleIconFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setIcon(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div>
      <Modal id={uuidv4()} heading="Edit App" className="edit-app-modal" show={isEditIconModalOpen} onClose={() => onClosed()} {...props}>
        <Form>
          <Row>
            <Col md={3} className="mt-4 d-flex justify-content-center">
              <FormGroup>
                <Label for="iconImg"></Label>
                <img
                  id="iconImg"
                  src={icon || defaultIcon}
                  width={48}
                  height={48}
                  onError={(e) => onIconLoadError(e)}
                  alt="App icon"
                />
              </FormGroup>
            </Col>
            <Col md={9}>
              <FormGroup className='align-left'>
                <Label for="appName">
                  Name
                </Label>
                <Input
                  id="appName"
                  name="appName"
                  placeholder=""
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormGroup>
              <FormGroup className='align-left'>
                <Label for="startUrl">
                  Web Address
                </Label>
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
          <FormGroup switch className='pl-0 align-left'>
            <Row className="mr-1">
              <Col md={9}>
                <Label check>
                  Custom Web Address
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
          <FormGroup id="edit-custom-url" className='d-none'>
            <Input
              id="customUrl"
              name="customUrl"
              placeholder="https://"
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
          </FormGroup>
          {location !== "launchpad" && (
            <>
              <FormGroup switch className='pl-0 align-left mt-3'>
                <Row className="mr-1">
                  <Col md={9}>
                    <Label check>
                      Icon from another web address
                    </Label>
                  </Col>
                  <Col className="container">
                    <div className="d-flex justify-content-end">
                      <Input
                        type="switch"
                        checked={isIconSearchUrlEnabled}
                        onChange={() => onIconSearchUrlSwitchChange()}
                      />
                    </div>
                  </Col>
                </Row>
              </FormGroup>
              <FormGroup id="editIcon-iconSearchUrlInput" className="d-none">
                <Input
                  id="iconSearchUrl"
                  name="iconSearchUrl"
                  placeholder="ex. https://google.com"
                  type="text"
                  value={iconSearchUrl}
                  onChange={(e) => setIconSearchUrl(e.target.value)}
                />
              </FormGroup>
              <FormGroup switch className='pl-0 align-left'>
                <Row className="mr-1">
                  <Col md={9}>
                    <Label check>
                      Custom Icon URL
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
              <FormGroup id="editIcon-customIconUrlInput" className="d-none">
                <Input
                  id="customIconUrl"
                  name="customIconUrl"
                  placeholder="https://example.com/icon.png"
                  type="text"
                  value={customIconUrl}
                  onChange={(e) => setCustomIconUrl(e.target.value)}
                />
              </FormGroup>
              <FormGroup className='align-left'>
                <Label for="iconFile">
                  Upload Custom Icon
                </Label>
                <Input
                  id="iconFile"
                  name="iconFile"
                  type="file"
                  accept="image/*"
                  onChange={handleIconFileChange}
                />
              </FormGroup>
            </>
          )}
          {
            isDesktopsEnabled && (
              <FormGroup switch className='pl-0 mt-3 align-left'>
                <Row className="mr-1">
                  <Col md={9}>
                    <Label check>
                      All Desktops
                    </Label>
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
            )
          }
          <Accordion className='d-none' flush open={advancedOpen} toggle={toggleAdvanced}>
            <AccordionItem className='mt-3'>
              <AccordionHeader targetId="1">Window</AccordionHeader>
              <AccordionBody accordionId="1">
              <FormGroup className='align-left'>
                <select id="windowSize" name="windowSize" value={windowSize} onChange={(e) => onWindowSizeChange(e.target.value)}>
                  <option value="fullscreen">FullScreen</option>
                  <option value="fixed">Fixed</option>
                </select>
              </FormGroup>
              <FormGroup id="windowWidth" className='d-none'>
                <Label for="windowWidth">
                  Width(px)
                </Label>
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
              <FormGroup id="windowHeight" className='d-none'>
                <Label for="windowHeight">
                  Height(px)
                </Label>
                <Input
                  id="windowHeight"
                  name="windowHeight"
                  placeholder=""
                  type="text"
                  value={windowWidth}
                  // @ts-expect-error
                  onChange={(e) => setWindowHeight(e.target.value)}
                />
              </FormGroup>
              </AccordionBody>
            </AccordionItem>
            <AccordionItem>
              <AccordionHeader targetId="2">Controls</AccordionHeader>
              <AccordionBody accordionId="2">
                <FormGroup switch className='pl-0 mt-2 align-left'>
                  <Row className="mr-1">
                    <Col md={9}>
                      <Label check>
                        Tabs
                      </Label>
                    </Col>
                    <Col className="container">
                      <div className="d-flex justify-content-end">
                        <Input
                          type="switch"
                          checked={withTabs}
                          onChange={() => {
                            setWithTabs(!withTabs);
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </FormGroup>
              </AccordionBody>
            </AccordionItem>
          </Accordion>
        </Form>
        <br /> <br />
        <Button color="primary" onClick={() => save() }>
          Save
        </Button>{' '}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default EditLaunchIconModalWindow;
