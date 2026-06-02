import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useSelector, useDispatch } from "react-redux";
import isElectron from "is-electron";
import log from "loglevel";

import logoIcon from '../../images/512x512.png';
// Reducers
import { userActions } from '../../store/user-slice';
import { workspaceActions } from '../../store/workspace-slice';
import { modalActions } from '../../store/modal-slice';
import { appActions } from '../../store/app-slice';
import { sessionActions } from '../../store/session-slice';
import { settingsActions } from '../../store/settings-slice';

import UserApi from '../../api/UserApi';
import { ProfilesService } from '../../services/profiles';
import { WorkspaceService } from "../../services/workspace";
import DesktopService from "../../services/desktop";
import XAppService from "../../services/xapp";

import LoginNavBar from '../../components/LoginNavBar/LoginNavBar';
import "./Start.css";

import {Spinner} from "reactstrap";

export function Start() {
  const route = useSelector((state: any) => state.session.route);
  const user = useSelector((state: any) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  let from = location.state?.from?.pathname || '/';
  const profileId = useSelector((state: any) => state.app.profileId);

  useEffect(() => {
    if (route === 'authenticated') {
      UserApi.getUserById(user.username).then(
          (response: any) => {
            log.debug("getUserById response: ", response);
            // check response status code
            log.debug("user.id ", response.id);
            if(response.id === user.username){
              localStorage.setItem("user", JSON.stringify(user));
              setUserData(user);
              dispatch(appActions.setProfileId(""));
              dispatch(sessionActions.setLocation("profiles"));
              navigate('/');
            }
        }
      ).catch(
        (error) => {
          log.debug("getUserById error: ", error);
          log.debug("getUserById error: ", error.response);
          if(error.response.status === 404){
            UserApi.createUser({
              id: user.username,
              email: user.attributes.email,
            }).then(
              (response: any) => {
                log.debug("createUser response: ", response);
                localStorage.setItem("user", JSON.stringify(user));
                setUserData(user);
                dispatch(appActions.setProfileId(""));
                dispatch(sessionActions.setLocation("profiles"));
                navigate('/');
              }
            ).catch(
              (error) => {
                log.error("createUser error: ", error);
                dispatch(appActions.setProfileId(""));
                dispatch(sessionActions.setLocation("profiles"));
                navigate('/');
              }
            );
          }
        }
      );
    }else{
        ProfilesService.getAllByUserId("device").then((_profiles) => {
            let _profile = _profiles[0];
            ProfilesService.get(_profile.id).then((profile) => {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                if(profile.settings !== undefined ){
                    dispatch(settingsActions.setSpaceBrowserEnabled(_profile.settings.isSpaceBrowserEnabled));
                    dispatch(settingsActions.setAdvancedBackgroundEnabled(_profile.settings.isAdvancedBackgroundEnabled));
                    dispatch(settingsActions.setSplitWindowsEnabled(_profile.settings.isSplitWindowsEnabled));
                    dispatch(settingsActions.setSessionsEnabled(_profile.settings.isSessionsEnabled));
                    dispatch(settingsActions.setDesktopsEnabled(_profile.settings.isDesktopsEnabled));
                    dispatch(settingsActions.setWorkspacesEnabled(_profile.settings.isWorkspacesEnabled));
                    dispatch(settingsActions.setSharedAppsEnabled(_profile.settings.isSharedAppsEnabled));
                    dispatch(settingsActions.setDeveloperMode(_profile.settings.isDeveloperMode));
                    dispatch(settingsActions.setExternalWindowMode(_profile.settings.isExternalWindowMode));
                    dispatch(settingsActions.setEfficiencyModeEnabled(_profile.settings.isEfficiencyModeEnabled));
                }
                dispatch(appActions.setSelectProfile(_profile));
                dispatch(appActions.setProfileId(_profile.id));
            });

        });
    }
  }, [route, user, navigate, dispatch]);

  useEffect(() => {
    log.debug("Profile ID: ", profileId);
    if(profileId === "") return;
    sessionStorage.clear();

    WorkspaceService.getWorkspacesByProfileId(profileId).then((workspaces) => {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      if(workspaces.length === 0){
        // @ts-expect-error TS(2554): Expected 7-8 arguments, but got 5.
        WorkspaceService.newWorkspace("Default", true, false, true, profileId).then((workspaceId) => {
          WorkspaceService.getWorkspacesByProfileId(profileId).then((workspaces) => {
            log.debug("Workspaces", workspaces);
            dispatch(workspaceActions.setWorkspaces({
              workspaces: workspaces
            }));
          }).catch((error) => {
            log.debug("Error getting workspaces", error);
          });
          dispatch(userActions.setDefaultWorkspace({ id: workspaceId }));
          DesktopService.newDesktop("Default", workspaceId, true).then((desktop) => {
            // @ts-expect-error TS(2554): Expected 4 arguments, but got 2.
            WorkspaceService.selectWorkspaceById(dispatch, workspaceId).then(() => {
              log.debug("Default workspace ready...");
              dispatch(sessionActions.setLocation("launchpad"));
              localStorage.setItem("activeProfileId", profileId);
              navigate("/home");
            });
          });
        });
      }else{
        log.debug("Workspaces", workspaces);
        dispatch(workspaceActions.setWorkspaces({
          workspaces: workspaces
        }));
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        workspaces.forEach((workspace: any) => {
          if(workspace.isDefault === 1){
            log.debug("Default workspace found...", workspace);
            // @ts-expect-error TS(2554): Expected 4 arguments, but got 2.
            WorkspaceService.selectWorkspaceById(dispatch, workspace.id).then(() => {
              log.debug("Default workspace ready...");
              dispatch(sessionActions.setLocation("launchpad"));
              localStorage.setItem("activeProfileId", profileId);
              navigate("/home");
            });
          }
        });
      }
    });

    XAppService.getAllByProfileId(profileId).then((xapps) => {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      dispatch(appActions.setXApps(xapps.reverse() || []));
      let _xappsStore = {};
      let _xappIds: any = [];
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
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

  function setUserData(user: any) {
    const _name = user.attributes.email.split("@")[0];
    let _user = {
      id: user.username,
      email: user.attributes.email,
      name: _name,
    };
    dispatch(userActions.setUser(_user));
    localStorage.setItem("user", JSON.stringify(_user));
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "signed-in",
        id: user.username,
      });
    }
  }

  return (
    <div id="content">
        {}
        <div className="container-fluid">
            {}
            <div className="login row">
                <div className='mb-2 d-flex justify-content-center'>
                    <img width={96} src={logoIcon} alt="logo" />
                </div>
                <div className='mb-2 d-flex justify-content-center'>
                    <h2 className='text-white font-bold text-3xl'> OnePad </h2>
                </div>
                <div className='mt-3 d-flex justify-content-center'>
                    <Spinner color='light' />
                </div>
            </div>
        </div>
    </div>

  );
}
