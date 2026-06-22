import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, ListGroup, ListGroupItem, Offcanvas, OffcanvasBody, OffcanvasHeader, UncontrolledDropdown } from "reactstrap";
import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';
import { aiAppsActions } from "../../store/ai-slice";

import "./AIAssistantsCanvas.css"
import clsx from "clsx";
import { itemsDb } from "../../data/store";
import { ArrowBarLeft, ArrowBarRight, ArrowClockwise, ArrowLeft, ArrowRight, ArrowsAngleContract, ArrowsExpand, ArrowsFullscreen, ChevronLeft, ChevronRight, Fullscreen, FullscreenExit, Kanban, Recycle, Robot, XLg } from "react-bootstrap-icons";
import { ReactSVG } from 'react-svg';

import { aiAppItemsDb, aiAppOthers, aiAppSearch } from './ai_apps';
import { windowServiceActions } from "../../store/window-service-slice";
import { Home } from "react-feather";

function AIAssistantsCanvas(){
    const dispatch = useDispatch();
    const route = useSelector((state: any) => state.session.route);

    const user = useSelector((state: any) => state.user);

    const profileId = useSelector((state: any) => state.app.profileId);

    const userId = useSelector((state: any) => state.user.id);

    const personId = useSelector((state: any) => state.app.personId);

    const isOpen = useSelector((state: any) => state.ai.isOpen);

    const title = useSelector((state: any) => state.ai.title);

    const icon = useSelector((state: any) => state.ai.icon);

    const url = useSelector((state: any) => state.ai.webviewUrl);

    const webviewUrl = useSelector((state: any) => state.ai.webviewUrl);

    const direction = useSelector((state: any) => state.ai.direction);

    const backdrop = useSelector((state: any) => state.ai.backdrop);

    const fade = useSelector((state: any) => state.ai.fade);

    const width = useSelector((state: any) => state.ai.width);

    const scopes = useSelector((state: any) => state.ai.scopes);

    const activeCategory = useSelector((state: any) => state.ai.activeCategory);

    const previousCategory = useSelector((state: any) => state.ai.previousCategory);

    const activePlayer = useSelector((state: any) => state.ai.activePlayer);

    const searchQuery = useSelector((state: any) => state.ai.searchQuery);


    const workspaceState = useSelector((state: any) => state.workspace);

    const sessionState = useSelector((state: any) => state.session);

    const [partitionId, setPartitionId] = useState("");
    const [scope, setScope] = useState("");
    const [webview, setWebview] = useState(null);
    const [windowId, setWindowId] = useState(uuidv4());
    const [webviewId, setWebviewId] = useState("ai-"+uuidv4());
    const [webviewHeight, setWebviewHeight] = useState("calc(100% - 88px)");
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
          webview?.classList.remove("hidden");
        });
        webview.addEventListener("did-navigate", (event: any) => {
          // Only handle main frame navigation to avoid noise from iframe navigations
          if (event.isMainFrame) {
            log.debug("did-navigate (main frame)");
            webview?.classList.remove("hidden");
          }
        });
        webview.addEventListener("did-navigate-in-page", (event: any) => {
          // Only handle main frame navigation to avoid noise from iframe navigations
          if (event.isMainFrame) {
            log.debug("did-navigate-in-page (main frame)");
            webview?.classList.remove("hidden");
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
      let _offcanvas = document.getElementById("ai-offcanvas-"+windowId);
      if(_window){
        if(isOpen){
          let _previousItemId = undefined;
          if(localStorage.getItem("ai-window-state") !== undefined && localStorage.getItem("ai-window-state") !== null){
            let _state = JSON.parse(localStorage.getItem("ai-window-state"));
            if(_state[activeCategory] !== undefined){
              _previousItemId = _state[activeCategory];
            }
          }
          let _item = undefined;
          if(_previousItemId !== undefined && _previousItemId !== null && _previousItemId !== ""){
            _item = itemsDb[_previousItemId] ? itemsDb[_previousItemId] : aiAppOthers[_previousItemId];
          }else{
            _item = itemsDb[aiAppItemsDb[activeCategory][0]] ? itemsDb[aiAppItemsDb[activeCategory][0]] : aiAppOthers[aiAppItemsDb[activeCategory][0]];
          }
          log.debug("activeCategory ", activeCategory, " _item ", _item);
          if(_item){
            if(previousCategory !== activeCategory){
              webview.classList.add("hidden");
              if(activeCategory === "search" && searchQuery !== "" && searchQuery !== undefined){
                dispatch(aiAppsActions.setUrl(_item.search+searchQuery));
              }else{
                dispatch(aiAppsActions.setUrl(_item.login));
              }

              dispatch(aiAppsActions.setTitle(_item.name));
              dispatch(aiAppsActions.setActivePlayer(_item.id));
              if(webview){
                webview.clearHistory();
              }
            }else{
              if(activeCategory === "search" && searchQuery !== "" && searchQuery !== undefined){
                dispatch(aiAppsActions.setUrl(_item.search+searchQuery));
              }else{
                dispatch(aiAppsActions.setUrl(_item.login));
              }
            }
            setTimeout(() => {
              _window.classList.add("ai-canvas-open");
              _offcanvas.classList.remove("hidden");
            }, 200);
          }
        }else{
          if(localStorage.getItem("ai-window-state") !== undefined && localStorage.getItem("ai-window-state") !== null){
            let _state = JSON.parse(localStorage.getItem("ai-window-state"));
            _state[activeCategory] = activePlayer;
            localStorage.setItem("ai-window-state", JSON.stringify(_state));
          }else{
            if(activePlayer !== "" && activeCategory !== "" && activePlayer !== undefined && activeCategory !== undefined){
              let _state = {};
              _state[activeCategory] = activePlayer;
              localStorage.setItem("ai-window-state", JSON.stringify(_state));
            }
          }
          _window.classList.remove("ai-canvas-open");
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
      if(!aiAppItemsDb || activeCategory === "" || itemsDb[aiAppItemsDb[activeCategory]] === undefined ) return;
      let _item = itemsDb[aiAppItemsDb[activeCategory][0]];
      dispatch(aiAppsActions.setUrl(_item.login));
      dispatch(aiAppsActions.setTitle(_item.name));
      dispatch(aiAppsActions.setActivePlayer(_item.id));
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
        dispatch(aiAppsActions.setWidth("calc(100%)"));
      }else{
        dispatch(aiAppsActions.setWidth("40%"));
      }
    }, [isFullScreen]);

    function handleSwitchWindow(item: any, icon_url: string){
      log.debug("handleSwitchWindow ", item);
      let _url = item.login;
      if(item.id === activePlayer){
        webview?.loadURL(_url);
        return;
      }

      dispatch(aiAppsActions.setUrl(_url));
      dispatch(aiAppsActions.setTitle(item.name));
      dispatch(aiAppsActions.setIcon(icon_url));
      dispatch(aiAppsActions.setActivePlayer(item.id));
      if(webview){
        webview?.clearHistory();
      }

      let _state = JSON.parse(localStorage.getItem("ai-window-state"));
      if(!_state){
        _state = {};
      }
      if(item && item.id){
        _state["ai"] = item.id;
        localStorage.setItem("ai-window-state", JSON.stringify(_state));
      }

    }

    function menuItem(item: any, from: string){
      let _icon_url = from === "itemDb" ? "./images/store/icon/"+item.icon : item.icon;
      let _icon = _icon_url;

      if(_icon_url.includes("svg")){
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
        <ListGroupItem key={uuidv4()} className="nav-item" onClick={() => handleSwitchWindow(item, _icon_url)}>
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
          id={"ai-offcanvas-"+windowId}
          className={clsx(
            "!m-0 fixed inset-0 z-998",
            "items-end justify-end",
            "bg-black/50",
            "ai-offcanvas",
            "flex hidden",
            "d-none"
          )}
          onClick={() => dispatch(aiAppsActions.close())}
        >

      </div>

      <div
        id={windowId}
        className={"ai-canvas d-flex" }
        style={{width: width}}
      >

        <div className="ai-sidebar">
          <ListGroup>
            <ListGroupItem>
                <div className=" w-100 d-flex mt-2 justify-content-center">
                  <Button color="dark" onClick={() => {
                    dispatch(aiAppsActions.close());
                    setIsFullScreen(false);
                  }} className={"ai-close-button"}>
                <XLg color="white" size={14} />
              </Button>
            </div>
            </ListGroupItem>
            {
              aiAppItemsDb[activeCategory] !== undefined ?
                aiAppItemsDb[activeCategory]?.map((id) => {
                    return itemsDb[id] ? menuItem(itemsDb[id], "itemDb") : menuItem(aiAppOthers[id], "others");
                })
              : null
            }
          </ListGroup>
        </div>
          {
            scopes.length > 1 && (
              <UncontrolledDropdown className="d-flex justify-content-end mb-2 scope-menu">
                <DropdownToggle color="dark" caret>
                  {scope === "profile" ? "Global" : "Space"}
                </DropdownToggle>
                <DropdownMenu dark>
                  <DropdownItem onClick={() => setScope("profile")}>Global</DropdownItem>
                  <DropdownItem onClick={() => setScope("space")}>Space</DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            )
          }
          {
            personId !== "" && (
              <div className="d-flex flex-column justify-content-start ai-canvas-content">
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
                  style={{position:"relative", width: "100%", height: webviewHeight, top: "5px"}}
                ></webview>
              </div>
            )
          }

        </div>

    </>;
}

export default AIAssistantsCanvas;
