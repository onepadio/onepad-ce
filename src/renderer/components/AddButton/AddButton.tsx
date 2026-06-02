
import { useDispatch, useSelector } from "react-redux";
import { modalActions } from "../../store/modal-slice";

import {
  Button,
} from "reactstrap";
import * as Icon from 'react-feather';
import clsx from "clsx";
import "./AddButton.css";
import { storeActions } from "../../store/store-slice";

function AddButton(props: any) {
  const dispatch = useDispatch();
  const route = useSelector((state: any) => state.session.route);
  const apps = useSelector((state: any) => state.workspace.apps);
  const appsLimit = useSelector((state: any) => state.app.appsLimit);

  const toggleAppStore = () => {
    dispatch(storeActions.setSelectedStore("web"));
    dispatch(modalActions.hideLaunchPad({}));
    if(appsLimit > 0 &&  apps.length > (appsLimit-1)){
      if(route !== "authenticated"){
        setTimeout(() => {
            //alert("You have reached the maximum number of workspaces. Please sign in to create more workspaces.");
            dispatch(modalActions.toggleSignUpModalWindow({}));
        }, 100);
      }else{
        // open upgrade modal
        dispatch(modalActions.toggleUpgradeModalWindow({}));
      }
    }else{
      dispatch(modalActions.setLocation("launchpad"));
      dispatch(modalActions.toggleAppStoreModal({}));
    }
   
  }

  return (
    <>
      <div id="addAppButton" className="addAppButton">
        <div className="card p-2 text-center">
          <div className="d-flex justify-content-center" onClick={() => toggleAppStore()}>
            <Button
              width={48}
              height={48}
              className={clsx(
                "addButton transition-colors",
              )}
              title="Add Site"
            >
              <Icon.Plus size={24} />
            </Button>
            <div className="icon-middle">
              <div className="icon-text">Add a Site</div>
            </div>
          </div>
          <br />
          <div>
            <span className="text-white-50"></span>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddButton;
