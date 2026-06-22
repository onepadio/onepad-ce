import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import isElectron from "is-electron";
import isUrl from "is-url";
import isUrlHttp from "is-url-http";

import { createProcess, getProcessDetails, logActivity, terminateProcess } from "../../api/ProcessApi";

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
} from "react-bootstrap-icons";
import { openAppWindow, closeWindow } from "../../services/window";
import { newTabForActiveWindow } from "../../util/tabs";
import { closeTab } from "../../util/tabs";
import { sessionActions } from "../../store/session-slice";
import "./RemoteTab.css";
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
  Col
} from "reactstrap";
import { ArrowUpRight } from "react-feather";
import {Spinner} from "reactstrap";

function RemoteTab(props: any) {
  const dispatch = useDispatch();
  
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  
  const openWindows = useSelector((state: any) => state.session.openWindows);
  
  const browserWindows = useSelector((state: any) => state.session.browserWindows);

  
  const sessionState = useSelector((state: any) => state.session);
  
  const openTabs = useSelector((state: any) => state.session.openTabs);
  
  // Use ref to always access latest openTabs in event handlers
  const openTabsRef = useRef(openTabs);
  useEffect(() => {
    openTabsRef.current = openTabs;
  }, [openTabs]);
  
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  
  const activeWindow = useSelector((state: any) => state.session.activeWindow);
  
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  
  const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);
  
  const isDesktopStickyMode = useSelector((state: any) => state.settings.isDesktopStickyMode);
  
  const showSidebar = useSelector((state: any) => state.window.showSidebar);

  const [webview, setWebView] = useState(null);
  const [sleepWebView, setSleepWebView] = useState(false);
  const [webViewId, setWebViewId] = useState("webview-" + props.tabId);
  const [controlsId, setControlsId] = useState("controls-" + props.tabId);
  const [cornerMenuId, setCornerMenuId] = useState("cornerMenu-" + props.tabId);
  const [addressBarId, setAddressBarId] = useState(
    "addressBar-" + props.tabId
  );
  const [backButtonId, setBackButtonId] = useState(
    "backButton-" + props.tabId
  );
  const [forwardButtonId, setForwardButtonId] = useState(
    "forwardButton-" + props.tabId
  );
  const [reloadButtonId, setReloadButtonId] = useState(
    "reloadButton-" + props.tabId
  );

  const [closeTabButtonId, setCloseTabButtonId] = useState(
    "closeTabButton-" + props.tabId
  );
  const [newTabButtonId, setNewTabButtonId] = useState(
    "newTabButton-" + props.tabId
  );
  const [closeWindowbButtonId, setCloseWindowButtonId] = useState(
    "closeWindowButton-" + props.tabId
  );

  const [startUrl, setStartUrl] = useState(props.url);
  const [currentUrl, setCurrentUrl] = useState("");
  const [title, setTitle] = useState("");
  const [currentFavIcon, setCurrentFavIcon] = useState("");
  const [addressBarValue, setAddressBarValue] = useState("");
  const [isSecure, setIsSecure] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isProcessRunning, setIsProcessRunning] = useState(false);
  const [timer, setTimer] = useState(0);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  useEffect(() => {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new Tooltip(tooltipTriggerEl)
    })
  });

  function checkServer(url: any) {
    log.debug("retrying to load", url);
    fetch(url)
        .then((response) => {
            log.debug("server response", response);
            if (response.status === 200) {
              setIsProcessRunning(true);
              webview.loadURL(url);
            } else {
                log.debug("server not ready, retrying in 5 seconds");
                setTimeout(() => {
                    checkServer(url);
                }
                , 5000);
            }
        }).catch((error) => {
            log.debug("server not ready, retrying in 5 seconds");
            setTimeout(() => {
                checkServer(url);
            }
            , 5000);
        });

  }

  function checkProcess(processUrl: any) {
    if(isProcessRunning){
      return;
    }
    getProcessDetails("user-1", props.tabId).then((response: any) => {
        log.debug("process response", response.status);
        if (response.status === "RUNNING") {
          setIsProcessRunning(true);
          if(webview){
            webview.loadURL(processUrl);
          }
        } else {
            if(response.status === "TERMINATED"){
              setIsProcessRunning(false);
              log.debug("ToDo: process terminated, window should be closed or status updated...");
              return;
            }
            log.debug("process not ready, retrying in 10 seconds");
            setTimeout(() => {
                checkProcess(processUrl);
            }
            , 10000);
        }
    }).catch((error) => {
        log.error("error getting process status", error);
    });
  }

  useEffect(() => {
    setTimeout(() => {
      setTimer(timer + 1);
    }
    , 1000);
  }, [timer]);

  useEffect(() => {
    log.debug("tab mounted");
    checkProcess(props.url);
    setTimer(timer + 1);
    if(props.url !== openTabs[props.tabId].state.url){
      setStartUrl(openTabs[props.tabId].state.url);
    }
    setWebView(document.getElementById(webViewId));
    if(openWindows[props.windowId].type !== "browser"){
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      document.getElementById(addressBarId).disabled = true;
    }

    return () => {
      log.debug("tab unmounted", props.tabId, currentUrl);
      if(openTabs.hasOwnProperty(props.tabId)){
        log.debug("Tab is still open, closing that tab");
        //closeTab();
      }
      return;
    };
  }, []);

  useEffect(() => {
    if (webview != null) {
      log.debug("webview is not null");
      webview.addEventListener("did-navigate", (event: any) => {
        // Only log main frame navigation to avoid noise from iframe navigations
        if (event.isMainFrame) {
          // didNavigate(event);
          log.debug("did-navigate (main frame), wid",webview.getWebContentsId());
        }
      });
      webview.addEventListener("page-favicon-updated",(event: any) => updateTabIcon(event.favicons));
      webview.addEventListener("dom-ready", () => {
        const webContentsId = webview.getWebContentsId();
        log.debug("dom-ready, wid", webContentsId);

        // Update webContentsId in tab state - use ref to get latest openTabs
        const _openTabs = Object.assign({}, openTabsRef.current);
        if (_openTabs[tabId]) {
          const _tab = Object.assign({}, _openTabs[tabId]);
          _tab.webContentsId = webContentsId;
          _openTabs[tabId] = _tab;
          dispatch(sessionActions.setOpenTabs({ data: _openTabs }));
          log.info(`RemoteTab: Set webContentsId ${webContentsId} for tab ${tabId}`);
        } else {
          log.warn(`RemoteTab: Tab ${tabId} not found in openTabs when setting webContentsId`);
        }

        // Screenshots are now handled by ScreenshotManagerHub
      });
      webview.addEventListener("did-fail-load", (event: any) => {
        log.debug("did-fail-load", event);
        log.debug("wid",webview.getWebContentsId());
        // sleep and retry
        if(!isProcessRunning){
          setTimeout(() => {
            checkProcess(props.url);
         }, 5000);
        }else{
          // if process is running, reload web view until server is ready
          setTimeout(() => {
            webview.loadURL(props.url);
          }, 5000);
        }
      });

    } else {
      log.debug("webview is null");
      setWebView(document.getElementById(webViewId));
    }
  }, [webview]);

  useEffect(() => {
    const container = document.getElementById(props.tabId);
    if (container != null) {
      if(showSidebar){
        container.classList.add("resized-webview-container");
      }else{
        container.classList.remove("resized-webview-container");
      }
    }
  }, [showSidebar]);

  useEffect(() => {
    const container = document.getElementById(props.tabId);
    const controls = document.getElementById(controlsId);
    const cornerMenu = document.getElementById(cornerMenuId);
    if (activeWindow && container != null) {
      if (props.tabId === activeTabId && props.windowId === activeWindow.id  && props.workspaceId === workspace.id) {
        if(isDesktopStickyMode){
          if(props.desktopId !== desktop.id){
            container.classList.remove("d-none");
            cornerMenu.classList.remove("d-none");
            if (controls != null) {
              // controls.classList.remove("d-none");
            }
            log.debug("show tab");
            logActivity("user-1", props.tabId).then((response) => {
              log.debug("activity response", response);
            }).catch((error) => {
              log.debug("activity error", error);
            });
          }
        }else{
          container.classList.remove("d-none");
          cornerMenu.classList.remove("d-none");
          if (controls != null) {
            // controls.classList.remove("d-none");
          }
          log.debug("show tab");
          logActivity("user-1", props.tabId).then((response) => {
            log.debug("activity response", response);
          }).catch((error) => {
            log.debug("activity error", error);
          });
        }
      } else {
        log.debug("hide tab");
        container.classList.add("d-none");
        cornerMenu.classList.add("d-none");
        if (controls != null) {
          controls.classList.add("d-none");
        }
      }
    }
  }, [workspace, desktop, activeWindow,  activeTabId]);

  useEffect(() => {
    if(activeTabId === props.tabId){
      log.debug("Window.js: activeTabId", activeTabId);
      let _openTabs = Object.assign({}, openTabs);
      let _tab = Object.assign({}, _openTabs[activeTabId]);
      _tab.lastAccessed = Date.now();
      if(_tab.sleeping){
        _tab.sleeping = false;
        setStartUrl(_tab.state.url);
        setSleepWebView(false);
        setWebView(document.getElementById(webViewId));
      }
      _openTabs[activeTabId] = _tab;
      dispatch(sessionActions.setOpenTabs({data: _openTabs}));
    }
  }, [activeTabId]);

  useEffect(() => {
    log.debug("tab sleeping", props.sleeping);
    if(props.sleeping){
      setSleepWebView(true);
    }
  }, [props.sleeping]);

  useEffect(() => {
    try{
      if (webview == null) return;
      let _openTabs = Object.assign({}, openTabs);
      let _tab = Object.assign({}, _openTabs[props.tabId]);
      let _tabState = Object.assign({}, _tab.state);

      if(openWindows[props.windowId].type !== "app" && _tabState.icon !== currentFavIcon){
        _tabState.icon = currentFavIcon;
      }
      if(_tabState.title !== title){
        _tabState.title = title;
      }
      _tab.state = _tabState;
      _openTabs[props.tabId] = _tab;
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

    if (webview.canGoBack()) {
      backButton.classList.remove("disabled");
    } else {
      backButton.classList.add("disabled");
    }

    if (webview.canGoForward()) {
      forwardButton.classList.remove("disabled");
    } else {
      forwardButton.classList.add("disabled");
    }

    let _openTabs = Object.assign({}, openTabs);
    let _tab = Object.assign({}, _openTabs[props.tabId]);
    let _state = Object.assign({}, _tab.state);

    if(_state.url !== currentUrl){
      _state.url = currentUrl;
    }
    _tab.state = _state;
    _openTabs[props.tabId] = _tab;
    dispatch(
      sessionActions.setOpenTabs({
        data: _openTabs,
      })
    );

  }, [currentUrl]);

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
    setCurrentUrl(e.url);
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
    if(props.tabId !== activeTabId || webview.getURL() === currentUrl) return;
    
    if(webview.getTitle() !== title){
      setTitle(webview.getTitle());
    }

    if(favicons.length === 0) return;

    if(favicons[0] === currentFavIcon){
      log.debug("updateTabIcon", "same icon");
      return;
    }
    setCurrentFavIcon(favicons[0]);
  }

  function goHome() {
    webview.loadURL(openWindows[props.windowId].url);
  }

  function goBack() {
    webview.goBack();
  }

  function goForward() {
    webview.goForward();
  }

  function reload() {
    // webview.reload();
    webview.loadURL(currentUrl);
  }

  function handleCloseTab(){
    // @ts-expect-error TS(2554): Expected 13 arguments, but got 11.
    closeTab(openTabs[props.tabId], dispatch, openTabs, windowTabs, openWindows, browserWindows, activeTabId, activeTabs, desktop, isExternalWindowMode, sessionActions);
  }

  function switchToExternal() {
    alert("coming soon..."); return;
    // save window state to localStorage
    // then open new window
    // if only one tab move window to external
    openAppWindow(props.windowId, currentUrl, "external", 0, 0);
    dispatch(sessionActions.getBackToLaunchPad({data: {
      desktopId: desktop.id,
    }}));
    // if more than one tab, move tab to external
    
  }

  function minimizeWindow() {
    log.debug("closeWindow",props.windowId);
    dispatch(sessionActions.getBackToLaunchPad({data: {
      desktopId: desktop.id,
    }}));
    return;
  }

  function handleCloseWindow(){
    terminateProcess("user-1", activeTabId).then((response) => {
      log.debug("App.js: terminateProcess");
      closeWindow(dispatch, sessionActions, props.windowId, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
    }).catch((err) => {
      log.error("App.js: terminateProcess", err);
      closeWindow(dispatch, sessionActions, props.windowId, openWindows, openTabs, activeTabs, windowTabs, desktop, isExternalWindowMode);
    });
    
    return;
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
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "open-external-window",
        tabWindowId: props.windowId,
        tabId: props.tabId,
        url: webview.getURL(),
        partition: props.partition
      });
    }
  }

  function handleSwitchTab(tab: any){
    log.debug("handleSwitchTab", tab);
    dispatch(sessionActions.setActiveTab({data: tab}));
  }

  function tabDDItem(tab: any){
    
    if (tab && tab.state && tab.window === props.windowId) {
      let _icon = "";
      if(tab.type === "app"){
        _icon = localStorage.getItem(tab.state.icon);
      }else{
        _icon = tab.state.icon;
      }

      let tabTitle = tab.state.title === "" ? tab.state.url.substring(0,35).concat("...") : tab.state.title.substring(0,35).concat("...");
      return (
          <DropdownItem
              key={tab.id}
              active={tab.id === props.tabId}
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

  function tabsMenu(){
    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle} className="tabs-drop-down">
          <DropdownToggle color="dark" data-bs-toggle="tooltip" data-bs-placement="right" title="Switch Tab" data-bs-custom-className="custom-tooltip">
            <ChevronDown size={16}/>
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
    newTabForActiveWindow(dispatch, workspace, desktop, windowTabs, openTabs, activeTabs, activeWindow);
  }

  function handleLoad(){
    log.debug("handleLoad....");
  }

  function content(){
    if(sleepWebView) return (<></>);
    if(!isProcessRunning) return (
      <div className="d-flex justify-content-center align-middle h-100">
        <div className="spinner">
          <Spinner color="primary" />
        </div>
        <div className="spinner-text">
          <span className="text-secondary">Starting...</span> <br/>
          <span className="text-secondary">{timer} seconds</span>
        </div>
      </div>
    );
    return (
      <webview
        id={webViewId}
        className="remote-webview"
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
    )
  }

  return (
    <>
        <nav
          id={controlsId}
          className="navbar navbar-expand navbar-dark bg-dark window-navbar d-none"
        >
          <button
            id={"home-"+props.tabId}
            className="btn btn-dark ml-1"
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
            {/* @ts-expect-error TS(2322): Type '{ children: string; class: string; width: nu... Remove this comment to see the full error message */}
            <i className="fa fa-chevron-left" width={16} > </i>
          </button>
          <button
            id={forwardButtonId}
            className="btn btn-dark ml-2"
            onClick={() => goForward()}
            data-bs-toggle="tooltip" data-bs-placement="right" title="Next page" data-bs-custom-className="custom-tooltip"
          >
            {/* @ts-expect-error TS(2322): Type '{ children: string; class: string; width: nu... Remove this comment to see the full error message */}
            <i className="fa fa-chevron-right" width={16} > </i>
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
            id={"move-to-external-"+props.tabId}
            className="btn btn-dark d-none"
            onClick={() => moveTabToExternalWindow()}
            data-bs-toggle="tooltip" data-bs-placement="right" title="Open In New Window" data-bs-custom-className="custom-tooltip"
          >
            <ArrowUpRight size={16}/>
          </button>
          <button
            id={newTabButtonId}
            className="btn btn-dark new-tab-button"
            onClick={() => handleNewTab()}
            data-bs-toggle="tooltip" data-bs-placement="right" title="New Tab" data-bs-custom-className="custom-tooltip"
          >
            <PlusLg size={18} />
          </button>
          <button
            id={closeTabButtonId}
            className="btn btn-dark close-tab-button"
            onClick={() => handleCloseTab()}
            data-bs-toggle="tooltip" data-bs-placement="right" title="Close Tab" data-bs-custom-className="custom-tooltip"
          >
            <XLg size={16} />
          </button>
          {
            tabsMenu()
          }
          <input
            id={addressBarId}
            className="form-control remote-address-bar"
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
            id={"lock-"+props.tabId}
            className="btn btn-dark lock-button"
            onClick={() => alert("show site details. coming soon...")}
          >
            {
              isSecure ? <LockFill size={16} /> : <UnlockFill size={16} color="red" />
            }
          </button>
          <button
            id={"add-bookmark-"+props.tabId}
            className="btn btn-dark ml-1 d-none"
            onClick={() => alert("add to bookmarks, coming soon...")}
          >
            <Bookmark size={16} />
          </button>
          <button
            id={"add-bookmark-"+props.tabId}
            className="btn btn-dark ml-1"
            onClick={() => alert("add to favourites, coming soon...")}
          >
            <Star size={16} />
          </button>
          <button
            id={"copy-"+props.tabId}
            className="btn btn-dark ml-1 clipboard-button"
            onClick={() => copyToClipboard()}
            data-bs-toggle="tooltip" data-bs-placement="bottom" title={currentUrl}
          >
            { hasCopied ? <Check size={16} /> : <Clipboard size={16} /> }
          </button>
        </nav>
        <div id={cornerMenuId} className="window-corner-menu d-none">
          <ListGroup horizontal className="mr-1 mt-2">
            <ListGroupItem className="mr-2">
              <div
                id={"switch-external-"+props.tabId}
                onClick={() => moveTabToExternalWindow()}
              >
                <ArrowUpRightCircleFill size={16} color="green"/>
              </div>
            </ListGroupItem>
            <ListGroupItem className="mr-2">
              <div
                id={"switch-external-"+props.tabId}
                onClick={() => minimizeWindow()}
              >
                <DashCircleFill size={16} color="orange"/>
              </div>
            </ListGroupItem>
            <ListGroupItem>
              <div
                id={closeWindowbButtonId}
                onClick={() => handleCloseWindow()}
              >
                <XCircleFill size={16} color="red" />
              </div>
            </ListGroupItem>
          </ListGroup>
        </div>
      <div id={props.tabId} className="remote-webview-container bg-dark d-none" onClick={() => toggle()}>
        {
          content()
        }
      </div>
    </>
  );
}

export default RemoteTab;
