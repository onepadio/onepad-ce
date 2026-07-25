import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";

import log from "loglevel";
import isElectron from "is-electron";
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
  BoxArrowUp,
  Window,
  Clipboard2Plus,
  ClipboardPlus,
  BookmarkStar,
  StarFill,
  Files,
  Robot,
  Justify,
  ListTask,
  ThreeDotsVertical,
} from "react-bootstrap-icons";
import { openAppWindow, closeWindow } from "../../services/window";
import { newTabForActiveWindow } from "../../util/tabs";
import { closeTab } from "../../util/tabs";
import { appActions } from "../../store/app-slice";
import { sessionActions } from "../../store/session-slice";
import { viewActions } from "../../store/view-slice";
import { windowBarActions } from "../../store/windowbar-slice";
import { tabsBarActions, tabsBarVisualModes } from "../../store/tabsbar-slice";
import { modalActions } from "../../store/modal-slice";

import AppService from "../../services/app";
import { LinkService } from "../../services/link";

import LoadingBar from "react-top-loading-bar";
import { ArrowUpRight, Terminal } from "react-feather";
import XAppService from "../../services/xapp";
import {
  handleSearch,
  handleSearchEngine,
  isValidDomain4,
} from "../../util/search";
import "./AddressBar.css";

import {
  controlsId,
  cornerMenuId,
  spinnerId,
  addressBarId,
  backButtonId,
  forwardButtonId,
  tabsNavBarId,
  showTabsBarButtonId,
  hideTabsBarButtonId,
  reloadButtonId,
  newTabButtonId,
  closeWindowButtonId,
} from "../WindowContainter/shared";

import { toggleLaunchPad } from "../LaunchPadLocal/LaunchPadLocal";
import WaffleMenuIcon from "../Icons/WaffleMenuIcon";
import { Button, Tooltip, Badge } from "reactstrap";
import RemoteAppMenu from "../RemoteAppMenu/RemoteAppMenu";
import { windowServiceActions } from "../../store/window-service-slice";
import TabsDropDown from "./TabsDropDown";
import { chatAssistantActions } from "../../store/chat-assistant-slice";
import { aiAppsActions } from "renderer/store/ai-slice";
import { windowActions } from "../../store/window-slice";

function AddressBar(props: any) {
  const dispatch = useDispatch();

  const user = useSelector((state: any) => state.user);

  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );

  const workspaceState = useSelector((state: any) => state.workspace);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const openWindows = useSelector((state: any) => state.session.openWindows);

  const browserWindows = useSelector(
    (state: any) => state.session.browserWindows
  );

  const sessionState = useSelector((state: any) => state.session);

  const openTabs = useSelector((state: any) => state.session.openTabs);

  const externalTabs = useSelector((state: any) => state.session.externalTabs);

  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  const activeWindow = useSelector((state: any) => state.session.activeWindow);

  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);

  const activeTabs = useSelector((state: any) => state.session.activeTabs);

  const activeTab = useSelector((state: any) => state.session.activeTab);

  const activeTabId = useSelector((state: any) => state.session.activeTabId);

  const isExternalWindowMode = useSelector(
    (state: any) => state.settings.isExternalWindowMode
  );
  const isDesktopStickyMode = useSelector(
    (state: any) => state.settings.isDesktopStickyMode
  );
  const isDeveloperMode = useSelector(
    (state: any) => state.settings.isDeveloperMode
  );

  const showSidebar = useSelector((state: any) => state.window.showSidebar);
  const closedExternalTabId = useSelector(
    (state: any) => state.session.closedExternalTabId
  );
  const isSharedAppsEnabled = useSelector(
    (state: any) => state.settings.isSharedAppsEnabled
  );
  const isBottomNavBarVisible = useSelector(
    (state: any) => state.view.isBottomNavBarVisible
  );

  const hideTabBar = useSelector((state: any) => state.view.hideTabBar);

  const isExtended = useSelector((state: any) => state.view.isExtended);

  const isExtendedMode = useSelector((state: any) => state.view.isExtendedMode);

  const tabsBarVisualMode = useSelector((state: any) => state.tabsBar.mode);

  const links = useSelector((state: any) => state.workspace.links);

  const apps = useSelector((state: any) => state.workspace.apps);

  const searchEngine = useSelector(
    (state: any) => state.windowService.searchEngine
  );
  const activeBrowserWindowId = useSelector(
    (state: any) => state.session.activeBrowserWindowId
  );

  const isLocal = useSelector((state: any) => state.workspace.isLocal);

  const isAIAssistantOpen = useSelector(
    (state: any) => state.ai.isOpen
  );

  const [progress, setProgress] = useState(0);
  const [webview, setWebView] = useState(null);
  const [sleepWebView, setSleepWebView] = useState(false);

  const [webViewId, setWebViewId] = useState("webview-");

  const currentUrl = useSelector((state: any) => state.windowBar.currentUrl);

  const currentTitle = useSelector(
    (state: any) => state.windowBar.currentTitle
  );
  const [title, setTitle] = useState("");
  const [currentFavIcon, setCurrentFavIcon] = useState("");
  const [addressBarValue, setAddressBarValue] = useState("");
  const [isSecure, setIsSecure] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [takeScreenShot, setTakeScreenShot] = useState(false);
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [showTabsBar, setShowTabsBar] = useState(true);
  const [shortUrl, setShortUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [navBackDisabled, setNavBackDisabled] = useState(false);
  const [navFwdDisabled, setNavFwdDisabled] = useState(false);
  const [onElement, setOnElement] = useState("");
  const isTabsScreenVisible = useSelector(
    (state: any) => state.app.tabsScreenVisible
  );

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState: any) => !prevState);

  type HideMode = 'always-on-top' | 'auto-hide';
  const [hideMode, setHideMode] = useState<HideMode>(() => {
    const saved = localStorage.getItem('addressbar-hide-mode');
    return saved === 'auto-hide' ? 'auto-hide' : 'always-on-top';
  });
  const shouldAutoHide = hideMode === 'auto-hide' && activeTab?.id !== "launchpad";
  const [isVisible, setIsVisible] = useState(!shouldAutoHide);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressBarRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(!shouldAutoHide);
    setSettingsOpen(false);
  }, [shouldAutoHide]);

  useEffect(() => {
    if (shouldAutoHide) {
      document.body.classList.add('addressbar-auto-hide');
    } else {
      document.body.classList.remove('addressbar-auto-hide');
    }
    return () => {
      document.body.classList.remove('addressbar-auto-hide');
    };
  }, [shouldAutoHide]);

  useEffect(() => {
    if (!settingsOpen) return;

    const closeSettings = (e: MouseEvent) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(e.target as Node) &&
        !(e.target as Element)?.closest?.('.address-bar-settings-button')
      ) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('click', closeSettings);
    return () => document.removeEventListener('click', closeSettings);
  }, [settingsOpen]);

  const handleToggleHideMode = () => {
    const newMode = hideMode === 'auto-hide' ? 'always-on-top' : 'auto-hide';
    setHideMode(newMode);
    localStorage.setItem('addressbar-hide-mode', newMode);
    setSettingsOpen(false);
  };

  function goHome() {
    let _webview = document.getElementById(webViewId);
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    _webview.loadURL(openWindows[activeWindow.id].url);
  }

  function goBack() {
    let _webview = document.getElementById(webViewId);
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    if (_webview.canGoBack()) _webview.goBack();
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
    if (_webview) _webview.reload();
  }

  function moveTabToExternalWindow() {
    let _window = openWindows[activeWindow.id];
    if (isElectron()) {
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

  function getPartitionId() {
    let partition = "";
    if (sessionState.route === "authenticated") {
      partition =
        sessionState.isInSession &&
        workspaceState.currentSession &&
        workspaceState.currentSession.isolated
          ? "persist:" + user.username + "_" + workspaceState.currentSession.id
          : "persist:" + user.username + "_" + workspace.id;
    } else {
      partition =
        sessionState.isInSession &&
        workspaceState.currentSession &&
        workspaceState.currentSession.isolated
          ? "persist:" + workspaceState.currentSession.id
          : "persist:" + workspace.id;
    }
    return partition;
  }

  function validURLHttp(str: any) {
    var pattern = new RegExp(
      "^(http?:\\/\\/)?" + // protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    return !!pattern.test(str);
  }

  function navigate(e: any) {
    let _addressBar = document.getElementById(addressBarId);
    let _webview = document.getElementById(webViewId);
    if (e.key === "Enter") {
      if (searchQuery === "") {
        return;
      }
      let _query = searchQuery.replace("http://", "").replace("https://", "");
      let _url = searchEngine.search + _query;

      if (activeTab.type === "browser") {
        if (isValidDomain4(searchQuery)) {
          let _url =
            searchQuery.startsWith("http://") ||
            searchQuery.startsWith("https://")
              ? searchQuery
              : "https://" + searchQuery;
          // @ts-expect-error TS(2531): Object is possibly 'null'.
          _webview.loadURL(_url);
        } else {
          // @ts-expect-error TS(2531): Object is possibly 'null'.
          _webview.loadURL(searchEngine.search + searchQuery);
        }
      } else {
        // app or link
        handleSearch(
          searchQuery,
          searchEngine,
          links,
          apps,
          openWindows,
          dispatch,
          sessionActions,
          appActions,
          setSearchQuery,
          desktop,
          workspace,
          activeBrowserWindowId,
          activeTabs,
          isLocal,
          openTabs,
          windowTabs,
          sessionState
        );
      }
      _addressBar.blur();
      return;

      if (isValidDomain4(_query)) {
        _url = "https://" + _query;
        let _hostname = new URL(_url).hostname;
        let _domain = _hostname.replace("www.", "");
      } else {
        // @ts-expect-error TS(2554): Expected 17 arguments, but got 16.
        handleSearch(
          _url,
          links,
          openWindows,
          dispatch,
          sessionActions,
          appActions,
          setSearchQuery,
          searchQuery,
          desktop,
          workspace,
          activeBrowserWindowId,
          activeTabs,
          isLocal,
          openTabs,
          windowTabs,
          sessionState
        );
      }

      try {
        if (
          addressBarValue.startsWith("http://") ||
          addressBarValue.startsWith("https://")
        ) {
          webview.loadURL(addressBarValue);
        } else {
          if (
            isUrlHttp(addressBarValue) ||
            validURLHttp("http://" + addressBarValue)
          ) {
            webview.loadURL("https://" + addressBarValue);
          } else {
            webview.loadURL(
              "https://www.google.com/search?q=" + addressBarValue
            );
          }
        }
      } catch (error) {
        log.debug("Invalid URL:" + addressBarValue);
        webview.loadURL("https://www.google.com/search?q=" + addressBarValue);
      }
    }
  }

  function copyToClipboard() {
    if (isElectron()) {
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "clipboard",
        text: webview.getURL(),
      });
      alert(webview.getURL() + " web link copied to clipboard.");
    }
  }

  function handleCloseWindow() {
    let _window = openWindows[activeWindow.id];
    let _autoSave =
      _window.data.autoSave !== undefined ? _window.data.autoSave : false;
    if (sessionState.isInSession || !_autoSave) {
      closeWindow(
        dispatch,
        sessionActions,
        activeWindow.id,
        openWindows,
        openTabs,
        activeTabs,
        windowTabs,
        desktop,
        isExternalWindowMode
      );
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
      if (_tab.location === "external") {
        if (isElectron()) {
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

    if (_window.type === "app") {
      AppService.updateState(activeWindow.id, {
        tabs: tabs,
      })
        .then((res) => {
          log.debug("updateState", res);
          closeWindow(
            dispatch,
            sessionActions,
            activeWindow.id,
            openWindows,
            openTabs,
            activeTabs,
            windowTabs,
            desktop,
            isExternalWindowMode
          );
        })
        .catch((err) => {
          log.error("updateState", err);
          closeWindow(
            dispatch,
            sessionActions,
            activeWindow.id,
            openWindows,
            openTabs,
            activeTabs,
            windowTabs,
            desktop,
            isExternalWindowMode
          );
        });
    } else if (_window.type === "link") {
      LinkService.updateState(activeWindow.id, {
        tabs: tabs,
      })
        .then((res) => {
          log.debug("updateState", res);
          closeWindow(
            dispatch,
            sessionActions,
            activeWindow.id,
            openWindows,
            openTabs,
            activeTabs,
            windowTabs,
            desktop,
            isExternalWindowMode
          );
        })
        .catch((err) => {
          log.error("updateState", err);
          closeWindow(
            dispatch,
            sessionActions,
            activeWindow.id,
            openWindows,
            openTabs,
            activeTabs,
            windowTabs,
            desktop,
            isExternalWindowMode
          );
        });
    } else if (_window.type === "xapp") {
      log.debug("updateState XAPP", tabs);
      XAppService.updateState(activeWindow.id, {
        tabs: tabs,
      })
        .then((res) => {
          log.debug("updateState", res);
          closeWindow(
            dispatch,
            sessionActions,
            activeWindow.id,
            openWindows,
            openTabs,
            activeTabs,
            windowTabs,
            desktop,
            isExternalWindowMode
          );
        })
        .catch((err) => {
          log.error("updateState", err);
          closeWindow(
            dispatch,
            sessionActions,
            activeWindow.id,
            openWindows,
            openTabs,
            activeTabs,
            windowTabs,
            desktop,
            isExternalWindowMode
          );
        });
    } else {
      closeWindow(
        dispatch,
        sessionActions,
        activeWindow.id,
        openWindows,
        openTabs,
        activeTabs,
        windowTabs,
        desktop,
        isExternalWindowMode
      );
    }
  }

  function switchToExternal() {
    // save window state to localStorage
    // then open new window
    // if only one tab move window to external
    openAppWindow(props.windowId, currentUrl, "external", 0, 0);
    dispatch(
      sessionActions.getBackToLaunchPad({
        data: {
          desktopId: desktop.id,
        },
      })
    );
    // if more than one tab, move tab to external
  }

  function minimizeWindow() {
    log.debug("closeWindow", props.windowId);
    dispatch(
      sessionActions.getBackToLaunchPad({
        data: {
          desktopId: desktop.id,
        },
      })
    );
    return;
  }

  function extend() {
    if (isExtendedMode) {
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(viewActions.toggleExtendedMode());
      dispatch(viewActions.setIsExtended(false));
    } else {
      dispatch(tabsBarActions.switchToTabsMode());
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(viewActions.toggleExtendedMode());
      dispatch(viewActions.setIsExtended(true));
    }
  }

  function handleOnFocus(e: any) {
    const addressBar = document.getElementById(addressBarId);
    log.debug("handleOnFocus", e.target.value);
    if (
      activeTabId === null ||
      activeTabId === undefined ||
      activeTabId === "launchpad"
    ) {
      setAddressBarValue("");
      return;
    }

    if (activeWindow.type === "remote") {
      setAddressBarValue(activeWindow.name);
      setTimeout(() => {
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        addressBar.setSelectionRange(0, currentUrl.length);
      }, 100);
      return;
    }

    setAddressBarValue(
      currentUrl.includes("data:text") ? searchQuery : currentUrl
    );
    setTimeout(() => {
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      addressBar.setSelectionRange(0, currentUrl.length);
    }, 100);
  }

  function handleNewTab() {
    newTabForActiveWindow(
      dispatch,
      workspace,
      desktop,
      windowTabs,
      openTabs,
      activeTabs,
      activeWindow
    );
  }

  const toggleDesktop = () => {
    dispatch(
      sessionActions.getBackToLaunchPad({
        data: {
          desktopId: desktop.id,
        },
      })
    );
  };

  function toggleAddLinkModal() {
    // get current url
    let _webview = document.getElementById("webview-" + activeTabId);
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    const currentUrl = _webview.getURL();
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    const currentTitle = _webview.getTitle();
    dispatch(
      modalActions.toggleAddLinkModal({
        data: {
          url: currentUrl,
          title: currentTitle,
        },
      })
    );
  }

  function openInNewWindow() {
    dispatch(windowServiceActions.moveTabToExternalWindow(activeTab.id));
  }

  function showElement(elementId: any) {
    //let wsname = document.getElementById(elementId);
    //wsname.classList.remove("d-none");
    setOnElement(elementId);
  }

  function hideElement(elementId: any) {
    setOnElement("");
  }

  useEffect(() => {
    if (
      activeTabId === null ||
      activeTabId === undefined ||
      activeTabId === "launchpad"
    )
      return;
    let _tab = openTabs[activeTabId] ? openTabs[activeTabId] : null;
    if (_tab === null) return;
    if (_tab && _tab.state) {
      dispatch(windowBarActions.setCurrentUrl(_tab.state.url));
      dispatch(windowBarActions.setCurrentTitle(_tab.state.title));
    }
    setWebViewId("webview-" + activeTabId);
    setWebView(document.getElementById("webview-" + activeTabId));
    if (openWindows[_tab.window].type !== "browser") {
      //document.getElementById(addressBarId).disabled = true;
    }
  }, [activeTabId]);

  useEffect(() => {
    if (activeTab.id === "launchpad") return;
    const addressBar = document.getElementById(addressBarId);
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    addressBar.disabled = false;
    if (
      activeTabId === null ||
      activeTabId === undefined ||
      activeTabId === "launchpad"
    ) {
      setAddressBarValue("");
      setShortUrl("");
      return;
    }

    if (activeWindow.type === "app" || activeWindow.type === "xapp") {
      setAddressBarValue(activeWindow.data.name);
      setShortUrl(activeWindow.data.name);
      return;
    }

    if (activeWindow.type === "remote") {
      setAddressBarValue(activeWindow.name);
      setShortUrl(activeWindow.name);
      // disable address bar
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      addressBar.disabled = true;
      return;
    }

    log.debug("currentUrl", currentUrl);
    if (currentUrl === "") return;

    let _hostname = new URL(currentUrl).hostname;
    let _protocol = new URL(currentUrl).protocol;
    log.debug("protocol:", _protocol);
    setShortUrl(
      currentTitle.includes("data:text") ? searchQuery : currentTitle
    );
    setAddressBarValue(
      currentTitle.includes("data:text") ? searchQuery : currentTitle
    );
    if (_protocol === "https:") {
      //setAddressBarValue("https://" + _hostname);
      //setShortUrl("https://" + _hostname);
    } else if (_protocol === "http:") {
      //setAddressBarValue("http://" + _hostname);
      //setShortUrl("https://" + _hostname);
    }
  }, [currentUrl, currentTitle, activeTabId]);

  useEffect(() => {
    setAddressBarValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab.id === "launchpad") {
      setNavBackDisabled(true);
      setNavFwdDisabled(true);
      return;
    }
    let _webview = document.getElementById(webViewId);
    if (_webview === null || _webview === undefined) return;

    // Add event listener for dom-ready
    const handleDomReady = () => {
      let backButton = document.getElementById(backButtonId);
      let forwardButton = document.getElementById(forwardButtonId);
      try {
        // @ts-expect-error
        if (_webview && _webview.canGoBack()) {
          setNavBackDisabled(false);
        } else {
          setNavBackDisabled(true);
        }

        // @ts-expect-error
        if (_webview && _webview.canGoForward()) {
          setNavFwdDisabled(false);
        } else {
          setNavFwdDisabled(true);
        }
      } catch (e) {
        log.error(e);
      }
    };

    // Add event listener
    _webview.addEventListener("dom-ready", handleDomReady);

    // Initial check if already ready
    // @ts-expect-error
    if (_webview.isReady) {
      handleDomReady();
    }

    // Cleanup
    return () => {
      _webview.removeEventListener("dom-ready", handleDomReady);
    };
  }, [activeTab, webViewId]);

  useEffect(() => {
    if (activeTab.id === "launchpad") {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [activeTab, activeWindow]);

  function toggleShowSidebar() {
    dispatch(windowActions.toggleShowSidebar({}));
  }

  function showSideBar() {
    dispatch(windowActions.showSideBar({}));
  }

  const activeWindowTabCount = windowTabs[activeWindowId]?.length || 0;

  return (
    <>
      {shouldAutoHide && !isVisible && (
        <div
          className="address-bar-trigger-indicator"
          onMouseEnter={() => setIsVisible(true)}
          title="Show address bar"
        />
      )}

      <div
        id="address-bar"
        ref={addressBarRef}
        className={`address-bar d-flex ${props.className} ${
          isSharedAppsEnabled ? " with-left-bar" : ""
        } ${isAIAssistantOpen ? "chat-assistant-open" : ""} ${
          isVisible ? "visible" : "hidden"
        }`}
        onMouseLeave={() => {
          if (!shouldAutoHide || settingsOpen) return;
          if (!hideTimeoutRef.current) {
            hideTimeoutRef.current = setTimeout(() => {
              setIsVisible(false);
              hideTimeoutRef.current = null;
            }, 500);
          }
        }}
        onMouseEnter={() => {
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }
        }}
      >
      {activeTab.id !== "launchpad" && (
        <>

          <Button
            id={"home-button-" + activeTabId}
            className="btn btn-dark ml-2 position-relative"
            onClick={() => showSideBar()}
            onMouseEnter={() => showSideBar()}
            disabled={disabled}
          >
            <ListTask size={20} />
            {activeWindowTabCount > 0 && (
              <Badge
                color="primary"
                pill
                className="position-absolute start-100 translate-middle"
                style={{ top: '15px' }}
              >
                {activeWindowTabCount}
              </Badge>
            )}
          </Button>
          <Button
            id={"home-button-" + activeTabId}
            className="btn btn-dark"
            onClick={() => goHome()}
            disabled={disabled}
          >
            <House size={20} />
          </Button>
          <Button
            id={backButtonId}
            className="btn btn-dark"
            onClick={() => goBack()}
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            title="Previous page"
            data-bs-custom-className="custom-tooltip"
            disabled={navBackDisabled}
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            id={forwardButtonId}
            className="btn btn-dark ml-1"
            onClick={() => goForward()}
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            title="Next page"
            data-bs-custom-className="custom-tooltip"
            disabled={navFwdDisabled}
          >
            <ChevronRight size={20} />
          </Button>
          <Button
            id={"reload-button"}
            className="btn btn-primary"
            onClick={() => reload()}
            disabled={disabled}
          >
            <ArrowClockwise color="white" size={20} />
          </Button>
          <div className="d-flex align-items-center justify-content-center form-control address-bar-new px-2">
            {activeWindow && activeWindow.data && activeWindow.data.icon && (
              <div className="d-flex align-items-center justify-content-center mr-2">
                <img
                  src={
                    activeWindow.type === "app" || activeWindow.type === "xapp"
                      ? `./images/store/icon/${activeWindow.data.icon}`
                      : activeWindow.data.icon
                  }
                  alt={activeWindow.data.name || "Window icon"}
                  width={20}
                  height={20}
                  className="rounded"
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
            <input
              id={addressBarId}
              className="flex-grow-1 border-0 bg-transparent text-white"
              type="search"
              placeholder="Search"
              aria-label="Search"
              value={addressBarValue}
              onKeyDown={(e) => {
                navigate(e);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === "") {
                  setAddressBarValue("");
                  setShortUrl("");
                }
              }}
              //onFocus={(e) => { handleOnFocus(e)}}
              onFocus={(e) => {
                handleOnFocus(e);
              }}
              onBlur={(e) => {
                setAddressBarValue(shortUrl);
              }}
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title={currentUrl}
              style={{ outline: "none" }}
            />
          </div>
          <Button
            id={"add-bookmark-button"}
            className="btn btn-dark"
            onClick={() => toggleAddLinkModal()}
            disabled={disabled}
            onMouseEnter={() => showElement("add-bookmark")}
            onMouseLeave={() => hideElement("add-bookmark")}
          >
            <BookmarkStar size={20} />
            {onElement === "add-bookmark" ? (
              <Tooltip
                isOpen={true}
                target={"add-bookmark-button"}
                toggle={toggle}
                transition={{ timeout: 0 }}
              >
                Add Link to Launchpad
              </Tooltip>
            ) : (
              <></>
            )}
          </Button>
          <Button
            id={"copy-to-clipboard-button"}
            className="btn btn-primary"
            onClick={() => copyToClipboard()}
            disabled={disabled}
            onMouseEnter={() => showElement("copy-to-clipboard")}
            onMouseLeave={() => hideElement("copy-to-clipboard")}
          >
            <Files color="white" size={20} />
            {onElement === "copy-to-clipboard" ? (
              <Tooltip
                isOpen={true}
                target={"copy-to-clipboard-button"}
                toggle={toggle}
                transition={{ timeout: 0 }}
              >
                Copy to Clipboard
              </Tooltip>
            ) : (
              <></>
            )}
          </Button>
          <Button
            id={"open-in-new-window-button2"}
            className="btn btn-primary"
            onClick={() => openInNewWindow()}
            disabled={disabled}
            onMouseEnter={() => showElement("open-in-new-window")}
            onMouseLeave={() => hideElement("open-in-new-window")}
          >
            <Window color="white" size={20} />
            {onElement === "open-in-new-window" ? (
              <Tooltip
                isOpen={true}
                target={"open-in-new-window-button2"}
                toggle={toggle}
                transition={{ timeout: 0 }}
              >
                {activeTab.type === "remote"
                  ? "Open in New Window"
                  : "Open Tab in New Window"}
              </Tooltip>
            ) : (
              <></>
            )}
          </Button>
          <Button
            color="dark"
            onClick={() => dispatch(aiAppsActions.toggle("ai"))}
            className="chat-assistant-button"
            title="AI Assistant"
          >
            <Robot size={16} />
          </Button>
          {isDeveloperMode && (
            <button
              id={"console-" + activeTabId}
              className="btn btn-dark ml-1"
              onClick={() => webview.openDevTools()}
              data-bs-toggle="tooltip"
              data-bs-placement="right"
              title="Developer Tools"
              data-bs-custom-className="custom-tooltip"
            >
              <Terminal size={16} />
            </button>
          )}
          <div className="address-bar-settings" ref={settingsMenuRef}>
            <Button
              color="dark"
              className="address-bar-settings-button"
              title="Address bar settings"
              onClick={(e) => {
                e.stopPropagation();
                setSettingsOpen((open) => !open);
              }}
            >
              <ThreeDotsVertical size={16} />
            </Button>
            {settingsOpen && (
              <div className="address-bar-settings-menu context-menu">
                <div
                  className="context-menu-item"
                  onClick={handleToggleHideMode}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    {hideMode === 'auto-hide' ? (
                      <>
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                      </>
                    ) : (
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    )}
                  </svg>
                  <span>{hideMode === 'auto-hide' ? 'Disable Auto-Hide' : 'Enable Auto-Hide'}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
    </>
  );
}

export default AddressBar;
