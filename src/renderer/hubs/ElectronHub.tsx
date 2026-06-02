import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from "is-electron";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import { sessionActions } from "../store/session-slice";
import { handleWindowOpened, handleWindowClosed } from "../services/window";

import { utilityAppsActions } from "../store/utility-slice";
import { windowServiceActions } from "../store/window-service-slice";

function ElectronHub() {
  const dispatch = useDispatch();
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const workspace = useSelector((state) => state.workspace.selectedWorkspace);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const desktop = useSelector((state) => state.workspace.selectedDesktop);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const openWindows = useSelector((state) => state.session.openWindows);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const items = useSelector((state) => state.workspace.items);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isLocal = useSelector((state) => state.workspace.isLocal);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeWindow = useSelector((state) => state.session.activeWindow);
  const activeWindowTabs = useSelector(
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    (state) => state.session.activeWindowTabs
  );
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const openTabs = useSelector((state) => state.session.openTabs);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const windowTabs = useSelector((state) => state.session.windowTabs);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeTabs = useSelector((state) => state.session.activeTabs);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeTabId = useSelector((state) => state.session.activeTabId);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const activeTab = useSelector((state) => state.session.activeTab);

  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isUtilityOpen = useSelector((state) => state.utility.isOpen);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const isChatOpen = useSelector((state) => state.chat.isOpen);

  const [inProgress, setInProgress] = useState(false);
  const [urlForNewTab, setUrlForNewTab] = useState("");
  const [action, setAction] = useState("");

  const [newWindowData, setNewWindowData] = useState("");
  const [closeWindowData, setCloseWindowData] = useState("");
  const [handleWindowNavigatedData, setHandleWindowNavigatedData] = useState(
    {}
  );
  const [handleOpenUrlData, setHandleOpenUrlData] = useState("");

  useEffect(() => {
    log.debug("ElectronHub: useEffect");
    if (isElectron()) {
      // @ts-expect-error
      window.electronAPI.handleWindowOpened((event: any, value: any) => {
        setNewWindowData(value);
        setAction("handleWindowOpened");
      });

      // @ts-expect-error
      window.electronAPI.handleWindowClosed((event: any, value: any) => {
        log.debug("SideBar: handleWindowClosed");
        setCloseWindowData(value);
        setAction("handleWindowClosed");
      });

      // @ts-expect-error
      window.electronAPI.handleWindowNavigated((event: any, data: any) => {
        log.debug("SideBar: handleWindowNavigated");
        setHandleWindowNavigatedData(data);
        setAction("handleWindowNavigated");
      });

      // @ts-expect-error
      window.electronAPI.handleOpenUrl((event: any, data: any) => {
        log.debug("ElectronHub: handleOpenUrl: " + data);
        // log.debug("ElectronHub: handleOpenUrl: activeWindow:"+JSON.stringify(activeWindow));
        setHandleOpenUrlData(data);
        setAction("handleOpenUrl");
      });

      // @ts-expect-error
      window.electronAPI.handleCloseTab((event: any, data: any) => {
        setAction("handleCloseTab");
      });
    }
  }, []);

  useEffect(() => {
    if (action === "") return;
    let _openWindows = Object.assign({}, openWindows);
    switch (action) {
      case "handleWindowOpened":
        setInProgress(true);
        log.debug("SideBar: handleWindowOpened");
        let decrypt = atob(newWindowData).split("|");
        let workspaceId = decrypt[0];
        log.debug("SideBar: handleWindowOpened: workspaceId:" + workspaceId);
        let window = {
          workspaceId: workspaceId,
          id: decrypt[1],
          url: decrypt[2],
          location: "external",
        };

        if (_openWindows.hasOwnProperty(window.id)) {
          let _window = Object.assign({}, _openWindows[window.id]);
          _window.location = "external";
          _window.workspaceId = workspaceId;
          _openWindows[window.id] = _window;
          dispatch(
            sessionActions.setOpenWindows({
              data: _openWindows,
            })
          );
          setInProgress(false);
        } else {
          handleWindowOpened(window, items, openWindows, isLocal, (result: any) => {
            if (result === undefined || result === null) {
              return;
            }
            let _result = Object.assign({}, result);
            _result.url = result.start_url;
            _result.location = "external";
            _result.workspaceId = workspaceId;
            _openWindows[result.id] = _result;
            dispatch(
              sessionActions.setOpenWindows({
                data: _openWindows,
              })
            );
            setInProgress(false);
          });
        }
        break;
      case "handleWindowClosed":
        log.debug("SideBar: handleWindowClosed");
        handleWindowClosed(closeWindowData, openWindows, (result: any) => {
          dispatch(
            sessionActions.setOpenWindows({
              data: result,
            })
          );
          dispatch(
            sessionActions.getBackToLaunchPad({
              data: {
                desktopId: desktop.id,
              },
            })
          );
        });
        break;
      case "handleWindowNavigated":
        let _data = Object.assign({}, handleWindowNavigatedData);
        // @ts-expect-error TS(2339): Property 'id' does not exist on type '{}'.
        let _window = Object.assign({}, _openWindows[_data.id]);
        // @ts-expect-error TS(2339): Property 'url' does not exist on type '{}'.
        _window.url = _data.url;
        // @ts-expect-error TS(2339): Property 'id' does not exist on type '{}'.
        _openWindows[_data.id] = _window;
        dispatch(
          sessionActions.setOpenWindows({
            data: _openWindows,
          })
        );
        break;
      case "handleOpenUrl":
        let _url =
          handleOpenUrlData === "about:blank"
            ? activeWindow.data.startUrl
            : handleOpenUrlData;
        dispatch(
          windowServiceActions.openNewTab({
            windowId: activeWindow.id,
            url: _url,
          })
        );

        break;
      case "handleCloseTab":
        log.debug("ElectronHub: closeTab");
        if (activeTabId === "" || activeTabId === "launchpad") {
          return;
        }
        dispatch(windowServiceActions.closeTab(activeTabId));
        break;
      default:
        break;
    }
    setAction("");
  }, [action]);

  return <></>;
}

export default ElectronHub;
