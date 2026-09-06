import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from "is-electron";

import { sessionActions } from "../../store/session-slice";
import { appActions } from "../../store/app-slice";
import { windowBarActions } from "../../store/windowbar-slice";
import { webviewActions } from "../../store/webview-slice";
import log from "loglevel";

import "./OPWebView.css";
import { modalActions } from "../../store/modal-slice";
import { generateFormDetectionScript, parseLoginDetection } from "../../utils/formDetection";
import PasswordService from "../../services/password";
import {
  applyNavigationToTabState,
  scheduleTabNavHistoryPersist,
} from "../../util/navHistory";

function OPWebView(props: any) {
  const dispatch = useDispatch();
  // settings
  
  const isTabGroupsEnabled = useSelector((state: any) => state.settings.isTabGroupsEnabled);

  
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  
  const activeTab = useSelector((state: any) => state.session.activeTab);
  
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  
  const openTabs = useSelector((state: any) => state.session.openTabs);
  
  const openWindows = useSelector((state: any) => state.session.openWindows);

  const isInSession = useSelector((state: any) => state.session.isInSession);
  const workspaceId = useSelector(
    (state: any) => state.workspace.selectedWorkspace?.id
  );
  const currentSessionId = useSelector(
    (state: any) => state.workspace.currentSession?.id
  );
  
  // Use ref to always access latest openTabs in event handlers
  const openTabsRef = useRef(openTabs);
  useEffect(() => {
    openTabsRef.current = openTabs;
  }, [openTabs]);

  const persistContextRef = useRef({
    isInSession,
    workspaceId,
    currentSessionId,
    activeTabId,
  });
  useEffect(() => {
    persistContextRef.current = {
      isInSession,
      workspaceId,
      currentSessionId,
      activeTabId,
    };
  }, [isInSession, workspaceId, currentSessionId, activeTabId]);
  const isSessionFullScreen = useSelector((state: any) => state.session.isFullScreen);
  const personId = useSelector((state: any) => state.app.personId);

  const webViewId = "webview-" + props.tabId;
  const [webview, setWebView] = useState(null);
  const [startUrl, setStartUrl] = useState(props.startUrl);

  const [sleepWebView, setSleepWebView] = useState(false);
  const [takeScreenShot, setTakeScreenShot] = useState(false);
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSecure, setIsSecure] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [title, setTitle] = useState("");
  const [currentFavIcon, setCurrentFavIcon] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hoveredLinkUrl, setHoveredLinkUrl] = useState("");
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  const [storeSS, setStoreSS] = useState(null);
  const [defaultUserAgent, setDefaultUserAgent] = useState("");
  const [userAgentLoaded, setUserAgentLoaded] = useState(false);
  const [needsCustomUA, setNeedsCustomUA] = useState(false);

  // Check if current tab's app requires custom user agent
  useEffect(() => {
    const currentTab = openTabs[props.tabId];
    if (currentTab && currentTab.window) {
      // First check if window data has useragent information
      const windowData = openWindows[currentTab.window];
      if (windowData && windowData.data && windowData.data.useragent) {
        setNeedsCustomUA(windowData.data.useragent === 'custom');
      } else {
        setNeedsCustomUA(false);
      }
    }
  }, [openTabs, openWindows, props.tabId]);

  useEffect(() => {
    const fetchUserAgent = async () => {
      if (isElectron() && window.electronAPI?.invoke) {
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

  function handleLoad() {
    log.debug("handleLoad....");
    // Dismiss splash once the page (iframe/webview) has loaded
    dispatch(appActions.hideSplashScreen({}));
  }

  function validURLHttps(str: any) {
    var pattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    return !!pattern.test(str);
  }

  function updateTabIcon(favicons: any) {
    if (props.tabId !== activeTabId || !webview || webview.getURL() === currentUrl) return;

    if (favicons.length === 0) return;

    if (favicons[0] === currentFavIcon) {
      log.debug("updateTabIcon", "same icon");
      return;
    }

    if (webview.getTitle() !== title) {
      const newTitle = webview.getTitle();
      setTitle(newTitle);
      // Update parent state
      if (props.setTitle) {
        props.setTitle(newTitle);
      }
    }

    setCurrentFavIcon(favicons[0]);
    // Update parent state
    if (props.setCurrentFavIcon) {
      props.setCurrentFavIcon(favicons[0]);
    }
  }

  function didNavigate(url: any) {
    if (!webview) return;
    
    if(url.startsWith("https://")){
      setIsSecure(true);
    }else{
      setIsSecure(false);
    }

    // Update parent state
    if (props.setCurrentUrl) {
      props.setCurrentUrl(url);
    }

    const _openTabs = Object.assign({}, openTabsRef.current);
    const _tab = Object.assign({}, _openTabs[props.tabId]);
    if (!_tab || !_tab.id) {
      return;
    }

    let title = "";
    try {
      title = webview.getTitle?.() || _tab.state?.title || "";
    } catch {
      title = _tab.state?.title || "";
    }

    const _state = applyNavigationToTabState(_tab.state || {}, url, title);
    _tab.state = _state;
    _openTabs[props.tabId] = _tab;
    dispatch(
      sessionActions.setOpenTabs({
        data: _openTabs,
      })
    );

    const persistCtx = persistContextRef.current;
    if (props.tabId === persistCtx.activeTabId) {
      scheduleTabNavHistoryPersist({
        workspaceId: persistCtx.workspaceId,
        sessionId: persistCtx.currentSessionId,
        isInSession: persistCtx.isInSession,
        tabId: props.tabId,
        tabType: _tab.type,
        navState: _state,
      });
    }
  }

  function goHome() {
    webview.loadURL(props.startUrl);
  }

  function goBack() {
    webview.goBack();
  }

  function goForward() {
    webview.goForward();
  }

  function reload() {
    webview.loadURL(currentUrl);
  }

  function handleWebViewFocus() {
    document.querySelectorAll(".context-menu").forEach((menu) => {
      document.body.removeChild(menu);
    });
  }

  // Password manager: Check for saved passwords and offer auto-fill
  async function checkAndOfferAutofill(url: string) {
    try {
      const hostname = new URL(url).hostname;
      
      if (!personId) return;
      
      // Check if there are saved passwords for this site
      const savedPasswords = await PasswordService.getByPersonIdAndHostname(personId, hostname);
      
      if (savedPasswords && savedPasswords.length > 0) {
        log.debug("Found saved passwords for:", hostname);
        
        // If only one password, auto-fill immediately
        if (savedPasswords.length === 1) {
          const pwd = savedPasswords[0];
          autofillPassword(pwd.id, pwd.username);
        } else {
          // Multiple passwords - show selection UI
          webview?.executeJavaScript(`
            window.postMessage({
              type: 'ONEPAD_SHOW_SUGGESTIONS',
              data: {
                passwords: ${JSON.stringify(savedPasswords.map((p: any) => ({
                  id: p.id,
                  username: p.username,
                  hostname: p.hostname
                })))}
              }
            }, '*');
          `);
        }
      }
    } catch (error) {
      log.error("Error checking for saved passwords:", error);
    }
  }

  // Password manager: Auto-fill password
  async function autofillPassword(passwordId: string, username: string) {
    try {
      if (!personId) return;
      
      // Get password from database
      const savedPassword = await PasswordService.get(passwordId);
      
      if (!savedPassword) {
        log.error("Password not found:", passwordId);
        return;
      }
      
      // Check if electronAPI is available
      // @ts-expect-error
      if (!window.electronAPI?.decrypt) {
        log.warn("Password decryption is only available in Electron environment");
        return;
      }
      
      // Decrypt password (handled in the service)
      // @ts-expect-error
      const decryptedPassword = window.electronAPI.decrypt.get(savedPassword.password);
      
      // Send to webview for auto-fill
      webview?.executeJavaScript(`
        window.postMessage({
          type: 'ONEPAD_AUTOFILL',
          data: {
            username: '${username.replace(/'/g, "\\'")}',
            password: '${decryptedPassword.replace(/'/g, "\\'")}'
          }
        }, '*');
      `);
      
      log.info("Auto-filled password for:", username);
    } catch (error) {
      log.error("Error auto-filling password:", error);
    }
  }

  // Password manager: Listen for login detection and scroll events from webview
  useEffect(() => {
    if (!webview) return;
    
    const handleConsoleMessage = (event: any) => {
      // Listen for postMessage from webview content
      if (event.message && event.message.includes('ONEPAD_LOGIN_DETECTED')) {
        try {
          const data = JSON.parse(event.message);
          const loginData = parseLoginDetection(data);
          
          if (loginData) {
            log.info("Login detected:", loginData.hostname);
            
            // Show password save prompt
            dispatch(modalActions.showPasswordSavePrompt({
              hostname: loginData.hostname,
              username: loginData.username,
              password: loginData.password,
              url: loginData.url
            }));
          }
        } catch (error) {
          log.error("Error parsing login detection:", error);
        }
      }
      
      // Listen for scroll events
      if (event.message && event.message.includes('ONEPAD_SCROLL_EVENT')) {
        try {
          const scrollData = JSON.parse(event.message);
          setScrollPosition({
            x: scrollData.x,
            y: scrollData.y
          });
          
          // Update Redux store
          dispatch(webviewActions.setScrollPosition({
            x: scrollData.x,
            y: scrollData.y
          }));
          dispatch(webviewActions.setScrolling(true));
          
          // Notify parent component if callback exists
          if (props.onScroll) {
            props.onScroll({
              x: scrollData.x,
              y: scrollData.y,
              scrollHeight: scrollData.scrollHeight,
              clientHeight: scrollData.clientHeight
            });
          }
          
          log.debug("Scroll position updated:", scrollData.x, scrollData.y);
        } catch (error) {
          log.error("Error parsing scroll event:", error);
        }
      }
      
      // Listen for scroll end events
      if (event.message && event.message.includes('ONEPAD_SCROLL_END')) {
        try {
          const scrollData = JSON.parse(event.message);
          
          // Update Redux store - scrolling has ended
          dispatch(webviewActions.setScrolling(false));
          dispatch(webviewActions.setScrollPosition({
            x: scrollData.x,
            y: scrollData.y
          }));
          
          log.debug("Scrolling ended at:", scrollData.x, scrollData.y);
        } catch (error) {
          log.error("Error parsing scroll end event:", error);
        }
      }
      
      // Listen for mouse move events
      if (event.message && event.message.includes('ONEPAD_MOUSE_MOVE')) {
        try {
          const mouseData = JSON.parse(event.message);
          
          // Update Redux store
          dispatch(webviewActions.setMousePosition({
            x: mouseData.x,
            y: mouseData.y
          }));
          
          // Notify parent component if callback exists
          if (props.onMouseMove) {
            props.onMouseMove({
              x: mouseData.x,
              y: mouseData.y,
              pageX: mouseData.pageX,
              pageY: mouseData.pageY
            });
          }
          
          log.debug("Mouse position updated:", mouseData.x, mouseData.y);
        } catch (error) {
          log.error("Error parsing mouse move event:", error);
        }
      }
    };
    
    webview.addEventListener('console-message', handleConsoleMessage);
    
    return () => {
      webview.removeEventListener('console-message', handleConsoleMessage);
    };
  }, [webview, dispatch]);

  // Add all webview event listeners (only for Electron)
  useEffect(() => {
    if (!userAgentLoaded) {
      return;
    }

    if (!isElectron()) {
      // For iframe in non-Electron, just set the element reference
      const iframeElement = document.getElementById(webViewId);
      if (iframeElement) {
        setWebView(iframeElement as any);
      }
      return;
    }

    if (webview != null) {
      const handleDomReady = () => {
        const webContentsId = webview.getWebContentsId();
        log.debug("dom-ready, wid", webContentsId);
        
        // Update webContentsId in tab state - use ref to get latest openTabs
        const _openTabs = Object.assign({}, openTabsRef.current);
        if (_openTabs[props.tabId]) {
          const _tab = Object.assign({}, _openTabs[props.tabId]);
          _tab.webContentsId = webContentsId;
          _openTabs[props.tabId] = _tab;
          dispatch(sessionActions.setOpenTabs({ data: _openTabs }));
          log.info(`OPWebView: Set webContentsId ${webContentsId} for tab ${props.tabId}`);
        } else {
          log.warn(`OPWebView: Tab ${props.tabId} not found in openTabs when setting webContentsId`);
        }
        
        if(props.tabId === activeTabId){
          log.debug("dom-ready, setCurrentUrl", props.tabId, activeTabId);
          dispatch(windowBarActions.setCurrentUrl(webview.getURL()));
          dispatch(windowBarActions.setCurrentTitle(webview.getTitle()));
        }

        // Inject form detection script for password manager
        webview.executeJavaScript(generateFormDetectionScript());
        
        // Inject scroll detection script with 100ms throttle
        webview.executeJavaScript(`
          (function() {
            let lastScrollTime = 0;
            let scrollThrottleTimeout = null;
            let scrollTimeout = null;
            const THROTTLE_MS = 100;
            const SCROLL_END_DELAY = 150;
            
            const sendScrollData = () => {
              const scrollData = {
                type: 'ONEPAD_SCROLL_EVENT',
                x: window.scrollX || window.pageXOffset,
                y: window.scrollY || window.pageYOffset,
                scrollHeight: document.documentElement.scrollHeight,
                clientHeight: document.documentElement.clientHeight,
                isScrolling: true
              };
              console.log(JSON.stringify(scrollData));
            };
            
            const sendScrollEndData = () => {
              const scrollEndData = {
                type: 'ONEPAD_SCROLL_END',
                x: window.scrollX || window.pageXOffset,
                y: window.scrollY || window.pageYOffset
              };
              console.log(JSON.stringify(scrollEndData));
            };
            
            const handleScroll = () => {
              const now = Date.now();
              const timeSinceLastScroll = now - lastScrollTime;
              
              // Clear scroll end timeout
              if (scrollTimeout) {
                clearTimeout(scrollTimeout);
              }
              
              if (timeSinceLastScroll >= THROTTLE_MS) {
                // Execute immediately if enough time has passed
                lastScrollTime = now;
                sendScrollData();
                
                // Clear any pending throttle
                if (scrollThrottleTimeout) {
                  clearTimeout(scrollThrottleTimeout);
                  scrollThrottleTimeout = null;
                }
              } else {
                // Schedule execution for the remaining time
                if (!scrollThrottleTimeout) {
                  scrollThrottleTimeout = setTimeout(() => {
                    lastScrollTime = Date.now();
                    sendScrollData();
                    scrollThrottleTimeout = null;
                  }, THROTTLE_MS - timeSinceLastScroll);
                }
              }
              
              // Set timeout to detect scroll end
              scrollTimeout = setTimeout(sendScrollEndData, SCROLL_END_DELAY);
            };
            
            window.addEventListener('scroll', handleScroll, { passive: true });
            
            // Send initial scroll position
            sendScrollData();
            setTimeout(sendScrollEndData, SCROLL_END_DELAY);
          })();
        `);
        
        // Inject mouse move detection script with 100ms throttle
        webview.executeJavaScript(`
          (function() {
            let lastMouseMoveTime = 0;
            let mouseMoveThrottleTimeout = null;
            const THROTTLE_MS = 200;
            
            const sendMouseData = (event) => {
              const mouseData = {
                type: 'ONEPAD_MOUSE_MOVE',
                x: event.clientX,
                y: event.clientY,
                pageX: event.pageX,
                pageY: event.pageY
              };
              console.log(JSON.stringify(mouseData));
            };
            
            const handleMouseMove = (event) => {
              const now = Date.now();
              const timeSinceLastMove = now - lastMouseMoveTime;
              
              if (timeSinceLastMove >= THROTTLE_MS) {
                // Execute immediately if enough time has passed
                lastMouseMoveTime = now;
                sendMouseData(event);
                
                // Clear any pending throttle
                if (mouseMoveThrottleTimeout) {
                  clearTimeout(mouseMoveThrottleTimeout);
                  mouseMoveThrottleTimeout = null;
                }
              } else {
                // Schedule execution for the remaining time
                if (!mouseMoveThrottleTimeout) {
                  const storedEvent = {
                    clientX: event.clientX,
                    clientY: event.clientY,
                    pageX: event.pageX,
                    pageY: event.pageY
                  };
                  mouseMoveThrottleTimeout = setTimeout(() => {
                    lastMouseMoveTime = Date.now();
                    sendMouseData(storedEvent);
                    mouseMoveThrottleTimeout = null;
                  }, THROTTLE_MS - timeSinceLastMove);
                }
              }
            };
            
            window.addEventListener('mousemove', handleMouseMove, { passive: true });
          })();
        `);
        
        // Inject CSS for bottom margin to prevent content from being hidden by overlay menu
        /*
        webview.insertCSS(`
          body {
            margin-bottom: 80px !important;
            padding-bottom: 0px !important;
          }
        `);
        */
        // Check for saved passwords and offer auto-fill
        checkAndOfferAutofill(webview.getURL());
      };
      
      webview.addEventListener("dom-ready", handleDomReady);
      
      webview.addEventListener("page-favicon-updated",(event: any) => updateTabIcon(event.favicons));
      
      webview.addEventListener("did-navigate", (event: any) => {
        log.debug("did-navigate, wid",webview.getWebContentsId(), "isMainFrame:", event.isMainFrame);
        // Only update URL for main frame navigation to avoid capturing iframe URLs (e.g., Google widgets)
        if (event.isMainFrame) {
          didNavigate(event.url);
        }
      });

      webview.addEventListener("did-navigate-in-page", (event: any) => {
        log.debug("did-navigate-in-page, wid",webview.getWebContentsId(), "isMainFrame:", event.isMainFrame);
        // Only update URL for main frame navigation to avoid capturing iframe URLs (e.g., Google widgets)
        if (event.isMainFrame) {
          didNavigate(event.url);
        }
      });

      if(props.type === "remote"){
        webview.addEventListener("did-fail-load", (event: any) => {
          log.debug("did-fail-load", event);
          log.debug("wid",webview.getWebContentsId());
          if(!props.isProcessRunning){
            setTimeout(() => {
              props.checkProcess(props.url);
           }, 5000);
          }else{
            setTimeout(() => {
              webview.loadURL(props.url);
            }, 5000);
          }
        });
      }

      webview.addEventListener("did-start-loading", (event: any) => {
        if (props.setProgress) {
          props.setProgress(10);
        }
      });

      webview.addEventListener("did-progress", (event: any) => {
        if (props.setProgress) {
          const progress = Math.min(90, event.progress * 100);
          props.setProgress(progress);
        }
      });

      webview.addEventListener("did-stop-loading", (event: any) => {
        log.debug("did-stop-loading");
        if (props.setProgress) {
          props.setProgress(99);
          setTimeout(() => {
            props.setProgress(100);
          }, 1000);
        }
      });

      webview.addEventListener("did-finish-load", (event: any) => {
        log.debug("did-finish-load");
        if (props.setProgress) {
          props.setProgress(99);
          setTimeout(() => {
            props.setProgress(100);
          }, 1000);
        }
        dispatch(appActions.hideSplashScreen({}));
      });

      webview.addEventListener("media-started-playing", (event: any) => {
        setMediaPlaying(true);
        if (props.setMediaPlaying) {
          props.setMediaPlaying(true);
        }
      });

      webview.addEventListener("media-paused", (event: any) => {
        setMediaPlaying(false);
        if (props.setMediaPlaying) {
          props.setMediaPlaying(false);
        }
      });

      webview.addEventListener("media-stopped", (event: any) => {
        log.debug("media-stopped", event);
        setMediaPlaying(false);
        if (props.setMediaPlaying) {
          props.setMediaPlaying(false);
        }
      });

      webview.addEventListener("did-fail-load", (event: any) => {
        // Don't leave splash up on main-frame load failure
        if (event.isMainFrame !== false) {
          dispatch(appActions.hideSplashScreen({}));
        }
        if(event.errorCode === -102 || event.errorCode === -105 || 
           event.errorCode === -106 || event.errorCode === -107 || 
           event.errorCode === -109 || event.errorCode === -113 || 
           event.errorCode === -118) {
          let _errorMessage = "Failed to load the page. ";
          webview.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #1a1a1a;
                    color: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                  }
                  .error-container {
                    text-align: center;
                    padding: 2rem;
                    max-width: 600px;
                  }
                  h1 {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    color: #ff4444;
                  }
                  p {
                    color: #cccccc;
                    line-height: 1.5;
                  }
                  .retry-button {
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    background-color: #2d2d2d;
                    border: 1px solid #444;
                    color: #fff;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                  }
                  .retry-button:hover {
                    background-color: #3d3d3d;
                  }
                </style>
              </head>
              <body>
                <div className="error-container">
                  <h1>⚠️ ${_errorMessage}</h1>
                  <p>The server may be down or not accepting connections. ${event.errorDescription}</p>
                  <button className="retry-button" onclick="window.location.reload()">Retry</button>
                </div>
              </body>
            </html>
          `)}`);
        } else {
          log.error("Error:"+event.errorCode+ " "+event.errorDescription);
        }
      });

      webview.addEventListener("focus", handleWebViewFocus);

      const handleUpdateTargetUrl = (event: any) => {
        setHoveredLinkUrl(event.url || "");
      };

      webview.addEventListener("update-target-url", handleUpdateTargetUrl);

      return () => {
        // Cleanup event listeners
        webview.removeEventListener("dom-ready", handleDomReady);
        webview.removeEventListener("page-favicon-updated", () => {});
        webview.removeEventListener("did-navigate", () => {});
        webview.removeEventListener("did-navigate-in-page", () => {});
        webview.removeEventListener("did-fail-load", () => {});
        webview.removeEventListener("did-start-loading", () => {});
        webview.removeEventListener("did-progress", () => {});
        webview.removeEventListener("did-stop-loading", () => {});
        webview.removeEventListener("did-finish-load", () => {});
        webview.removeEventListener("media-started-playing", () => {});
        webview.removeEventListener("media-paused", () => {});
        webview.removeEventListener("media-stopped", () => {});
        webview.removeEventListener("focus", handleWebViewFocus);
        webview.removeEventListener("update-target-url", handleUpdateTargetUrl);
      };
    } else {
      log.debug("webview is null");
      setWebView(document.getElementById(webViewId));
    }
  }, [webview, activeTabId, props.tabId, userAgentLoaded]);

  useEffect(() => {
    let _openTabs = Object.assign({}, openTabs);
    let _tab = Object.assign({}, _openTabs[props.tabId]);
    _tab.mediaPlaying = mediaPlaying;
    _openTabs[props.tabId] = _tab;
    dispatch(sessionActions.setOpenTabs({ data: _openTabs }));
  }, [mediaPlaying]);

  // Screenshot capture is now handled by ScreenshotManagerHub
  // Components retrieve cached screenshots as needed
  useEffect(() => {
    if (takeScreenShot && props.location === "main") {
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
    if (activeTabId === props.tabId) {
      log.debug("Window.js: activeTabId", activeTabId);
      let _openTabs = Object.assign({}, openTabs);
      let _tab = Object.assign({}, _openTabs[activeTabId]);
      _tab.lastAccessed = Date.now();
      if (_tab.sleeping) {
        _tab.sleeping = false;
        setStartUrl(_tab.state.url);
        setSleepWebView(false);
        setWebView(document.getElementById(webViewId));
      }
      _openTabs[activeTabId] = _tab;
      dispatch(sessionActions.setOpenTabs({ data: _openTabs }));
      // @ts-expect-error
      const storeSS = isElectron() && window.electronAPI?.screenshot ? window.electronAPI.screenshot.get(
        "screenshot-" + props.tabId
      ) : null;
      if (storeSS) {
        setStoreSS(storeSS);
      }
    }
  }, [activeTabId]);

  useEffect(() => {
    if (activeTabId !== props.tabId) return;
    if((windowTabs[activeWindowId] && windowTabs[activeWindowId].length > 1)){
      setIsFullScreen(false);
    }else{
      setIsFullScreen(true);
    }
  }, [isTabGroupsEnabled, activeTab, windowTabs, activeWindowId, activeTabId, props.tabId]);

  // Render iframe for non-Electron or webview for Electron
  const renderContent = () => {
    if (sleepWebView) {
      return <></>;
    }

    if (props.location !== "main") {
      if (storeSS) {
        return <img className="webview darken-image" src={storeSS} alt="" />;
      }
      
      // Use iframe for non-Electron
      if (!isElectron()) {
        return (
          <iframe
            id={webViewId}
            className={"webview d-none m-1 " + (isFullScreen ? "full-screen" : "")}
            src={startUrl}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            onLoad={() => handleLoad()}
          ></iframe>
        );
      }
      
      // Wait for user agent to load before rendering webview
      if (!userAgentLoaded) {
        return <div className="webview d-none m-1" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;
      }
      
      // Use webview for Electron (nodeintegration disabled to prevent detection)
      // Render different webview based on whether custom UA is needed
      if (needsCustomUA) {
        return (
          <webview
            id={webViewId}
            className={"webview d-none m-1 "+ (isFullScreen ? "full-screen" : "")}
            // @ts-expect-error
            autosize="on"
            src={startUrl}
            // @ts-expect-error
            allowpopups="true"
            partition={props.partition}
            useragent={defaultUserAgent}
            onLoadCapture={() => handleLoad()}
          ></webview>
        );
      }
      
      return (
        <webview
          id={webViewId}
          className={"webview d-none m-1 "+ (isFullScreen ? "full-screen" : "")}
          // @ts-expect-error
          autosize="on"
          src={startUrl}
          // @ts-expect-error
          allowpopups="true"
          partition={props.partition}
          onLoadCapture={() => handleLoad()}
        ></webview>
      );
    }

    // Main location
    if (!isElectron()) {
      return (
        <iframe
          id={webViewId}
          className={"webview m-1 " + (isFullScreen ? "full-screen" : "")}
          src={startUrl}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation"
          onLoad={() => handleLoad()}
        ></iframe>
      );
    }

    // Wait for user agent to load before rendering webview
    if (!userAgentLoaded) {
      return <div className="webview m-1" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff'}}>Loading...</div>;
    }

    // Render different webview based on whether custom UA is needed
    if (needsCustomUA) {
      return (
        <webview
          id={webViewId}
          className={"webview m-1 "+ (isFullScreen  ? "full-screen" : "")}
          // @ts-expect-error
          autosize="on"
          src={startUrl}
          // @ts-expect-error
          allowpopups="true"
          partition={props.partition}
          useragent={defaultUserAgent}
          onLoadCapture={() => handleLoad()}
        ></webview>
      );
    }

    return (
      <webview
        id={webViewId}
        className={"webview m-1 "+ (isFullScreen  ? "full-screen" : "")}
        // @ts-expect-error
        autosize="on"
        src={startUrl}
        // @ts-expect-error
        allowpopups="true"
        partition={props.partition}
        onLoadCapture={() => handleLoad()}
      ></webview>
    );
  };

  return (
    <>
      {renderContent()}
      {!isElectron() && (
        <div className="demo-notice">
          ⚠️ Demo Mode: Limited functionality - Full features available in desktop app
        </div>
      )}
      {hoveredLinkUrl && props.location === "main" && (
        <div className="link-hover-overlay">
          {hoveredLinkUrl}
        </div>
      )}
    </>
  );
}

export default OPWebView;
