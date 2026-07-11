import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Offcanvas, OffcanvasBody, OffcanvasHeader, UncontrolledDropdown } from "reactstrap";
import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';
import { chatActions } from "../../store/chat-slice";

import "./ChatAppsWindow.css"
import clsx from "clsx";

function ChatAppsWindow(props: any){
    const dispatch = useDispatch();
    const route = useSelector((state: any) => state.session.route);

    const personId = useSelector((state: any) => state.app.personId);

    const user = useSelector((state: any) => state.user);

    const profileId = useSelector((state: any) => state.app.profileId);

    const isOpen = useSelector((state: any) => state.chat.isOpen);

    const title = useSelector((state: any) => state.chat.title);

    const webviewUrl = useSelector((state: any) => state.chat.webviewUrl);

    const direction = useSelector((state: any) => state.chat.direction);

    const backdrop = useSelector((state: any) => state.chat.backdrop);

    const fade = useSelector((state: any) => state.chat.fade);

    const width = useSelector((state: any) => state.chat.width);

    const scopes = useSelector((state: any) => state.chat.scopes);


    const workspaceState = useSelector((state: any) => state.workspace);

    const sessionState = useSelector((state: any) => state.session);

    const [partitionId, setPartitionId] = useState("");
    const [scope, setScope] = useState("");
    const [webview, setWebview] = useState(null);
    const [windowId, setWindowId] = useState(uuidv4());
    const [webviewId, setWebviewId] = useState(uuidv4());
    const [webviewHeight, setWebviewHeight] = useState("calc(100% - 40px)");
    const [defaultUserAgent, setDefaultUserAgent] = useState("");
    const [userAgentLoaded, setUserAgentLoaded] = useState(false);

    useEffect(() => {
      const fetchUserAgent = async () => {
        if (window.electronAPI?.invoke) {
          try {
            const userAgent = await window.electronAPI.invoke('get-user-agent');
            setDefaultUserAgent(userAgent);
            setUserAgentLoaded(true);
            log.info("User agent loaded from main process:", userAgent);
          } catch (error) {
            log.error("Failed to get user agent from main process, using fallback:", error);
            setDefaultUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
            setUserAgentLoaded(true);
          }
        } else {
          setDefaultUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
          setUserAgentLoaded(true);
        }
      };
      
      fetchUserAgent();
    }, []);

    function handleLoad(){

    }

    useEffect(() => {
      if(!webview){
        setWebview(document.getElementById(webviewId));
      }else{
        webview.addEventListener("dom-ready", () => {
          log.debug("dom-ready, wid", webview.getWebContentsId());

        });
      }
    }, [webview]);

    function getPartitionId(_scope: any){
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
      log.debug("ChatAppsWindow isOpen updated ", isOpen);
      let _webview = document.getElementById(windowId);
      let _offcanvas = document.getElementById("chatview-offcanvas-"+windowId);
      if(_webview){
        if(isOpen){
          _webview.classList.add("chatview-canvas-open");
          _offcanvas.classList.remove("hidden");
        }else{
          _webview.classList.remove("chatview-canvas-open");
          _offcanvas.classList.add("hidden");
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

    return (
      <>
          <div
            id={"chatview-offcanvas-"+windowId}
            className={clsx(
              "!m-0 fixed inset-0 z-998",
              "items-end justify-end",
              "bg-black/50",
              "chatview-offcanvas",
              "flex hidden",
            )}
            onClick={() => dispatch(chatActions.toggle())}
          >

        </div>
        <div
          id={windowId}
          // @ts-expect-error
          toggle={() => dispatch(chatActions.toggle())}
          className={"chatview-canvas " }
          direction={direction}
          backdrop={backdrop}
          fade={fade}
          style={{width: width, minWidth: "1000px"}}
        >
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
              personId !== "" && userAgentLoaded && (
                <webview
                  id={"whatsapp-"+webviewId}
                  className={ isOpen ? "chatview-webview" : "hidden"}
                  // @ts-expect-error
                  autosize="on"
                  src={webviewUrl}
                  // @ts-expect-error
                  allowpopups="false"
                  partition={"persist:"+personId}
                  useragent={defaultUserAgent}
                  onLoadCapture={() => handleLoad()}
                  style={{width: "100%", height: webviewHeight}}
                ></webview>
              )
            }
            {
              personId !== "" && !userAgentLoaded && (
                <div className="chatview-webview" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff', height: webviewHeight}}>Loading...</div>
              )
            }
          </div>

      </>
    )
}

export default ChatAppsWindow;
