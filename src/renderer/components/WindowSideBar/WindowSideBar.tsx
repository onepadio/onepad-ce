import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import isElectron from 'is-electron';
import { v4 as uuidv4 } from 'uuid';
import log from "loglevel";

import { newTabForActiveWindow } from "../../util/tabs";

import { windowActions } from "../../store/window-slice";
import { sessionActions } from "../../store/session-slice";
import { appActions } from "../../store/app-slice";
import { windowServiceActions } from "../../store/window-service-slice";

import { openInternalWindow, openAppWindow, handleWindowClosed } from "../../services/window";

import "./WindowSideBar.css";
// @ts-expect-error
import globe_icon from '../../images/globe_icon_96.png';
import { Alert, Button, ListGroup, ListGroupItem } from "reactstrap";

import {
  Plus,
  XCircleFill,
  SquareHalf,
  PlusCircle,
  LayoutSidebar,
  Layers,
  Bookmark,
  House,
  ChevronLeft,
  ChevronRight,
  ArrowClockwise,
  Star,
  Stars,
  List,
  WindowStack,
  PlusLg,
  Icon0Circle,
  Icon1Circle,
  Icon2Circle,
  Icon3Circle,
  Icon4Circle,
  Icon5Circle,
  Icon6Circle,
  Icon7Circle,
  Icon8Circle,
  Icon9Circle,
  Icon1CircleFill,
  Icon2CircleFill,
  Icon3CircleFill,
  Icon4CircleFill,
  Icon5CircleFill,
  Icon6CircleFill,
  Icon7CircleFill,
  Icon8CircleFill,
  Icon9CircleFill,
  Icon1Square,
  Icon1SquareFill,
  Icon2SquareFill,
  Icon2Square,
  Icon3SquareFill,
  Icon3Square,
  Icon4SquareFill,
  Icon4Square,
  Icon5SquareFill,
  Icon5Square,
  Icon6SquareFill,
  Icon6Square,
  Icon7SquareFill,
  Icon7Square,
  Icon8SquareFill,
  Icon8Square,
  Icon9SquareFill,
  Icon9Square,
} from "react-bootstrap-icons";

function WindowSideBar(){
    const dispatch = useDispatch();

    const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

    const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

    const openWindows = useSelector((state: any) => state.session.openWindows);

    const openTabs = useSelector((state: any) => state.session.openTabs);

    const activeTabs = useSelector((state: any) => state.session.activeTabs);

    const showSidebar = useSelector((state: any) => state.window.showSidebar);

    const activeBar = useSelector((state: any) => state.window.activeBar);

    const activeWindow = useSelector((state: any) => state.session.activeWindow);

    const windowTabs = useSelector((state: any) => state.session.windowTabs);

    const browserWindows = useSelector((state: any) => state.session.browserWindows);

    const items = useSelector((state: any) => state.workspace.links);

    const isLocal = useSelector((state: any) => state.workspace.isLocal);

    const activeBrowserWindowId = useSelector((state: any) => state.session.activeBrowserWindowId);


    const isTabsScreenVisible = useSelector((state: any) => state.app.tabsScreenVisible);

    const [homePage, setHomePage] = useState("https://www.google.com/");
    const [selectedBrowserWindow, setSelectedBrowserWindow] = useState("");

    const toggleShowSidebar = () => {
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(windowActions.toggleShowSidebar());
    }

    function showTiles(){
      if(activeBar === "tiles"){
        toggleShowSidebar();
        return;
      }
      dispatch(windowActions.setActiveBar("tiles"));
    }


    function handleNewTab(){
      newTabForActiveWindow(dispatch, workspace, desktop, windowTabs, openTabs, activeTabs, activeWindow);
    }

    function showTabs(){
      if(isTabsScreenVisible){
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(appActions.hideTabsScreen());
        return;
      }
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(appActions.showTabsScreen());
    }

    function showBookmarks(){
      if(activeBar === "bookmarks"){
        toggleShowSidebar();
        return;
      }
      dispatch(windowActions.setActiveBar("bookmarks"));
    }

    function showFavourites(){
      if(activeBar === "favourites"){
        toggleShowSidebar();
        return;
      }
      dispatch(windowActions.setActiveBar("favourites"));
    }

    function newBrowserWindow(){
      if(browserWindows.length >= 9){
        alert("Maximum number of tab groups reached");
        return;
      }
      let _id = "browser_".concat(uuidv4());
      log.debug("openLink");
      log.debug("openInternalWindow:"+homePage);
      if(openWindows[_id] != null && openWindows[_id].location === "external"){
        openAppWindow(_id, homePage, "external", 0, 0);
        return;
      }

      if(openWindows[_id] != null){
        dispatch(sessionActions.setActiveWindow({data: openWindows[_id]}));
        return;
      }

      let window = {
          workspace: workspace.id,
          id: _id,
          url: ":browser",
          location: "main",
      }

      let _openWindows = Object.assign({}, openWindows);
      let _openTabs = Object.assign({}, openTabs);
      let _windowTabs = Object.assign({}, windowTabs);
      openInternalWindow(
          window,
          items,
          openWindows,
          isLocal,
          (result: any) => {
              if(result === undefined || result === null){
                  return;
              }
              let _result = Object.assign({}, result);
              _result.type = "browser";
              _result.url = homePage;
              _result.location = "main";
              _result.desktop = desktop.id;
              _result.workspace = workspace.id;

              log.debug("Result:"+_result);
              // OpenWindows
              _openWindows[result.id] = _result;
              dispatch(
                sessionActions.setOpenWindows({
                data: _openWindows,
              }));

              // Create initial tab using WindowService
              dispatch(windowServiceActions.openNewTab({
                windowId: _result.id,
                url: _result.data.startUrl
              }));

              dispatch(sessionActions.setActiveWindow({data: _result}));
              dispatch(sessionActions.addBrowserWindow({data: _id}));
              dispatch(sessionActions.setActiveBrowserWindowId({data: _id}));
          },
      );
    }

    function handleSwitchBrowserWindow(key: any){
      log.debug("handleSwitchGroup:",key);
      log.debug("handleSwitchGroup:",browserWindows);
      log.debug("handleSwitchGroup:",openWindows);
      if(key != null){
        let _window = Object.assign({}, openWindows[key]);
        log.debug("handleSwitchGroup:",_window);
        if(openWindows[key] != null){
          dispatch(sessionActions.setActiveWindow({data: openWindows[key]}));
          dispatch(sessionActions.setActiveBrowserWindowId({data: openWindows[key].id}));
        }
      }
    }

    function numberIcon(item: any, index: any){
      let isActive = (item === activeBrowserWindowId);
      let _icon = "";
      switch(index){
        case 0:
          // @ts-expect-error TS(2322): Type 'Element' is not assignable to type 'string'.
          _icon = isActive ? <Icon1SquareFill size={20} /> : <Icon1Square size={20} />;
          break;
        case 1:
          // @ts-expect-error TS(2322): Type 'Element' is not assignable to type 'string'.
          _icon = isActive ? <Icon2SquareFill size={20} /> : <Icon2Square size={20} />;
          break;
        case 2:
          // @ts-expect-error TS(2322): Type 'Element' is not assignable to type 'string'.
          _icon = isActive ? <Icon3SquareFill size={20} /> : <Icon3Square size={20} />;
          break;
        case 3:
          // @ts-expect-error TS(2322): Type 'Element' is not assignable to type 'string'.
          _icon = isActive ? <Icon4SquareFill size={20} /> : <Icon4Square size={20} />;
          break;
        case 4:
          // @ts-expect-error TS(2322): Type 'Element' is not assignable to type 'string'.
          _icon = isActive ? <Icon5SquareFill size={20} /> : <Icon5Square size={20} />;
          break;
        case 5:
          // @ts-expect-error TS(2322): Type 'Element' is not assignable to type 'string'.
          _icon = isActive ?  <Icon6SquareFill size={20} /> : <Icon6Square size={20} />;
          break;
        case 6:
          // @ts-expect-error TS(2322): Type 'Element' is not assignable to type 'string'.
          _icon = isActive ?<Icon7SquareFill size={20} /> : <Icon7Square size={20} />;
          break;
        case 7:
          // @ts-expect-error TS(2322): Type 'Element' is not assignable to type 'string'.
          _icon = isActive ? <Icon8SquareFill size={20} /> : <Icon8Square size={20} />;
          break;
        case 8:
          // @ts-expect-error TS(2322): Type 'Element' is not assignable to type 'string'.
          _icon = isActive ? <Icon9SquareFill size={20} /> : <Icon9Square size={20} />;
          break;
        default:
          break;
      }

      return (
        <ListGroupItem>
            <Button color="dark"
              onClick={() => setSelectedBrowserWindow(item)}
              onContextMenu={(e) => {
                e.preventDefault(); // prevent the default behaviour when right clicked
              }}
              data-bs-toggle="tooltip"
              data-bs-placement="right"
              title={"Tab Group-"+(index+1)}
              data-bs-custom-className="custom-tooltip"
            >
              {
                _icon
              }
            </Button>
        </ListGroupItem>
      )
    }

    useEffect(() => {
      log.debug("selectedBrowserWindow:",selectedBrowserWindow);
      handleSwitchBrowserWindow(selectedBrowserWindow);
    }, [selectedBrowserWindow]);

    if(activeWindow.type === "remote"){
      return (
        <></>
      )
    }else{

      return <>
        <div className="d-flex justify-content-start window-side-bar window-menu bg-dark w-100 d-none">
          <ListGroup className="menu">
            <ListGroupItem >
                <Button color="dark" onClick={() => showTabs()}>
                  <ChevronLeft size={20} />
                </Button>
            </ListGroupItem>
            <ListGroupItem  >
                <Button color="dark" onClick={() => showTabs()}>
                  <ChevronRight size={20} />
                </Button>
            </ListGroupItem>
            <ListGroupItem >
                <Button color="dark" onClick={() => showTabs()}>
                  <ArrowClockwise size={20} />
                </Button>
            </ListGroupItem>
            <ListGroupItem >
                <Button color="dark" onClick={() => handleNewTab()} data-bs-toggle="tooltip" data-bs-placement="right" title="New Tab" data-bs-custom-className="custom-tooltip">
                  <PlusLg size={20} />
                </Button>
            </ListGroupItem>
            <ListGroupItem>
                <Button color="dark" onClick={() => showTabs()} className="position-relative" data-bs-toggle="tooltip" data-bs-placement="right" title="Tabs" data-bs-custom-className="custom-tooltip">
                  {}
                  <WindowStack size={20} /> <span className="position-absolute top-50 start-30 translate-bottom badge rounded-pill bg-primary">{windowTabs[activeWindow.id] ? windowTabs[activeWindow.id].length:0}</span>
                </Button>
            </ListGroupItem>
            <ListGroupItem className="d-none">
                <Button color="dark" onClick={() => showFavourites()} data-bs-toggle="tooltip" data-bs-placement="right" title="Favourites" data-bs-custom-className="custom-tooltip">
                  <Stars size={20} />
                </Button>
            </ListGroupItem>
            <ListGroupItem className="d-none">
                <Button color="dark" onClick={() => showBookmarks()}>
                  <Bookmark size={20} />
                </Button>
            </ListGroupItem>
            {
              activeWindow.type === "browser" ? browserWindows.map((item: any,index: any) => (
                 numberIcon(item, index)
              )) : (<></>)
            }
            {
              activeWindow.type === "browser" && browserWindows.length < 9 && (
                <ListGroupItem>
                  <Button color="dark" onClick={() => newBrowserWindow()} data-bs-toggle="tooltip" data-bs-placement="right" title="New Tab Group" data-bs-custom-className="custom-tooltip">
                    <PlusLg size={20} />
                  </Button>
                </ListGroupItem>
              )
            }
          </ListGroup>
      </div>
      </>;
    }
}

export default WindowSideBar;
