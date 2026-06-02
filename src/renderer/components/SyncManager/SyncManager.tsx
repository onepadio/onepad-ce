import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux";
import { USER_TYPE } from "../../model/user";
import UserApi from "../../api/UserApi";
import log from "loglevel";
import { userActions } from "../../store/user-slice";
import { appActions } from "../../store/app-slice";
import { modalActions } from "../../store/modal-slice";

export default function SyncManager(){
    const dispatch = useDispatch();
    
    const userState = useSelector((state: any) => state.user);
    
    const userId = useSelector((state: any) => state.user.id);
    
    const userType = useSelector((state: any) => state.user.userType);
    
    const uid = useSelector((state: any) => state.user.uid);

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

    useEffect(() => {
        if( userType === "") return;
        if(userType === USER_TYPE.GUEST){
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            dispatch(appActions.resetLimits());
            dispatch(userActions.setProduct("FREE"));
            return;
        }

        if( 
            userId === "" || userId === undefined || userId === null ||
            uid === "" || uid === undefined || uid === null
        ) return;

        // if user exists
        UserApi.getUserById(userState.uid).then(
            (response: any) => {
            log.debug("getUserById response: ", response);
            // check response status code
            log.debug("user.id ", response.id);
            if(response.id === userState.uid){
                localStorage.setItem("user-"+userState.uid, JSON.stringify(response));
                updateLimits(response);
                dispatch(userActions.setProduct(response.productName));
                // limits data needs to be persisted
            }
        }
        ).catch(
        (error) => {
            log.debug("getUserById error: ", error);
            log.debug("getUserById error: ", error.response);
            if(error.response.status === 404){
            UserApi.createUser({
                id: userState.uid,
                email: userState.email,
            }).then(
                (response: any) => {
                log.debug("createUser response: ", response);
                localStorage.setItem("user-"+userState.uid, JSON.stringify(response));
                dispatch(userActions.setProduct(response.productName));
                updateLimits(response);
                }
            ).catch(
                (error) => {
                log.error("createUser error: ", error);
                alert("Error creating user");
                }
            );
            }
        }
        );

    }, [userId]);

    return (
        <></>
    )
}