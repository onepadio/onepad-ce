import { v4 as uuidv4 } from "uuid";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, ModalHeader, ModalBody, ModalFooter } from "reactstrap";

import Modal from "../lib/Modal";

import { modalActions } from "../../store/modal-slice";

// @ts-expect-error
import sign_up_compare from '../../images/sign_up_compare.png';

function SingInModalWindow(props: any) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const isSignUpModalOpen = useSelector((state: any) => state.modal.isSignUpModalOpen);

  function toggle() {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleSignUpModalWindow());
  }

  function onSignIn() {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleSignUpModalWindow());
    dispatch(modalActions.setShowLoginPage(true));
  }

  return (
    <div>
      <Modal id={uuidv4()} heading="Ready to Sign Up?" show={isSignUpModalOpen} onClose={() => toggle()}>
        <div className="d-flex w-100 justify-content-start ml-3">
          You can access to more workspaces and more features when you sign up. 
        </div> <br/>
        <img src={sign_up_compare} alt="Sign Up Compare" className="w-100"/> <br/>

        <Button color="primary" onClick={onSignIn}>
          Sign Up
        </Button>{" "}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
        
      </Modal>
    </div>
  );
}

export default SingInModalWindow;
