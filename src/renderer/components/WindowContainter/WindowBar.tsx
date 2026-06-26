import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import isElectron from "is-electron";
import isUrl from "is-url";
import isUrlHttp from "is-url-http";

import {
  ArrowUpRightSquare,
  ArrowUpRightCircleFill,
  ArrowClockwise,
  ArrowRight,
  ArrowLeft,
  PlusCircle,
  XLg,
  DashCircleFill,
  XCircleFill,
  XSquare,
  DashCircle,
  DashSquare,
  SquareHalf,
  Clipboard,
  House,
  LockFill,
  UnlockFill,
  Star,
  Bookmark,
  Check,
  X,
  ArrowDown,
  CaretDown,
  ChevronDown,
  PlusLg,
  Plus,
  PlusSquare,
  ArrowRepeat,
  Speedometer,
  XSquareFill,
  ArrowUpRightSquareFill,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Link45deg,
  WindowStack,
} from "react-bootstrap-icons";
import { openAppWindow, closeWindow } from "../../services/window";
import { newTabForActiveWindow } from "../../util/tabs";
import { closeTab } from "../../util/tabs";
import { appActions } from "../../store/app-slice";
import { sessionActions } from "../../store/session-slice";
import { viewActions } from "../../store/view-slice";

import "./Window.css";
import AppService from "../../services/app";
import { LinkService } from "../../services/link";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  ListGroup,
  ListGroupItem,
  Tooltip,
  UncontrolledDropdown,
  Container,
  Row,
  Col,
  Spinner,
  Button,
} from "reactstrap";

import LoadingBar from 'react-top-loading-bar'
import { ArrowUpRight, Terminal } from "react-feather";
import XAppService from "../../services/xapp";
import { hide } from "@popperjs/core";
import OPWebView from "./OPWebView";

import {
  controlsId, cornerMenuId, spinnerId, addressBarId, backButtonId, forwardButtonId, tabsNavBarId, showTabsBarButtonId, hideTabsBarButtonId,
  reloadButtonId, newTabButtonId, closeWindowButtonId
} from "./shared";

function WindowBar(props: any) {
  const dispatch = useDispatch();

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const openWindows = useSelector((state: any) => state.session.openWindows);

  const browserWindows = useSelector((state: any) => state.session.browserWindows);


  const sessionState = useSelector((state: any) => state.session);

  const openTabs = useSelector((state: any) => state.session.openTabs);

  const externalTabs = useSelector((state: any) => state.session.externalTabs);

  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  const activeWindow = useSelector((state: any) => state.session.activeWindow);

  const activeTabs = useSelector((state: any) => state.session.activeTabs);

  const activeTab = useSelector((state: any) => state.session.activeTab);

  const activeTabId = useSelector((state: any) => state.session.activeTabId);

  const isFullScreen = useSelector((state: any) => state.session.isFullScreen);


  const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

  const isDesktopStickyMode = useSelector((state: any) => state.settings.isDesktopStickyMode);

  const isDeveloperMode = useSelector((state: any) => state.settings.isDeveloperMode);

  const showSidebar = useSelector((state: any) => state.window.showSidebar);

  const closedExternalTabId = useSelector((state: any) => state.session.closedExternalTabId);

  const isSharedAppsEnabled = useSelector((state: any) => state.settings.isSharedAppsEnabled);

  const isBottomNavBarVisible = useSelector((state: any) => state.view.isBottomNavBarVisible);

  const hideTabBar = useSelector((state: any) => state.view.hideTabBar);

  const [progress, setProgress] = useState(0);
  const [webview, setWebView] = useState(null);
  const [sleepWebView, setSleepWebView] = useState(false);

  const [webViewId, setWebViewId] = useState("webview-");


  const [startUrl, setStartUrl] = useState(props.url);

  const currentUrl = useSelector((state: any) => state.windowBar.currentUrl);
  const [title, setTitle] = useState("");
  const [currentFavIcon, setCurrentFavIcon] = useState("");
  const [addressBarValue, setAddressBarValue] = useState("");
  const [isSecure, setIsSecure] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [takeScreenShot, setTakeScreenShot] = useState(false);
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [showTabsBar, setShowTabsBar] = useState(true);

  const isTabsScreenVisible = useSelector((state: any) => state.app.tabsScreenVisible);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  useEffect(() => {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new Tooltip(tooltipTriggerEl)
    })
  });

  useEffect(() => {
    log.debug("windowbar mounted");
    return () => {
      log.debug("windowbar unmounted");
      return;
    };
  }, []);

  useEffect(() => {
    if(activeTabId === null || activeTabId === undefined || activeTabId === "launchpad") return;
    let _tab = openTabs[activeTabId];
    if(_tab === undefined || _tab === null) return;
    if(_tab.url !== openTabs[activeTabId].state.url){
      setStartUrl(openTabs[activeTabId].state.url);
    }
    setWebViewId("webview-" + activeTabId);
    setWebView(document.getElementById("webview-" + activeTabId));
    if(openWindows[_tab.window].type !== "browser"){
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      document.getElementById(addressBarId).disabled = true;
    }
  }, [activeTabId]);

  useEffect(() => {
    if (webview != null) {
      log.debug("webview is not null");
      webview.addEventListener("did-navigate", (event: any) => {
        log.debug("did-navigate, wid",webview.getWebContentsId(), "isMainFrame:", event.isMainFrame);
        // Only process main frame navigation to avoid capturing iframe URLs (e.g., Google widgets)
        if (event.isMainFrame) {
          didNavigate(event);
        }
      });
      webview.addEventListener("page-favicon-updated",(event: any) => updateTabIcon(event.favicons));
      webview.addEventListener("dom-ready", () => {
        log.debug("dom-ready, wid", webview.getWebContentsId());

      });
      webview.addEventListener("did-fail-load", (event: any) => {
        log.error("did-fail-load", event);
        if (event.errorCode !== -3) {
          //webview.loadURL("https://www.google.com/search?q=" + event.validatedURL);
        }
      });

      webview.addEventListener("mouse-down", (event: any) => {
        log.debug("mouse-down", event);
      });

      webview.addEventListener("media-started-playing", (event: any) => {
        setMediaPlaying(true);
      });

      webview.addEventListener("media-paused", (event: any) => {
        setMediaPlaying(false);
      });

      webview.addEventListener("media-stopped", (event: any) => {
        log.debug("media-stopped", event);
        setMediaPlaying(false);
      });

      webview.addEventListener("did-start-loading", (event: any) => {

        setProgress(50);
      });

      webview.addEventListener("did-stop-loading", (event: any) => {
        setProgress(100);
        log.debug("did-stop-loading", event);
      });

      webview.addEventListener("did-finish-load", (event: any) => {
        setTakeScreenShot(true);
        setProgress(100);
        log.debug("did-finish-load", event);
      });

    } else {
      log.debug("webview is null");
      setWebView(document.getElementById(webViewId));
    }


  }, [webview]);

  useEffect(() => {
    let _openTabs = Object.assign({}, openTabs);
    let _tab = Object.assign({}, _openTabs[activeTabId]);
    _tab.mediaPlaying = mediaPlaying;
    _openTabs[activeTabId] = _tab;
    dispatch(sessionActions.setOpenTabs({data: _openTabs}));
  }, [mediaPlaying]);

  // Screenshot capture is now handled by ScreenshotManagerHub
  // Components retrieve cached screenshots as needed
  useEffect(() => {
    if(takeScreenShot && props.location === "main"){
      setTakeScreenShot(false);
      // Screenshots are automatically captured by background service
      // Trigger a version update to notify components of potential new screenshots
      setTimeout(() => {
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(appActions.updateScreenShotStatusVersion());
      }, 1000);
    }
  }, [takeScreenShot]);

  useEffect(() => {
    const container = document.getElementById(activeTabId);
    const tabsNavBar = document.getElementById(tabsNavBarId);
    if (container != null && tabsNavBar != null) {
      if(showSidebar){
        container.classList.add("resized-webview-container");
        tabsNavBar.classList.add("resized-webview-container");
      }else{
        container.classList.remove("resized-webview-container");
        tabsNavBar.classList.remove("resized-webview-container");
      }
    }
  }, [showSidebar, activeTabId, webview]);

  useEffect(() => {
    if(!isFullScreen) return;
    const _showButton = document.getElementById(showTabsBarButtonId);
    const _hideButton = document.getElementById(hideTabsBarButtonId);
    if(activeTabId !== activeTabId){
      //_showButton.classList.add("d-none");
      // _hideButton.classList.add("d-none");
      //return;
    }
    const tabsNavBar = document.getElementById(tabsNavBarId);

    if(hideTabBar[activeWindow.id] !== undefined && hideTabBar[activeWindow.id] === true){
      setTimeout(() => {
        tabsNavBar.classList.add("d-none");
        // _hideButton.classList.add("d-none");
      }, 100);
      _showButton.classList.remove("d-none");

    }else{
      tabsNavBar.classList.remove("d-none");
      _showButton.classList.add("d-none");
      // _hideButton.classList.remove("d-none");
    }

  }, [windowTabs, webview, activeTabId, isSharedAppsEnabled, isBottomNavBarVisible, hideTabBar, isFullScreen]);

  useEffect(() => {
    const controls = document.getElementById(controlsId);
    const cornerMenu = document.getElementById(cornerMenuId);
    const spinner = document.getElementById(spinnerId);
    const tabsNavBar = document.getElementById(tabsNavBarId);
    const windowBackground = document.getElementById("window-background");
    if(isFullScreen){
      if (activeWindow && activeWindow.id !== "launchpad") {
        if(isDesktopStickyMode){
          if(activeWindow.desktop !== desktop.id){
            // cornerMenu.classList.remove("d-none");
            if(spinner) spinner.classList.remove("d-none");
            windowBackground.classList.remove("d-none");
            if (controls != null) {
              controls.classList.remove("d-none");
            }
            if(tabsNavBar != null){
              tabsNavBar.classList.remove("d-none");
            }
            log.debug("show tab");
          }
        }else{
          // cornerMenu.classList.remove("d-none");
          if(spinner) spinner.classList.remove("d-none");
          windowBackground.classList.remove("d-none");
          if (controls != null) {
            controls.classList.remove("d-none");
          }
          if(tabsNavBar != null && windowTabs[activeWindow.id].length > 1){
            tabsNavBar.classList.remove("d-none");
          }
          log.debug("show tab");
        }
      }else{
        log.debug("hide bars");
        // cornerMenu.classList.add("d-none");
        if(spinner) spinner.classList.add("d-none");
        windowBackground.classList.add("d-none");
        if (controls != null) {
          controls.classList.add("d-none");
        }
        if(tabsNavBar != null){
          tabsNavBar.classList.add("d-none");
        }
      }
    }else{
      tabsNavBar.classList.add("d-none");
      controls.classList.add("d-none");
      if(activeWindow && activeWindow.id !== "launchpad"){
        windowBackground.classList.remove("d-none");
      }else{
        windowBackground.classList.add("d-none");
      }
    }


  }, [workspace, desktop, activeWindow,  activeTabId]);

  useEffect(() => {
    try{
      if (webview == null) return;
      let _openTabs = Object.assign({}, openTabs);
      let _tab = Object.assign({}, _openTabs[activeTabId]);
      let _tabState = Object.assign({}, _tab.state);

      if(openWindows[activeWindow.id].type === "link" && _tabState.icon !== currentFavIcon){
        _tabState.icon = currentFavIcon;
      }
      if(_tabState.title !== title){
        _tabState.title = title;
      }
      _tab.state = _tabState;
      const webContentsId = webview.getWebContentsId();
      _tab.webContentsId = webContentsId;
      _openTabs[activeTabId] = _tab;
      log.info(`WindowBar: Set webContentsId ${webContentsId} for tab ${activeTabId}`);
      log.debug("updateTabIcon_openTabs", _openTabs);
      dispatch(
        sessionActions.setOpenTabs({
          data: _openTabs,
        })
      );
    }catch(e){
      log.error(e);
    }
  }, [currentFavIcon, title]);

  useEffect(() => {
    let _webview = document.getElementById(webViewId);


    log.debug("currentUrl", currentUrl);
    if(currentUrl === "") return;
    const addressBar = document.getElementById(addressBarId);
    let _hostname = new URL(currentUrl).hostname;
    let _protocol = new URL(currentUrl).protocol;
    log.debug("protocol:", _protocol);
    if(_protocol === "https:"){
      setAddressBarValue("https://" + _hostname);
    }else if(_protocol === "http:"){
      setAddressBarValue("http://" + _hostname);
    }

    let backButton = document.getElementById(backButtonId);
    let forwardButton = document.getElementById(forwardButtonId);

    try{
      // @ts-expect-error
      if (_webview && _webview.canGoBack()) {
        backButton.classList.remove("disabled");
      } else {
        backButton.classList.add("disabled");
      }

      // @ts-expect-error
      if (_webview && _webview.canGoForward()) {
        forwardButton.classList.remove("disabled");
      } else {
        forwardButton.classList.add("disabled");
      }
    }catch(e){
      log.error(e);
    }
    let _openTabs = Object.assign({}, openTabs);
    let _tab = Object.assign({}, _openTabs[activeTabId]);
    let _state = Object.assign({}, _tab.state);

    if(_state.url !== currentUrl){
      _state.url = currentUrl;
    }
    _tab.state = _state;
    _openTabs[activeTabId] = _tab;
    dispatch(
      sessionActions.setOpenTabs({
        data: _openTabs,
      })
    );

  }, [currentUrl, webViewId]);

  const getControlsHeight = () => {
    const controls = document.getElementById(controlsId);
    if (controls) {
      return controls.offsetHeight;
    }
    return 0;
  };

  function navigate(e: any) {
    if(e.key === 'Enter') {
        try {
          if( addressBarValue.startsWith("http://") || addressBarValue.startsWith("https://")){
            webview.loadURL(addressBarValue);
          }else{
            if(isUrlHttp(addressBarValue) || validURLHttp("http://"+addressBarValue)){
              webview.loadURL("https://"+addressBarValue);
            }else{
              webview.loadURL("https://www.google.com/search?q=" + addressBarValue);
            }
          }
        } catch (error) {
          log.debug("Invalid URL:" + addressBarValue);
          webview.loadURL("https://www.google.com/search?q=" + addressBarValue);
        }
    }
  }

  function didNavigate(e: any) {
    log.debug("didNavigate:", e.url);
    if(e.url === currentUrl){
      return;
    }
    // setCurrentUrl(e.url);
    if(e.url.startsWith("https://")){
      setIsSecure(true);
    }else{
      setIsSecure(false);
    }
  }


  function validURLHttps(str: any) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }

  function validURLHttp(str: any) {
    var pattern = new RegExp('^(http?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }

  function updateTabIcon(favicons: any) {
    if(activeTabId !== activeTabId || webview.getURL() === currentUrl) return;

    if(favicons.length === 0) return;

    if(favicons[0] === currentFavIcon){
      log.debug("updateTabIcon", "same icon");
      return;
    }

    if(webview.getTitle() !== title){
      setTitle(webview.getTitle());
    }

    setCurrentFavIcon(favicons[0]);
  }

  function goHome() {
    let _webview = document.getElementById(webViewId);
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    _webview.loadURL(openWindows[activeWindow.id].url);
  }

  function goBack() {
    let _webview = document.getElementById(webViewId);
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    if(_webview.canGoBack()) _webview.goBack();
  }

  function goForward() {
    let _webview = document.getElementById(webViewId);
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    _webview.goForward();
  }

  function reload() {
    // webview.reload();
    // get active tab
    let _webview = document.getElementById(webViewId);
    let _tab = Object.assign({}, openTabs[activeTabId]);
    // @ts-expect-error
    if(_webview) _webview.reload();
  }

  function handleCloseTab(tab: any){
    if(tab === null || tab === undefined){
      tab = openTabs[activeTabId];
    }
    // @ts-expect-error TS(2554): Expected 13 arguments, but got 11.
    closeTab(tab, dispatch, openTabs, windowTabs, openWindows, browserWindows, activeTabId, activeTabs, desktop, isExternalWindowMode, sessionActions);
  }

  function switchToExternal() {
    alert("coming soon..."); return;
    // save window state to localStorage
    // then open new window
    // if only one tab move window to external
    openAppWindow(activeWindow.id, currentUrl, "external", 0, 0);
    dispatch(sessionActions.getBackToLaunchPad({data: {
      desktopId: desktop.id,
    }}));
    // if more than one tab, move tab to external

  }

  function minimizeWindow() {
    log.debug("closeWindow",activeWindow.id);
    dispatch(sessionActions.getBackToLaunchPad({data: {
      desktopId: desktop.id,
    }}));
    return;
  }

  function handleCloseWindow(){
    let _window = openWindows[activeWindow.id];
    let _autoSave = _window.data.autoSave !== undefined ? _window.data.autoSave : false;
    if(sessionState.isInSession || !_autoSave){
      closeWindow(dispatch, sessionActions, activeWindow.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
      return;
    }

    // save window state
    let _tabIds = Object.assign([], windowTabs[activeWindow.id]);
    let tabs: any = [];
    _tabIds.forEach((tabId: any) => {
      let _openTabs = Object.assign({}, openTabs);
      let _tab = Object.assign({}, _openTabs[tabId]);
      let _state = Object.assign({}, _tab.state);
      _state.id = tabId;
      tabs.push(_state);
      if(_tab.location === "external"){
        if(isElectron()){
          // @ts-expect-error
          window.electronAPI.send("toMain", {
            action: "close-tab",
            closeTabWindowId: _tab.window,
            closeTabId: _tab.id,
            closeTabType: _tab.type,
          });
        }
      }
    });

    if(_window.type === "app"){
      AppService.updateState(activeWindow.id, {
        tabs: tabs,
      }).then((res) => {
        log.debug("updateState", res);
        closeWindow(dispatch, sessionActions, activeWindow.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
      }).catch((err) => {
        log.error("updateState", err);
        closeWindow(dispatch, sessionActions, activeWindow.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
      });
    }else if(_window.type === "link"){
      LinkService.updateState(activeWindow.id, {
        tabs: tabs,
      }).then((res) => {
        log.debug("updateState", res);
        closeWindow(dispatch, sessionActions, activeWindow.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
      }).catch((err) => {
        log.error("updateState", err);
        closeWindow(dispatch, sessionActions, activeWindow.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
      });
    }else if(_window.type === "xapp"){
      log.debug("updateState XAPP", tabs);
      XAppService.updateState(activeWindow.id, {
        tabs: tabs,
      }).then((res) => {
        log.debug("updateState", res);
        closeWindow(dispatch, sessionActions, activeWindow.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
      }).catch((err) => {
        log.error("updateState", err);
        closeWindow(dispatch, sessionActions, activeWindow.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
      });
    }else{
      closeWindow(dispatch, sessionActions, activeWindow.id, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
    }
  }

  function toggleLeftMenu() {
    const leftMenu = document.getElementById("left-menu");
    if (leftMenu.classList.contains("d-none")) {
      leftMenu.classList.remove("d-none");
    } else {
      leftMenu.classList.add("d-none");
    }
  }

  const style = {
    color: "cornflowerblue",
    fontSize: 10,
  };

  function handleAddressBarClick(e: any){
    setTimeout(function () { e.target.select(); }, 100);
  }

  function copyToClipboard(){
    if(isElectron()){
        // @ts-expect-error
        window.electronAPI.send("toMain", {
            action: "clipboard",
            text: webview.getURL(),
        });
        setHasCopied(true);
        setTimeout(() => {
            setHasCopied(false);
        }
        , 2000);
    }
  }

  function moveTabToExternalWindow(){
    let _window = openWindows[activeWindow.id];
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "open-external-window",
        tabWindowId: activeWindow.id,
        tabId: activeTabId,
        url: webview.getURL(),
        partition: props.partition,
        type: _window.type,
      });

      let _openTabs = Object.assign({}, openTabs);
      let _tab = Object.assign({}, _openTabs[activeTabId]);

      _tab.location = "external";
      _openTabs[activeTabId] = _tab;
      dispatch(
        sessionActions.setOpenTabs({
          data: _openTabs,
        })
      );
    }
  }

  function handleSwitchTab(tab: any){
    log.debug("handleSwitchTab", tab);
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
  }

  function tabDDItem(tab: any){

    if (tab && tab.state && tab.window === activeWindow.id) {
      let _icon = "";
      if(tab.type === "app"){
        _icon = "./images/store/icon/"+tab.state.icon;
      }else{
        _icon = tab.state.icon;
      }

      let tabTitle = tab.state.title === "" ? tab.state.url.substring(0,35).concat("...") : tab.state.title.substring(0,35).concat("...");
      return (
          <DropdownItem
              key={tab.id}
              active={tab.id === activeTabId}
              onClick={() => handleSwitchTab(tab)}
              className="tab-dd-item"
          >

            <Container fluid>
              <Row className="w-100">
                <Col xs={1} className="align-self-center" >
                  <div className="d-flex justify-content-center" >
                    <img className="tab-icon-dd" width={16} height={16} src={_icon} alt=""/>
                  </div>
                </Col>
                <Col xs={8} className="align-self-center">
                  {}
                  <div className="d-flex w-100 justify-content-start">
                      <span className="tab-title">{tab.state.title}</span>
                  </div>
                </Col>
              </Row>

            </Container>

          </DropdownItem>
      )
    }else{
      return (<></>);
    }
  }

  function closeTabsDDIfOpen(){
    if(dropdownOpen){
      setTimeout(() => {
        toggle();
      }, 200);
    }
  }

  function openTabsDD(){
    if(!dropdownOpen){
      toggle();
    }
  }

  function tabsMenu(){
    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle} className="tabs-drop-down" onMouseEnter={openTabsDD} onMouseLeave={closeTabsDDIfOpen}>
          <DropdownToggle color="dark" data-bs-toggle="tooltip" data-bs-placement="right" title="Switch Tab" data-bs-custom-className="custom-tooltip">
            {
              dropdownOpen ? (
                <ChevronUp size={16}/>
              ) : (
                <ChevronDown size={16}/>
              )
            }
          </DropdownToggle>
          <DropdownMenu dark>
              <DropdownItem header>
                  Open Tabs
              </DropdownItem>
              {
                Object.values(openTabs).map(tab => {
                    return tabDDItem(tab);
                  }
                )
              }
          </DropdownMenu>
      </Dropdown>
    );
  }

  function handleNewTab(){
    if(windowTabs[activeWindow.id].length > 19){
      alert("You have reached the maximum number of tabs allowed in an app window.");
      return;
    }
    newTabForActiveWindow(dispatch, workspace, desktop, windowTabs, openTabs, activeTabs, activeWindow, props.isolated);
  }

  function handleLoad(){
    log.debug("handleLoad....");
  }

  function onWebviewFocus(){
    log.debug("onWebviewFocus");
  }

  function webView(){
    if(sleepWebView)
      return (<></>);
    if(props.location !== "main"){
      // @ts-expect-error
      const storeSS = isElectron() && window.electronAPI?.screenshot ? window.electronAPI.screenshot.get("screenshot-"+activeTabId) : null;
      if(storeSS){
        return (
          <>
            <img className="webview darken-image" src={storeSS} alt=""/>
          </>
        );
      }else{
        // Use iframe for non-Electron
        if (!isElectron()) {
          return (
            <iframe
              id={webViewId}
              className="webview d-none"
              src={startUrl}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
              onLoad={() => handleLoad()}
            ></iframe>
          );
        }
        
        return (
            <webview
              id={webViewId}
              className="webview d-none"
              // @ts-expect-error
              autosize="on"
              src={startUrl}
              // @ts-expect-error
              nodeintegration="true"
              // @ts-expect-error
              allowpopups="true"
              partition={props.partition}
              onLoadCapture={() => handleLoad()}
            ></webview>
        );
      }

    }else{
      // Use iframe for non-Electron
      if (!isElectron()) {
        return (
          <iframe
            id={webViewId}
            className="webview"
            src={startUrl}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation"
            onLoad={() => handleLoad()}
          ></iframe>
        );
      }
      
      return (
        <webview
          id={webViewId}
          className="webview"
          // @ts-expect-error
          autosize="on"
          src={startUrl}
          // @ts-expect-error
          nodeintegration="true"
          // @ts-expect-error
          allowpopups="true"
          partition={props.partition}
          onLoadCapture={() => handleLoad()}
        ></webview>
      );
    }


  }

  function tabsBarItem(tab: any){
    if (tab && tab.state && tab.window === activeWindow.id) {
      let _icon = "";
      if(tab.type === "app" || tab.type === "xapp"){
        _icon = "./images/store/icon/"+tab.state.icon;
      }else{
        _icon = tab.state.icon;
      }
      let maxTitleLength = 10;
      if(windowTabs[activeWindow.id] && windowTabs[activeWindow.id].length < 5){
        maxTitleLength = 25;
      }
      let tabTitle =  "";
      if(windowTabs[activeWindow.id] &&  windowTabs[activeWindow.id].length < 12){
        tabTitle = tab.state.title === "" ? openWindows[activeWindow.id].data.name : tab.state.title.length > maxTitleLength ? tab.state.title.substring(0,maxTitleLength).concat("...") : tab.state.title;
      }

      let isActive = tab.id === activeTabId ? " active" : " inactive";
      return (
        <ListGroupItem className={"align-self-center h-100 flex-fill" + isActive}>
          <Container fluid className="tab-bar-item w-100 h-100 align-self-center">
              <Row className="w-100 h-100" onClick={() => handleSwitchTab(tab)}>
                <Col xs={1} className="d-flex align-items-center h-100" onClick={() => handleSwitchTab(tab)}>
                  <div className="d-flex justify-content-center w-100" >
                    {
                      tab.sleeping ? (
                        <div className="d-flex justify-content-center sleeping-tab">
                          <Speedometer size={16} color="gray" className="align-self-center"></Speedometer>
                        </div>
                      ) : (
                        <img className="tab-icon-dd" width={16} height={16} src={_icon} alt=""/>
                      )
                    }
                  </div>
                </Col>
                <Col xs={9} className="d-flex align-items-center h-100" onClick={() => handleSwitchTab(tab)}>
                  {}
                  <div className="d-flex justify-content-start align-items-center w-100 h-100">
                      <span className="text-white text-sm text-truncate">{tabTitle}</span>
                  </div>
                </Col>
              </Row>
              <div className="d-flex justify-content-end move-to-external-button">
                {
                  isActive ? (
                    <ArrowUpRightCircleFill size={16} color="green" onClick={() => moveTabToExternalWindow()}></ArrowUpRightCircleFill>
                  ) : (
                    <></>
                  )
                }
              </div>
              <div className="d-flex justify-content-end close-button" >
                <XCircleFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
              </div>
          </Container>
        </ListGroupItem>
      )
    }
  }

  function toggleTabsBar(){
    let _bar = document.getElementById(tabsNavBarId);
    let _showButton = document.getElementById(showTabsBarButtonId)
    let _hideButton = document.getElementById(hideTabsBarButtonId);

    if(hideTabBar[activeWindow.id] !== undefined && hideTabBar[activeWindow.id] === true){
      _bar.classList.remove("hide-tabs-bar");
      _showButton.classList.add("d-none");
      // _hideButton.classList.remove("d-none");
      // setShowTabsBar(true);
      dispatch(viewActions.toggleHideTabBar(activeWindow.id));
    }else{
      _hideButton.blur();
      // _hideButton.classList.add("d-none");
      _bar.classList.add("hide-tabs-bar");
      // setShowTabsBar(false);
      dispatch(viewActions.toggleHideTabBar(activeWindow.id));
      setTimeout(() => {
        // remove focus from hide button
        _showButton.classList.remove("d-none");
      }, 500);
    }
  }

  function showTabs(){
    if(isTabsScreenVisible){
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(appActions.hideTabsScreen());
      return;
    }
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(appActions.showTabsScreen());
  }

  function hideWindowBackground(){
    dispatch(sessionActions.getBackToLaunchPad({data: {
      desktopId: desktop.id,
    }}));
  }

  return (
    <>
    <div className="app-window">
      <nav
        id={controlsId}
        className="navbar navbar-expand navbar-dark bg-dark window-navbar d-none"
      >
        <button
          id={"home-"+activeTabId}
          className="btn btn-dark"
          onClick={() => goHome()}
          data-bs-toggle="tooltip" data-bs-placement="right" title="Go Home" data-bs-custom-className="custom-tooltip" data-bs-trigger="hover focus"
        >
          <House size={20} />
        </button>
        <button
          id={backButtonId}
          className="btn btn-dark ml-2"
          onClick={() => goBack()}
          data-bs-toggle="tooltip" data-bs-placement="right" title="Previous page" data-bs-custom-className="custom-tooltip"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          id={forwardButtonId}
          className="btn btn-dark ml-2"
          onClick={() => goForward()}
          data-bs-toggle="tooltip" data-bs-placement="right" title="Next page" data-bs-custom-className="custom-tooltip"
        >
          <ChevronRight size={16} />
        </button>
        <button
          id={reloadButtonId}
          className="btn btn-dark ml-1 reload-button"
          onClick={() => reload()}
          data-bs-toggle="tooltip" data-bs-placement="right" title="Reload Tab" data-bs-custom-className="custom-tooltip"
        >
          <ArrowClockwise size={16} />
        </button>
        <button
          id={"move-to-external-"+activeTabId}
          className="btn btn-dark"
          onClick={() => moveTabToExternalWindow()}
          data-bs-toggle="tooltip" data-bs-placement="right" title="Open In New Window" data-bs-custom-className="custom-tooltip"
        >
          <ArrowUpRight size={16}/>
        </button>
        <Button color="dark" onClick={() => showTabs()} className="position-relative" data-bs-toggle="tooltip" data-bs-placement="right" title="Tabs" data-bs-custom-className="custom-tooltip">
          <WindowStack size={16} />
        </Button>
        {
          tabsMenu()
        }
        <input
          id={addressBarId}
          className="form-control address-bar"
          type="search"
          placeholder=""
          aria-label="Search"
          value={addressBarValue}
          onKeyDown={(e) => {navigate(e)}}
          onChange={(e) => setAddressBarValue(e.target.value)}
          // @ts-expect-error
          onClick={(e) => { e.target.setSelectionRange(0, e.target.value.length); }}
          data-bs-toggle="tooltip" data-bs-placement="bottom" title={currentUrl}
        />
        <button
          id={"lock-"+activeTabId}
          className="btn btn-dark lock-button d-none"
          onClick={() => alert("show site details. coming soon...")}
        >
          {
            isSecure ? <LockFill size={16} /> : <UnlockFill size={16} color="red" />
          }
        </button>
        <button
          id={"add-bookmark-"+activeTabId}
          className="btn btn-dark ml-1 d-none"
          onClick={() => alert("add to bookmarks, coming soon...")}
        >
          <Bookmark size={16} />
        </button>
        <button
          id={"add-bookmark-"+activeTabId}
          className="btn btn-dark ml-1 d-none"
          onClick={() => alert("add to favourites, coming soon...")}
        >
          <Star size={16} />
        </button>
        {
          isDeveloperMode && (
            <button
              id={"console-"+activeTabId}
              className="btn btn-dark ml-1"
              onClick={() => webview.openDevTools()}
              data-bs-toggle="tooltip" data-bs-placement="right" title="Developer Tools" data-bs-custom-className="custom-tooltip"
            >
              <Terminal size={16} />
            </button>
          )
        }
        <button
          id={"copy-"+activeTabId}
          className="btn btn-dark ml-1 clipboard-button"
          onClick={() => copyToClipboard()}
          data-bs-toggle="tooltip" data-bs-placement="bottom" title={currentUrl}
        >
          { hasCopied ? <Check size={16} /> : <Link45deg size={16} /> }
        </button>
      </nav>
      <nav
        id={tabsNavBarId}
        className="navbar navbar-expand navbar-dark bg-dark tabs-navbar"
      >
        <ListGroup horizontal className="tab-items">
          {
            Object.values(openTabs).map(tab => {
                return tabsBarItem(tab);
              }
            )
          }
        </ListGroup>
        <button
            id={newTabButtonId}
            className="btn btn-dark new-tab-button"
            onClick={() => handleNewTab()}
            data-bs-toggle="tooltip" data-bs-placement="right" title="New Tab" data-bs-custom-className="custom-tooltip"
          >
            <PlusLg size={16} />
        </button>
        <Button color="dark" id={hideTabsBarButtonId} className="hide-tabs-bar-button d-none" onClick={() => toggleTabsBar()}>
          <ChevronUp size={16}/>
        </Button>
      </nav>
      <div id={cornerMenuId} className="window-corner-menu d-none">
        <ListGroup horizontal className="mr-1 mt-1">
          <ListGroupItem>
            <button
              id={closeWindowButtonId}
              className="btn btn-dark close-tab-button"
              onClick={() => handleCloseWindow()}
              data-bs-toggle="tooltip" data-bs-placement="right" title="Close Window" data-bs-custom-className="custom-tooltip"
            >
              <XLg size={16} />
            </button>
          </ListGroupItem>
        </ListGroup>
      </div>



      <Button color="dark" id={showTabsBarButtonId} className="show-tabs-bar-button d-none" onClick={() => toggleTabsBar()}>
        <ChevronDown size={16}/>
      </Button>

    </div>
    {
      isFullScreen ? ( <div id="window-background" className="window-background bg-dark"></div>) : (
        <div id="window-background" className="window-background bg-dark transparent" onClick={()=> hideWindowBackground()}></div>)
    }
    </>
  );
}

export default WindowBar;
