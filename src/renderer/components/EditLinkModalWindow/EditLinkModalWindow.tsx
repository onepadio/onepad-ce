import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from 'uuid';
import log from "loglevel";

import { Window } from '../../model/window';

import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";

import { updateWorkspaces } from "../../services/workspace";
import { updateWorkspaceItems } from "../../api/WorkspaceApi";
import {setItem, getItem} from '../../services/persist';
import { LinkService } from "../../services/link";
import { getFavicon, getGoogleFavicon } from "../../services/favicon";

// @ts-expect-error
import { db, saveApp } from "../../repository/db";
import { windowTypes, openWindowForIconSearch } from "../../services/window";
import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionBody,
} from "reactstrap";
import Modal from "../lib/Modal";

import { Steps, Hints } from 'intro.js-react';
// @ts-expect-error
import defaultIcon from '../../images/default_icon.png'
import * as Icon from 'react-feather';
import clsx from "clsx";
import "./EditLinkModalWindow.css";

function EditLinkModalWindow(props: any) {
  const dispatch = useDispatch();
  
  const isDesktopsEnabled = useSelector((state: any) => state.settings.isDesktopsEnabled);

  
  const userId = useSelector((state: any) => state.user.id);
  
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  
  const category = useSelector((state: any) => state.workspace.selectedCategory);
  
  const items = useSelector((state: any) => state.workspace.items);
  
  const isLocal = useSelector((state: any) => state.workspace.isLocal);

  
  const selectedIcon = useSelector((state: any) => state.modal.editIconSelectedItem);
  
  const isEditLinkModalOpen = useSelector((state: any) => state.modal.isEditLinkModalOpen);
  // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
  const toggleEditLinkModal = () => dispatch(modalActions.toggleEditLinkModal());


  // Advanced accordion
  const [advancedOpen, setAdvancedOpen] = useState("");
  const toggleAdvanced = (id: any) => {
    if (advancedOpen === id) {
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      setAdvancedOpen();
    } else {
      setAdvancedOpen(id);
    }
  };
  const[hasLoaded, setHasLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [startUrl, setStartUrl] = useState("");
  const [isIconSearchUrlEnabled, setIsIconSearchUrlEnabled] = useState(false);
  const [iconSearchUrl, setIconSearchUrl] = useState("");
  const [icon, setIcon] = useState(defaultIcon);
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [isCustomIconUrl, setIsCustomIconUrl] = useState(false);
  const [allDesktops, setAllDesktops] = useState(false);
  const [withTabs, setWithTabs] = useState(false);
  const [windowSize, setWindowSize] = useState("fullscreen");
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(800);
  const [windowHeight, setWindowHeight] = useState(600)

  const [availableIcons, setAvailableIcons] = useState([]);
  

  function save() {
    if (title.length === 0 || startUrl.length === 0) {
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

    LinkService.update(selectedIcon.id, desktopId, "links", title, startUrl, icon, window).then(
      (id) => {
        log.debug("Saved link with id:" + id);
        LinkService.getLinksByWorkspaceIdAndDesktopId(workspace.id, desktop.id).then((links) => {
          dispatch(workspaceActions.setLinks({ links: links }));
          toggleEditLinkModal();
        });
      }
    );
  }

  function onIconLoadError(error: any) {
    log.debug("Errror:" + error);
    setIcon("");
  }

  function load(){
    if(selectedIcon.data === null || selectedIcon.data === undefined){
      return;
    }
    log.debug("Resetting edit link modal",selectedIcon);
    setIcon(selectedIcon.data.icon);
    setStartUrl(selectedIcon.data.startUrl);
    setTitle(selectedIcon.data.title);
    setAllDesktops(selectedIcon.desktop === "all");
    setWithTabs(selectedIcon.data.window.enableTabs);
    setIsFullScreen(selectedIcon.data.window.fullScreen);
    setWindowSize(selectedIcon.data.window.fullScreen ? "fullscreen" : "fixed");
    setWindowWidth(selectedIcon.data.window.width);
    setWindowHeight(selectedIcon.data.window.height);
  }

  useEffect(() => {
    if(isEditLinkModalOpen){
      load();
    }
  }, [selectedIcon, isEditLinkModalOpen]);

  function validURL(str: any) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }

  useEffect(() => {
    if(isIconSearchUrlEnabled && isCustomIconUrl){
      setIsCustomIconUrl(false);
    }
    const iconSearchUrlField = document.getElementById("editLink-iconSearchUrlInput");
    if(isIconSearchUrlEnabled){
      iconSearchUrlField.classList.remove("d-none");
    }else{
      iconSearchUrlField.classList.add("d-none");
    }
    setIconSearchUrl(startUrl);
  },[isIconSearchUrlEnabled]);

  useEffect(() => {
    log.debug("Icon search url switch changed ", isCustomIconUrl);
    if(isCustomIconUrl && isIconSearchUrlEnabled){
      setIsIconSearchUrlEnabled(false);
    }
    const customIconUrlField = document.getElementById("editLink-customIconUrlInput");
    if(isCustomIconUrl){
      customIconUrlField.classList.remove("d-none");
    }else{
      customIconUrlField.classList.add("d-none");
    }
  },[isCustomIconUrl]);

  useEffect(() => {
    if(!hasLoaded) {
      setHasLoaded(true);
    }else{
      let searchUrl = isIconSearchUrlEnabled ? (iconSearchUrl.length > 0 ? iconSearchUrl : "") : startUrl;
      try {
        if(searchUrl.length > 0 && validURL(searchUrl)){
          log.debug("Valid URL:" + searchUrl);
          //setIconSearchUrl(searchUrl);
          if(isCustomIconUrl && customIconUrl.length > 0){
            setIcon(customIconUrl);
          }else{
            setIcon(getGoogleFavicon(searchUrl));
          }
        }
      } catch (error) {
        log.debug("Invalid URL:" + searchUrl);
      }
    }
  }, [startUrl, iconSearchUrl , isIconSearchUrlEnabled, customIconUrl, isCustomIconUrl]);

  useEffect(() => {

  }, [startUrl]);

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

  function deleteLink(){
    LinkService.delete(selectedIcon.id).then(() => {
      LinkService.getLinksByWorkspaceIdAndDesktopId(workspace.id, desktop.id).then((links) => {
        dispatch(workspaceActions.setLinks({ links: links }));
        toggleEditLinkModal();
      });
    });
  }

  function onIconSearchUrlSwitchChange() {
    setIsIconSearchUrlEnabled(!isIconSearchUrlEnabled);
  }

  function onCustomIconUrlSwitchChange() {
    setIsCustomIconUrl(!isCustomIconUrl);
  }

  function onModalClose(){
    toggleEditLinkModal();
    setIcon("");
    setStartUrl("");
    setTitle("");
    setIsIconSearchUrlEnabled(false);
    setIsCustomIconUrl(false);
    setIconSearchUrl("");
    setCustomIconUrl("");
    setHasLoaded(false);
  }

  return (
    <>
      {}
      <div className="addSiteButton">
        <div>
        <Modal id={uuidv4()} heading="Edit Link" className="edit-app-modal" show={isEditLinkModalOpen} onClose={() => onModalClose()} {...props}>
            <Form>
              <Input
                id="defaultUrl"
                name="defaultUrl"
                placeholder=""
                type="hidden"
                value={startUrl}
              />
              <Row>
                <Col md={3} className="mt-4 d-flex justify-content-center">
                  <FormGroup>
                    <Label for="iconImg"></Label>
                        <img
                          id="iconImg"
                          src={icon}
                          width={32}
                          height={32}
                          onError={(e) => onIconLoadError(e)}
                        ></img>
                  </FormGroup>
                </Col> 
                <Col md={9}>
                  <FormGroup className="align-left">
                    <Label for="startUrl">
                      Web Address (ex. https://google.com)
                    </Label>
                    <Input
                      id="startUrl"
                      name="startUrl"
                      placeholder=""
                      type="text"
                      value={startUrl}
                      onChange={(e) => setStartUrl(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className="align-left">
                    <Label for="appName">Title</Label>
                    <Input
                      id="appName"
                      name="appName"
                      placeholder=""
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup switch className="pl-0 align-left">
                    <Row className="mr-1">
                      <Col id="addLinkFetchIcon" md={9}>
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
                  <FormGroup id="editLink-iconSearchUrlInput" className="d-none">
                    <Input
                      id="iconSearchUrl"
                      name="iconSearchUrl"
                      placeholder="ex. https://google.com"
                      type="text"
                      value={iconSearchUrl}
                      onChange={(e) => setIconSearchUrl(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup switch className="pl-0 align-left d-none">
                    <Row className="mr-1">
                      <Col id="addLinkCustomIcon" md={9}>
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
                  <FormGroup id="editLink-customIconUrlInput" className="d-none">
                    <Input
                      id="customIconUrl"
                      name="customIconUrl"
                      placeholder=""
                      type="text"
                      value={customIconUrl}
                      onChange={(e) => setCustomIconUrl(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                
              </Row>
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
              <Accordion flush open={advancedOpen} toggle={toggleAdvanced} className='d-none'>
                <AccordionItem className='mt-3'>
                  <AccordionHeader targetId="1">Window</AccordionHeader>
                  <AccordionBody accordionId="1">
                  <FormGroup className="align-left">
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
          
            <Button color="primary" onClick={save}>
              Save
            </Button>{" "}
            <Button color="secondary" onClick={toggleEditLinkModal}>
              Cancel
            </Button>
        </Modal>
        </div>
      </div>
    </>
  );
}

export default EditLinkModalWindow;
