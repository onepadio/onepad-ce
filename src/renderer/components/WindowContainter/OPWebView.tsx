import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from "is-electron";

import { sessionActions } from "../../store/session-slice";
import { appActions } from "../../store/app-slice";
import { windowBarActions } from "../../store/windowbar-slice";
import log from "loglevel";

import "./OPWebView.css";
import { modalActions } from "../../store/modal-slice";
import { generateFormDetectionScript, parseLoginDetection } from "../../utils/formDetection";
import PasswordService from "../../services/password";

function OPWebView(props: any) {
  const dispatch = useDispatch();
  // settings
  
  const isTabGroupsEnabled = useSelector((state: any) => state.settings.isTabGroupsEnabled);

  
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  
  const activeTab = useSelector((state: any) => state.session.activeTab);
  
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  
  const openTabs = useSelector((state: any) => state.session.openTabs);
  
  // Use ref to always access latest openTabs in event handlers
  const openTabsRef = useRef(openTabs);
  useEffect(() => {
    openTabsRef.current = openTabs;
  }, [openTabs]);
  
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

  const [storeSS, setStoreSS] = useState(null);
  const [defaultUserAgent, setDefaultUserAgent] = useState("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

  function handleLoad() {
    log.debug("handleLoad....");
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

    let _openTabs = Object.assign({}, openTabs);
    let _tab = Object.assign({}, _openTabs[props.tabId]);
    let _state = Object.assign({}, _tab.state);
    _state.url = url;
    _tab.state = _state;
    _openTabs[props.tabId] = _tab;
    dispatch(
      sessionActions.setOpenTabs({
        data: _openTabs,
      })
    );
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

  // Password manager: Listen for login detection from webview
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
    };
    
    webview.addEventListener('console-message', handleConsoleMessage);
    
    return () => {
      webview.removeEventListener('console-message', handleConsoleMessage);
    };
  }, [webview, dispatch]);

  // Add all webview event listeners
  useEffect(() => {
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
        
        // Check for saved passwords and offer auto-fill
        checkAndOfferAutofill(webview.getURL());
      };
      
      webview.addEventListener("dom-ready", handleDomReady);
      
      webview.addEventListener("page-favicon-updated",(event: any) => updateTabIcon(event.favicons));
      
      webview.addEventListener("did-navigate", (event: any) => {
        log.debug("did-navigate, wid",webview.getWebContentsId());
        didNavigate(event.url);
      });

      webview.addEventListener("did-navigate-in-page", (event: any) => {
        log.debug("did-navigate-in-page, wid",webview.getWebContentsId());
        didNavigate(event.url);
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
      };
    } else {
      log.debug("webview is null");
      setWebView(document.getElementById(webViewId));
    }
  }, [webview, activeTabId, props.tabId]);

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
      const storeSS = window.electronAPI.screenshot.get(
        "screenshot-" + props.tabId
      );
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

  return sleepWebView ? (
    <></>
  ) : props.location !== "main" ? (
    storeSS ? (
      <img className="webview darken-image" src={storeSS} alt="" />
    ) : (
      <webview
        id={webViewId}
        className={"webview d-none m-1 "+ (isFullScreen ? "full-screen" : "")}
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
  ) : (
    <webview
      id={webViewId}
      className={"webview m-1 "+ (isFullScreen  ? "full-screen" : "")}
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

export default OPWebView;
