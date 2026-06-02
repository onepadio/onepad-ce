import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";


import XAppService from "../../services/xapp";

import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";
import { appActions } from "../../store/app-slice";

import "./LaunchPadLocal.css";

import { Alert } from "reactstrap";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { Clouds, Tv } from "react-bootstrap-icons";


import RemoteTasks from "./RemoteTasks";
import RemoteDesktops from "./RemoteDesktops";

function CloudPadBody(props: any) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const route = useSelector((state: any) => state.session.route);
  
  const profileId = useSelector((state: any) => state.app.profileId);
  
  const user = useSelector((state: any) => state.user);
  
  const openWindows = useSelector((state: any) => state.session.openWindows);
  
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

  
  const isCloudPadOpen = useSelector((state: any) => state.modal.isCloudPadOpen);
  
  const cloudPadTab = useSelector((state: any) => state.modal.cloudPadTab);

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
    let _allItems: any = [];
    visibleApps.forEach((item) => {
      let _item = Object.assign({}, item);
      _item.type = "app";
      _allItems.push(_item);
    });

    visibleLinks.forEach((item) => {
      let _item = Object.assign({}, item);
      let _data = Object.assign({}, item.data);
      _item.type = "link";
      _item.data = _data;
      _item.data.name = item.data.title;
      _allItems.push(_item);
    });
    log.debug("All items: ", _allItems);
    if (sortAlphabetically) {
      _allItems.sort((a, b) => {
        return a.data.name.localeCompare(b.data.name);
      });
    } else {
      _allItems.sort((a, b) => {
        return a.createdAt - b.createdAt;
      });
    }

    if (searchQuery.length > 0) {
      _allItems = _allItems.filter((item) => {
        return item.data.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setAllItems(_allItems);
  }, [visibleApps, visibleLinks, searchQuery, sortAlphabetically]);

  useEffect(() => {
    
    const _launchpad = document.getElementById("launchpad-id");
    const _backdrop = document.getElementById("launchpad-backdrop");
    if(!_launchpad || !_backdrop) return;

    if (isCloudPadOpen) {
      _launchpad.style.display = "block";
      _backdrop.style.display = "block";
      let _xapps = JSON.parse(localStorage.getItem("xappIds-"+profileId));
      log.debug("LaunchPadLocal: useEffect: xapps: ", _xapps);
      if(!_xapps) {
        setGlobalApps([]);
      }else{
        setGlobalApps(_xapps);
      }
    } else {
      _launchpad.style.display = "none";
      _backdrop.style.display = "none";
    }
  }, [isCloudPadOpen]);

  useEffect(() => {
    log.debug("Profile ID: ", profileId);
    if(profileId === "" || profileId === undefined) return;

    XAppService.getAllByProfileId(profileId).then((xapps: []) => {
      
      dispatch(appActions.setXApps(xapps.reverse() || []));
      let _xappsStore: any = {};
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
        {}
        <div className="row">
        {}
        <div className="col">
            <Tabs
            className="container-fluid launchpad-tabs"
            defaultFocus={true}
            selectedIndex={tabIndex}
            onSelect={(index) => setTabIndex(index)}
            >
            <TabList>
                {
                  cloudPadTab === "apps" && (
                    <Tab>
                      <div id="myRemote" className="d-flex align-items-center">
                          <Clouds className="mr-2" />
                          <span>Cloud Apps</span>
                      </div>
                    </Tab>
                  )
                }
                {
                  cloudPadTab === "pcs" && (
                    <Tab>
                      <div id="myRemote" className="d-flex align-items-center">
                        <Tv className="mr-2" />
                        <span>Cloud PCs</span>
                      </div>
                    </Tab>
                  )
                }
            </TabList>
            {
              cloudPadTab === "apps" && (
                <TabPanel>
                  {}
                  <div className="container-fluid mt-4 position-absolute top-10 start-0 small-icons-tab">
                    <div className="row">
                        <RemoteTasks />
                    </div>
                  </div>
                </TabPanel>
              )
            }
            {
              cloudPadTab === "pcs" && (
                <TabPanel>
                  {}
                  <div className="container-fluid mt-4 position-absolute top-10 start-0 small-icons-tab">
                  <div className="row">
                      <RemoteDesktops />
                      </div>
                    </div>
                  </TabPanel>
                )
              }
            </Tabs>
        </div>
        </div>
    </div>
  );
}

export default CloudPadBody;
