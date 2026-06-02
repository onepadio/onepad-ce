import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';

import { windowTypes } from '../../services/window';
import {
  updateApp, 
  getAppById,
  deleteApp
// @ts-expect-error
} from '../../db'
import { 
  Button, 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input
 } from 'reactstrap';

function DeleteLaunchIconModal(props: any) {
  const toggle = () => props.toggle(!props.isOpen);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [icon, setIcon] = useState("");
  const [defaultUrl, setDefaultUrl] = useState("");
  const [startUrl, setStartUrl] = useState("");
  const [windowType, setWindowType] = useState("");

  
  const isLocal = useSelector((state: any) => state.workspace.isLocal);

  function save(){
    updateApp(props.selectedicon, name, code, startUrl, defaultUrl, icon, windowType).then(
      () => {
        toggle();
      }
    );
  }

  function deleteIcon(){
    if(isLocal){
      deleteIconLocal();
    }else{
      deleteIconRemote();
    }
  }

  function deleteIconLocal(){
    deleteApp(props.selectedicon).then(
      () => {
        toggle();
      }
    );
  }

  function deleteIconRemote(){
    log.debug("deleteIconRemote");
    toggle();
  }

  useEffect(() => {
    log.debug("test");
  }, []);

  return (
    <div>
      <Modal className='mtest' isOpen={props.isOpen} toggle={toggle} centered={true} {...props}>
        <ModalHeader toggle={toggle}>Delete App/Site</ModalHeader>
        <ModalBody>
         You are deleting the app or site. Are you sure?
        </ModalBody>
        <ModalFooter>
        <Button color="danger" onClick={deleteIcon}>
            Delete
          </Button>{' '}
          <Button color="secondary" onClick={toggle}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default DeleteLaunchIconModal;