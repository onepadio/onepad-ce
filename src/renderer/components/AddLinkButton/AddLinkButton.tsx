import { useSelector, useDispatch } from "react-redux";
import { modalActions } from "../../store/modal-slice";

import {
  Button,
} from "reactstrap";

import * as Icon from 'react-feather';
import clsx from "clsx";
import "./AddLinkButton.css";

function AddLinkButton(props: any) {
  const dispatch = useDispatch();
  const route = useSelector((state: any) => state.session.route);
  const links = useSelector((state: any) => state.workspace.links);
  const linksLimit = useSelector((state: any) => state.app.linksLimit);

  const toggleAddLinkModal = () => {
    if(linksLimit > 0 && links.length > (linksLimit-1)){
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
      dispatch(modalActions.toggleAddLinkModal({}));
    }
  }

  return (
    <>
      <div id="addLinkButton" className="col-6 col-md-3 col-lg-2 launch-item addLinkButton">
        <div className="card p-3 text-center" onClick={() => toggleAddLinkModal()}>
          <div className="d-flex justify-content-center">
            <Button
              width={72}
              height={72}
              className={clsx(
                "addButton transition-colors",
              )}
              title="Add Site"
            >
              <Icon.Plus size={36} />
            </Button>
            <div className="icon-middle">
              <div className="icon-text">Add Link</div>
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

export default AddLinkButton;
