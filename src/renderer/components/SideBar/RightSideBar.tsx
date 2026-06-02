import isElectron from "is-electron";
import "./RightSideBar.css";
import UtilitiesMenu from "./UtilitiesMenu";

import { Button, ListGroup, ListGroupItem } from "reactstrap";
import { BoxArrowRight, Calculator, FileEarmarkArrowUp, Key, Terminal } from "react-bootstrap-icons";
import { useDispatch } from "react-redux";

import {modalActions} from "../../store/modal-slice";
import {cornerWindowActions} from "../../store/corner-window-slice";
import {passwordManagerActions} from "../../store/passwordmanager-slice";
import SettingsMenu from "../SettingsMenu/SettingsMenu";


function RightSideBar() {
    const dispatch = useDispatch();
    const toggleFileSharingModal = () => {
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(modalActions.toggleFileSharingRequestModal());
      }

    

    function openCalculator(){
        dispatch(cornerWindowActions.setUrl("https://calculator.onepad.io"));
        dispatch(cornerWindowActions.setWidth(400));
        dispatch(cornerWindowActions.setHeight(620));
        dispatch(cornerWindowActions.setIsOpen(true));
    }
    function togglePasswordManager(){
        dispatch(passwordManagerActions.togglePasswordManager());
    }

    function onToggleDevTools() {
      if (isElectron()) {
        // @ts-expect-error
        window.electronAPI.send("toMain", {
          action: "toggle-dev-tools",
        });
      }
    }

  return (
        <div className="right-side-bar">
            <UtilitiesMenu />
            <div className="bottom-menu">
                <ListGroup className='open-windows h-100'>
                        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
                                <Button className='mb-2' color="dark" onClick={() => openCalculator()}>
                                <Calculator color="white" size={18} />
                </Button>
            </ListGroupItem>
                        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
                                <Button className='mb-2' title="P2P File Transfer"  color="dark" onClick={toggleFileSharingModal}>
                                <FileEarmarkArrowUp color="white" size={18} />
                </Button>
            </ListGroupItem>
                        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
                                <Button className='mb-2' color="dark" onClick={() => togglePasswordManager()}>
                                <Key color="white" size={18} />
                </Button>
            </ListGroupItem>
                        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
                            <SettingsMenu />
            </ListGroupItem>
                        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
                            <Button onClick={onToggleDevTools}>
                                <Terminal color="white" size={20} />
              </Button>
            </ListGroupItem>
        </ListGroup>
      </div>
    </div>
  );
}

export default RightSideBar;