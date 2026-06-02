import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from 'uuid';
import log from "loglevel";

import { Window } from '../../model/window';

import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";
import { appActions } from "../../store/app-slice";

import { updateWorkspaces } from "../../services/workspace";
import { updateWorkspaceItems } from "../../api/WorkspaceApi";
import { LinkService } from "../../services/link";
import XAppService from "../../services/xapp";
import { getGoogleFavicon } from "../../services/favicon";

import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
} from "reactstrap";
import Modal from "../lib/Modal";

import { Steps, Hints } from 'intro.js-react';
import defaultIcon from '../../images/default_icon.png';
import "./AddLinkModalWindow.css";

function AddLinkModalWindow(props: any) {
  const dispatch = useDispatch();

  const isDesktopsEnabled = useSelector((state: any) => state.settings.isDesktopsEnabled);

  const profileId = useSelector((state: any) => state.app.profileId);

  const userId = useSelector((state: any) => state.user.id);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const category = useSelector((state: any) => state.workspace.selectedCategory);

  const items = useSelector((state: any) => state.workspace.items);

  const isLocal = useSelector((state: any) => state.workspace.isLocal);

  const selectedCategory = useSelector((state: any) => state.modal.selectedCategory);

  const location = useSelector((state: any) => state.modal.location);

  const isAddLinkModalOpen = useSelector((state: any) => state.modal.isAddLinkModalOpen);

  const addLinkModalData = useSelector((state: any) => state.modal.addLinkModalData);
  const toggleAppStore = () => {
        dispatch(modalActions.toggleAppStore({}));
    }

  // Advanced accordion
  const [advancedOpen, setAdvancedOpen] = useState("");
  const toggleAdvanced = (id: any) => {
    if (advancedOpen === id) {
      setAdvancedOpen("");
    } else {
      setAdvancedOpen(id);
    }
  };

  const [title, setTitle] = useState("");
  const [startUrl, setStartUrl] = useState("https://");
  const [isIconSearchUrlEnabled, setIsIconSearchUrlEnabled] = useState(false);
  const [iconSearchUrl, setIconSearchUrl] = useState("");
  const [icon, setIcon] = useState(defaultIcon);
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [isCustomIconUrl, setIsCustomIconUrl] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [allDesktops, setAllDesktops] = useState(true);
  const [withTabs, setWithTabs] = useState(true);
  const [windowSize, setWindowSize] = useState("fullscreen");
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(800);
  const [windowHeight, setWindowHeight] = useState(600);
  const [showNavbar, setShowNavbar] = useState(true);

  const [availableIcons, setAvailableIcons] = useState([]);

  const [stepsEnabled, setStepsEnabled] = useState(false);
  const [hintsEnabled, setHintsEnabled] = useState(false);
  const [initialStep, setInitialStep] = useState(0);
  const toggleHints = () => setHintsEnabled(!hintsEnabled);
  const [steps, setSteps] = useState([]);


  function save() {
    if (title.length == 0 || startUrl.length == 0) {
      alert("Name or url can not be empty");
      return;
    }
    let window = new Window();
    window.fullScreen = isFullScreen;
    window.enableTabs = withTabs;
    window.showNavbar = showNavbar;
    if(!isFullScreen){
      window.height = windowHeight;
      window.width = windowWidth;
    }

    let desktopId = desktop.id;
    if(allDesktops){
      desktopId="all";
    }

    // Check if we're adding to favourites category AND location is xapps
    // Only save to xapps if explicitly coming from favourites context
    if (selectedCategory === "favourites" && location === "xapps") {
      // Save as xapp (favourite app)
      XAppService.save(
        title,           // name
        startUrl,        // startUrl
        "",              // customUrl
        "",              // storeId
        icon,            // icon
        window,          // window
        profileId,       // profileId
        true,            // autoSave
        true             // suspendTabs
      ).then((id) => {
        log.debug("Saved xapp with id:" + id);

        // Update xapps in store
        XAppService.getAllByProfileId(profileId).then((xapps: any) => {
          dispatch(appActions.setXApps(xapps.reverse() || []));
          let _xappsStore: any = {};
          let _xappIds: any = [];

          xapps.forEach((xapp: any) => {
            _xappsStore[xapp.id] = xapp;
            _xappIds.push(xapp.id);
          });

          // Update localStorage with new xapp
          let existingIds = JSON.parse(localStorage.getItem("xappIds-" + profileId) || "[]");
          if (!existingIds.includes(id)) {
            existingIds.push(id);
            localStorage.setItem("xappIds-" + profileId, JSON.stringify(existingIds));
          }

          dispatch(appActions.setXAppsStore(_xappsStore));
          toggleAddLinkModal();
        }).catch((error) => {
          log.error("Error getting xapps", error);
          toggleAddLinkModal();
        });
      }).catch((error) => {
        log.error("Error saving xapp", error);
        alert("Error saving favourite app: " + error);
      });
    } else {
      // Save as regular link
      LinkService.save(workspace.id, desktopId, "links", title, startUrl, icon, window).then(
        (id) => {
          log.debug("Saved link with id:" + id);
          LinkService.getLinksByWorkspaceIdAndDesktopId(workspace.id, desktop.id).then((links) => {
            dispatch(workspaceActions.setLinks({ links: links }));
            toggleAddLinkModal();
          });
        }
      );
    }
  }

  function saveRemote() {
    log.debug("Saving remote...");
    let uuid = uuidv4();
    let _items = [...items];

    updateWorkspaceItems(userId, workspace.id, _items).then(
      (response) => {
        dispatch(workspaceActions.setItems({ items: _items }));
        updateWorkspaces(userId, dispatch);
        toggleAddLinkModal();
      }
    );
  }

  function onIconLoadError(error: any) {
    log.debug("Errror:" + error);
    setIcon("");
  }

  function toggleAddLinkModal(){
    init();
    dispatch(modalActions.toggleAddLinkModal({
      data: {
        url: "https://",
        title: "",
      }
    }));
  }

  function init() {
    setIcon(defaultIcon);
    setStartUrl("https://");
    setTitle("");
    setIsIconSearchUrlEnabled(false);
    setIsCustomIconUrl(false);
    setCustomIconUrl("");
    setIconFile(null);
  }

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
    let searchUrl = isIconSearchUrlEnabled ? iconSearchUrl : startUrl;
    try {
      if(validURL(searchUrl)){
        log.debug("Valid URL:" + searchUrl);
        if(isCustomIconUrl){
          setIcon(customIconUrl);
        }else{
          setIcon(getGoogleFavicon(searchUrl));
        }
      }
    } catch (error) {
      log.debug("Invalid URL:" + searchUrl);
    }
  }, [startUrl, iconSearchUrl , isIconSearchUrlEnabled, customIconUrl, isCustomIconUrl]);

  useEffect(() => {
    if(isAddLinkModalOpen){
      if(localStorage.getItem("add-link-intro") !== "true"){
        setSteps(
          [
            {
              title: "Add Link",
              element: ".add-link-modal",
              intro: "Welcome to Add Link window. You can add a link to your workspace by using this window.",
            },
            {
              title: "Link",
              element: "#addLinkStartUrl",
              intro: "Step-1: Enter the link you would like to open when you click on the icon. This can be the login page or the home page of the website.",
            },
            {
              title: "Title",
              element: "#addLinkAppName",
              intro: "Step-2: Enter a name to be displayed on the icon of the link. This can be the name of the website or the name of the application.",
            },
            {
              title: "Fetch Icon From Custom URL",
              element: "#addLinkFetchIcon",
              intro: "If the icon is not loaded automatically, you can enter a custom url to load the icon. This can be the url of the another website.",
            },
            {
              title: "Custom Icon URL",
              element: "#addLinkCustomIcon",
              intro: "If the icon is still not loaded automatically, you can enter a custom url for the icon.",
            },
          ]
        );
        setStepsEnabled(true);
      }else{
        setStepsEnabled(false);
      }
      setStartUrl(addLinkModalData.url);
      setTitle(addLinkModalData.title);
    }
  }, [isAddLinkModalOpen, addLinkModalData]);

  function onExit() {
    setStepsEnabled(false);
    localStorage.setItem("add-link-intro", "true");
  };

  function onWindowSizeChange(value: any) {
    const widthField = document.getElementById("ww");
    const heightField = document.getElementById("wh");
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

  function onIconSearchUrlSwitchChange() {
    log.debug("Icon search url switch changed ", isIconSearchUrlEnabled);
    const iconSearchUrlField = document.getElementById("iconSearchUrlInput");
    if(!isIconSearchUrlEnabled){
      iconSearchUrlField.classList.remove("d-none");
    }else{
      iconSearchUrlField.classList.add("d-none");
    }
    setIsIconSearchUrlEnabled(!isIconSearchUrlEnabled);
  }

  function onCustomIconUrlSwitchChange() {
    log.debug("Custom icon url switch changed ", isCustomIconUrl);
    const customIconUrlField = document.getElementById("customIconUrlInput");
    if(!isCustomIconUrl){
      customIconUrlField.classList.remove("d-none");
    }else{
      customIconUrlField.classList.add("d-none");
    }
    setIsCustomIconUrl(!isCustomIconUrl);
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
    <>
      <Steps
        enabled={stepsEnabled}
        steps={steps}
        initialStep={initialStep}
        onExit={onExit}
      />
      <div className="addSiteButton">
        <div>
        <Modal id={uuidv4()} heading="Add Link" className="add-link-modal" show={isAddLinkModalOpen}  onClose={() => toggleAddLinkModal()}>
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
                      id="addLinkStartUrl"
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
                      id="addLinkAppName"
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
                  <FormGroup id="iconSearchUrlInput" className="d-none">
                    <Input
                      id="iconSearchUrl"
                      name="iconSearchUrl"
                      type="text"
                      value={iconSearchUrl}
                      onChange={(e) => setIconSearchUrl(e.target.value)}
                      placeholder="ex. https://google.com"
                    />
                  </FormGroup>
                  <FormGroup switch className="pl-0 align-left d-none">
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
                </Col>
              </Row>

              {
                isDesktopsEnabled && (
                  <FormGroup switch className='pl-0 mt-3'>
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

              <FormGroup className="align-left text-white d-none">
                <Label for="windowSize">
                  Window
                </Label>
                <select id="windowSize" name="windowSize" value={windowSize} onChange={(e) => onWindowSizeChange(e.target.value)}>
                  <option value="fullscreen">Internal FullScreen</option>
                  <option value="fixed">External Fixed</option>
                </select>
              </FormGroup>
              <FormGroup id="ww" className='d-none align-left'>
                <Label for="windowWidth">
                  Width(px)
                </Label>
                <Input
                  id="windowWidthInput"
                  name="windowWidth"
                  placeholder=""
                  type="text"
                  value={windowWidth}
                  onChange={(e) => setWindowWidth(Number(e.target.value))}
                />
              </FormGroup>
              <FormGroup id="wh" className='d-none align-left'>
                <Label for="windowHeight">
                  Height(px)
                </Label>
                <Input
                  id="windowHeightInput"
                  name="windowHeight"
                  placeholder=""
                  type="text"
                  value={windowWidth}
                  // @ts-expect-error
                  onChange={(e) => setWindowHeight(e.target.value)}
                />
              </FormGroup>
              <FormGroup switch className='pl-0 mt-2 align-left d-none'>
                <Row className="mr-1">
                  <Col md={9}>
                    <Label check>
                      NavBar
                    </Label>
                  </Col>
                  <Col className="container">
                    <div className="d-flex justify-content-end">
                      <Input
                        type="switch"
                        checked={showNavbar}
                        onChange={() => {
                          setShowNavbar(!showNavbar);
                        }}
                      />
                    </div>
                  </Col>
                </Row>
              </FormGroup>
              <FormGroup switch className='pl-0 mt-2 align-left d-none'>
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
            </Form>
            <br/><br/>
            <Button color="primary" onClick={save}>
              Add
            </Button>{" "}
            <Button color="secondary" onClick={toggleAddLinkModal}>
              Cancel
            </Button>
        </Modal>
        </div>
      </div>
    </>
  );
}

export default AddLinkModalWindow;
