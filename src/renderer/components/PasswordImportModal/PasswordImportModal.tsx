import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";


import { modalActions } from "../../store/modal-slice";

import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
} from "reactstrap";
import SafariPasswordsReader from "./SafariPasswordsReader";
import Modal from "../lib/Modal";
import "./PasswordImportModal.css";

const browsers = [
    {
        name: "Chrome",
        value: "chrome",
    },
    {
        name: "Safari",
        value: "safari",
    },
    {
        name: "Edge",
        value: "edge",
    },
];

function PasswordImportModal(props: any) {
  const dispatch = useDispatch();
  
  const isOpen = useSelector((state: any) => state.modal.isPasswordImportModalOpen);

  // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
  const toggle = () => dispatch(modalActions.togglePasswordImportModal());
  const [inputType, setInputType] = useState("chrome");

  useEffect(() => {
    log.debug("test");
  }, []);

  function onDone() {
    toggle();
  }

  return (
    <div>
      <Modal id={uuidv4()} heading="Import Passwords" className="password-import-modal" show={isOpen} onClose={() => toggle()}>
        <Form className='mb-3'>
            <div className="d-flex mb-3">
              Import from:
              <Input
                  type="select"
                  name="select"
                  id="inputType"
                  value={inputType}
                  onChange={(e) => setInputType(e.target.value)}
              >
                  {browsers.map((browser) => (
                      <option key={browser.value} value={browser.value}>
                          {browser.name}
                      </option>
                  ))}
              </Input>
            </div>
            <SafariPasswordsReader />

        </Form>
        <Button color="danger" onClick={() => onDone()}>
          Done
        </Button>{" "}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default PasswordImportModal;
