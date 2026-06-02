import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import { ProfileFactory } from "../../model/profile";

import { Button, Form, FormGroup, Label, Input } from "reactstrap";
import Modal from "../../components/lib/Modal";
import "./DeleteProfileWarningModal.css";

function DeleteProfileWarningModalWindow(props: any) {

  const [isDisabled, setIsDisabled] = useState(true);

  function toggle() {
    props.onClose();
  }

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="Delete Perosn"
        className="delete-profile-modal"
        show={props.isOpen}
        onClose={() => toggle()}
      >
        You are deleting the profile. All data will be deleted permanently, are you sure you want to continue? <br/><br/>
        <Button color="danger" onClick={() => props.onConfirm()}>
          Delete
        </Button>{" "}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>

      </Modal>
    </div>
  );
}

export default DeleteProfileWarningModalWindow;
