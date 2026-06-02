import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from 'is-electron';
import { v4 as uuidv4 } from 'uuid';
import log from "loglevel";
import bootstrap from 'bootstrap';

import { WorkspaceService } from "../../services/workspace";
import { workspaceActions } from "../../store/workspace-slice";
import { sessionActions } from '../../store/session-slice';
import { selectWorkspaceByName } from "../../services/workspace";
import { handleWindowOpened, handleWindowClosed } from '../../services/window';
import { openAppWindow, closeWindow } from '../../services/window'
import { newTabForActiveWindow, closeTab } from "../../util/tabs";

import AppService from "../../services/app";
import LinkService from "../../services/link";

import "./VerticalTabBar.css";
import { Alert, Button, ListGroup, ListGroupItem, Tooltip } from "reactstrap";
import {
  Container,
  Row,
  Col,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionBody,
} from "reactstrap";
import {
  Plus,
  XCircleFill,
  SquareHalf,
  PlusCircle,
  LayoutSidebar,
  Layers,
  Bookmark,
  PauseFill,
  List,
  Collection,
  Speedometer,
  ChevronRight,
} from "react-bootstrap-icons";

import { windowActions } from "../../store/window-slice";
import clsx from "clsx";


function VerticalTabBar(){
    const dispatch = useDispatch();

    const isSplitWindowsEnabled = useSelector((state: any) => state.settings.isSplitWindowsEnabled);

    const isSessionsEnabled = useSelector((state: any) => state.settings.isSessionsEnabled);

    const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

    const openWindows = useSelector((state: any) => state.session.openWindows);

    const browserWindows = useSelector((state: any) => state.session.browserWindows);

    const openTabs = useSelector((state: any) => state.session.openTabs);

    const windowTabs = useSelector((state: any) => state.session.windowTabs);

    const activeTabs = useSelector((state: any) => state.session.activeTabs);

    const activeWindow = useSelector((state: any) => state.session.activeWindow);

    const activeTabId = useSelector((state: any) => state.session.activeTabId);

    const items = useSelector((state: any) => state.workspace.items);

    const isLocal = useSelector((state: any) => state.workspace.isLocal);

    const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

    const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

    const showSidebar = useSelector((state: any) => state.window.showSidebar);

    const [inProgress, setInProgress] = useState(false);
    const [style, setStyle] = useState("list");
    const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
    const [hoveredTabScreenshot, setHoveredTabScreenshot] = useState<string | null>(null);
    const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
      const container = document.getElementById("vertical-tab-bar");
      if (container != null) {
        if(showSidebar){
          container.classList.add("vertical-tab-bar-open");
        }else{
          container.classList.remove("vertical-tab-bar-open");
        }
      }
    }, [showSidebar]);

    useEffect(() => {
      var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
      var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new Tooltip(tooltipTriggerEl)
      })
    });


    const toggleShowLaunchPad = () => {
      dispatch(sessionActions.getBackToLaunchPad({data: {
        desktopId: desktop.id,
      }}));
    }


    function handleOpenWindow(item){
        if(item.type === "browser"){
          dispatch(sessionActions.setActiveBrowserWindowId({data: item.id}));
        }
        if(item.location === "external"){
            openAppWindow(item.id, item.start_url, item.window_type, item.is_stateful, item.show_controls);
        }else{
            dispatch(sessionActions.setActiveWindow({data: item}));
        }
    }

    function handleMouseOver(tabId){
      const closeButton = document.getElementById("closeButton"+tabId);
      const pauseButton = document.getElementById("pause"+tabId);
      const chevron = document.getElementById("chevron"+tabId);

      if(closeButton != null){
        closeButton.classList.remove("d-none");
      }
      if(chevron != null){
        chevron.classList.add("d-none");
      }
      if(pauseButton != null){
        pauseButton.classList.add("d-none");
      }
    }

    function handleScreenshotPreview(tabId){
      // Set hovered tab for screenshot preview
      setHoveredTabId(tabId);

      // Retrieve screenshot from cache
      if(isElectron()){
        try {
          const screenshotKey = "screenshot-"+tabId;
          // @ts-expect-error
          const screenshot = window.electronAPI.screenshot.get(screenshotKey);
          log.debug("Screenshot retrieval:", {
            tabId: tabId,
            key: screenshotKey,
            found: screenshot ? "Yes" : "No",
            hasWebContentsId: openTabs[tabId]?.webContentsId !== undefined,
            webContentsId: openTabs[tabId]?.webContentsId
          });
          setHoveredTabScreenshot(screenshot || null);
        } catch (error) {
          log.error("Error retrieving screenshot:", error);
          setHoveredTabScreenshot(null);
        }
      }

      // Calculate position for the preview
      const tabElement = document.getElementById("tabItem"+tabId);
      if (tabElement) {
        const rect = tabElement.getBoundingClientRect();
        const verticalTabBar = document.getElementById("vertical-tab-bar");
        const tabBarRect = verticalTabBar?.getBoundingClientRect();

        const calculatedLeft = tabBarRect ? tabBarRect.right + 15 : rect.right + 15;

        // Align the top of the preview with the top of the tab item
        // Account for any parent container offsets
        const calculatedTop = rect.top;

        log.debug("Preview position:", {
          tabTop: rect.top,
          tabBottom: rect.bottom,
          tabRight: rect.right,
          tabBarRight: tabBarRect?.right,
          calculatedLeft: calculatedLeft,
          calculatedTop: calculatedTop
        });

        setPreviewPosition({
          top: calculatedTop,
          left: calculatedLeft
        });
      } else {
        log.warn("Tab element not found for ID:", tabId);
      }
    }

    function handleMouseOut(tabId){
      const closeButton = document.getElementById("closeButton"+tabId);
      const chevron = document.getElementById("chevron"+tabId);
      const pauseButton = document.getElementById("pause"+tabId);

      if(closeButton != null){
        closeButton.classList.add("d-none");
      }
      if(chevron != null){
        chevron.classList.remove("d-none");
      }
      if(pauseButton != null){
        pauseButton.classList.remove("d-none");
      }
    }

    function handleScreenshotPreviewHide(){
      // Clear screenshot preview
      setHoveredTabId(null);
      setHoveredTabScreenshot(null);
    }

    function handleCloseWindow(windowId){
      closeWindow(dispatch, sessionActions, windowId, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
    }

    function handleCloseTab(tab) {
      closeTab(tab, dispatch, openTabs, windowTabs, openWindows, browserWindows, activeWindow?.id, activeTabId, activeTabs, desktop, isExternalWindowMode, sessionActions, undefined);
    }

    function tilesTabItem(tabId){
      let tab = openTabs[tabId];
      // Use the full tab ID (including browser_ prefix if present)
      // @ts-expect-error
      const storeSS = window.electronAPI.screenshot.get("screenshot-"+tabId);
      let _ss = storeSS ? storeSS : localStorage.getItem("screenshot-"+tabId);
      let tabTitle = tab.state.title === "" ? tab.state.url.substring(0,27).concat("...") : tab.state.title.length > 27 ? tab.state.title.substring(0,27).concat("...") : tab.state.title;
      let _icon = "";
      try {
        if(tab.type === "app"){
          _icon = "./images/store/icon/"+tab.state.icon;
        }else{
          _icon = tab.state.icon;
        }
        return tab.id === activeTabId ? (
          <ListGroupItem key={uuidv4()} id={"tabItem"+tabId}>
            {}
            <div className="col-12 vertical-tab-item active rounded">
              <Container fluid>
                  <Row>
                    <Col xs={12} className="align-self-center tab-item-col">
                                            <div id={"xButton"+tab.id} className="d-flex justify-content-end mr-1">
                          <XCircleFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={12} className="align-self-center tab-item-col">
                      <div className="d-flex justify-content-center p-1 mt-1">
                        <img width={120} height={80} src={_ss} alt="" onClick={() => handleSwitchTab(tab)}/>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                      <div className="appicon d-flex justify-content-center" >
                                                <img width={16} className="launch-icon" src={_icon} alt=""/>
                      </div>
                    </Col>
                    <Col xs={8} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                        {}
                        <div className="d-flex w-100 justify-content-start">
                            <span className="tab-title w-100">{tabTitle}</span>
                        </div>
                    </Col>
                    <Col xs={2} className="align-self-center tab-item-col">
                                            <div id={"chevron"+tab.id} className="d-flex justify-content-end mr-2">
                                                <i className="fa fa-chevron-right" style={{width: 16}}> </i>
                      </div>
                    </Col>
                  </Row>
              </Container>
            </div>
          </ListGroupItem>
        ): (
          <ListGroupItem key={uuidv4()} id={"tabItem"+tabId}>
              <div className="col-12 vertical-tab-item rounded">
                <Container fluid>
                  <Row>
                    <Col xs={12} className="align-self-center tab-item-col">
                                            <div id={"closeButtonx"+tab.id} className="d-flex justify-content-end mr-1">
                          <XCircleFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
                      </div>
                    </Col>
                  </Row>
                    <Row>
                      <Col xs={12} className="align-self-center tab-item-col">
                        <div className="d-flex justify-content-center p-1 mt-1">
                          {
                            tab.sleeping ? (
                              <div className="d-flex justify-content-center sleeping-tab" onClick={() => handleSwitchTab(tab)}>
                                <Speedometer size={16} color="gray" className="align-self-center"></Speedometer>
                              </div>
                            ) : (
                              <img width={120} height={80} src={_ss} alt="" onClick={() => handleSwitchTab(tab)}/>
                            )
                          }
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                        <div className="appicon d-flex justify-content-center" >
                                                    <img width={16} className="launch-icon" src={_icon} alt=""/>
                        </div>
                      </Col>
                      <Col xs={8} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                          {}
                          <div className="d-flex w-100 justify-content-start">
                              <span className="tab-title w-100">{tabTitle}</span>
                          </div>
                      </Col>
                      <Col xs={2} className="align-self-center tab-item-col">
                        {
                          tab.sleeping && (
                                                        <div id={"pause"+tab.id} className="d-flex justify-content-end mr-2">

                            </div>
                          )
                        }
                      </Col>
                    </Row>
                </Container>
              </div>
          </ListGroupItem>
        )
      } catch (error) {
          log.error(error);
          return (
          <></>
          );
      }
    }


    function tabItem(tabId){
      let tab = openTabs[tabId];
      if(tab == null || tab === undefined) return;

      let tabTitle = tab.state.title === "" ? tab.state.url.substring(0,24).concat("...") : tab.state.title.length > 24 ? tab.state.title.substring(0,24).concat("...") : tab.state.title;
      let _icon = "";
        try {
          if(tab.type === "app"){
            _icon = tab.state.icon;
          }else{
            _icon = tab.state.icon;
          }
          return tab.id === activeTabId ? (
            <ListGroupItem key={uuidv4()} id={"tabItem"+tabId} data-bs-toggle="tooltip" data-bs-placement="right" title={tab.state.title} data-bs-custom-className="custom-tooltip">
                {}
                <div className="col-12 vertical-tab-item active">
                      <Container fluid>
                          <Row onMouseOver={() => handleMouseOver(tab.id)} onMouseOut={() => handleMouseOut(tab.id)}>
                            <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                              <div className="appicon d-flex justify-content-center" >
                                                                <img width={16} className="launch-icon" src={_icon} alt=""/>
                              </div>
                            </Col>
                            <Col xs={8} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                                {}
                                <div className="d-flex w-100 justify-content-start">
                                    <span className="tab-title w-100">{tabTitle}</span>
                                </div>
                            </Col>
                            <Col xs={2} className="align-self-center tab-item-col">
                                                            <div id={"closeButton"+tab.id} className="d-flex justify-content-end mr-2 d-none">
                                  <XCircleFill size={14} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
                              </div>
                                                            <div id={"chevron"+tab.id} className="d-flex justify-content-end mr-2">
                                                                <ChevronRight size={14} color="gray" />
                              </div>
                            </Col>
                          </Row>
                      </Container>
                  </div>
            </ListGroupItem>
          ): (
            <ListGroupItem key={uuidv4()} id={"tabItem"+tabId} data-bs-toggle="tooltip" data-bs-placement="right" title={tab.state.title} data-bs-custom-className="custom-tooltip">
              {}
              <div className="col-12 vertical-tab-item">
                <Container fluid>
                  <Row onMouseOver={() => handleMouseOver(tab.id)} onMouseOut={() => handleMouseOut(tab.id)} onMouseEnter={() => handleScreenshotPreview(tab.id)} onMouseLeave={() => handleScreenshotPreviewHide()}>
                    <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                      <div className="appicon d-flex justify-content-center p-1" >
                                                <img width={16} className="launch-icon" src={_icon} alt=""/>
                      </div>
                    </Col>
                    <Col xs={8} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                        {}
                        <div className="d-flex w-100 justify-content-start">
                            <span className="tab-title w-100">{tabTitle}</span>
                        </div>
                    </Col>
                    <Col xs={2} className="align-self-center tab-item-col">
                                            <div id={"closeButton"+tab.id} className="d-flex justify-content-end mr-2 d-none">
                          <XCircleFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
                      </div>
                     {
                       tab.sleeping && (
                                                <div id={"pause"+tab.id} className="d-flex justify-content-end mr-2">
                          <Speedometer size={16} color="gray"></Speedometer>
                        </div>
                       )
                     }
                    </Col>
                  </Row>
                </Container>
              </div>
            </ListGroupItem>
          )
      } catch (error) {
          log.error(error);
          return (
          <></>
          );
      }
    }

    function handleSwitchTab(tab){
      log.debug("handleSwitchTab", tab);
      //TODO: if tab location is external, open external window
      if(tab.location === "external"){
        if(isElectron()){
          // @ts-expect-error
          window.electronAPI.send("toMain", {
            action: "switch-to-external-tab",
            tabWindowId: tab.window,
            tabId: tab.id,
            type: tab.type,
          });
        }
      }else{
        dispatch(sessionActions.setActiveTab({data: tab}));
      }
    }

    function handleNewTab(){
      newTabForActiveWindow(dispatch, workspace, desktop, windowTabs, openTabs, activeTabs, activeWindow);
    }

    function getSortedTabs() {
      if (!windowTabs[activeWindow.id]) return [];

      return [...windowTabs[activeWindow.id]].sort((a, b) => {
        const tabA = openTabs[a];
        const tabB = openTabs[b];

        if (!tabA || !tabB) return 0;

        const createdA = tabA.created || 0;
        const createdB = tabB.created || 0;

        return createdB - createdA;
      });
    }

    function tabsMenu(){
      try {
        if(activeWindow.id !== "launchpad" && activeWindow.data.window.enableTabs){
          const sortedTabs = getSortedTabs();

          return <>
            <Container fluid className="pl-0 mt-1 d-none">
              <Row>
                <Col md={2} className="align-middle">
                  <Button color="dark" onClick={() => style === "list" ? setStyle("grid") : setStyle("list")}>
                    {
                      style === "list" ? (
                        <Collection size={16}/>
                      ):(
                        <List size={16}/>
                      )
                    }
                  </Button>
                </Col>
                <Col md={5} className="d-flex justify-content-start align-middle mt-1 ml-2 text-white">
                  <h6>Tabs</h6>
                </Col>
                <Col md={1} className="align-middle ml-3">
                  <Button color="dark" onClick={() => handleNewTab() }>
                    <PlusCircle color="white" size={16} />
                  </Button>
                </Col>
              </Row>
            </Container>
            <div className="tabs-menu-container">
              <div className="new-tab-button-fixed">
                <ListGroupItem
                  key="new-tab-button"
                  className="cursor-pointer"
                  onClick={() => handleNewTab()}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="col-12 d-flex align-items-center justify-content-center py-2">
                    <PlusCircle size={20} color="white" className="mr-2" />
                    <span className="text-white">New Tab</span>
                  </div>
                </ListGroupItem>
              </div>
              <ListGroup className="w-100 bg-dark tabs-menu-scrollable">
                {sortedTabs.map((tabId) => style === "list" ? tabItem(tabId) : tilesTabItem(tabId))}
              </ListGroup>
            </div>
          </>;
        }else{
          return(
            <></>
          )
        }
      } catch (error) {
        log.error(error);
        return(
          <></>
        )
      }

    }

    const [open, setOpen] = useState('1');
    const toggle = (id) => {
      if (open === id) {
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        setOpen();
      } else {
        setOpen(id);
      }
    };

    function toggleShowSidebar() {
      dispatch(windowActions.toggleShowSidebar({}));
    }

    return (
      <>
        <div
          className={clsx(
            "!m-0 fixed inset-0",
            "items-end justify-end",
            "bg-black/50",
            "vertical-tab-bar-overlay",
            "flex",
          )}
          id="vertical-tab-bar-overlay"
          onClick={() => toggleShowSidebar()}
          >

        </div>
        <div id="vertical-tab-bar" className="d-flex justify-content-start vertical-tabbar bg-dark w-100">

          {tabsMenu()}

        </div>

        {/* Screenshot Preview on Hover */}
        {hoveredTabId && openTabs[hoveredTabId] && (
          <div
            className="tab-screenshot-preview"
            style={{
              position: 'fixed',
              top: `${previewPosition.top}px`,
              left: `${previewPosition.left}px`,
              zIndex: 1100,
              pointerEvents: 'none',
              transform: 'translateY(0)' // Ensure no transform offset
            }}
          >
            <div className="screenshot-preview-content">
              {hoveredTabScreenshot ? (
                <img
                  src={hoveredTabScreenshot}
                  alt={openTabs[hoveredTabId]?.state?.title || 'Tab preview'}
                  className="screenshot-preview-image"
                />
              ) : (
                <div className="screenshot-preview-placeholder">
                  <p style={{color: 'white', padding: '20px'}}>Loading preview...</p>
                </div>
              )}
              <div className="screenshot-preview-title">
                {openTabs[hoveredTabId]?.state?.title || openTabs[hoveredTabId]?.state?.url}
              </div>
            </div>
          </div>
        )}
      </>
    )
}

export default VerticalTabBar;
