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
import { SpaceManager } from '../../model/SpaceManager';

import { ProfilesService } from '../../services/profiles';
import { UsersService } from '../../services/users';

import UserApi from '../../api/UserApi';

import LoginNavBar from '../../components/LoginNavBar/LoginNavBar';
import "./Login.css";
import { Fade } from 'reactstrap';
import { PersonsService } from '../../services/persons';
import { USER_TYPE } from '../../model/user';
import { WorkspaceService } from '../../services/workspace';

export function Login() {
  const route = useSelector((state: any) => state.session.route);
  const user = useSelector((state: any) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  let from = location.state?.from?.pathname || '/';

  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const sessionStateData = useSelector((state) => state.session);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const workspaceState = useSelector((state) => state.workspace);

  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const userState = useSelector((state) => state.user);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const showLoginPage = useSelector((state) => state.modal.showLoginPage);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const openStripeModalWhenLoggedIn = useSelector((state) => state.modal.openStripeModalWhenLoggedIn);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const profileId = useSelector((state) => state.app.profileId);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const personId = useSelector((state) => state.app.personId);

  useEffect(() => {
    if(route === "authenticated"){
      // check if user exists in users table
      // if not, create user

      UsersService.getByEmailAndPerson(user.attributes.email, personId).then((_user) => {
        if(_user){ // user exists
          dispatch(userActions.setUser({
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            id: _user.id,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            email: _user.email,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            name: _user.name,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            userType: _user.type,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            uid: _user.uid,
          }));
          let spaceManager = new SpaceManager();
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          spaceManager.switchToUser(_user.id, dispatch, workspaceState, sessionStateData, (userId: any) => {
            PersonsService.setActiveUser(personId, userId);
            log.debug("switched to user: ", userId);
            navigate("/home");
            dispatch(modalActions.setShowLoginPage(false));
          });
        }else{ // user does not exist
          UsersService.create(user.attributes.email, user.attributes.email, personId, USER_TYPE.USER, user.username).then((_userId) => {
            // move guest user workspaces to this user
            UsersService.getGuestUserByPerson(personId).then((guestUser) => {
              // @ts-expect-error TS(2571): Object is of type 'unknown'.
              ProfilesService.getAllByUserId(guestUser.id).then((profiles) => {
                let _profileId = profiles[0].id;
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                WorkspaceService.getWorkspacesByUserId(guestUser.id).then((workspaces) => {
                  // @ts-expect-error TS(2571): Object is of type 'unknown'.
                  workspaces.forEach((workspace: any) => {
                    WorkspaceService.updateUser(workspace.id, _userId);
                    WorkspaceService.updateProfile(workspace.id, _profileId);
                  });
                  switchToUser(_userId);
                });
              });
            });
          }).catch((error) => {
            log.error("create user error: ", error);
          });
        }
      }).catch((error) => {
        log.error("user not found: ", error);
      });

      return;


      ProfilesService.getAllByUserId(user.username).then(
        (profiles) => {
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          if(profiles.length > 0){
            dispatch(appActions.setProfileId(""));
            dispatch(sessionActions.setLocation("profiles"));
            dispatch(modalActions.setShowLoginPage(false));
          }else{
            ProfilesService.get(profileId).then(
              (profile) => {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                if(profile.user !== user.username){
                  ProfilesService.updateUser(profileId, user.username).then(
                    (id) => {
                      log.debug("update user: ", id);
                    }
                  ).catch(
                    (error) => {
                      log.error("update user error: ", error);
                    }
                  );
                }
              }
            ).catch(
              (error) => {
                log.error("get profile error: ", error);
              }
            );
          }
        }
      ).catch(
        (error) => {
          log.error("get profiles error: ", error);
        }
      );
    }
  }, [route, user, navigate, dispatch]);

  function switchToUser(userId: any){
    let spaceManager = new SpaceManager();
    UsersService.get(userId).then((_user) => {
      dispatch(userActions.setUser({
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        id: _user.id,
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        email: _user.email,
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        name: _user.name,
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        userType: _user.type,
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        uid: _user.uid,
      }));
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      spaceManager.switchToUser(_user.id, dispatch, workspaceState, sessionStateData, (_userId: any) => {
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        PersonsService.setActiveUser(personId, _user.id);
        log.debug("switched to user: ", _userId);
        navigate("/home");
        dispatch(modalActions.setShowLoginPage(false));
      });
    });
  }


  function updateLimits(response: any){
    if(response.limits === undefined){
      return;
    }
    dispatch(userActions.setLimits(response.limits));
    dispatch(appActions.updateAccountLimits({
      workspaces: response.limits.maxWorkspaces,
      profiles: response.limits.maxProfiles,
      apps: response.limits.maxApps,
      links: response.limits.maxLinks,
    }));
  }



  function setUserData(user: any) {
    const _name = user.attributes.email.split("@")[0];
    let _user = {
      id: user.username,
      email: user.attributes.email,
      name: _name,
    };
    dispatch(userActions.setUser(_user));
    // localStorage.setItem("user", JSON.stringify(_user));
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
        action: "signed-in",
        id: user.username,
      });
    }
  }

  return (
    <div id="login-content" className='login-container'>
        <LoginNavBar />
        {}
        <div className="container-fluid logo">
          <div className='mb-2 d-flex justify-content-center'>
              <img width={96} src={logoIcon} alt="logo" />
          </div>
          <div className='mb-2 d-flex justify-content-center'>
                    <h2 className='text-white'> OnePad </h2>
                </div>
        </div>
        {}
        <div className="container-fluid">
          <Fade className="mt-3 ml-75" tag="div">
            {}
            <div className="login row">

            </div>
          </Fade>
        </div>
    </div>
  );
}
