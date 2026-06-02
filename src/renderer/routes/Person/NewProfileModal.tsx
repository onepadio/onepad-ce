import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";

import { ProfileFactory } from "../../model/profile";
import { ProfilesService } from "../../services/profiles";
import { WorkspaceService } from "../../services/workspace";

import { 
  Button, 
  Form, 
  FormGroup, 
  Label, 
  Input,
  Row,
  Col, 
} from "reactstrap";
import Modal from "../../components/lib/Modal";
import "./NewProfileModalWindow.css";

function NewProfileModalWindow(props: any) {
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const secretPass = useSelector((state) => state.app.secretPass);
  const isNewDesktopModalWindowOpen = useSelector(
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    (state) => state.modal.isNewDesktopModalWindowOpen
  );
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const userId = useSelector((state) => state.user.id);
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
  const newProfileType = useSelector((state) => state.modal.newProfileType);

  const [name, setName] = useState("");
  const [addPin, setAddPin] = useState(false);
  const [pin, setPin] = useState("");
  const [reTypedPin, setReTypedPin] = useState("");
  const [isDisabled, setIsDisabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [sync, setSync] = useState(false);

  function encrypt(text: any) {
    return CryptoJS.AES.encrypt(
      text,
      secretPass
    ).toString();

  };

  function toggle() {
    refresh();
    props.onClose();
  }
  
  function save() {
    log.debug("pin", pin);
    let profile = ProfileFactory.createProfile(name);
    if(addPin){
        if(pin !== reTypedPin){
            setErrorMessage("PINs do not match!");
            return;
        }
        profile.passCode = encrypt(pin);
    }
    let _userId = newProfileType === "local" ?  "device" : userId;
    let _sync = sync ? 1 : 0;

    // @ts-expect-error TS(2554): Expected 2-4 arguments, but got 5.
    ProfilesService.save(_userId, name, profile.passCode, profile.data, _sync).then((id) => {
        log.debug("profile saved: ", id);
        //temporary code start
        WorkspaceService.getWorkspacesByProfileId("default").then((workspaces) => {
            log.debug("workspaces: ", workspaces);
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            if (workspaces.length > 0) {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                workspaces.forEach((workspace: any) => {
                  WorkspaceService.updateProfile(workspace.id, id).then(() => {
                    log.debug("workspace updated: ", workspace);
                  }).catch((error) => {
                    log.error("error updating workspace: ", error);
                  });
                });
            }
        }).catch((error) => {
            log.error("error getting workspaces: ", error);
        });
        //temporary code end
    }).catch((error) => {
        log.error("error saving profile: ", error);
    });

    setTimeout(() => {
        refresh();
        props.onClose();
        }
    , 1000);
  }

  function refresh() {
    setName("");
    setPin("");
    setAddPin(false);
    setErrorMessage("");
  }

  function onPinChange(e: any){
    setPin(e.target.value);
    setReTypedPin("");
    setErrorMessage("");
  }

  function onReTypedPinChange(e: any){
    setReTypedPin(e.target.value);
    setErrorMessage("");
  }

  function onPINSwitchChange(){
    setAddPin(!addPin);
    setPin("");
    setReTypedPin("");
    setErrorMessage("");
  }

  useEffect(() => {
    if (addPin) {
        document.getElementById("pin").classList.remove("d-none");
        document.getElementById("retypedpin").classList.remove("d-none");
    }else{
        document.getElementById("pin").classList.add("d-none");
        document.getElementById("retypedpin").classList.add("d-none");
    }
  }
  , [addPin]);

  useEffect(() => {
    if (name.length > 3) {
      if(addPin && (pin.length < 4 || reTypedPin.length < 4)){
        setIsDisabled(true);
      }else{
        setIsDisabled(false);
      }
    }else{
        setIsDisabled(true);
    }
  }
  , [addPin,pin, reTypedPin,name]);

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="New Profile"
        className="new-profile-modal"
        show={props.isOpen}
        onClose={() => toggle()}
      >
        <Form>
          <FormGroup className="text-danger">
            <Label>{errorMessage}</Label>
          </FormGroup>
          <FormGroup className="align-left">
            <Label for="desktopName">Enter a name for your new profile</Label>
            <Input
              id="desktopName"
              name="desktopName"
              placeholder=""
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormGroup>
          {
            userId !== "" && (
              <FormGroup switch className='pl-0 mt-3 align-left'>
                <Row className="mr-1">
                  <Col md={9}>
                    <Label check>
                      Sync
                    </Label>
                  </Col>
                  <Col className="container">
                    <div className="d-flex justify-content-end">
                      <Input
                        type="switch"
                        checked={sync}
                        onChange={() => {
                          setSync(!sync);
                        }}
                      />
                    </div>
                  </Col>
                </Row>
              </FormGroup>
            )
          }
          <FormGroup switch className='pl-0 mt-3 align-left'>
            <Row className="mr-1">
              <Col md={9}>
                <Label check>
                  PIN
                </Label>
              </Col>
              <Col className="container">
                <div className="d-flex justify-content-end">
                  <Input
                    type="switch"
                    checked={addPin}
                    onChange={() => {
                      onPINSwitchChange();
                    }}
                  />
                </div>
              </Col>
            </Row>
          </FormGroup>
          <FormGroup id="pin" className='d-none'>
            <Input
              id="pin"
              name="pin"
              placeholder="Type PIN code here"
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => onPinChange(e)}
            />
          </FormGroup>
          <FormGroup id="retypedpin" className='d-none'>
            <Input
              id="reTypedPinInput"
              name="retypedpin"
              placeholder="Retype PIN code"
              type="password"
              maxLength={4}
              value={reTypedPin}
              onChange={(e) => onReTypedPinChange(e)}
            />
          </FormGroup>
        </Form>
        <div className="container-fluid">
          <div className="row d-flex justify-content-center">
            <div className="col-3">

            </div>
            <div className="col-3">
                <Button color="primary" onClick={save} disabled={isDisabled}>
                    Add
                </Button>{" "}
            </div>
            <div className="col-3">
                <Button color="secondary" onClick={() => props.onClose()}>
                    Cancel
                </Button>
            </div>
            <div className="col-3">

            </div>
          </div>    
        </div>
        
      </Modal>
    </div>
  );
}

export default NewProfileModalWindow;
