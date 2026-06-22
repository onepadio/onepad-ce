import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { useNavigate } from "react-router-dom";
import * as Icon from 'react-feather';
import isElectron from 'is-electron';


import default_bg from "../../images/default_bg.jpg";
import "../../App.css";
import { Alert, Button, Fade } from "reactstrap";

import Dock from "react-osx-dock";


// Reducers
import { userActions } from "../../store/user-slice";
import { workspaceActions } from "../../store/workspace-slice";
import { addWorkspace, getWorkspaces } from "../../api/WorkspaceApi";

import { localWorkspace, addLocalWorkspace, selectWorkspaceByName, setWorkspaces } from "../../services/workspace";

import SPNavBar from "../../components/SPNavBar/SPNavBar";
import LaunchPad from "../../components/LaunchPad/LaunchPad";
import LaunchPadLocal from "../../components/LaunchPadLocal/LaunchPadLocal";
import SearchBar from "../../components/SearchBar/SearchBar";
import DesktopMenu from "../../components/DesktopMenu/DesktopMenu";
import SettingsCanvas from "../../components/SettingsCanvas/SettingsCanvas";
import TabWindow from "../../components/WindowContainter/TabWindow";
import SideBar from "../../components/SideBar/SideBar";
import EditLaunchIconModalWindow from "../../components/EditLaunchIconModalWindow/EditLaunchIconModalWindow";
import RenameSpaceModalWindow from "../../components/RenameSpaceModalWindow/RenameSpaceModalWindow";
import ArchiveWorkspaceModal from "../../components/ArchiveWorkspaceModal/ArchiveWorkspaceModal";
import AddLinkModalWindow from "../../components/AddLinkModalWindow/AddLinkModalWindow";
import EditUserAppModalWindow from "../../components/EditUserAppModalWindow/EditUserAppModalWindow";

function ProtectedHome({
  signOut,
  user
}: any) {
  const dispatch = useDispatch();
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const isLocal = useSelector((state: any) => state.workspace.isLocal);
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const workspaces = useSelector((state: any) => state.workspace.workspaces);
  const windows = useSelector((state: any) => state.window.windows);
  const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);
  const isEfficiencyModeEnabled = useSelector(
    (state: any) => state.settings.isEfficiencyModeEnabled
  );

  const [selectedIconId, setSelectedIconId] = useState("");
  const [isEditLaunchIconModalOpen, setIsEditLaunchIconModalOpen] =
    useState(false);
  const toggleEditLaunchIconModal = () =>
    setIsEditLaunchIconModalOpen(!isEditLaunchIconModalOpen);

  const [isInEditMode, setIsInEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    initUserData(user);
    initWorkspacesOnline();
  }, []);

  useEffect(() => {
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "switched-workspace",
        workspace: workspace.id,
      });
    }
  }, [workspace]);

  useEffect(() => {
    log.debug("workspaces", workspaces);
    if (workspaces.length > 0 && !isUpdating) {
      try {
        //selectWorkspaceByName("Device", dispatch);
      } catch (error) {
        log.error("Workspaces not ready yet..");
      }

    }
  }, [workspaces]);

  useEffect(() => {
    log.debug("openWindows", openWindows);
  }, [openWindows]);

  function initUserData(user: any) {
    const _name = user.attributes.email.split("@")[0];
    dispatch(
      userActions.setUser({
        id: user.username,
        email: user.attributes.email,
        name: _name,
      })
    );
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "signed-in",
        id: user.username,
      });
    }
  }

  function initWorkspacesOnline() {
    if (!isUpdating) {
      log.debug("updating workspaces...");
      setIsUpdating(true);
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(workspaceActions.clearWorkspaces());
      getWorkspaces(user.username).then((data: any) => {
        if (data.length == 0) {
          addWorkspace({
            user: user.username,
            name: "Online",
            bgImage: default_bg,
            items: [],
          }).then((ws) => {
            initWorkspacesOnline();
          });
        }else{
          // Check if Online workspace exists
          let onlineWorkspace = data.find((w: any) => w.name === "Online");
          if (!onlineWorkspace) {
            let ws = {
              user: user.username,
              name: "Online",
              bgImage: default_bg,
              items: [],
            };
            addWorkspace(ws).then((response: any) => {
              log.debug("response", response);
              if(response.ResponseMetadata.HTTPStatusCode === 200){
                getWorkspaces(user.username).then((data: any) => {
                  data.push(localWorkspace);
                  setWorkspaces(data, dispatch).then(() => {
                    setIsUpdating(false);
                    console.debug("updating workspaces done");
                    selectWorkspaceByName("Online", dispatch);
                  });
                });
              }
            });
          }else{
            data.push(localWorkspace);
            setWorkspaces(data, dispatch).then(() => {
              setIsUpdating(false);
              console.debug("updating workspaces done");
              selectWorkspaceByName("Online", dispatch);
            });
          }
        }
      });

      setTimeout(() => {
        if(isUpdating){
          console.debug("updating workspaces timeout");
          setIsUpdating(false);
        }
      }, 5000);
    }
  }

  let launchPad = "";
  if (isLocal) {
    // @ts-expect-error TS(2322): Type 'Element' is not assignable to type 'string'.
    launchPad = <LaunchPadLocal name="pad1" data-interval="false" isInEditMode={isInEditMode}/>;
  } else {
    // @ts-expect-error TS(2322): Type 'Element' is not assignable to type 'string'.
    launchPad = <LaunchPad name="pad1" data-interval="false" isInEditMode={isInEditMode}/>;
  }

  function _window(item: any){
    log.debug("item.url", item["start_url"]);
    let partition = "persist:"+user.username+"_"+workspace.id;

    //return <XWindow key={item.id} id={item.id} name={item.name} icon={item.icon} url={item.url} width={item.width} height={item.height} x={item.x} y={item.y} />

    return item["location"] === "main" ? <TabWindow key={item["id"]} windowId={item["id"]} partition={partition} url={item["url"]} workspaceId={item["workspaceId"]}/> : <></>

  }

  return (
    <div id="content">
      {/* @ts-expect-error TS(2322): Type '{ user: any; }' is not assignable to type 'I... Remove this comment to see the full error message */}
      <SPNavBar user={user} />
      {}
      <div className="container-fluid pl-85">
              {}
              <div className="row">
                {}
                <div className="col-2 d-flex justify-content-start">
                  <Button color="dark" onClick={() => setIsInEditMode(!isInEditMode)} className="edit-button">
                    {isInEditMode ? <Icon.X size={16} /> : <Icon.Edit2 size={16} />}
                  </Button>
                </div>
                {}
                <div className="col-8 d-flex justify-content-center">
                  <SearchBar id="searchBar" />
                </div>
                {}
                <div className="col-2 d-flex justify-content-end">
                  <DesktopMenu />
                </div>
              </div>

              <Fade className="mt-3 ml-75" tag="div">
                {launchPad}
              </Fade>
              {
                isExternalWindowMode ? (
                  <> </>
                ) : Object.values(openWindows)
                .map(
                    item => _window(item)
                )
              }
              <EditLaunchIconModalWindow/>
              <RenameSpaceModalWindow />
              <ArchiveWorkspaceModal />
              <AddLinkModalWindow />
              <EditUserAppModalWindow />
              <SettingsCanvas />
              <SideBar />
      </div>
    </div>
  );
}

export default ProtectedHome;
