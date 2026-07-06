import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import XAppService from "../../services/xapp";
import DesktopService from "../../services/desktop";

import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";
import { appActions } from "../../store/app-slice";

import "./LaunchPadLocal.css";

import { Alert, Button } from "reactstrap";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { Grid, Clouds, Tv, Terminal, Star, Plus, Person } from "react-bootstrap-icons";

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
import DockerTasks from "./DockerTasks";
import { storeActions } from "../../store/store-slice";
import CategoryFolder from "../CategoryFolder/CategoryFolder";

function LaunchPadBody(props: any) {
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

  const xapps = useSelector((state: any) => state.app.xapps);

  const xappsStore = useSelector((state: any) => state.app.xappsStore);


  const appsLimit = useSelector((state: any) => state.app.appsLimit);

  const linksLimit = useSelector((state: any) => state.app.linksLimit);

  const searchQuery = useSelector((state: any) => state.launchpad.searchQuery);


  const currentTitle = useSelector((state: any) => state.windowBar.currentTitle);


  const isLaunchPadOpen = useSelector((state: any) => state.modal.isLaunchPadOpen);

  const [globalApps, setGlobalApps] = useState([]);
  const [visibleApps, setVisibleApps] = useState<any[]>([]);
  const [visibleLinks, setVisibleLinks] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

  function toggleAppStore() {
    dispatch(storeActions.setSelectedStore("web"));

    dispatch(modalActions.setLocation("launchpad"));
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleAppStoreModal());
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...allItems];
    const draggedItem = newItems[draggedIndex];

    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setAllItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);

    // Save the new order to desktop state
    if (selectedDesktop?.id && allItems.length > 0) {
      const iconOrder = allItems.map((item: any) => item.id);
      try {
        await DesktopService.saveIconOrder(selectedDesktop.id, iconOrder);
        log.debug("Icon order saved:", iconOrder);

        // Update the desktop in Redux store
        const updatedDesktop = await DesktopService.get(selectedDesktop.id);
        dispatch(workspaceActions.selectDesktop({ desktop: updatedDesktop }));
      } catch (error) {
        log.error("Error saving icon order:", error);
      }
    }
  };

  // Update icon order when apps or links are added/deleted
  useEffect(() => {
    const updateIconOrderOnChange = async () => {
      if (!selectedDesktop?.id || !selectedDesktop?.state?.iconOrder) {
        return;
      }

      const currentIconOrder = selectedDesktop.state.iconOrder;
      const currentIds = new Set([...apps.map((a: any) => a.id), ...links.map((l: any) => l.id)]);

      // Check if any icons were added or removed
      const savedIds = new Set(currentIconOrder);
      const addedIds = [...currentIds].filter(id => !savedIds.has(id));
      const removedIds = currentIconOrder.filter((id: string) => !currentIds.has(id));

      if (addedIds.length > 0 || removedIds.length > 0) {
        // Remove deleted items and add new items at the end
        let newIconOrder = currentIconOrder.filter((id: string) => currentIds.has(id));
        newIconOrder = [...newIconOrder, ...addedIds];

        try {
          await DesktopService.saveIconOrder(selectedDesktop.id, newIconOrder);
          log.debug("Icon order updated after add/delete:", newIconOrder);

          // Update the desktop in Redux store
          const updatedDesktop = await DesktopService.get(selectedDesktop.id);
          dispatch(workspaceActions.selectDesktop({ desktop: updatedDesktop }));
        } catch (error) {
          log.error("Error updating icon order:", error);
        }
      }
    };

    updateIconOrderOnChange();
  }, [apps, links, selectedDesktop?.id]);

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
    visibleApps.forEach((item: any) => {
      let _item = Object.assign({}, item);
      _item.type = "app";
      _allItems.push(_item);
    });

    visibleLinks.forEach((item: any) => {
      let _item = Object.assign({}, item);
      let _data = Object.assign({}, item.data);
      _item.type = "link";
      _item.data = _data;
      _item.data.name = item.data.title;
      _allItems.push(_item);
    });
    log.debug("All items: ", _allItems);

    if (sortAlphabetically) {
      _allItems.sort((a: any, b: any) => {
        return a.data.name.localeCompare(b.data.name);
      });
    } else {
      // Apply saved icon order from desktop state
      if (selectedDesktop?.state?.iconOrder && selectedDesktop.state.iconOrder.length > 0) {
        const iconOrder = selectedDesktop.state.iconOrder;
        const orderedItems: any[] = [];
        const itemsById = new Map(_allItems.map((item: any) => [item.id, item]));

        // Add items in the saved order
        iconOrder.forEach((id: string) => {
          if (itemsById.has(id)) {
            orderedItems.push(itemsById.get(id));
            itemsById.delete(id);
          }
        });

        // Add any new items that aren't in the saved order (at the end)
        itemsById.forEach((item: any) => {
          orderedItems.push(item);
        });

        _allItems = orderedItems;
      } else {
        // Default sort by creation date
        _allItems.sort((a: any, b: any) => {
          return a.createdAt - b.createdAt;
        });
      }
    }

    if (searchQuery.length > 0) {
      _allItems = _allItems.filter((item: any) => {
        return item.data.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setAllItems(_allItems);
  }, [visibleApps, visibleLinks, searchQuery, sortAlphabetically, selectedDesktop]);

  useEffect(() => {
    const _launchpad = document.getElementById("launchpad-id");
    const _backdrop = document.getElementById("launchpad-backdrop");
    if (!_launchpad || !_backdrop) return;

    if (isLaunchPadOpen) {
      _launchpad.style.display = "block";
      _backdrop.style.display = "block";
      let _xapps = JSON.parse(localStorage.getItem("xappIds-" + profileId) || "[]");
      log.debug("LaunchPadLocal: useEffect: xapps: ", _xapps);
      if (!_xapps) {
        setGlobalApps([]);
      } else {
        setGlobalApps(_xapps);
      }
    } else {
      _launchpad.style.display = "none";
      _backdrop.style.display = "none";
    }
  }, [isLaunchPadOpen]);

  useEffect(() => {
    log.debug("Profile ID: ", profileId);
    if (profileId === "" || profileId === undefined) return;

    XAppService.getAllByProfileId(profileId)
      .then((xapps: any) => {

        dispatch(appActions.setXApps(xapps.reverse() || []));
        let _xappsStore: any = {};
        let _xappIds: any = [];

        xapps.forEach((xapp: any) => {
          _xappsStore[xapp.id] = xapp;
          _xappIds.push(xapp.id);
        });
        if (localStorage.getItem("xappIds-" + profileId) === null) {
          localStorage.setItem(
            "xappIds-" + profileId,
            JSON.stringify(_xappIds)
          );
        }
        dispatch(appActions.setXAppsStore(_xappsStore));
      })
      .catch((error) => {
        log.debug("Error getting xapps", error);
      });
  }, [profileId]);

  return (
    <div id="launchpad-container-id" className="container-fluid launchpad-container">
      {}
      <div className="row">
        {}
        <div className="col">
          <div
            className="container-fluid launchpad-tabs"
          >
              {false && (
                <Tab>
                  <div
                    id="myDocker"
                    className="d-flex align-items-center myDocker d-none"
                  >
                    <Terminal className="mr-2" />
                    <span>Docker</span>
                  </div>
                </Tab>
              )}
              {route === "authenticated" && user.uid !== "" && false && (
                <>
                  <Tab>
                    <div id="myRemote" className="d-flex align-items-center">
                      <Clouds className="mr-2" />
                      <span>Cloud Apps</span>
                    </div>
                  </Tab>
                  <Tab>
                    <div id="myRemote" className="d-flex align-items-center">
                      <Tv className="mr-2" />
                      <span>Cloud PCs</span>
                    </div>
                  </Tab>
                </>
              )}
              <div className="container-fluid">
              <div className="row">
                  <div className="col">
                    <div className="d-flex align-items-center">
                      <Grid
                        className="me-2"
                        style={{ color: "rgba(249, 249, 249, 0.8)" }}
                      />
                      <span
                        style={{
                          color: "rgba(249, 249, 249, 0.8)",
                          fontSize: "18px",
                          fontWeight: "500",
                        }}
                      >
                        {workspace.name}
                      </span>
                    </div>
                  </div>
                  <div className="col">
                    <div className="d-flex align-items-center justify-content-end">
                      <Button
                        id="space-apps-add-button"
                        color="light"
                        className="btn-sm"
                        onClick={toggleAppStore}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col">
                    <div
                      style={{
                        height: "1px",
                        width: "100%",
                        backgroundColor: "rgba(255, 255, 255, 0.3)",
                        margin: "10px 0",
                      }}
                    />
                  </div>
                </div>
              </div>
              {}
              <div className="container-fluid icons-tab">
                <div className="d-flex flex-row justify-content-center p-4 icons-pad-space">
                  <div className="d-flex flex-row justify-content-start w-100 flex-wrap">
                    {allItems
                      ?.filter((item) => item.workspace !== profileId)
                      .map((item, index) =>
                        item.type === "app" ? (
                          <LaunchIcon
                            key={item.id}
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
                            showStatusDot={true}
                            draggable={true}
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e: any) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            style={{
                              opacity: draggedIndex === index ? 0.5 : 1,
                            }}
                          />
                        ) : (
                          <LinkIcon
                            key={item.id}
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
                            showStatusDot={true}
                            draggable={true}
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e: any) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            style={{
                              opacity: draggedIndex === index ? 0.5 : 1,
                            }}
                          />
                        )
                      )}
                  </div>
                </div>
              </div>
            {false && (
              <TabPanel className="d-none">
                {}
                <div className="container-fluid mt-4 position-absolute top-10 start-0 icons-tab">
                  <div className="row">
                    <DockerTasks />
                  </div>
                </div>
              </TabPanel>
            )}
            {false && (
            <TabPanel>
              {}
              <div className="container-fluid mt-4 position-absolute top-10 start-0 icons-tab">
                <div className="row">
                  <RemoteTasks />
                </div>
                </div>
              </TabPanel>
            )}
            {false && (
              <TabPanel>
                {}
                <div className="container-fluid mt-4 position-absolute top-10 start-0 icons-tab">
                  <div className="row">
                  <RemoteDesktops />
                </div>
                </div>
              </TabPanel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LaunchPadBody;
