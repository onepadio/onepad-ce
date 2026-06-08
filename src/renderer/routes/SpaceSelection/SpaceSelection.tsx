import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import { workspaceActions } from "../../store/workspace-slice";
import { modalActions } from "../../store/modal-slice";
import { appActions } from "../../store/app-slice";

import "./SpaceSelection.css";

import { Button, Spinner } from "reactstrap";
import * as Icon from 'react-feather';
import { Grid, PlusCircle } from "react-bootstrap-icons";

import { WorkspaceService } from "../../services/workspace";
import { UsersService } from "../../services/users";
import {
  processOpenTabsBeforePersist,
  processWindows,
} from "../../services/window";
import SpaceIcon from "../../components/SpacePad/SpaceIcon";

import logoIcon from '../../images/icon_512x512_transparent.png';
import spaceBgImage from '../../images/space_bg.jpg';
import { ProfilesService } from "renderer/services/profiles";
import DesktopService from "renderer/services/desktop";
import NewWorkspaceModalWindow from "renderer/components/NewWorkspaceModalWindow/NewWorkspaceModalWindow";
import { userActions } from "renderer/store/user-slice";
import { sessionActions } from "renderer/store/session-slice";
import TopBar from "../Person/TopBar";

export default function SpaceSelection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionStateData = useSelector((state: any) => state.session);
  const workspaceState = useSelector((state: any) => state.workspace);
  const personId = useSelector((state: any) => state.app.personId);
  const userId = useSelector((state: any) => state.user.id);
  const userName = useSelector((state: any) => state.user.name);
  const selectedPerson = useSelector((state: any) => state.app.selectedPerson);

  const workspaces = useSelector((state: any) => state.workspace.workspaces);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const sessions = useSelector((state: any) => state.workspace.sessions);
  const activeDesktopWindows = useSelector((state: any) => state.session.activeDesktopWindows);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");

  useEffect(() => {
    // Load workspaces for the selected user
    if (userId && personId) {
      loadWorkspaces();
    }
  }, [userId, personId]);

  useEffect(() => {
    if (selectedWorkspaceId !== "") {
      selectWorkspace(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  function loadWorkspaces() {
    setIsLoading(true);
    WorkspaceService.getActiveWorkspacesByUserId(userId).then((workspaces) => {
      log.debug("Loaded workspaces for user:", userId, workspaces);
      dispatch(workspaceActions.setWorkspaces({
        workspaces: workspaces
      }));
      setIsLoading(false);
    }).catch((error) => {
      log.error("Error loading workspaces:", error);
      setIsLoading(false);
    });
  }

  function selectWorkspace(workspaceId: string) {
    log.debug("Selecting workspace:", workspaceId);

    const selectedWorkspace = workspaces.find((w: any) => w.id === workspaceId);
    if (!selectedWorkspace) {
      log.error("Workspace not found:", workspaceId);
      return;
    }

    // Select the new workspace
    WorkspaceService.selectWorkspaceById(
      dispatch,
      workspaceId,
      workspaceState,
      sessionStateData
    ).then(() => {
      UsersService.setLastWorkspace(userId, workspaceId);
      navigate("/home");
    }).catch((err) => {
      log.error("Error selecting workspace:", err);
    });
  }

  function handleCreateNewSpace() {
    dispatch(modalActions.toggleNewWorkspaceModal({}));
  }

  function handleSpaceSelect(spaceId: string) {
    setSelectedWorkspaceId(spaceId);
  }

  return (
    <>
      <div className="space-selection-background" style={{ backgroundImage: `url(${spaceBgImage})` }} />
      <Button
        color="secondary"
        outline
        className="back-button-fixed"
        onClick={() => {
          dispatch(userActions.setUserId(""));
          dispatch(appActions.setProfileId(""));
          dispatch(sessionActions.setLocation("profiles"));
          navigate('/');
        }}
      >
        <Icon.ArrowLeft size={16} className="me-2" />
        Back
      </Button>
      <div className='d-flex justify-content-center mt-3 logo-container'>
            <img width={96} src={logoIcon} alt="logo" />
      </div>
      <div className="space-selection">

        <NewWorkspaceModalWindow
        onClose={() => {
          loadWorkspaces();
        }} />
        <div className="container-fluid">
          <div className="row d-flex justify-content-center mb-4">
            <div className="col-auto text-center">
              <h3>Select a Space</h3>
              {selectedPerson && (
                <p className="text-white">
                  Choose a space for {selectedPerson.name || userName}
                </p>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="row d-flex justify-content-center">
              <div className='mt-3 d-flex justify-content-center'>
                <Spinner color='light' />
              </div>
            </div>
          ) : (
            <div className="row d-flex justify-content-center">
              <div className="col-12 col-lg-10 col-xl-8">
                <div className="spaces-grid">
                  {workspaces.map((workspace: any) => (
                    <div key={workspace.id} className="space-card-wrapper">
                      <div
                        className="space-card"
                        onClick={() => handleSpaceSelect(workspace.id)}
                      >
                        <div className="space-card-header">
                          <div className="space-icon-wrapper">
                            {workspace.config && workspace.config.iconType === "image" ? (
                              <img
                                width={48}
                                height={48}
                                className="space-icon-image"
                                src={workspace.config.icon}
                                alt={workspace.name}
                              />
                            ) : (
                              <div
                                className="space-icon-color"
                                style={{
                                  backgroundColor: workspace.config?.color ||
                                    "#" + (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, "0")
                                }}
                              >
                                {workspace.config?.alias || workspace.name.toUpperCase().slice(0, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-card-body">
                          <h5 className="space-name">{workspace.name}</h5>
                          <p className="space-description text-muted d-none">
                            {workspace.description || "Your workspace for organizing apps and content"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add New Space Card */}
                  <div className="space-card-wrapper">
                    <div
                      className="space-card add-space-card"
                      onClick={handleCreateNewSpace}
                    >
                      <div className="space-card-header">
                        <div className="space-icon-wrapper">
                          <div className="space-icon-add">
                            <PlusCircle size={32} />
                          </div>
                        </div>
                      </div>
                      <div className="space-card-body">
                        <h5 className="space-name">Create New Space</h5>
                        <p className="space-description text-white">
                          Add a new workspace to organize your apps
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>

  );
}
