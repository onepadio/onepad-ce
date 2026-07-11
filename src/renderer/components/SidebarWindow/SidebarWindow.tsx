import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';
import { sidebarActions } from "../../store/sidebar-slice";
import { X } from "react-bootstrap-icons";
import { itemsDb } from "../../data/store";

import "./SidebarWindow.css"
import clsx from "clsx";

interface SidebarApp {
  appId: string;
  url: string;
  title: string;
  icon: string;
  userAgent: string;
}

function SidebarWindow(props: any){
    const dispatch = useDispatch();
    const route = useSelector((state: any) => state.session.route);

    const personId = useSelector((state: any) => state.app.personId);

    const user = useSelector((state: any) => state.user);

    const userId = useSelector((state: any) => state.user.id);

    const profileId = useSelector((state: any) => state.app.profileId);

    const isOpen = useSelector((state: any) => state.sidebar.isOpen);

    const title = useSelector((state: any) => state.sidebar.title);

    const webviewUrl = useSelector((state: any) => state.sidebar.webviewUrl);

    const appId = useSelector((state: any) => state.sidebar.appId);

    const userAgent = useSelector((state: any) => state.sidebar.userAgent);

    const direction = useSelector((state: any) => state.sidebar.direction);

    const backdrop = useSelector((state: any) => state.sidebar.backdrop);

    const fade = useSelector((state: any) => state.sidebar.fade);

    const width = useSelector((state: any) => state.sidebar.width);

    const scopes = useSelector((state: any) => state.sidebar.scopes);


    const workspaceState = useSelector((state: any) => state.workspace);

    const sessionState = useSelector((state: any) => state.session);

    const [windowId] = useState(uuidv4());
    const [defaultUserAgent, setDefaultUserAgent] = useState("");
    const [userAgentLoaded, setUserAgentLoaded] = useState(false);
    
    // Track all opened apps with their webviews
    const [openedApps, setOpenedApps] = useState<Record<string, SidebarApp>>({});

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

    // Track when sidebar opens/closes
    useEffect(() => {
      log.debug("SidebarWindow isOpen updated ", isOpen);
      let _webview = document.getElementById(windowId);
      let _offcanvas = document.getElementById("sidebar-offcanvas-"+windowId);
      if(_webview){
        if(isOpen){
          _webview.classList.add("sidebar-canvas-open");
          _offcanvas?.classList.remove("hidden");
        }else{
          _webview.classList.remove("sidebar-canvas-open");
          _offcanvas?.classList.add("hidden");
        }
      }
    }, [isOpen, windowId]);

    // Add new app to openedApps when appId/url changes
    useEffect(() => {
      if (appId && webviewUrl && isOpen) {
        setOpenedApps(prev => {
          // If app already exists, don't add it again
          if (prev[appId]) {
            log.debug("App already in openedApps, switching to it:", appId);
            return prev;
          }
          
          // Add new app
          log.debug("Adding new app to openedApps:", appId, webviewUrl);
          return {
            ...prev,
            [appId]: {
              appId,
              url: webviewUrl,
              title,
              icon: "",
              userAgent
            }
          };
        });
      }
    }, [appId, webviewUrl, title, isOpen, userAgent]);

    function handleClose() {
      dispatch(sidebarActions.close());
    }

    return (
      <>
          <div
            id={"sidebar-offcanvas-"+windowId}
            className={clsx(
              "!m-0 fixed inset-0 z-998",
              "items-end justify-end",
              "bg-black/50",
              "sidebar-offcanvas",
              "flex hidden",
            )}
            onClick={handleClose}
          >

        </div>
        <div
          id={windowId}
          className={"sidebar-canvas " }
          style={{width: width}}
        >
            <div className="sidebar-header">
              <h6 className="sidebar-title">{title}</h6>
              <button className="sidebar-close-btn" onClick={handleClose}>
                <X size={20} color="white" />
              </button>
            </div>
            
            {/* Render a webview for each opened app */}
            {
              profileId !== "" && userAgentLoaded && Object.values(openedApps).map((app) => {
                // Check if this app requires a custom user agent
                const needsCustomUA = app?.userAgent === 'custom';
                
                // Render with custom user agent if needed
                if (needsCustomUA) {
                  return (
                    <webview
                      key={app.appId}
                      id={"sidebar-webview-"+app.appId}
                      className={app.appId === appId ? "sidebar-webview" : "hidden"}
                      // @ts-expect-error
                      autosize="on"
                      src={app.url}
                      // @ts-expect-error
                      allowpopups="false"
                      partition={"persist:"+userId}
                      useragent={defaultUserAgent}
                      style={{width: "100%", height: "calc(100% - 72px)"}}
                    ></webview>
                  );
                }
                
                // Render without custom user agent (uses Electron default)
                return (
                  <webview
                    key={app.appId}
                    id={"sidebar-webview-"+app.appId}
                    className={app.appId === appId ? "sidebar-webview" : "hidden"}
                    // @ts-expect-error
                    autosize="on"
                    src={app.url}
                    // @ts-expect-error
                    allowpopups="false"
                    partition={"persist:"+userId}
                    style={{width: "100%", height: "calc(100% - 72px)"}}
                  ></webview>
                );
              })
            }
            
            {
              profileId !== "" && !userAgentLoaded && (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff', height: 'calc(100% - 40px)', width: '100%'}}>Loading...</div>
              )
            }
          </div>

      </>
    )
}

export default SidebarWindow;
