import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Offcanvas, OffcanvasBody, OffcanvasHeader, UncontrolledDropdown } from "reactstrap";
import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';
import { canvasActions } from "../../store/canvas-slice";

import "./WebViewCanvas.css"

function WebViewCanvas(props: any){
    const dispatch = useDispatch();
    const route = useSelector((state: any) => state.session.route);
    
    const user = useSelector((state: any) => state.user);
    
    const profileId = useSelector((state: any) => state.app.profileId);
    
    const isOpen = useSelector((state: any) => state.canvas.isOpen);
    
    const title = useSelector((state: any) => state.canvas.title);
    
    const webviewUrl = useSelector((state: any) => state.canvas.webviewUrl);
    
    const direction = useSelector((state: any) => state.canvas.direction);
    
    const backdrop = useSelector((state: any) => state.canvas.backdrop);
    
    const fade = useSelector((state: any) => state.canvas.fade);
    
    const width = useSelector((state: any) => state.canvas.width);
    
    const scopes = useSelector((state: any) => state.canvas.scopes);

    
    const workspaceState = useSelector((state: any) => state.workspace);
    
    const sessionState = useSelector((state: any) => state.session);

    const [partitionId, setPartitionId] = useState("");
    const [scope, setScope] = useState("");
    const [webview, setWebview] = useState(null);
    const [webviewId, setWebviewId] = useState(uuidv4());
    const [webviewHeight, setWebviewHeight] = useState("calc(100% - 40px)");

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
      if(scope === "") return;
      let _webview = document.getElementById(scope+"-"+webviewId);
      if(_webview){
        if(scope === "profile"){
          let _space_webview = document.getElementById("space-"+webviewId);
          if(_space_webview) _space_webview.classList.add("hidden");
        }else{
          let _profile_webview = document.getElementById("profile-"+webviewId);
          if(_profile_webview) _profile_webview.classList.add("hidden");
        }
        _webview.classList.remove("hidden");
      }
    }, [scope, webviewId]);


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
        <div>
          <Offcanvas
            isOpen={isOpen}
            toggle={() => dispatch(canvasActions.toggle())}
            className="webview-canvas"
            direction={direction}
            backdrop={backdrop}
            fade={fade}
            style={{width: width}}
          >
                
                <OffcanvasBody>
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
                    
                      <>
                        {
                          scopes.includes("profile") && (
                            <webview
                              id={"profile-"+webviewId}
                              className="hidden"
                              // @ts-expect-error
                              autosize="on"
                              src={webviewUrl}
                              // @ts-expect-error
                              nodeintegration="true"
                              // @ts-expect-error
                              allowpopups="true"
                              partition={getPartitionId("profile")}
                              onLoadCapture={() => handleLoad()}
                              style={{width: "100%", height: webviewHeight}}
                              useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15"
                            ></webview>
                          )
                        }
                        {
                          scopes.includes("space") && (
                            <webview
                              id={"space-"+webviewId}
                              className="hidden"
                              // @ts-expect-error
                              autosize="on"
                              src={webviewUrl}
                              // @ts-expect-error
                              nodeintegration="true"
                              // @ts-expect-error
                              allowpopups="true"
                              partition={getPartitionId("space")}
                              onLoadCapture={() => handleLoad()}
                              style={{width: "100%", height: webviewHeight}}
                              useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15"
                            ></webview>
                          )
                        }
                      </>
                    
                  }
                </OffcanvasBody>
            </Offcanvas>
        </div>
    )
}

export default WebViewCanvas;