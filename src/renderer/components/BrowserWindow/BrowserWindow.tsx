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
  Link,
  Link45deg,
} from "react-bootstrap-icons";
import { openAppWindow, closeWindow } from "../../services/window";
import { newTabForActiveWindow } from "../../util/tabs";
import { closeTab } from "../../util/tabs";
import { sessionActions } from "../../store/session-slice";
import "./BrowserWindow.css";

import {BrowserState, BrowserStateFactory} from "../../model/state";
import BrowserStateService from "../../services/browsers";

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
  List,
} from "reactstrap";
import LoadingBar from 'react-top-loading-bar'
import { ArrowUpRight, Terminal } from "react-feather";

function BrowserWindow(props: any) {
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

  const activeWindowTabs = useSelector((state: any) => state.session.activeWindowTabs);

  const activeTabs = useSelector((state: any) => state.session.activeTabs);

  const activeTab = useSelector((state: any) => state.session.activeTab);

  const activeTabId = useSelector((state: any) => state.session.activeTabId);

  const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

  const isDesktopStickyMode = useSelector((state: any) => state.settings.isDesktopStickyMode);

  const isDeveloperMode = useSelector((state: any) => state.settings.isDeveloperMode);

  const showSidebar = useSelector((state: any) => state.window.showSidebar);

  const closedExternalTabId = useSelector((state: any) => state.session.closedExternalTabId);

  const activeBrowserWindowId = useSelector((state: any) => state.session.activeBrowserWindowId);

  const isSharedAppsEnabled = useSelector((state: any) => state.settings.isSharedAppsEnabled);

  const isBottomNavBarVisible = useSelector((state: any) => state.view.isBottomNavBarVisible);

  const [progress, setProgress] = useState(0);
  const [webview, setWebView] = useState(null);
  const [sleepWebView, setSleepWebView] = useState(false);
  const [webViewId, setWebViewId] = useState("webview-" + props.tabId);
  const [controlsId, setControlsId] = useState("controls-" + props.tabId);
  const [cornerMenuId, setCornerMenuId] = useState("cornerMenu-" + props.tabId);
  const [spinnerId, setSpinnerId] = useState("spinner-" + props.tabId);
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
  const [consolebButtonId, setConsoleButtonId] = useState(
    "closeWindowButton-" + props.tabId
  );

  const [tabsNavBarId, setTabsNavBarId] = useState(
    "tabsNavBar-" + props.tabId
  );

  const [startUrl, setStartUrl] = useState(props.url);
  const [currentUrl, setCurrentUrl] = useState("");
  const [title, setTitle] = useState("");
  const [currentFavIcon, setCurrentFavIcon] = useState("");
  const [addressBarValue, setAddressBarValue] = useState("");
  const [isSecure, setIsSecure] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [takeScreenShot, setTakeScreenShot] = useState(false);
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTabsBar, setShowTabsBar] = useState(true);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  useEffect(() => {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new Tooltip(tooltipTriggerEl)
    })
  });

  useEffect(() => {
    log.debug("tab mounted");
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
        log.debug("did-navigate, wid",webview.getWebContentsId(), "isMainFrame:", event.isMainFrame);
        // Only process main frame navigation to avoid capturing iframe URLs (e.g., Google widgets)
        if (event.isMainFrame) {
          didNavigate(event);
        }
      });
      webview.addEventListener("page-favicon-updated",(event: any) => updateTabIcon(event.favicons));
      webview.addEventListener("dom-ready", () => {
        log.debug("dom-ready, wid", webview.getWebContentsId());
        setTakeScreenShot(true);
      });
      webview.addEventListener("did-fail-load", (event: any) => {
        log.error("did-fail-load", event);
        setLoading(false);
        if (event.errorCode !== -3) {
          //webview.loadURL("https://www.google.com/search?q=" + event.validatedURL);
        }
      });

      webview.addEventListener("mouse-down", (event: any) => {
        log.debug("mouse-down", event);
      });

      webview.addEventListener("media-started-playing", (event: any) => {
        log.debug("media-started-playing", event);
        setMediaPlaying(true);
      });

      webview.addEventListener("media-paused", (event: any) => {
        log.debug("media-paused", event);
        setMediaPlaying(false);
      });

      webview.addEventListener("did-start-loading", (event: any) => {
        setProgress(10);
        setTimeout(() => {
          setProgress(20);
        }, 100);
        setTimeout(() => {
          setProgress(30);
        }, 150);
        setTimeout(() => {
          setProgress(40);
        }, 200);
        setTimeout(() => {
          setProgress(50);
        }, 200);
        setLoading(true);
      });

      webview.addEventListener("did-stop-loading", (event: any) => {
        setProgress(100);
      });

      webview.addEventListener("did-finish-load", (event: any) => {
        log.debug("did-finish-load", event);
        setProgress(90);
        setTimeout(() => {
          setProgress(100);
        }, 100);
      });

    } else {
      log.debug("webview is null");
      setWebView(document.getElementById(webViewId));
    }


  }, [webview]);

  useEffect(() => {
    let _openTabs = Object.assign({}, openTabs);
    let _tab = Object.assign({}, _openTabs[props.tabId]);
    _tab.mediaPlaying = mediaPlaying;
    _openTabs[props.tabId] = _tab;
    dispatch(sessionActions.setOpenTabs({data: _openTabs}));
  }, [mediaPlaying]);

  // Screenshot capture is now handled by ScreenshotManagerHub
  // Components retrieve cached screenshots as needed
  useEffect(() => {
    if(takeScreenShot && props.location === "main"){
      setTakeScreenShot(false);
      // Screenshots are automatically captured by background service
    }
  }, [takeScreenShot]);

  useEffect(() => {
    const container = document.getElementById(props.tabId);
    const tabsNavBar = document.getElementById(tabsNavBarId);
    if (container != null) {
      if(showSidebar){
        container.classList.add("resized-webview-container");
        tabsNavBar.classList.add("resized-webview-container");
      }else{
        container.classList.remove("resized-webview-container");
        tabsNavBar.classList.remove("resized-webview-container");
      }
    }
  }, [showSidebar]);

  useEffect(() => {
    if(activeTabId !== props.tabId) return;
    const container = document.getElementById(props.tabId);
    const tabsNavBar = document.getElementById(tabsNavBarId);
    if (container != null) {
      if(!showTabsBar){
          container.classList.remove("show-tab");
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
        setTimeout(() => {
          tabsNavBar.classList.add("d-none");
        }, 100);
      }else{
          if(isBottomNavBarVisible){
            container.classList.remove("no-tab-bar");
            container.classList.remove("no-bottom-bar");
            container.classList.remove("no-tab-and-bottom-bar");
          }else{
            container.classList.remove("no-tab-bar");
            container.classList.remove("no-tab-and-bottom-bar");
            container.classList.add("no-bottom-bar");
          }
          setTimeout(() => {
            container.classList.add("show-tab");
          }, 100);

        tabsNavBar.classList.remove("d-none");
      }
    }
  }, [windowTabs, webview, activeTabId, isSharedAppsEnabled, isBottomNavBarVisible]);

  useEffect(() => {
    const container = document.getElementById(props.tabId);
    const controls = document.getElementById(controlsId);
    const tabsNavbar = document.getElementById(tabsNavBarId);
    const cornerMenu = document.getElementById(cornerMenuId);
    const spinner = document.getElementById(spinnerId);
    if (activeWindow && container != null) {
      if (props.tabId === activeTabId && props.windowId === activeWindow.id  && props.workspaceId === workspace.id) {
        if(isDesktopStickyMode){
          if(props.desktopId !== desktop.id){
            container.classList.remove("d-none");
            cornerMenu.classList.remove("d-none");
            spinner.classList.remove("d-none");
            if (controls != null) {
              controls.classList.remove("d-none");
            }
            if(tabsNavbar != null){
              tabsNavbar.classList.remove("d-none");
            }
            log.debug("show tab");
          }
        }else{
          container.classList.remove("d-none");
          cornerMenu.classList.remove("d-none");
          spinner.classList.remove("d-none");
          if (controls != null) {
            controls.classList.remove("d-none");
          }
          if(tabsNavbar != null){
            tabsNavbar.classList.remove("d-none");
          }
          log.debug("show tab");
        }
      } else {
        log.debug("hide tab");
        container.classList.add("d-none");
        cornerMenu.classList.add("d-none");
        spinner.classList.add("d-none");
        if (controls != null) {
          controls.classList.add("d-none");
        }
        if(tabsNavbar != null){
          tabsNavbar.classList.add("d-none");
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

  function handleCloseTab(tab: any){
    if(tab === null || tab === undefined){
      tab = openTabs[props.tabId];
    }
    // @ts-expect-error TS(2554): Expected 13 arguments, but got 11.
    closeTab(tab, dispatch, openTabs, windowTabs, openWindows, browserWindows, activeTabId, activeTabs, desktop, isExternalWindowMode, sessionActions);
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
    // save window state
    dispatch(sessionActions.getBackToLaunchPad({data: {
      desktopId: desktop.id,
    }}));
    let state = {
      browserWindows: [],
      openWindows: {},
      windowTabs: {},
      activeTabs: {},
      openTabs: {},
      activeBrowserWindowId: activeBrowserWindowId,
    }

    let _openTabs = Object.assign({}, openTabs);
    let _openWindows = Object.assign({}, openWindows);
    let _activeTabs = Object.assign({}, activeTabs);
    let _windowTabs = Object.assign([], windowTabs);
    let _browserWindows = Object.assign([], browserWindows);
    let _filtered = _browserWindows;
    browserWindows.forEach((windowId: any) => {
      log.debug("close browser window...", windowId)

      let interrupted = false;
      if (_openWindows.hasOwnProperty(windowId)) {
        state.openWindows[windowId] = _openWindows[windowId];
        delete _openWindows[windowId];
      }else{
        interrupted = true;
      }

      if (windowTabs.hasOwnProperty(windowId)) {
        state.windowTabs[windowId] = _windowTabs[windowId];
        delete _windowTabs[windowId];
      }else{
        interrupted = true;
      }

      if (_activeTabs.hasOwnProperty(windowId)) {
        state.activeTabs[windowId] = _activeTabs[windowId];
        delete _activeTabs[windowId];
      }else{
        interrupted = true;
      }


      _filtered = _filtered.filter((item: any) => item !== windowId);

      Object.values(_openTabs).forEach((tab: any) => {

        if(tab.window === windowId){

          log.debug("closeWindow:delete tab:"+tab.id);
          //update tab url with current url

          let _tab = Object.assign({}, _openTabs[tab.id]);

          _tab.url = tab.state.url;
          //sleep tab
          _tab.sleeping = true;
          if(!interrupted){

            state.openTabs[tab.id] = _tab;
          }


          if(tab.location === "external"){
            if(isElectron()){
              // @ts-expect-error
              window.electronAPI.send("toMain", {
                action: "close-tab",

                closeTabWindowId: tab.window,

                closeTabId: tab.id,
              });
            }
          }

          delete _openTabs[tab.id];
        }
      });


      if(isElectron()){
        // @ts-expect-error
        window.electronAPI.send("toMain", {
            action: "close-window",
            id: windowId,
        });
      }

      if(interrupted){
        delete state.openWindows[windowId];
        delete state.windowTabs[windowId];
        delete state.activeTabs[windowId];
      }else{
        state.browserWindows.push(windowId);
      }
    });

    BrowserStateService.getBrowserStateByWorkspaceId(workspace.id).then((res: any) => {
      if(res){

        BrowserStateService.updateBrowserState(res.id, state).then((res) => {
          log.debug("updateBrowserState", res);
          dispatch(sessionActions.setBrowserWindows({data: _filtered}));
          dispatch(sessionActions.setOpenWindows({data: _openWindows,}));
          dispatch(sessionActions.setActiveTabs({data: _activeTabs,}));
          dispatch(sessionActions.setWindowTabs({data: _windowTabs,}));
          dispatch(sessionActions.setOpenTabs({data: _openTabs,}));
          dispatch(sessionActions.setBrowserWindows({data: []}));
          dispatch(sessionActions.setActiveBrowserWindowId({data: ""}));
        }).catch((err) => {
          log.error(err);
        });
      }else{
        BrowserStateService.createBrowserState(workspace.id, state).then((res) => {
          log.debug("createBrowserState", res);
          dispatch(sessionActions.setBrowserWindows({data: _filtered}));
          dispatch(sessionActions.setOpenWindows({data: _openWindows,}));
          dispatch(sessionActions.setActiveTabs({data: _activeTabs,}));
          dispatch(sessionActions.setWindowTabs({data: _windowTabs,}));
          dispatch(sessionActions.setOpenTabs({data: _openTabs,}));
          dispatch(sessionActions.setBrowserWindows({data: []}));
          dispatch(sessionActions.setActiveBrowserWindowId({data: ""}));
        }).catch((err) => {
          log.error(err);
        });
      }
    }).catch((err) => {
      log.error(err);
    });

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

      let _openTabs = Object.assign({}, openTabs);
      let _tab = Object.assign({}, _openTabs[props.tabId]);

      _tab.location = "external";
      _openTabs[props.tabId] = _tab;
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

    if (tab && tab.state && tab.window === props.windowId) {
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
              dropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />
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
    if(windowTabs[props.windowId].length > 19){
      alert("You have reached the maximum number of tabs allowed in a browser page.");
      return;
    }
    newTabForActiveWindow(dispatch, workspace, desktop, windowTabs, openTabs, activeTabs, activeWindow);
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
      const storeSS = isElectron() && window.electronAPI?.screenshot ? window.electronAPI.screenshot.get("screenshot-"+props.tabId) : null;
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
    if (tab && tab.state && tab.window === props.windowId) {
      let _icon = "";
      if(tab.type === "app"){
        _icon = "./images/store/icon/"+tab.state.icon;
      }else{
        _icon = tab.state.icon;
      }
      let tabTitle =  "";
      if(windowTabs[props.windowId].length < 12){
        tabTitle = tab.state.title === "" ? openWindows[props.windowId].data.name : tab.state.title.length > 10 ? tab.state.title.substring(0,10).concat("...") : tab.state.title;
      }
      let isActive = props.tabId === tab.id ? " active" : "";
      return (
        <ListGroupItem className={"align-self-center h-100 flex-md-fill " + isActive}>
          <Container fluid className="tab-bar-item w-100 h-100 align-self-center">
              <Row className="w-100 h-100" onClick={() => handleSwitchTab(tab)}>
                <Col xs={1} className="d-flex align-items-center h-100" onClick={() => handleSwitchTab(tab)}>

                    {
                      tab.sleeping ? (
                        <div className="d-flex justify-content-center sleeping-tab">
                          <Speedometer size={16} color="gray" className="align-self-center"></Speedometer>
                        </div>
                      ) : (
                        <div className="d-flex justify-content-center">
                          <img className="tab-icon-dd" width={16} height={16} src={_icon} alt=""/>
                        </div>
                      )
                    }

                </Col>
                <Col xs={9} className="d-flex align-items-center h-100" onClick={() => handleSwitchTab(tab)}>
                  {}
                  <div className="d-flex justify-content-start w-100">
                      <span className="text-white text-sm text-truncate">{tabTitle}</span>
                  </div>
                </Col>
              </Row>
              <div className="d-flex justify-content-end move-to-external-button">
                {
                  isActive ? (
                    <ArrowUpRightSquareFill size={16} color="green" onClick={() => moveTabToExternalWindow()}></ArrowUpRightSquareFill>
                  ) : (
                    <></>
                  )
                }
              </div>
              <div className="d-flex justify-content-end close-button" >
                <XSquareFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XSquareFill>
              </div>
          </Container>

        </ListGroupItem>
      )
    }
  }

  return (
    <div className="browser-window">
      <nav
        id={controlsId}
        className="navbar navbar-expand navbar-dark bg-dark window-navbar d-none"
      >
        <button
          id={"home-"+props.tabId}
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
          id={"move-to-external-"+props.tabId}
          className="btn btn-dark d-none"
          onClick={() => moveTabToExternalWindow()}
          data-bs-toggle="tooltip" data-bs-placement="right" title="Open In New Window" data-bs-custom-className="custom-tooltip"
        >
          <ArrowUpRight size={16}/>
        </button>
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
          id={"lock-"+props.tabId}
          className="btn btn-dark lock-button d-none"
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
          className="btn btn-dark ml-1 d-none"
          onClick={() => alert("add to favourites, coming soon...")}
        >
          <Star size={16} />
        </button>
        {
          isDeveloperMode && (
            <button
              id={"console-"+props.tabId}
              className="btn btn-dark ml-1"
              onClick={() => webview.openDevTools()}
              data-bs-toggle="tooltip" data-bs-placement="right" title="Developer Tools" data-bs-custom-className="custom-tooltip"
            >
              <Terminal size={16} />
            </button>
          )
        }
        <button
          id={"copy-"+props.tabId}
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
        <ListGroup horizontal className="tab-items justify-content-between flex-nowrap">
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


      </nav>
      <div id={cornerMenuId} className="window-corner-menu d-none">
        <ListGroup horizontal className="mr-1 mt-1">
          <ListGroupItem>
          {
            windowTabs[props.windowId] && windowTabs[props.windowId].length > 7 && (
              <button
                id={newTabButtonId}
                className="btn btn-dark"
                onClick={() => handleNewTab()}
                data-bs-toggle="tooltip" data-bs-placement="right" title="New Tab" data-bs-custom-className="custom-tooltip"
              >
                <PlusLg size={16} />
              </button>
            )
          }
            <button
                id={closeWindowbButtonId}
                className="btn btn-dark"
                onClick={() => handleCloseWindow()}
                data-bs-toggle="tooltip" data-bs-placement="right" title="Close Window" data-bs-custom-className="custom-tooltip"
              >
                <XLg size={16} />
              </button>
          </ListGroupItem>
        </ListGroup>
      </div>
      <div id={spinnerId} className="loading-spinner d-none">
        {
          loading && (
            <LoadingBar color="#f11946" progress={progress} onLoaderFinished={() => log.debug("Loader finished...")} />
          )
        }
      </div>
      <div id={props.tabId} className="webview-container bg-dark d-none">
        {
          webView()
        }
      </div>
    </div>
  );
}

export default BrowserWindow;
