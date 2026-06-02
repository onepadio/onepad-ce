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
import { windowServiceActions } from "../../store/window-service-slice";

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
  WindowStack,
} from "react-bootstrap-icons";

// @ts-expect-error
import defaultIcon from '../../images/default_icon.png';

function TilesBar(){
    const dispatch = useDispatch();

    const isSplitWindowsEnabled = useSelector((state: any) => state.settings.isSplitWindowsEnabled);

    const isSessionsEnabled = useSelector((state: any) => state.settings.isSessionsEnabled);

    const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

    const openWindows = useSelector((state: any) => state.session.openWindows);

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

    useEffect(() => {
      const container = document.getElementById("vertical-tab-bar");
      if (container != null) {
        if(showSidebar){
          container.classList.add("vertical-tab-bar-open");
        }else{
          setTimeout(() => {
            container.classList.remove("vertical-tab-bar-open");
          }, 300);
        }
      }
    }, [showSidebar]);

    useEffect(() => {
      var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
      var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new Tooltip(tooltipTriggerEl)
      })
    });

    function handleMouseOver(tabId){
      let closeButton = document.getElementById("closeButton"+tabId);
      let pauseButton = document.getElementById("pause"+tabId);
      let chevron = document.getElementById("chevron"+tabId);
      closeButton.classList.remove("d-none");
      if(chevron != null){
        chevron.classList.add("d-none");
      }
      if(pauseButton != null){
        pauseButton.classList.add("d-none");
      }
    }

    function handleMouseOut(tabId){
      let closeButton = document.getElementById("closeButton"+tabId);
      let chevron = document.getElementById("chevron"+tabId);
      let pauseButton = document.getElementById("pause"+tabId);
      closeButton.classList.add("d-none");
      if(chevron != null){
        chevron.classList.remove("d-none");
      }
      if(pauseButton != null){
        pauseButton.classList.remove("d-none");
      }
    }

    function handleCloseWindow(windowId){
      closeWindow(dispatch, sessionActions, windowId, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
    }

    function handleCloseTab(tab) {
      log.debug("Active tab",activeTabId);
      log.debug("Closing tab",tab.id);
      if(windowTabs[tab.window].length === 1){
        if(tab.type === "app"){
          AppService.updateState(tab.window, {
            tabs: [],
          }).then((res) => {
            log.debug("App state updated",res);
            handleCloseWindow(tab.window);
          });
        }else if(openWindows[tab.window].type === "link"){
          LinkService.updateState(tab.window, {
            tabs: [],
          }).then((res) => {
            log.debug("updateState", res);
            handleCloseWindow(tab.window);
          }).catch((err) => {
            log.error("updateState", err);
            handleCloseWindow(tab.window);
          });
        }else{
          handleCloseWindow(tab.window);
        }

      }else{
        let tabId = tab.id;
        let _windowTabs = Object.assign([], windowTabs);

        let _updatedTabs = _windowTabs[tab.window].filter((_tabId) => _tabId !== tabId);
        _windowTabs[tab.window] = _updatedTabs;
        dispatch(
            sessionActions.setWindowTabs({
              data: _windowTabs,
            })
        );

        let _openTabs = Object.assign({}, openTabs);
        delete _openTabs[tabId];
        dispatch(
            sessionActions.setOpenTabs({
            data: _openTabs,
            })
        );

        if(tabId === activeTabId){
          log.debug("Closing active tab");
          log.debug("_updatedTabs",_updatedTabs);
          log.debug("openTabs[_updatedTabs.at(-1)]",openTabs[_updatedTabs.at(-1)]);

          let _activeTabs = Object.assign({}, activeTabs);
          _activeTabs[tab.window] = _updatedTabs.at(-1);
          dispatch(
              sessionActions.setActiveTabs({
              data: _activeTabs,
              })
          );
          handleSwitchTab(openTabs[_updatedTabs.at(-1)]);
        }

      }
      // Delete screenshot
      localStorage.removeItem("screenshot-"+tab.id);

    }

    function iconOnlyTabItem(tabId){
      let tab = openTabs[tabId];
      let _icon = localStorage.getItem("screenshot-"+tabId);
        try {
          return tab.id === activeTabId ? (
          <ListGroupItem key={uuidv4()}>
              <div className="d-flex justify-content-center p-1 mt-1 border-left border-white" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Tooltip on bottom">
                                <img width={120} height={80} src={_icon} alt="" onClick={() => handleSwitchTab(tab)} data-bs-toggle="tooltip" data-bs-placement="bottom" title="Tooltip on bottom"/>
              </div>
          </ListGroupItem>
          ): (
            <ListGroupItem key={uuidv4()}>
                <div className="d-flex justify-content-center p-1 mt-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Tooltip on bottom">
                                    <img width={120} height={80} src={_icon} alt="" onClick={() => handleSwitchTab(tab)}/>
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

      let tabTitle = tab.state.title === "" ? tab.state.url.substring(0,14).concat("...") : tab.state.title.substring(0,14).concat("...");
      let _icon = "";
        try {
          if(tab.type === "app"){
            _icon = localStorage.getItem(tab.state.icon) == null ? defaultIcon : localStorage.getItem(tab.state.icon);
          }else{
            _icon = tab.state.icon;
          }
          return tab.id === activeTabId ? (
            <ListGroupItem key={uuidv4()} id={tabId} data-bs-toggle="tooltip" data-bs-placement="right" title={tab.state.title} data-bs-custom-className="custom-tooltip">
                {}
                <div className="col-12 vertical-tab-item-active rounded">
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
                                  <XCircleFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
                              </div>
                                                            <div id={"chevron"+tab.id} className="d-flex justify-content-end mr-2">
                                                                <i className="fa fa-chevron-right" style={{width: 16}}> </i>
                              </div>
                            </Col>
                          </Row>
                      </Container>
                  </div>
            </ListGroupItem>
          ): (
            <ListGroupItem key={uuidv4()} id={tabId} data-bs-toggle="tooltip" data-bs-placement="right" title={tab.state.title} data-bs-custom-className="custom-tooltip">
              {}
              <div className="col-12 vertical-tab-item">
                <Container fluid>
                  <Row onMouseOver={() => handleMouseOver(tab.id)} onMouseOut={() => handleMouseOut(tab.id)}>
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
                          <PauseFill size={16} color="gray"></PauseFill>
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
      dispatch(sessionActions.setActiveTab({data: tab}));
    }

    function addNewTab(){
      let _url = activeWindow.data.customUrl !== undefined && activeWindow.data.customUrl !== "" ? activeWindow.data.customUrl : activeWindow.data.startUrl;
      dispatch(windowServiceActions.openNewTab({
        windowId: activeWindow.id,
        url: _url
      }));
    }

    function tabsMenu(){
      try {
        if(activeWindow.id !== "launchpad" && activeWindow.data.window.enableTabs){
          return (
            <ListGroup className="w-100 bg-dark tabs-menu mt-2">
              <ListGroupItem key="plus" >
                <Row>
                  <Col md={2} className="align-middle mt-1">
                    <WindowStack size={16}/>
                  </Col>
                  <Col md={6} className="d-flex justify-content-start align-middle mt-1">
                  <h6>Tabs</h6>
                  </Col>
                  <Col md={2} className="align-middle">
                    <Button color="dark" onClick={() => addNewTab() }>
                      <PlusCircle color="white" size={16} />
                    </Button>
                  </Col>
                </Row>
              </ListGroupItem>
              {windowTabs[activeWindow.id].map((tabId) => iconOnlyTabItem(tabId))}
            </ListGroup>
          );
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

    return (
        <div id="vertical-tab-bar" className="d-flex justify-content-start vertical-tabbar bg-dark w-100">

          {tabsMenu()}

        </div>
    )
}

export default TilesBar;
