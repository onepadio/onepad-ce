import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, ListGroup, ListGroupItem, Offcanvas, OffcanvasBody, OffcanvasHeader, UncontrolledDropdown } from "reactstrap";
import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';
import { spaceAppActions } from "../../store/spaceapp-slice";

// @ts-expect-error
import googleIcon from '../../images/google_icon.png'

import "./SpaceAppWindow.css"
import clsx from "clsx";
import { itemsDb } from "../../data/store";
import { ArrowBarLeft, ArrowBarRight, ArrowLeft, ArrowRight, ArrowsAngleContract, ArrowsExpand, ArrowsFullscreen, ChevronLeft, ChevronRight, Fullscreen, FullscreenExit, Kanban, XLg } from "react-bootstrap-icons";
import { ReactSVG } from 'react-svg';

function SpaceAppWindow(props){
    const dispatch = useDispatch();
    const route = useSelector((state: any) => state.session.route);

    const user = useSelector((state: any) => state.user);

    const profileId = useSelector((state: any) => state.app.profileId);

    const userId = useSelector((state: any) => state.user.id);

    const personId = useSelector((state: any) => state.app.personId);

    const isOpen = useSelector((state: any) => state.spaceApp.isOpen);

    const title = useSelector((state: any) => state.spaceApp.title);

    const webviewUrl = useSelector((state: any) => state.spaceApp.webviewUrl);

    const direction = useSelector((state: any) => state.spaceApp.direction);

    const backdrop = useSelector((state: any) => state.spaceApp.backdrop);

    const fade = useSelector((state: any) => state.spaceApp.fade);

    const width = useSelector((state: any) => state.spaceApp.width);

    const scopes = useSelector((state: any) => state.spaceApp.scopes);


    const activePlayer = useSelector((state: any) => state.spaceApp.activePlayer);


    const workspaceState = useSelector((state: any) => state.workspace);

    const sessionState = useSelector((state: any) => state.session);

    const [partitionId, setPartitionId] = useState("");
    const [scope, setScope] = useState("");
    const [webview, setWebview] = useState(null);
    const [windowId, setWindowId] = useState(uuidv4());
    const [webviewId, setWebviewId] = useState("spaceapp-"+uuidv4());
    const [webviewHeight, setWebviewHeight] = useState("calc(100% - 40px)");
    const [isFullScreen, setIsFullScreen] = useState(false);

    const [activeCategory, setActiveCategory] = useState("spaceapp");
    const [previousCategory, setPreviousCategory] = useState("spaceapp");

    const _itemsDb = {
      "spaceapp": ["5e1a8b8f-2584-4b2c-9953-d7ef3eb13a1e", "6bab690d-3c41-45c9-8ef5-96d30915b0f5", "9df46663-b627-4943-91b0-7b102bc10a73", "48c9dab6-f01e-4d93-b086-7daa4ecd798b"],
    }

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
      let _window = document.getElementById(windowId);
      let _webview = document.getElementById(webviewId);
      let _offcanvas = document.getElementById("spaceapp-offcanvas-"+windowId);
      if(_window){
        if(isOpen){
            // webview.classList.add("hidden");

            if(webview){
              webview.clearHistory();
            }

            setTimeout(() => {
              _window.classList.add("spaceapp-canvas-open");
              //_offcanvas.classList.remove("hidden");
            }, 200);

        }else{
          _window.classList.remove("spaceapp-canvas-open");
          //_offcanvas.classList.add("hidden");
        }
      }
    }, [isOpen]);


    useEffect(() => {
      log.debug("WebViewCanvas useEffect: ", partitionId, webviewUrl);
      if(webview && webviewUrl && partitionId !== ""){
        // webview.loadURL(webviewUrl);
        log.debug("webview ", webview, " partitionId ", partitionId, " webviewUrl ", webviewUrl);
      }
    }, [partitionId, webviewUrl]);

    useEffect(() => {
      if(!_itemsDb || activeCategory === "" || itemsDb[_itemsDb[activeCategory]] === undefined ) return;
      let _item = itemsDb[_itemsDb[activeCategory][0]];
      dispatch(spaceAppActions.setUrl(_item.login));
      dispatch(spaceAppActions.setTitle(_item.name));
      dispatch(spaceAppActions.setActivePlayer(_item.id));
      if(webview){
        webview.clearHistory();
      }
    }, []);

    useEffect(() => {
      if(scopes.length > 1){
       setWebviewHeight("calc(100% - 40px)");
       setScope("space");
      }else{
        setWebviewHeight("calc(100%)");
        setScope(scopes[0]);
      }
    }, [scopes,webviewUrl]);

    useEffect(() => {
      if(isFullScreen){
        dispatch(spaceAppActions.setWidth("100%"));
      }else{
        dispatch(spaceAppActions.setWidth("58%"));
      }
    }, [isFullScreen]);

    function handleSwitchWindow(item){
      if(item.id === activePlayer){
        webview.loadURL(item.login);
        return;
      }
      dispatch(spaceAppActions.setUrl(item.login));
      dispatch(spaceAppActions.setTitle(item.name));
      dispatch(spaceAppActions.setActivePlayer(item.id));
      if(webview){
        webview.clearHistory();
      }
    }

    function menuItem(item){
      log.debug("menuItem ", item);
      let _icon = itemsDb[item.id] ? "./images/store/icon/"+item.icon : item.icon;

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

    return (
      <>

        <div
          id={windowId}
          className={"spaceapp-canvas d-flex" }
          style={{width: width}}
        >
          <div className="spaceapp-sidebar">
            <ListGroup>
              <ListGroupItem>
                <div className=" w-100 d-flex mt-2 justify-content-center">
                                    <ChevronLeft size={20} onClick={() => webview.goBack() }/>
                                    <ChevronRight size={20} onClick={() => webview.goForward() }/>
                </div>
              </ListGroupItem>
            </ListGroup>
            <div className="d-flex w-100 justify-content-center close-button">
              {
                <Button color="dark" onClick={() => dispatch(spaceAppActions.toggle())}><XLg size={12} /></Button>
              }
            </div>
            <div className="d-flex w-100 justify-content-center expand-button">
              {
                isFullScreen ? <Button color="dark" onClick={() => setIsFullScreen(false) }><ArrowBarRight size={12} /></Button> : <Button color="dark" onClick={() => setIsFullScreen(true) }><ArrowBarLeft size={12}/></Button>
              }
            </div>
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
                <webview
                  id={webviewId}
                  autosize={true}
                  src={webviewUrl}
                  nodeintegration={true}
                  allowpopups={false}
                  partition={props.partitionId}
                  onLoadCapture={() => handleLoad()}
                  style={{width: "100%", height: webviewHeight}}
                ></webview>
              )
            }

          </div>

      </>
    )
}

export default SpaceAppWindow;
