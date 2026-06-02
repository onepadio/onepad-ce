import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";

import { ProfilesService } from "../../services/profiles";
import { appActions } from "../../store/app-slice";

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
import "./PINModal.css"

function PINModalWindow(props: any) {
    const dispatch = useDispatch();
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const secretPass = useSelector((state) => state.app.secretPass);

    const [pin, setPin] = useState("");
    const [isDisabled, setIsDisabled] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    function encrypt(text: any) {
        return CryptoJS.AES.encrypt(
        text,
        secretPass
        ).toString();

    };

    function decrypt(text: any){
      const bytes = CryptoJS.AES.decrypt(text, secretPass);
      return bytes.toString(CryptoJS.enc.Utf8);
    };

  function toggle() {
    refresh();
    props.onClose();
  }
  
  function open() {
    ProfilesService.get(props.profileId).then((profile) => {

      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      if (decrypt(profile.passCode) === pin){
        dispatch(appActions.setSelectProfile(profile));
        setTimeout(() => {
            props.onSuccess();
        }
        , 100);
      }else{
          setErrorMessage("Wrong PIN!");
      }
    }).catch((error) => {
      log.error("error getting profile: ", error);
    });
   
  }

  function refresh() {
    setPin("");
    setErrorMessage("");
  }

  useEffect(() => {
    if (pin.length > 3) {
        setIsDisabled(false);
    }else{
        setIsDisabled(true);
    }
  }
  , [pin]);

  function onPinChange(e: any){
    setPin(e.target.value);
    setErrorMessage("");
  }

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="This profile is protected by PIN"
        className="pin-modal"
        show={props.isOpen}
        onClose={() => toggle()}
      >
        <Form>
          <FormGroup className="text-danger">
            <Label>{errorMessage}</Label>
          </FormGroup>
          <FormGroup id="pin" >
            <Input
              id="pin"
              name="pin"
              placeholder=" Type PIN here "
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => onPinChange(e)}
            />
          </FormGroup>
        </Form>
        <div className="container-fluid">
          <div className="row d-flex justify-content-center">
            <div className="col-3">

            </div>
            <div className="col-3">
                <Button color="primary" onClick={open} disabled={isDisabled}>
                    Go
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

export default PINModalWindow;
