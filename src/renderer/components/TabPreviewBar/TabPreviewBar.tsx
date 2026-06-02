import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import log from "loglevel";
import { sessionActions } from "../../store/session-slice";
import { appActions } from "../../store/app-slice";
import isElectron from "is-electron";

import "./TabsPreviewBar.css";
import { closeTab, newTabForActiveWindow } from "../../util/tabs";
import { Button, Col, Container, Row } from "reactstrap";
import { Grid, GridFill, Plus, PlusCircle, Speedometer, XCircleFill } from "react-bootstrap-icons";
import { viewActions } from "../../store/view-slice";
import { tabsBarActions, tabsBarVisualModes } from "../../store/tabsbar-slice";

function TabsPreviewBar() {
  const dispatch = useDispatch();
  // settings

  const isTabGroupsEnabled = useSelector((state: any) => state.settings.isTabGroupsEnabled);

  const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

  const isSharedAppsEnabled = useSelector((state: any) => state.settings.isSharedAppsEnabled);
  //session

  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);

  const openTabs = useSelector((state: any) => state.session.openTabs);

  const activeWindow = useSelector((state: any) => state.session.activeWindow);

  const activeTabId = useSelector((state: any) => state.session.activeTabId);

  const activeTab = useSelector((state: any) => state.session.activeTab);

  const activeTabs = useSelector((state: any) => state.session.activeTabs);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const openWindows = useSelector((state: any) => state.session.openWindows);

  const browserWindows = useSelector((state: any) => state.session.browserWindows);

  const ssDict = useSelector((state: any) => state.session.ssDict);

  const ssDictVersion = useSelector((state: any) => state.session.ssDictVersion);

  const screenShotStatusVersion = useSelector((state: any) => state.session.screenShotStatusVersion);


  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const isExtended = useSelector((state: any) => state.view.isExtended);

  const isExtendedMode = useSelector((state: any) => state.view.isExtendedMode);

  const tabsBarVisualMode = useSelector((state: any) => state.tabsBar.mode);

  const isAIAssistantOpen = useSelector((state: any) => state.ai.isOpen);


  const [screenShots, setScreenShots] = useState<Record<string, any>>({});
  const [windowIcon, setWindowIcon] = useState<string>("");
  const [version, setVersion] = useState<number>(0);
  const [componentClassName, setComponentClassName] = useState("tabs-preview-bar pl-0 d-flex justify-content-center d-none");
  const [tabs, setTabs] = useState<string[]>([]);

  const componentId = "tabs-preview-bar";
  const domId = "tabs-preview-bar";
  const plusButtonId = "tabs-preview-plus-button";
  const iconId = "tabs-preview-icon-id";

  useEffect(() => {
    // componentDidMount
    return () => {
      // componentWillUnmount
    };
  }, []);

  useEffect(() => {
    const element = document.getElementById(componentId);
    if(element === null || element === undefined) return;
      if((windowTabs[activeWindowId] && windowTabs[activeWindowId].length > 1)){
        setTimeout(() => {
          element.classList.remove("d-none");
        }, 500);
      }else{
        element.classList.add("d-none");
      }


  },[activeWindowId, isExtended, isTabGroupsEnabled, activeTab, windowTabs]);

  useEffect (() => {
    const element = document.getElementById(componentId);

    let _window = openWindows[activeWindowId];
    if(_window){
        if(_window.type === "app"){
            setWindowIcon("./images/store/icon/"+_window.data.icon);
        }else if(_window.type === "link"){
            setWindowIcon(_window.data.icon);
        }else{
            setWindowIcon("icon_128x128.png");
        }
    }

    if(windowTabs[activeWindowId]){
      windowTabs[activeWindowId].forEach((tabId) => {
        let _tab = openTabs[tabId];
        if(isElectron() && _tab && _tab.webContentsId !== undefined && _tab.webContentsId !== null){
            //window.electronAPI.send("toMain", {
            //  action: "screenshot",
            //  id: _tab.webContentsId,
            //  tab: _tab.id,
            //});
        }
      });
    }

    if(activeWindowId !== null || activeWindowId !== undefined || activeWindowId !== "launchpad"){
      if(windowTabs[activeWindowId]){
          let _tabs = [];
          windowTabs[activeWindowId].forEach((tabId) => {
              if(openTabs[tabId]){
                  _tabs.push(tabId);
              }
          });
          setTabs(_tabs);
          //let _ssDict = {};
          //windowTabs[activeWindowId].forEach((tabId) => {
          //  let _tab_ = openTabs[tabId];
          //    if(ssDict[tabId]){
          //        _ssDict[tabId] = window.electronAPI.screenshot.get(_tab_.state.url);
          //    }
          //});
          //setScreenShots(_ssDict);
      }
    }


  }, [activeWindowId, activeTabId, windowTabs, ssDictVersion]);

useEffect(() => {
    setVersion(screenShotStatusVersion);
    log.debug("ssDict:  "+ssDict);

}, [ssDict, screenShotStatusVersion]);

  function tabsMenu(){
    if(activeWindow !== undefined && activeWindow.id !== undefined && windowTabs[activeWindow.id] !== undefined && activeWindow.type !== "remote"){
        return (
            tabs.map((tabId) =>
                openTabs[tabId] ? tilesTabItem(tabId) : (<> </>)
            )
        )
    }else{
        return (
            <></>
        );
    }
  }

  function tilesTabItem(tabId: string){
    let tab = openTabs[tabId];
    let _ss = screenShots[tabId] ? screenShots[tabId] : "./images/store/icon/preview.png";
    let tabTitle = tab.state.title === "" ? tab.state.url.substring(0,25).concat("...") : tab.state.title.substring(0,25).concat("...");
    let _icon = tab.state.icon.startsWith("http") || tab.state.icon.startsWith("./images/store/icon/") ? tab.state.icon : "./images/store/icon/"+tab.state.icon;
    try {
      return tab.id === activeTabId ? (
        <div
            id={"tabs-screen__item-"+tab.id}
            className={"align-middle tabs-screen__column"}
            ref={(el) => {
              if (el && tab.id === activeTabId) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }
            }}
            >
            <Container
              className={"tabs-screen__item d-flex flex-column justify-content-end active "+tabsBarVisualMode}
              >
                            <div id={"closeButtonx"+tab.id} className="d-flex justify-content-end mr-1 close-button">
                <XCircleFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
              </div>
              <Row className={tabsBarVisualMode !== tabsBarVisualModes.SCREENS ? "d-none": "" }>
                <Col xs={12} className="align-self-center tab-item-col">

                    <div className="d-flex justify-content-center">

                        <img
                            id={"ss-"+tab.id}
                            className="tabs-screen__screenshot"
                            src={_ss}
                            data-version={ssDictVersion}
                            alt=""
                            onClick={() => handleOnClick(tab)}
                            onError={(e) => {
                                // @ts-expect-error
                                e.target.onerror = null;
                                // @ts-expect-error
                                e.target.src = "./images/store/icon/preview.png";
                            }}
                        />

                    </div>
                </Col>
              </Row>
              <Row className="mb-1 ml-1">
                <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleOnClick(tab)}>
                  <div className="appicon d-flex justify-content-center" >
                                        <img width={16} className="launch-icon" src={_icon} alt=""/>
                  </div>
                </Col>
                <Col xs={10} className="align-self-center tab-item-col" onClick={() => handleOnClick(tab)}>
                    {}
                    <div className="d-flex w-100 justify-content-start">
                        <span className="tab-title text-white">{tabTitle}</span>
                    </div>
                </Col>

              </Row>
            </Container>
        </div>
      ): (
        <div
            id={"tabs-screen__item-"+tab.id}

            className={tab.sleeping ? "align-middle  grayscale tabs-screen__column" : "align-middle tabs-screen__column" }
            >
            <Container className={"tabs-screen__item d-flex flex-column justify-content-end "+tabsBarVisualMode}>
                            <div id={"closeButtonx"+tab.id} className="d-flex justify-content-end mr-1 close-button">
                      <XCircleFill size={16} color="gray" onClick={() => handleCloseTab(tab)}></XCircleFill>
              </div>
              <Row className={tabsBarVisualMode !== tabsBarVisualModes.SCREENS ? "mt-1 d-none": "mt-1" }>
                <Col xs={12} className="align-self-center tab-item-col">

                    <div className="d-flex justify-content-center">

                        <img
                            id={"ss-"+tab.id}
                            className="tabs-screen__screenshot"
                            src={_ss}
                            data-version={ssDictVersion}
                            alt=""
                            onClick={() => handleOnClick(tab)}
                            onError={(e) => {
                                // @ts-expect-error
                                e.target.onerror = null;
                                // @ts-expect-error
                                e.target.src = "./images/store/icon/preview.png";
                            }}
                        />

                    </div>
                </Col>
              </Row>
              <Row className="mb-1 ml-1 tabs-screen_item__description">
                <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleOnClick(tab)}>
                {
                    tab.sleeping ? (
                        <div className="d-flex justify-content-end sleeping-tab" onClick={() => handleOnClick(tab)}>
                            <Speedometer size={16} color="gray" className="align-self-center"></Speedometer>
                        </div>
                    ) : (
                      <div className="appicon d-flex justify-content-center" >
                                                <img width={16} className="launch-icon" src={_icon} alt=""/>
                      </div>
                    )
                  }
                </Col>
                <Col xs={10} className=" tab-item-col" onClick={() => handleOnClick(tab)}>
                    {}
                    <div className="d-flex w-100 justify-content-start">
                        <span className="tab-title text-white">{tabTitle}</span>
                    </div>
                </Col>

              </Row>
            </Container>
        </div>
      )
    } catch (error) {
        log.error(error);
        return (
        <></>
        );
    }
  }

  function tabItem(tabId){
    let tab = openTabs[tabId];
    let _ss = ssDict[tabId] ? ssDict[tabId] : "./images/store/icon/preview.png";
    let tabTitle = tab.state.title === "" ? tab.state.url.substring(0,30).concat("...") : tab.state.title.substring(0,30).concat("...");
    let _icon = "";

    return (
                <div key={tabId} data-version={version} className="tab-item mt-2 mr-2">
            <img
                id={"ss-"+tab.id}
                className={"tabs-screen__screenshot "+(tab.id === activeTabId ? "active" : "")}
                height={80}
                width={80}
                src={_ss}
                alt=""
                onClick={() => handleOnClick(tab)}
                onError={(e) => {
                    // @ts-expect-error
                    e.target.onerror = null;
                    // @ts-expect-error
                    e.target.src = "./images/store/icon/preview.png";
                }}
            />
        </div>
    );
  }

  function handleOnClick(tab){
    handleSwitchTab(tab);
  }

  function handleOnClickAnimated(tab){
    let _container = document.getElementById(domId);
    const _selectedSS = document.getElementById("ss-"+tab.id);
    const _ssImage = document.getElementById("tabs-screen__ss-image");
    // get coordinates of the selected screenshot
    const _ssRect = _selectedSS.getBoundingClientRect();
    // set the image to the selected screenshot
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    _ssImage.src = document.getElementById("ss-"+tab.id).src;
    _ssImage.style.position = "absolute";
    _ssImage.style.left = _ssRect.left+"px";
    _ssImage.style.top = _ssRect.top+"px";
    _ssImage.style.width = _ssRect.width+"px";
    _ssImage.style.height = _ssRect.height+"px";
    _ssImage.style.transition = "all 0.1s";

    setTimeout(() => {
        let _containerRect = _container.getBoundingClientRect();
        // set the image to the selected screenshot
        _ssImage.style.width = _containerRect.width+"px";
        _ssImage.style.height = _containerRect.height+"px";
        _ssImage.style.left = "0px";
        _ssImage.style.top = "36px";
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        _ssImage.style.opacity = 1;
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        _ssImage.style.zIndex = 1000;
        _ssImage.style.transition = "all 0.5s";
        _ssImage.style.pointerEvents = "none";
        _ssImage.style.overflow = "hidden";
        _ssImage.style.display = "block";

        const _items = document.getElementsByClassName("tabs-screen__item");
        for(let i=0; i<_items.length; i++){
            // if(_items[i].id !== "tabs-screen__item-"+tab.id){
                _items[i].classList.add("tabs-screen__item__not_selected");
            // }
        }

        //document.getElementById(plusButtonId).classList.add("d-none");
        //document.getElementById(iconId).style.opacity = 0;
        //document.getElementById(iconId).style.transition = "all 0.1s";
        // _selectedSS.classList.add("tabs-screen__item-selected");
        setTimeout(() => {
            handleSwitchTab(tab);
        }, 500);
    }, 100);
}

function handleSwitchTab(tab){
    const _ssImage = document.getElementById("tabs-screen__ss-image");
    log.debug("handleSwitchTab", tab);
    //TODO: if tab location is external, open external window
    if(tab.location === "external"){
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
                action: "switch-to-external-tab",
                tabWindowId: tab.window,
                tabId: tab.id,
                type: tab.type,
            });
        }
    }

    dispatch(sessionActions.setActiveTab({data: tab}));
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(appActions.hideTabsScreen());
}

function handleCloseTab(tab) {
    // @ts-expect-error TS(2554): Expected 13 arguments, but got 12.
    closeTab(tab, dispatch, openTabs, windowTabs, openWindows, browserWindows, activeWindowId, activeTabId, activeTabs, desktop, isExternalWindowMode, sessionActions);
}

function handleNewTab(){
    newTabForActiveWindow(dispatch, workspace, desktop, windowTabs, openTabs, activeTabs, activeWindow);
}

function hide(){
  if(isExtendedMode){
    dispatch(viewActions.setIsExtended(true));
  }
}

function showIfNeeded(){
  if(isExtendedMode){
    dispatch(viewActions.setIsExtended(false));
  }
}

return (
    <div id={componentId} className={`tabs-preview-bar pl-0 d-flex justify-content-center ${tabsBarVisualMode} ${activeWindow?.type !== 'browser' || true ? 'remote' : ''} ${isSharedAppsEnabled ? 'with-left-bar' : 'remote'} `} onMouseEnter={() => showIfNeeded()} onMouseLeave={() => hide()}>
          <div className={"align-middle mt-1 mb-1 tabs-screen__mode-switch d-none"}>
                <Container fluid className="w-100 h-100 justify-content-center">
                    <Row className="h-100">
                        <Col xs={12} className="align-self-center">
                            {
                                tabsBarVisualMode !== tabsBarVisualModes.TABS ? (
                                  <GridFill size={20} color="white" onClick={() =>  dispatch(tabsBarActions.switchToTabsMode())}></GridFill>
                                ) : (
                                  <Grid size={20} color="white" onClick={() => dispatch(tabsBarActions.switchToSpaceMode())}></Grid>
                                )
                            }
                        </Col>
                    </Row>
                </Container>
          </div>
          <div className={`d-flex justify-content-start tabs-preview-bar_tabs ${isAIAssistantOpen ? 'chat-assistant-open' : ''}`}>
            {
                tabsMenu()
            }
            <Col id={plusButtonId} className="align-middle mt-1 mb-1 tabs-screen__plus d-none">
                <Container fluid className="w-100 h-100 justify-content-center">
                    <Row className="h-100">
                        <Col xs={12} className="align-self-center">
                            <div className="d-flex justify-content-center p-1 mt-1">
                                <Button color="dark" onClick={() => handleNewTab() } >
                                    <Plus color="white" size={48} />
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Col>

          </div>
          <div id={plusButtonId} className={"d-none align-middle mt-1 mb-1 tabs-screen__plus "+tabsBarVisualMode}>
                <Container fluid className="w-100 h-100 justify-content-center">
                    <Row className="h-100">
                        <Col xs={12} className="align-self-center">
                          <PlusCircle size={20} color="white" onClick={() => handleNewTab()}></PlusCircle>
                        </Col>
                    </Row>
                </Container>
          </div>
    </div>
  );

}

export default TabsPreviewBar;
