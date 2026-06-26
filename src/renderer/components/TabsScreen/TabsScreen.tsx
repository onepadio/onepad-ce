import { v4 as uuidv4 } from "uuid";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import log from "loglevel";
import isElectron from 'is-electron';

import { appActions } from "../../store/app-slice";
import { sessionActions } from "../../store/session-slice";

import { newTabForActiveWindow, closeTab } from "../../util/tabs";

import {
    Button,
    Col,
    Container,
    Row,
    Spinner,
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
} from "react-bootstrap-icons";

import "./TabsScreen.css";

function TabsScreen(props: any) {
    const dispatch = useDispatch();

    const isVisible = useSelector((state: any) => state.app.tabsScreenVisible);

    const screenShotStatusVersion = useSelector((state: any) => state.app.screenShotStatusVersion);


    const showSidebar = useSelector((state: any) => state.window.showSidebar);

    const isSharedAppsEnabled = useSelector((state: any) => state.settings.isSharedAppsEnabled);

    const isBottomNavBarVisible = useSelector((state: any) => state.view.isBottomNavBarVisible);

    const activeWindow = useSelector((state: any) => state.session.activeWindow);

    const activeWindowId = useSelector((state: any) => state.session.activeWindowId);

    const activeWindowTabs = useSelector((state: any) => state.session.activeWindowTabs);

    const openWindows = useSelector((state: any) => state.session.openWindows);

    const openTabs = useSelector((state: any) => state.session.openTabs);

    const windowTabs = useSelector((state: any) => state.session.windowTabs);

    const activeTabId = useSelector((state: any) => state.session.activeTabId);


    const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

    const browserWindows = useSelector((state: any) => state.session.browserWindows);

    const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

    const activeTabs = useSelector((state: any) => state.session.activeTabs);

    const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

    const [windowIcon, setWindowIcon] = useState("");
    const [progressValue, setProgressValue] = useState(0);
    const [ssDict, setSSDict] = useState({});
    const domId = "tabs-screen-id";
    const plusButtonId = "tabs-screen-plus-button";
    const iconId = "tabs-screen-icon-id";

    useEffect(() => {
        const container = document.getElementById(domId);
        if(showSidebar){
            container.classList.add("resized-webview-container");
        }else{
            container.classList.remove("resized-webview-container");
        }

      }, [showSidebar]);

      useEffect(() => {
        const container = document.getElementById(domId);

        if(!isSharedAppsEnabled){
            container.classList.remove("no-bottom-bar");
            setTimeout(() => {
                container.classList.add("no-tab-and-bottom-bar");
            }, 100);
        }else{
            if(isBottomNavBarVisible){
                container.classList.remove("no-tab-and-bottom-bar");
                container.classList.remove("no-bottom-bar");
                setTimeout(() => {
                    container.classList.add("no-tab-bar");
                }, 100);
            }else{
                container.classList.remove("no-tab-bar");
                setTimeout(() => {
                    container.classList.add("no-tab-and-bottom-bar");
                }, 100);
            }
        }

      }, [isSharedAppsEnabled, isBottomNavBarVisible]);

    useEffect(() => {
        const domElement = document.getElementById(domId);
        if(isVisible){
            domElement.classList.remove("d-none");
            setProgressValue(0.1);
            setTimeout(() => {
                setProgressValue(0.2);
            }, 100);
            setTimeout(() => {
                setProgressValue(0.3);
            }, 200);
            setTimeout(() => {
                setProgressValue(0.4);
            }, 300);
            setTimeout(() => {
                setProgressValue(0.5);
            }, 400);
            setTimeout(() => {
                setProgressValue(0.6);
            }, 500);
            setTimeout(() => {
                setProgressValue(0.9);
            }, 600);
            setTimeout(() => {
                setProgressValue(1);
            }, 700);
            if(windowTabs[activeWindowId]){
                let _ssDict = {};
                windowTabs[activeWindowId].forEach((tabId: any) => {
                    if(openTabs[tabId] && openTabs[tabId].sleeping === false){
                        // @ts-expect-error
                        let _ss = isElectron() && window.electronAPI?.screenshot ? window.electronAPI.screenshot.get("screenshot-"+tabId) : null;
                        _ssDict[tabId] = _ss;
                    }
                });
                setSSDict(_ssDict);
            }
        }else{
            domElement.classList.add("d-none");
        }
    }
    , [isVisible]);

    useEffect (() => {
        log.debug("TabsScreen:  "+screenShotStatusVersion);
        let _window = openWindows[activeWindowId];
        if(_window){
            if(_window.type === "app"){
                setWindowIcon("./images/store/icon/"+_window.data.icon);
            }else if(_window.type === "link"){
                setWindowIcon(_window.data.icon);
            }else{
                setWindowIcon("icon_128x128.png");
            }
        }

        // Screenshots are now handled by ScreenshotManagerHub
        // We just retrieve cached screenshots below

        if(activeWindowId === "launchpad"){
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            dispatch(appActions.hideTabsScreen());
        }else{
            if(windowTabs[activeWindowId]){
                let _ssDict = {};
                windowTabs[activeWindowId].forEach((tabId: any) => {
                    if(openTabs[tabId]){
                        // @ts-expect-error
                        let _ss = isElectron() && window.electronAPI?.screenshot ? window.electronAPI.screenshot.get("screenshot-"+tabId) : null;
                        _ssDict[tabId] = _ss;
                    }
                });
                setSSDict(_ssDict);
            }
        }

    }, [activeWindowId, activeTabId, screenShotStatusVersion]);

    function handleOnClick(tab: any){
        let _container = document.getElementById(domId);
        const _selectedSS = document.getElementById("ss-"+tab.id);
        const _ssImage = document.getElementById("tabs-screen__ss-image");
        // get coordinates of the selected screenshot
        const _ssRect = _selectedSS.getBoundingClientRect();
        // set the image to the selected screenshot
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        _ssImage.src = document.getElementById("ss-"+tab.id).src;
        _ssImage.style.position = "absolute";
        _ssImage.style.left = _ssRect.left+"px";
        _ssImage.style.top = _ssRect.top+"px";
        _ssImage.style.width = _ssRect.width+"px";
        _ssImage.style.height = _ssRect.height+"px";
        _ssImage.style.transition = "all 0.1s";

        setTimeout(() => {
            let _containerRect = _container.getBoundingClientRect();
            // set the image to the selected screenshot
            _ssImage.style.width = _containerRect.width+"px";
            _ssImage.style.height = _containerRect.height+"px";
            _ssImage.style.left = "0px";
            _ssImage.style.top = "36px";
            // @ts-expect-error TS(2531): Object is possibly 'null'.
            _ssImage.style.opacity = 1;
            // @ts-expect-error TS(2531): Object is possibly 'null'.
            _ssImage.style.zIndex = 1000;
            _ssImage.style.transition = "all 0.5s";
            _ssImage.style.pointerEvents = "none";
            _ssImage.style.overflow = "hidden";
            _ssImage.style.display = "block";

            const _items = document.getElementsByClassName("tabs-screen__item");
            for(let i=0; i<_items.length; i++){
                // if(_items[i].id !== "tabs-screen__item-"+tab.id){
                    _items[i].classList.add("tabs-screen__item__not_selected");
                // }
            }

            document.getElementById(plusButtonId).classList.add("d-none");
            // @ts-expect-error TS(2531): Object is possibly 'null'.
            document.getElementById(iconId).style.opacity = 0;
            document.getElementById(iconId).style.transition = "all 0.1s";
            // _selectedSS.classList.add("tabs-screen__item-selected");
            setTimeout(() => {
                handleSwitchTab(tab);
            }, 500);
        }, 100);
    }

    function handleSwitchTab(tab: any){
        const _ssImage = document.getElementById("tabs-screen__ss-image");
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
        }

        dispatch(sessionActions.setActiveTab({data: tab}));
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(appActions.hideTabsScreen());
        // reset the image
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        _ssImage.style.opacity = 0;
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        _ssImage.style.zIndex = -1;
        _ssImage.style.width = "0px";
        _ssImage.style.height = "0px";
        let _items = document.getElementsByClassName("tabs-screen__item");
        for(let i=0; i<_items.length; i++){
            // if(_items[i].id !== "tabs-screen__item-"+tab.id){
                _items[i].classList.remove("tabs-screen__item__not_selected");
            // }
        }
        document.getElementById(plusButtonId).classList.remove("d-none");
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        document.getElementById(iconId).style.opacity = 1;
    }

    function handleCloseTab(tab: any) {
        // @ts-expect-error TS(2554): Expected 13 arguments, but got 11.
        closeTab(tab, dispatch, openTabs, windowTabs, openWindows, browserWindows, activeTabId, activeTabs, desktop, isExternalWindowMode, sessionActions);
    }

    function handleNewTab(){
        newTabForActiveWindow(dispatch, workspace, desktop, windowTabs, openTabs, activeTabs, activeWindow);
      }

    function tabsMenu(){
        if(activeWindow !== undefined && activeWindow.id !== undefined && windowTabs[activeWindow.id] !== undefined ){
            return windowTabs[activeWindow.id].map((tabId) => openTabs[tabId] ? tabComputerItem(tabId) : (<> </>)
            );
        }else{
            return (
                <></>
            );
        }
    }


    function tabComputerItem(tabId: any){
        let tab = openTabs[tabId];
        let _ss = ssDict[tabId] ? ssDict[tabId] : "./images/store/icon/preview.png";
        return (
            <Col id={"tabs-screen__item-"+tab.id} xs={6} sm={4} md={4} lg={4} className="align-middle tabs-screen__item mt-1 mb-1" onClick={() => handleOnClick(tab)}>
                {}
                <div className="project-mockup max-w-xl">
                    {}
                    <div className="project-mockup-screen relative p-3 md:mx-8 md:p-2 bg-gray-900 bg-neutral-800 shadow-2xl shadow-neutral-700/50 dark:shadow-neutral-700 rounded-t-xl rounded-b-xl md:rounded-b-none -z-10" >
                        {}
                        <div className="h-48 sm:h-72 overflow-hidden rounded relative">
                            <img
                             id={"ss-"+tab.id}
                             alt=""
                             className="w-full h-full transition duration-500 transform group-hover:scale-105 tabs-screen__screenshot" src={_ss}
                             onClick={() => handleOnClick(tab)}
                             onError={(e) => {
                                // @ts-expect-error
                                e.target.onerror = null;
                                // @ts-expect-error
                                e.target.src = "./images/store/icon/preview.png";
                            }}
                             />
                        </div>
                    </div>
                    {}
                    <div className="h-2 bg-neutral-300 bg-neutral-600 rounded-t hidden md:block"><div className="w-24 h-1 mx-auto rounded-b-lg shadow-inner bg-neutral-100 dark:bg-neutral-700"></div></div>
                    {}
                    <div className="h-[3px] bg-neutral-400 bg-neutral-700 rounded-b-full hidden md:block"></div>
                </div>
            </Col>
        )
    }
    function tilesTabItem(tabId: any){
        let tab = openTabs[tabId];
        let _ss = ssDict[tabId] ? ssDict[tabId] : "./images/store/icon/preview.png";
        let tabTitle = tab.state.title === "" ? tab.state.url.substring(0,30).concat("...") : tab.state.title.substring(0,30).concat("...");
        let _icon = "";
        try {
          if(tab.type === "app"){
            _icon = "./images/store/icon/"+tab.state.icon;
          }else{
            _icon = tab.state.icon;
          }
          return tab.id === activeTabId ? (
            <Col id={"tabs-screen__item-"+tab.id} xs={6} sm={4} md={4} lg={3} className="align-middle tabs-screen__item mt-1 mb-1">
                <Container fluid>
                    <Row>
                        <Col xs={12} className="align-self-center tab-item-col">
                        {}
                        <div id={"xButton"+tab.id} className="d-flex justify-content-end mr-1">
                            <XCircleFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
                        </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} className="align-self-center tab-item-col">
                        <div className="d-flex justify-content-center p-1 mt-1">
                            <img
                                id={"ss-"+tab.id}
                                className="tabs-screen__screenshot"
                                height={80}
                                src={_ss}
                                alt=""
                                onClick={() => handleOnClick(tab)}
                                onError={(e) => {
                                    // @ts-expect-error
                                    e.target.onerror = null;
                                    // @ts-expect-error
                                    e.target.src = "./images/store/icon/preview.png";
                                }}
                            />
                        </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleOnClick(tab)}>
                        <div className="appicon d-flex justify-content-center" >
                            {}
                            <img width={16} className="launch-icon" src={_icon} alt=""/>
                        </div>
                        </Col>
                        <Col xs={8} className="align-self-center tab-item-col" onClick={() => handleOnClick(tab)}>
                            {}
                            <div className="d-flex w-100 justify-content-start">
                                <span className="tab-title w-100">{tabTitle}</span>
                            </div>
                        </Col>
                        <Col xs={2} className="align-self-center tab-item-col">
                        {}
                        <div id={"chevron"+tab.id} className="d-flex justify-content-end mr-2">
                            {/* @ts-expect-error TS(2322): Type '{ children: string; class: string; width: nu... Remove this comment to see the full error message */}
                            <i className="fa fa-chevron-right" width={16}> </i>
                        </div>
                        </Col>
                    </Row>
                </Container>
            </Col>
          ): (
            <Col
                id={"tabs-screen__item-"+tab.id}
                xs={6} sm={4} md={4} lg={3}
                className={tab.sleeping ? "align-middle tabs-screen__item grayscale mt-1 mb-1" : "align-middle tabs-screen__item mt-1 mb-1" }
                >
                <Container fluid>
                <Row>
                    <Col xs={12} className="align-self-center tab-item-col">
                    {}
                    <div id={"closeButtonx"+tab.id} className="d-flex justify-content-end mr-1">
                        <XCircleFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
                    </div>
                    </Col>
                </Row>
                    <Row>
                    <Col xs={12} className="align-self-center tab-item-col">
                        <div className="d-flex justify-content-center p-1 mt-1">

                            <img
                                id={"ss-"+tab.id}
                                className="tabs-screen__screenshot"
                                height={80}
                                src={_ss}
                                alt=""
                                onClick={() => handleOnClick(tab)}
                                onError={(e) => {
                                    // @ts-expect-error
                                    e.target.onerror = null;
                                    // @ts-expect-error
                                    e.target.src = "./images/store/icon/preview.png";
                                }}
                            />

                        </div>
                    </Col>
                    </Row>
                    <Row>
                    <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleOnClick(tab)}>
                        <div className="appicon d-flex justify-content-center" >
                        {}
                        <img width={16} className="launch-icon" src={_icon} alt=""/>
                        </div>
                    </Col>
                    <Col xs={8} className="align-self-center tab-item-col" onClick={() => handleOnClick(tab)}>
                        {}
                        <div className="d-flex w-100 justify-content-start">
                            <span className="tab-title w-100">{tabTitle}</span>
                        </div>
                    </Col>
                    <Col xs={2} className="align-self-center tab-item-col">
                        {
                        tab.sleeping && (
                            <div className="d-flex justify-content-end sleeping-tab mr-1" onClick={() => handleOnClick(tab)}>
                                <Speedometer size={16} color="gray" className="align-self-center"></Speedometer>
                            </div>
                        )
                        }
                    </Col>
                    </Row>
                </Container>
            </Col>
          )
        } catch (error) {
            log.error(error);
            return (
            <></>
            );
        }
      }

    return (
        <Container id={domId} fluid className="tabs-screen pl-0 flex-column justify-content-start">
            <Row className="mt-3">
                <Col xs={12} className="d-flex justify-content-center">
                    <img id="tabs-screen-icon-id" className="tabs-screen__icon" width={64} src={windowIcon} alt="logo" />
                </Col>
            </Row>
            <Row className="m-3 w-100">
                {
                    tabsMenu()
                }
                <Col id={plusButtonId} xs={6} sm={4} md={4} lg={4} className="align-middle mt-1 mb-1 tabs-screen__plus">
                    <Container fluid className="w-100 h-100 justify-content-center">
                        <Row className="h-100">
                            <Col xs={12} className="align-self-center">
                                <div className="d-flex justify-content-center p-1 mt-1">
                                    <Button color="dark" onClick={() => handleNewTab() } >
                                        <Plus color="white" size={48} />
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </Col>
            </Row>
            <img
                id="tabs-screen__ss-image"
                className="tabs-screen__ss-image"
                width={64}
            />
        </Container>
    );
}

export default TabsScreen;
