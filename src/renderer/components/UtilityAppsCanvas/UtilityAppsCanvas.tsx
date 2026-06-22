import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, ListGroup, ListGroupItem, Offcanvas, OffcanvasBody, OffcanvasHeader, UncontrolledDropdown } from "reactstrap";
import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';
import { utilityAppsActions } from "../../store/utility-slice";

import "./UtilityAppsCanvas.css"
import clsx from "clsx";
import { itemsDb } from "../../data/store";
import { ArrowBarLeft, ArrowBarRight, ArrowClockwise, ArrowLeft, ArrowRight, ArrowsAngleContract, ArrowsExpand, ArrowsFullscreen, ChevronLeft, ChevronRight, Fullscreen, FullscreenExit, Kanban, Recycle, Robot, XLg } from "react-bootstrap-icons";
import { ReactSVG } from 'react-svg';

import { utilityAppItemsDb, utilityAppOthers, utilityAppSearch } from "./utility_apps";
import { windowServiceActions } from "../../store/window-service-slice";
import { Home } from "react-feather";

function UtilityAppsCanvas(){
    const dispatch = useDispatch();
    const route = useSelector((state: any) => state.session.route);

    const user = useSelector((state: any) => state.user);

    const profileId = useSelector((state: any) => state.app.profileId);

    const userId = useSelector((state: any) => state.user.id);

    const personId = useSelector((state: any) => state.app.personId);

    const isOpen = useSelector((state: any) => state.utility.isOpen);

    const title = useSelector((state: any) => state.utility.title);

    const icon = useSelector((state: any) => state.utility.icon);

    const url = useSelector((state: any) => state.utility.webviewUrl);

    const webviewUrl = useSelector((state: any) => state.utility.webviewUrl);

    const direction = useSelector((state: any) => state.utility.direction);

    const backdrop = useSelector((state: any) => state.utility.backdrop);

    const fade = useSelector((state: any) => state.utility.fade);

    const width = useSelector((state: any) => state.utility.width);

    const scopes = useSelector((state: any) => state.utility.scopes);

    const activeCategory = useSelector((state: any) => state.utility.activeCategory);

    const previousCategory = useSelector((state: any) => state.utility.previousCategory);

    const activePlayer = useSelector((state: any) => state.utility.activePlayer);

    const searchQuery = useSelector((state: any) => state.utility.searchQuery);


    const workspaceState = useSelector((state: any) => state.workspace);

    const sessionState = useSelector((state: any) => state.session);

    const [partitionId, setPartitionId] = useState("");
    const [scope, setScope] = useState("");
    const [webview, setWebview] = useState(null);
    const [windowId, setWindowId] = useState(uuidv4());
    const [webviewId, setWebviewId] = useState("utility-"+uuidv4());
    const [webviewHeight, setWebviewHeight] = useState("calc(100% - 55px)");
    const [isFullScreen, setIsFullScreen] = useState(false);


    function handleLoad(){

    }

    useEffect(() => {
      if(!webview){
        setWebview(document.getElementById(webviewId));
      }else{
        webview.addEventListener("dom-ready", () => {
          log.debug("dom-ready, wid", webview.getWebContentsId());
        });
        webview.addEventListener("did-start-loading", () => {
          log.debug("did-start-loading");
        });
        webview.addEventListener("did-stop-loading", () => {
          log.debug("did-stop-loading");
          webview.classList.remove("hidden");
        });
        webview.addEventListener("did-navigate", (event: any) => {
          // Only handle main frame navigation to avoid noise from iframe navigations
          if (event.isMainFrame) {
            log.debug("did-navigate (main frame)");
            webview.classList.remove("hidden");
          }
        });
        webview.addEventListener("did-navigate-in-page", (event: any) => {
          // Only handle main frame navigation to avoid noise from iframe navigations
          if (event.isMainFrame) {
            log.debug("did-navigate-in-page (main frame)");
            webview.classList.remove("hidden");
          }
        });
      }
    }, [webview]);

    function getPartitionId(_scope){
      let partition = "";
      let _workspaceId = workspaceState.selectedWorkspace.id;
      if(_scope === "profile"){
        partition = "persist:"+profileId;
      }else{
        if(route === "authenticated"){
          partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+user.username+"_"+workspaceState.currentSession.id : "persist:"+user.username+"_"+_workspaceId;
        }else{
          partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+workspaceState.currentSession.id : "persist:"+_workspaceId;
        }
      }
      return partition;
    }

    useEffect(() => {
      if(activeCategory === "" || activeCategory === undefined) return;
      let _window = document.getElementById(windowId);
      let _webview = document.getElementById(webviewId);
      let _offcanvas = document.getElementById("utility-offcanvas-"+windowId);
      if(_window){
        if(isOpen){
          let _previousItemId = undefined;
          if(localStorage.getItem("utility-window-state") !== undefined && localStorage.getItem("utility-window-state") !== null){
            let _state = JSON.parse(localStorage.getItem("utility-window-state"));
            if(_state[activeCategory] !== undefined){
              _previousItemId = _state[activeCategory];
            }
          }
          let _item = undefined;
          if(_previousItemId !== undefined && _previousItemId !== null && _previousItemId !== ""){
            _item = itemsDb[_previousItemId] ? itemsDb[_previousItemId] : utilityAppOthers[_previousItemId];
          }else{
            _item = itemsDb[utilityAppItemsDb[activeCategory][0]] ? itemsDb[utilityAppItemsDb[activeCategory][0]] : utilityAppOthers[utilityAppItemsDb[activeCategory][0]];
          }
          log.debug("activeCategory ", activeCategory, " _item ", _item);
          if(_item){
            if(previousCategory !== activeCategory){
              webview.classList.add("hidden");
              if(activeCategory === "search" && searchQuery !== "" && searchQuery !== undefined){
                dispatch(utilityAppsActions.setUrl(_item.search+searchQuery));
              }else{
                dispatch(utilityAppsActions.setUrl(_item.login));
              }

              dispatch(utilityAppsActions.setTitle(_item.name));
              dispatch(utilityAppsActions.setActivePlayer(_item.id));
              if(webview){
                webview.clearHistory();
              }
            }else{
              if(activeCategory === "search" && searchQuery !== "" && searchQuery !== undefined){
                dispatch(utilityAppsActions.setUrl(_item.search+searchQuery));
              }else{
                dispatch(utilityAppsActions.setUrl(_item.login));
              }
            }
            setTimeout(() => {
              _window.classList.add("utility-canvas-open");
              _offcanvas.classList.remove("hidden");
            }, 200);
          }
        }else{
          if(localStorage.getItem("utility-window-state") !== undefined && localStorage.getItem("utility-window-state") !== null){
            let _state = JSON.parse(localStorage.getItem("utility-window-state"));
            _state[activeCategory] = activePlayer;
            localStorage.setItem("utility-window-state", JSON.stringify(_state));
          }else{
            if(activePlayer !== "" && activeCategory !== "" && activePlayer !== undefined && activeCategory !== undefined){
              let _state = {};
              _state[activeCategory] = activePlayer;
              localStorage.setItem("utility-window-state", JSON.stringify(_state));
            }
          }
          _window.classList.remove("utility-canvas-open");
          _offcanvas.classList.add("hidden");
        }
      }
    }, [isOpen, activeCategory]);


    useEffect(() => {
      log.debug("WebViewCanvas useEffect: ", partitionId, webviewUrl);
      if(webview && webviewUrl && partitionId !== ""){
        // webview.loadURL(webviewUrl);
        log.debug("webview ", webview, " partitionId ", partitionId, " webviewUrl ", webviewUrl);
      }
    }, [partitionId, webviewUrl]);

    useEffect(() => {
      if(!utilityAppItemsDb || activeCategory === "" || itemsDb[utilityAppItemsDb[activeCategory]] === undefined ) return;
      let _item = itemsDb[utilityAppItemsDb[activeCategory][0]];
      dispatch(utilityAppsActions.setUrl(_item.login));
      dispatch(utilityAppsActions.setTitle(_item.name));
      dispatch(utilityAppsActions.setActivePlayer(_item.id));
      if(webview){
        webview.clearHistory();
      }
    }, []);

    useEffect(() => {
      if(scopes.length > 1){
       setWebviewHeight("calc(100% - 40px)");
       setScope("space");
      }else{
        setWebviewHeight("calc(100vh - 56px)");
        setScope(scopes[0]);
      }
    }, [scopes,webviewUrl]);

    useEffect(() => {
      if(isFullScreen){
        dispatch(utilityAppsActions.setWidth("calc(100%)"));
      }else{
        dispatch(utilityAppsActions.setWidth("40%"));
      }
    }, [isFullScreen]);

    function handleSwitchWindow(item){
      let _url = item.login;
      if(activeCategory === "search" && searchQuery !== "" && searchQuery !== undefined){
        _url = item.search+searchQuery;
      }
      if(item.id === activePlayer){
        webview.loadURL(_url);
        return;
      }

      dispatch(utilityAppsActions.setUrl(_url));
      dispatch(utilityAppsActions.setTitle(item.name));
      dispatch(utilityAppsActions.setIcon(item.icon));
      dispatch(utilityAppsActions.setActivePlayer(item.id));
      if(webview){
        webview.clearHistory();
      }

      let _state = JSON.parse(localStorage.getItem("utility-window-state"));
      _state[activeCategory] = item.id;
      localStorage.setItem("utility-window-state", JSON.stringify(_state));
      if(activeCategory === "search"){
        dispatch(windowServiceActions.setSearchEngine(item));
      }
    }

    function menuItem(item: any, from: string){
      let _icon = from === "itemDb" ? "./images/store/icon/"+item.icon : item.icon;

      if(_icon.includes("svg")){
        if(item.id !== activePlayer){
          _icon = (
            <ReactSVG src={_icon} className="launch-icon grayscale" />
          )
        }else{
          _icon = (
            <ReactSVG color="white" src={_icon} className="launch-icon" />
          )
        }
      }else{
        if(item.id !== activePlayer){
          _icon = (
                        <img width={24} height={24} className="launch-icon grayscale" src={_icon} alt="" />
          )
        }else{
          _icon = (
                        <img width={24} height={24} className="launch-icon" src={_icon} alt="" />
          )
        }
      }

      return(
        <ListGroupItem key={uuidv4()} className="nav-item" onClick={() => handleSwitchWindow(item)}>
          <div
            className="appicon d-flex justify-content-center" data-bs-toggle="tooltip" data-bs-placement="right" title={item.name} data-bs-custom-className="custom-tooltip"
            onContextMenu={(e) => {
              e.preventDefault(); // prevent the default behaviour when right clicked
            }}
          >
            {
              _icon
            }
          </div>
        </ListGroupItem>
        )

    }

    return <>
        <div
          id={"utility-offcanvas-"+windowId}
          className={clsx(
            "!m-0 fixed inset-0 z-998",
            "items-end justify-end",
            "bg-black/50",
            "utility-offcanvas",
            "flex hidden",
          )}
          onClick={() => dispatch(utilityAppsActions.close())}
        >

      </div>

      <div
        id={windowId}
        className={"utility-canvas d-flex" }
        style={{width: width}}
      >

        <div className="utility-sidebar">
          <ListGroup>
            <ListGroupItem>
                <div className=" w-100 d-flex mt-2 justify-content-center">
                  <Button color="dark" onClick={() => {
                    dispatch(utilityAppsActions.close());
                    setIsFullScreen(false);
                  }} className={"utility-close-button"}>
                <XLg color="white" size={14} />
              </Button>
            </div>
            </ListGroupItem>
            {
              utilityAppItemsDb[activeCategory] !== undefined ?
                utilityAppItemsDb[activeCategory]?.map((id) => {
                    return itemsDb[id] ? menuItem(itemsDb[id], "itemDb") : menuItem(utilityAppOthers[id], "others");
                })
              : null
            }
          </ListGroup>
          <div className="d-flex w-100 justify-content-center expand-button">
            {
              isFullScreen ? <Button color="dark" onClick={() => setIsFullScreen(false) }><ArrowBarRight size={12} /></Button> : <Button color="dark" onClick={() => setIsFullScreen(true) }><ArrowBarLeft size={12}/></Button>
            }
          </div>
        </div>
          {
            personId !== "" && (
              <div className="d-flex flex-column justify-content-start utility-canvas-content">
                <div className="d-flex justify-content-between nav-menu-bar align-items-center">
                  <div className="d-flex justify-content-start align-items-center">
                    {
                      icon ? <img width={24} height={24} src={icon} alt="" /> : <Robot color="white" size={24} />
                    }
                    <div className="d-flex flex-column justify-content-start align-items-start">
                      <span className="ms-2 text-white">{title}</span>
                      <span className="ms-2 text-white">{webviewUrl}</span>
                    </div>
                  </div>
                  <div className="d-flex justify-content-start">
                    <Button className="mx-1" color="dark" onClick={() => webview?.loadURL(url)}><Home color="white" size={14} /></Button>
                    <Button className="mx-1" color="dark" onClick={() => webview?.reload()}><ArrowClockwise color="white" size={14} /></Button>
                    <Button className="mx-1" color="dark" onClick={() => webview?.goBack() }><ChevronLeft size={12}/></Button>
                    <Button className="mx-1" color="dark" onClick={() => webview?.goForward() }><ChevronRight size={12}/></Button>
                  </div>
                </div>
                <webview
                  id={webviewId}
                  autosize={true}
                  src={webviewUrl}
                  nodeintegration={true}
                  allowpopups={false}
                  partition={"persist:"+personId}
                  onLoadCapture={() => handleLoad()}
                  style={{position:"relative", width: "100%", height: webviewHeight}}
                ></webview>
              </div>
            )
          }

        </div>

    </>;
}

export default UtilityAppsCanvas;
