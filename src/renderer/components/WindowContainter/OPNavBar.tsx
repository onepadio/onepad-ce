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
  Dash,
  ArrowsFullscreen,
  Fullscreen,
  FullscreenExit,
  Pause,
  GridFill,
  Grid,
  ArrowBarRight,
  ArrowBarLeft,
} from "react-bootstrap-icons";
import { openAppWindow, closeWindow } from "../../services/window";
import { newTabForActiveWindow } from "../../util/tabs";
import { closeTab } from "../../util/tabs";
import { appActions } from "../../store/app-slice";
import { sessionActions } from "../../store/session-slice";
import { viewActions } from "../../store/view-slice";
import { windowBarActions } from "../../store/windowbar-slice";
import { tabsBarActions, tabsBarVisualModes } from "../../store/tabsbar-slice";

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
import "./OPNavBar.css";

import { 
  controlsId, cornerMenuId, spinnerId, addressBarId, backButtonId, forwardButtonId, tabsNavBarId, showTabsBarButtonId, hideTabsBarButtonId,
  reloadButtonId, newTabButtonId, closeWindowButtonId
} from "./shared";

function OPNavBar(props: any){
    const dispatch = useDispatch();
    const route = useSelector((state: any) => state.session.route);
    const user = useSelector((state: any) => state.user);

    
    const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
    
    const workspaceState = useSelector((state: any) => state.workspace);
    
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
    
    const isExtended = useSelector((state: any) => state.view.isExtended);
    
    const isExtendedMode = useSelector((state: any) => state.view.isExtendedMode);
    
    const tabsBarVisualMode = useSelector((state: any) => state.tabsBar.mode);

    const [progress, setProgress] = useState(0);
    const [webview, setWebView] = useState(null);
    const [sleepWebView, setSleepWebView] = useState(false);

    const [webViewId, setWebViewId] = useState("webview-");
    

    
    const currentUrl = useSelector((state: any) => state.windowBar.currentUrl);
    const [title, setTitle] = useState("");
    const [currentFavIcon, setCurrentFavIcon] = useState("");
    const [addressBarValue, setAddressBarValue] = useState("");
    const [isSecure, setIsSecure] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);
    const [takeScreenShot, setTakeScreenShot] = useState(false);
    const [mediaPlaying, setMediaPlaying] = useState(false);
    const [showTabsBar, setShowTabsBar] = useState(true);
    const [shortUrl, setShortUrl] = useState("");

    
    const isTabsScreenVisible = useSelector((state: any) => state.app.tabsScreenVisible);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen((prevState) => !prevState);
    
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

    function moveTabToExternalWindow(){
        let _window = openWindows[activeWindow.id];
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
            action: "open-external-window",
            tabWindowId: activeWindow.id,
            tabId: activeTabId,
            url: webview.getURL(),
            partition: getPartitionId(),
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

    function getPartitionId(){
      let partition = "";
      if(route === "authenticated"){
        partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+user.username+"_"+workspaceState.currentSession.id : "persist:"+user.username+"_"+workspace.id;
      }else{
        partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+workspaceState.currentSession.id : "persist:"+workspace.id;
      }
      return partition;
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

      function switchToExternal() {
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

      function extend(){
        if(isExtendedMode){
          // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
          dispatch(viewActions.toggleExtendedMode());
          dispatch(viewActions.setIsExtended(false));
        }else{
          dispatch(tabsBarActions.switchToTabsMode());
          // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
          dispatch(viewActions.toggleExtendedMode());
          dispatch(viewActions.setIsExtended(true));
        }
      }
    
    useEffect(() => {
        if(activeTabId === null || activeTabId === undefined || activeTabId === "launchpad") return;
        let _tab = openTabs[activeTabId] ? openTabs[activeTabId] : null;
        if(_tab === null) return;
        if(_tab && _tab.state && _tab.state.url) dispatch(windowBarActions.setCurrentUrl(_tab.state.url));
        setWebViewId("webview-" + activeTabId);
        setWebView(document.getElementById("webview-" + activeTabId));
        if(openWindows[_tab.window].type !== "browser"){
            //document.getElementById(addressBarId).disabled = true;
        }
    }, [activeTabId]);
    
    useEffect(() => {
        log.debug("currentUrl", currentUrl);
        if(currentUrl === "") return;
        const addressBar = document.getElementById(addressBarId);
        let _hostname = new URL(currentUrl).hostname;
        let _protocol = new URL(currentUrl).protocol;
        log.debug("protocol:", _protocol);
        if(_protocol === "https:"){
            setAddressBarValue("https://" + _hostname);
            setShortUrl("https://" + _hostname);
        }else if(_protocol === "http:"){
            setAddressBarValue("http://" + _hostname);
            setShortUrl("https://" + _hostname);
        }
    }, [currentUrl]);

    useEffect(() => {
      let _webview = document.getElementById(webViewId);
      if(_webview === null || _webview === undefined) return;
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

  }, [webViewId]);
      
    return (
        <div className="op-navbar">
            <nav
                id={controlsId}
                className="navbar navbar-expand navbar-dark bg-dark window-new-navbar"
            >   
                
                {
                    tabsBarVisualMode !== tabsBarVisualModes.TABS ? (
                      <button
                          id={"grid-"+activeTabId}
                          className="btn btn-dark ml-1"
                          onClick={() =>  dispatch(tabsBarActions.switchToTabsMode())}
                          data-bs-toggle="tooltip" data-bs-placement="right" title="Go Home" data-bs-custom-className="custom-tooltip" data-bs-trigger="hover focus"
                      >
                      
                        <ArrowBarLeft size={20} color="white" ></ArrowBarLeft>
                      </button>
                    ) : (
                      <button
                        id={"grid-"+activeTabId}
                        className="btn btn-dark ml-1"
                        onClick={() => dispatch(tabsBarActions.switchToSpaceMode())}
                        data-bs-toggle="tooltip" data-bs-placement="right" title="Go Home" data-bs-custom-className="custom-tooltip" data-bs-trigger="hover focus"
                      >
                        <ArrowBarRight size={20} color="white" ></ArrowBarRight>
                      </button>
                    )
                }
                <button
                    id={"home-"+activeTabId}
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
                
                <input
                id={addressBarId}
                className="form-control address-bar-new"
                type="search"
                placeholder=""
                aria-label="Search"
                value={addressBarValue}
                onKeyDown={(e) => {navigate(e)}}
                //onChange={(e) => setAddressBarValue(e.target.value)}
                onFocus={(e) => { setAddressBarValue(currentUrl); e.target.setSelectionRange(0, e.target.value.length); }}
                onBlur={(e) => { setAddressBarValue(shortUrl) }}
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
            <div id={cornerMenuId} className="window-corner-menu">
                <ListGroup horizontal className="mr-1 mt-1">
                    <ListGroupItem>
                        <button
                            id={"move-to-external-"+props.tabId}
                            className="btn btn-dark close-tab-button"
                            onClick={() => moveTabToExternalWindow()}
                        >
                            <ArrowUpRight size={16} color="white"/>
                        </button>
                    </ListGroupItem>
                    <ListGroupItem>
                    <button
                        id={"switch-external-"+props.tabId}
                        className="btn btn-dark close-tab-button"
                        onClick={() => minimizeWindow()}
                    >
                        <Dash size={16} color="white"/>
                    </button>
                    </ListGroupItem>
                    <ListGroupItem>
                    <button
                        id={"switch-external-"+props.tabId}
                        className="btn btn-dark close-tab-button"
                        onClick={() => extend()}
                    >
                        {
                            isExtendedMode ? <FullscreenExit size={16} color="white"/> : <Fullscreen size={16} color="white"/>
                        }
                    </button>
                    </ListGroupItem>
                    <ListGroupItem>
                        <button
                        id={closeWindowButtonId}
                        className="btn btn-dark close-tab-button"
                        onClick={() => handleCloseWindow()}
                        data-bs-toggle="tooltip" data-bs-placement="right" title="Close Window" data-bs-custom-className="custom-tooltip"
                        >
                        <Pause size={16} />
                        </button>
                    </ListGroupItem>
                </ListGroup>
            </div>
        </div>
    );
}

export default OPNavBar;