import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from 'uuid';
import log from "loglevel";

import { sessionActions } from '../../store/session-slice';
import { openAppWindow, closeWindow } from '../../services/window'

import "../TabsVerticalBar/VerticalTabBar.css";
import { Button, ListGroup, ListGroupItem } from "reactstrap";
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
  XCircleFill,
  PlusCircle,
} from "react-bootstrap-icons";

// @ts-expect-error
import defaultIcon from '../../images/default_icon.png';

function BookmarkSideMenu(){
    const dispatch = useDispatch();

    const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

    const openWindows = useSelector((state: any) => state.session.openWindows);

    const openTabs = useSelector((state: any) => state.session.openTabs);

    const windowTabs = useSelector((state: any) => state.session.windowTabs);

    const activeTabs = useSelector((state: any) => state.session.activeTabs);

    const activeWindow = useSelector((state: any) => state.session.activeWindow);

    const activeTabId = useSelector((state: any) => state.session.activeTabId);

    const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

    const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

    const showSidebar = useSelector((state: any) => state.window.showSidebar);

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

    function handleMouseOver(tabId: any){
      let closeButton = document.getElementById("closeButton"+tabId);
      let chevron = document.getElementById("chevron"+tabId);
      closeButton.classList.remove("d-none");
      if(chevron != null){
        chevron.classList.add("d-none");
      }
    }

    function handleMouseOut(tabId: any){
      let closeButton = document.getElementById("closeButton"+tabId);
      let chevron = document.getElementById("chevron"+tabId);
      closeButton.classList.add("d-none");
      if(chevron != null){
        chevron.classList.remove("d-none");
      }
    }

    function handleCloseWindow(windowId: any){
      closeWindow(dispatch, sessionActions, windowId, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
    }

    function handleCloseTab(tab: any) {
      log.debug("Active tab",activeTabId);
      log.debug("Closing tab",tab.id);
      if(windowTabs[tab.window].length === 1){
        handleCloseWindow(tab.window);
        return;
      }

      let tabId = tab.id;
      let _windowTabs = Object.assign([], windowTabs);

      let _updatedTabs = _windowTabs[tab.window].filter((_tabId: any) => _tabId !== tabId);
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

    function iconOnlyTabItem(tabId: any){
      let tab = openTabs[tabId];
      let _icon = "";
        try {
          if(tab.type === "app"){
            _icon = localStorage.getItem(tab.state.icon) == null ? defaultIcon : localStorage.getItem(tab.state.icon);
          }else{
            _icon = tab.state.icon;
          }
          return tab.id === activeTabId ? (
          <ListGroupItem key={uuidv4()}>
              <div className="appicon d-flex justify-content-center p-1 mt-1 border-bottom border-white" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Tooltip on bottom">
                {}
                <img width={24} className="launch-icon" src={_icon} alt="" onClick={() => handleSwitchTab(tab)} data-bs-toggle="tooltip" data-bs-placement="bottom" title="Tooltip on bottom"/>
              </div>
          </ListGroupItem>
          ): (
            <ListGroupItem key={uuidv4()}>
                <div className="appicon d-flex justify-content-center p-1 mt-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Tooltip on bottom">
                  {}
                  <img width={24} className="launch-icon" src={_icon} alt="" onClick={() => handleSwitchTab(tab)}/>
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


    function tabItem(tabId: any){
      let tab = openTabs[tabId];
      if(tab == null || tab === undefined) return;

      let tabTitle = tab.state.title === "" ? tab.url.substring(0,15) : tab.state.title;
      let _icon = "";
        try {
          if(tab.type === "app"){
            _icon = localStorage.getItem(tab.state.icon) == null ? defaultIcon : localStorage.getItem(tab.state.icon);
          }else{
            _icon = tab.state.icon;
          }
          return tab.id === activeTabId ? (
            <ListGroupItem key={uuidv4()}>
                {}
                <div className="col-12 vertical-tab-item-active">
                      <Container fluid>
                          <Row onMouseOver={() => handleMouseOver(tab.id)} onMouseOut={() => handleMouseOut(tab.id)}>
                            <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                              <div className="appicon d-flex justify-content-center" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Tooltip on bottom">
                                {}
                                <img width={16} className="launch-icon" src={_icon} alt="" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Tooltip on bottom"/>
                              </div>
                            </Col>
                            <Col xs={8} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                                {}
                                <div className="d-flex w-100 justify-content-start">
                                    <span className="tab-title w-100">{tabTitle}</span>
                                </div>
                            </Col>
                            <Col xs={2} className="align-self-center tab-item-col">
                              {}
                              <div id={"closeButton"+tab.id} className="d-flex justify-content-end mr-1 d-none">
                                  <XCircleFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
                              </div>
                              {}
                              <div id={"chevron"+tab.id} className="d-flex justify-content-end mr-1">
                                {/* @ts-expect-error TS(2322): Type '{ children: string; class: string; width: nu... Remove this comment to see the full error message */}
                                <i className="fa fa-chevron-right" width={16}> </i>
                              </div>
                            </Col>
                          </Row>
                      </Container>
                  </div>
            </ListGroupItem>
          ): (
            <ListGroupItem key={uuidv4()}>
              {}
              <div className="col-12 vertical-tab-item">
                <Container fluid>
                  <Row onMouseOver={() => handleMouseOver(tab.id)} onMouseOut={() => handleMouseOut(tab.id)}>
                    <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                      <div className="appicon d-flex justify-content-center p-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Tooltip on bottom">
                        {}
                        <img width={16} className="launch-icon" src={_icon} alt="" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Tooltip on bottom"/>
                      </div>
                    </Col>
                    <Col xs={8} className="align-self-center tab-item-col" onClick={() => handleSwitchTab(tab)}>
                        {}
                        <div className="d-flex w-100 justify-content-start">
                            <span className="tab-title w-100">{tabTitle}</span>
                        </div>
                    </Col>
                    <Col xs={2} className="align-self-center tab-item-col">
                      {}
                      <div id={"closeButton"+tab.id} className="d-flex justify-content-end mr-1 d-none">
                          <XCircleFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
                      </div>
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

    function handleSwitchTab(tab: any){
      log.debug("handleSwitchTab", tab);
      //TODO: if tab location is external, open external window
      //let _activeTab = Object.assign({}, activeTab);
      dispatch(sessionActions.setActiveTab({data: tab}));
    }

    function addNewTab(){
      let _tab = {
        id: uuidv4(),
        url: activeWindow.data.startUrl,
        title: "",
        type: "link",
        icon: activeWindow.data.icon,
        location: activeWindow.location,
        desktop: desktop.id,
        workspace: workspace.id,
        window: activeWindow.id,
      }

      if(activeWindow.hasOwnProperty("storeId")){
        _tab.type = "app";
      }

      // OpenTabs
      let _openTabs = Object.assign({}, openTabs);
      _openTabs[_tab.id] = _tab;
      dispatch(sessionActions.setOpenTabs({data: _openTabs}));
      log.debug("_tab: ", _tab);
      log.debug("openTabs: ", openTabs);

       //WindowTabs
       let _windowTabs = Object.assign({}, windowTabs);
       let _currentWindowTabs = Object.assign([], windowTabs[activeWindow.id]);
       _currentWindowTabs.push(_tab.id);
       _windowTabs[activeWindow.id] = _currentWindowTabs;
       dispatch(sessionActions.setWindowTabs({data: _windowTabs}));

      // Active Tab
      dispatch(sessionActions.setActiveTab({data:_tab}));

      // ActiveTabs
      let _activeTabs = Object.assign({}, activeTabs);
      _activeTabs[activeWindow.id] = _tab.id;
      dispatch(sessionActions.setActiveTabs({data: _activeTabs}));
    }

    function tabsMenu(){
      try {
        if(activeWindow.id !== "launchpad" && activeWindow.data.window.enableTabs && activeWindow.desktop === desktop.id){
          return (
            <ListGroup className="w-100">
              {windowTabs[activeWindow.id].map((tabId: any) => tabItem(tabId))}
              <ListGroupItem key="plus" className="d-flex justify-content-center mt-2">
                <Button color="dark" onClick={() => addNewTab() }>
                  <PlusCircle color="white" size={16} />
                </Button>
              </ListGroupItem>
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

    const [open, setOpen] = useState(true);
    const toggle = (id: any) => {
      if (open === id) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    };

    return (
        <div id="vertical-tab-bar" className="d-flex justify-content-start vertical-tabbar window-menu bg-dark w-100">
            <Accordion flush open={open} toggle={toggle} className="tabs-menu">
              <AccordionItem className='mt-3'>
                <AccordionHeader targetId="1"> Bookmarks</AccordionHeader>
                <AccordionBody accordionId="1">
                  <ListGroup className="w-100">
                    <ListGroupItem key="plus" className="d-flex justify-content-center mt-2">
                      <Button color="dark" onClick={() => alert("coming soon") }>
                        <PlusCircle color="white" size={16} />
                      </Button>
                    </ListGroupItem>
                </ListGroup>
                </AccordionBody>
              </AccordionItem>
            </Accordion>
        </div>
    )
}

export default BookmarkSideMenu;
