import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import {v4 as uuidv4} from 'uuid';

import { modalActions } from "../../../../store/modal-slice";
import { sessionActions } from '../../../../store/session-slice';

import { FavouritesService } from '../../../../services/favourites';

import { 
  Button, 
  Form,
  FormGroup,
  Label,
  Input
 } from 'reactstrap';

import Modal from "../../../lib/Modal";
import "./EditFavouritesGroupModal.css";

function EditFavouritesGroupModal(props: any) {
  const dispatch = useDispatch();
  
  const userId = useSelector((state: any) => state.user.id);
  
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const [windowFavourites, setWindowFavourites] = useState([]);
  
  const favourites = useSelector((state: any) => state.session.favourites);
  
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  
  const selectedFolderId = useSelector((state: any) => state.session.selectedFolderId);
  
  const selectedFavouritesGroupId = useSelector((state: any) => state.modal.selectedFavouritesGroupId);

  const [name, setName] = useState("");

  
  const isEditFavouritesGroupModalOpen = useSelector((state: any) => state.modal.isEditFavouritesGroupModalOpen);

  function toggleEditFavouritesGroupModal(){
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleEditFavoritesGroupModal());
  }

  function save(){
    if (name.length < 1) {
      return;
    }
    let _favourites = Object.assign({}, favourites);
    let _folders = Object.assign([], _favourites[activeWindowId]);
    let _folder = Object.assign({}, _folders.find((folder: any) => folder.id === selectedFavouritesGroupId));
    _folder.name = name;
    _folders = _folders.map((folder: any) => {
      if (folder.id === selectedFavouritesGroupId) {
        return _folder;
      }
      return folder;
    });

    FavouritesService.updateByParentId(activeWindowId, _folders).then((data) => {
      log.debug("FavouritesSideMenu: added", data);
      let _favourites = Object.assign({}, favourites);
      _favourites[activeWindowId] = _folders;
      dispatch(sessionActions.setFavourites({data: _favourites}));
      toggleEditFavouritesGroupModal();
    });
  }

  useEffect(() => {
    let _favourites = Object.assign({}, favourites);
    let _folders = Object.assign([], _favourites[activeWindowId]);
    let _folder = Object.assign({}, _folders.find((folder: any) => folder.id === selectedFavouritesGroupId));
    setName(_folder.name);
  }, [selectedFavouritesGroupId]);

  return (
    <div>
      <Modal id={uuidv4()} heading="Rename Folder" className="rename-favgroup-modal" show={isEditFavouritesGroupModalOpen} onClose={() => toggleEditFavouritesGroupModal()}>
        <Form>
          <FormGroup className="align-left">
            <Label for="groupName">
              Name
            </Label>
            <Input
              id="groupName"
              name="groupName"
              placeholder=""
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormGroup>
        </Form>
        <Button color="primary" onClick={save}>
          Save
        </Button>{' '}
        <Button color="secondary" onClick={toggleEditFavouritesGroupModal}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default EditFavouritesGroupModal;