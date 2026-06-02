import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";



import * as Icon from "react-feather";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableColumns,
  faTableCellsLarge,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";

import XAppService from "../../services/xapp";

import { sessionActions } from "../../store/session-slice";
import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";
import { appActions } from "../../store/app-slice";

import "./LaunchPadLocal.css";

import { Alert, Button, ListGroup, ListGroupItem } from "reactstrap";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { Grid, PlusCircle, Link, Link45deg, PersonCircle, Cloud, Clouds, Tv } from "react-bootstrap-icons";

import { addressBarId } from "../WindowContainter/shared";

import LaunchIcon from "../LaunchIcon/LaunchIcon";
import AddButton from "../AddButton/AddButton";
import AddLinkButton from "../AddLinkButton/AddLinkButton";
import LinkIcon from "../LinkIcon/LinkIcon";
import AddRemoteButton from "../AddRemoteButton/AddRemoteButton";
import RemoteLaunchIcon from "../RemoteLaunchIcon/RemoteLaunchIcon";
import BrowserButton from "../BrowserButton/BrowserButton";
import RemoteTasks from "./RemoteTasks";
import RemoteDesktops from "./RemoteDesktops";

import "./SaasPad.css";

function SaasPadBody(props: any) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const route = useSelector((state: any) => state.session.route);

  const profileId = useSelector((state: any) => state.app.profileId);

  const user = useSelector((state: any) => state.user);

  const openWindows = useSelector((state: any) => state.session.openWindows);
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  const windowHistory = useSelector((state: any) => state.session.windowHistory);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const selectedDesktop = useSelector(

    (state: any) => state.workspace.selectedDesktop
  );
  const selectCategory = useSelector(

    (state: any) => state.workspace.selectedCategory
  );

  const apps = useSelector((state: any) => state.workspace.apps);

  const links = useSelector((state: any) => state.workspace.links);

  const xapps =  useSelector((state: any) => state.app.xapps);

  const xappsStore =  useSelector((state: any) => state.app.xappsStore);


  const appsLimit = useSelector((state: any) => state.app.appsLimit);

  const linksLimit = useSelector((state: any) => state.app.linksLimit);

  const searchQuery = useSelector((state: any) => state.launchpad.searchQuery);


  const currentTitle = useSelector((state: any) => state.windowBar.currentTitle);


  const isSaasPadOpen = useSelector((state: any) => state.modal.isSaasPadOpen);
  const saasPadSelectedIndex = useSelector((state: any) => state.modal.saasPadSelectedIndex);

  const [globalApps, setGlobalApps] = useState([]);
  const [visibleApps, setVisibleApps] = useState([]);
  const [visibleLinks, setVisibleLinks] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);

  const [remoteTasks, setRemoteTasks] = useState([]);

  // Alert
  const [visible, setVisible] = useState(true);
  const onDismiss = () => setVisible(false);

  const [tabIndex, setTabIndex] = useState(0);

  function openSignIn() {
    navigate("/login");
  }

  let alert = null;
  if (route === "authenticated") {
    alert = (
      <Alert color="info" isOpen={visible} toggle={onDismiss}>
        This workspace is offline. <br /> Please use online workspaces to save
        your data.
      </Alert>
    );
  } else {
    alert = (
      <Alert color="info" isOpen={visible} toggle={onDismiss}>
        This workspace is offline. <br /> Please &nbsp;
        <a className="alert-link" onClick={openSignIn}>
          Sign In
        </a>{" "}
        &nbsp; and use online workspaces to save your data.
      </Alert>
    );
  }

  function hideLaunchPad() {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.hideLaunchPad());
  }

  useEffect(() => {
    log.debug("Selected tab: " + tabIndex);
    switch (tabIndex) {
      case 0:
        log.debug("Selected Apps tab");
        dispatch(workspaceActions.selectCategory({ category: "apps" }));
        break;
      case 1:
        //dispatch(workspaceActions.selectCategory({ category: "links" }));
        log.debug("Selected Remote tab");
        break;
      default:
        dispatch(workspaceActions.selectCategory({ category: "none" }));
        log.debug("Selected unknown tab");
    }
  }, [tabIndex]);

  useEffect(() => {
    if (workspace.name === "RemoteTest") {
      const rtab = document.getElementById("remoteTab");
      if (rtab) {
        rtab.classList.remove("d-none");
      }
    }
  }, [workspace]);

  useEffect(() => {
    log.debug("LaunchPadLocal: useEffect: apps: ", apps);
    if (appsLimit > 0) {
      setVisibleApps(apps.slice(0, appsLimit));
    } else {
      setVisibleApps(apps);
    }
  }, [apps, route, appsLimit]);

  useEffect(() => {
    //if(linksLimit > 0) {
    //  setVisibleLinks(links.slice(0, linksLimit));
    //}else{
    setVisibleLinks(links);
    //}
  }, [links, route, linksLimit]);

  useEffect(() => {
    let _allItems: any[] = [];
    visibleApps.forEach((item: any) => {
      let _item = Object.assign({}, item);
      _item.type = "app";
      if(openWindows.hasOwnProperty(item.id)){
        _allItems.push(_item);
      }
    });

    visibleLinks.forEach((item: any) => {
      let _item = Object.assign({}, item);
      let _data = Object.assign({}, item.data);
      _item.type = "link";
      _item.data = _data;
      _item.data.name = item.data.title;
      if(openWindows.hasOwnProperty(item.id)){
        _allItems.push(_item);
      }
    });
    log.debug("All items: ", _allItems);
    if (sortAlphabetically) {
      _allItems.sort((a, b) => {
        return a.data.name.localeCompare(b.data.name);
      });
    } else {
      // Sort by recent usage (most recently used first)
      _allItems.sort((a, b) => {
        // Current active window comes first
        if (a.id === activeWindowId) return -1;
        if (b.id === activeWindowId) return 1;

        // Then sort by position in window history (more recent = higher index)
        const indexA = windowHistory.lastIndexOf(a.id);
        const indexB = windowHistory.lastIndexOf(b.id);

        // If both are in history, sort by most recent (higher index first)
        if (indexA !== -1 && indexB !== -1) {
          return indexB - indexA;
        }

        // If only one is in history, it comes first
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // If neither is in history, sort by creation time as fallback
        const timeA = a?.createdAt || 0;
        const timeB = b?.createdAt || 0;

        return timeB - timeA;
      });
    }

    if (searchQuery.length > 0) {
      _allItems = _allItems.filter((item) => {
        return item.data.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setAllItems(_allItems);
  }, [visibleApps, visibleLinks, searchQuery, sortAlphabetically, activeWindowId, windowHistory, openWindows]);

  useEffect(() => {

    const _launchpad = document.getElementById("launchpad-id");
    const _backdrop = document.getElementById("launchpad-backdrop");
    if(!_launchpad || !_backdrop) return;

    if (isSaasPadOpen) {
      _launchpad.style.display = "block";
      _backdrop.style.display = "block";
    } else {
      _launchpad.style.display = "none";
      _backdrop.style.display = "none";
    }
  }, [isSaasPadOpen]);

  useEffect(() => {
    log.debug("Profile ID: ", profileId);
    if(profileId === "" || profileId === undefined) return;

    XAppService.getAllByProfileId(profileId).then((xapps: any[]) => {

      dispatch(appActions.setXApps(xapps.reverse() || []));
      let _xappsStore = {};
      let _xappIds: any = [];

      xapps.forEach((xapp: any) => {
        _xappsStore[xapp.id] = xapp;
        _xappIds.push(xapp.id);
      });
      if(localStorage.getItem("xappIds-"+profileId) === null){
        localStorage.setItem("xappIds-"+profileId, JSON.stringify(_xappIds));
      }
      dispatch(appActions.setXAppsStore(_xappsStore));
    }).catch((error) => {
      log.debug("Error getting xapps", error);
    });

  }, [profileId]);

  return (
    <div className="container-fluid launchpad-container">
                <div className="small-icons-tab">
                <div className="icons">
                    <div className={`browser-button-wrapper ${saasPadSelectedIndex === 0 ? 'selected-switcher-item' : ''}`}>
                      <BrowserButton showStatusDot={false} />
                    </div>
                    {allItems?.map((item, index) =>
                    item.type === "app" ? (
                        <div key={item.id} className={`${saasPadSelectedIndex === index + 1 ? 'selected-switcher-item' : ''}`}>
                          <LaunchIcon
                          id={item.id}
                          data={item}
                          iconid={item.id}
                          uuid={item.id}
                          localid={item.id}
                          name={item.data.name}
                          url={
                              item.data.customUrl.length > 0
                              ? item.data.customUrl
                              : item.data.startUrl
                          }
                          icon={item.data.icon}
                          isOpen={openWindows.hasOwnProperty(item.id)}
                          windowConfig={item.data.window}
                          autoSave={item.data.autoSave}
                          isStateful={true}
                          showControls={true}
                          isInEditMode={props.isInEditMode}
                          workspaceId={workspace.id}
                          desktopId={selectedDesktop.id}
                          isolated={
                              item.data.isolated ? item.data.isolated : false
                          }
                          showStatusDot={false}
                          />
                        </div>
                    ) : (
                        <div key={item.id} className={`${saasPadSelectedIndex === index + 1 ? 'selected-switcher-item' : ''}`}>
                          <LinkIcon
                          id={item.id}
                          data={item}
                        url={item.data.startUrl}
                        title={item.data.title}
                        icon={item.data.icon}
                        isInEditMode={props.isInEditMode}
                        isOpen={openWindows.hasOwnProperty(item.id)}
                        workspaceId={workspace.id}
                        desktopId={selectedDesktop.id}
                        windowType={
                            item.data.windowType
                            ? item.data.windowType
                            : "internal"
                        }
                        showStatusDot={false}
                        />
                        </div>
                    )
                    )}
                </div>
                </div>
            </div>
  );
}

export default SaasPadBody;
