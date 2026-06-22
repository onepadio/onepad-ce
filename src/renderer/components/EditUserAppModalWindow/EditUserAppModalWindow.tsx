import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from 'uuid';
import log from "loglevel";

import { modalActions } from "../../store/modal-slice";
import { appActions } from "../../store/app-slice";
import UserAppService from "../../services/userapp";
import { getGoogleFavicon } from "../../services/favicon";

import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
} from "reactstrap";
import Modal from "../lib/Modal";

import defaultIcon from '../../images/default_icon.png';
import "./EditUserAppModalWindow.css";

function EditUserAppModalWindow(props: any) {
  const dispatch = useDispatch();

  const isEditUserAppModalOpen = useSelector((state: any) => state.modal.isEditUserAppModalOpen);
  const editUserAppModalData = useSelector((state: any) => state.modal.editUserAppModalData);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [icon, setIcon] = useState(defaultIcon);
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [isCustomIconUrl, setIsCustomIconUrl] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");

  function save() {
    if (name.length == 0 || url.length == 0) {
      alert("Name or url can not be empty");
      return;
    }

    UserAppService.update(id, name, url, icon, description, company).then(() => {
      log.debug("Updated user app with id:" + id);
      // Dispatch action to refresh user apps list
      dispatch(appActions.refreshUserApps());
      alert("App updated successfully!");
      toggleEditUserAppModal();
    }).catch((error) => {
      log.error("Error updating user app", error);
      alert("Error updating app: " + error);
    });
  }

  function toggleEditUserAppModal(){
    dispatch(modalActions.closeEditUserAppModal());
    init();
  }

  function init() {
    setIcon(defaultIcon);
    setUrl("https://");
    setName("");
    setDescription("");
    setCompany("");
    setIsCustomIconUrl(false);
    setCustomIconUrl("");
    setIconFile(null);
  }

  function validURL(str: any) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ 
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ 
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ 
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ 
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ 
      '(\\#[-a-z\\d_]*)?$','i');
    return !!pattern.test(str);
  }

  useEffect(() => {
    try {
      if(validURL(url)){
        log.debug("Valid URL:" + url);
        if(isCustomIconUrl){
          setIcon(customIconUrl);
        }else{
          setIcon(getGoogleFavicon(url));
        }
      }
    } catch (error) {
      log.debug("Invalid URL:" + url);
    }
  }, [url, customIconUrl, isCustomIconUrl]);

  useEffect(() => {
    if(isEditUserAppModalOpen && editUserAppModalData){
      setId(editUserAppModalData.id);
      setName(editUserAppModalData.name);
      setUrl(editUserAppModalData.url);
      setIcon(editUserAppModalData.icon);
      setDescription(editUserAppModalData.description || "");
      setCompany(editUserAppModalData.company || "");
    }
  }, [isEditUserAppModalOpen, editUserAppModalData]);

  function onIconLoadError(error: any) {
    log.debug("Error:" + error);
    setIcon(defaultIcon);
  }

  function onCustomIconUrlSwitchChange() {
    log.debug("Custom icon url switch changed ", isCustomIconUrl);
    const customIconUrlField = document.getElementById("editUserAppCustomIconUrlInput");
    if(!isCustomIconUrl){
      customIconUrlField?.classList.remove("d-none");
    }else{
      customIconUrlField?.classList.add("d-none");
    }
    setIsCustomIconUrl(!isCustomIconUrl);
  }

  function handleIconFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setIcon(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <>
      <div className="editUserAppButton">
        <div>
        <Modal id={uuidv4()} heading="Edit My App" className="edit-user-app-modal" show={isEditUserAppModalOpen}  onClose={() => toggleEditUserAppModal()}>
            <Form>
              <Row>
                <Col md={3} className="mt-4 d-flex justify-content-center">
                  <FormGroup>
                    <Label for="iconImg"></Label>
                        <img
                          id="iconImg"
                          src={icon}
                          width={32}
                          height={32}
                          onError={(e) => onIconLoadError(e)}
                        ></img>
                  </FormGroup>
                </Col>
                <Col md={9}>
                  <FormGroup className="align-left">
                    <Label for="url">
                      Web Address (ex. https://google.com)
                    </Label>
                    <Input
                      id="editUserAppUrl"
                      name="url"
                      placeholder=""
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className="align-left">
                    <Label for="name">Title</Label>
                    <Input
                      id="editUserAppName"
                      name="name"
                      placeholder=""
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className="align-left">
                    <Label for="description">Description (optional)</Label>
                    <Input
                      id="editUserAppDescription"
                      name="description"
                      placeholder=""
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className="align-left">
                    <Label for="company">Company (optional)</Label>
                    <Input
                      id="editUserAppCompany"
                      name="company"
                      placeholder=""
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup switch className="pl-0 align-left">
                    <Row className="mr-1">
                      <Col id="editUserAppCustomIcon" md={9}>
                        <Label check>
                         Custom Icon Link
                        </Label>
                      </Col>
                      <Col className="container">
                        <div className="d-flex justify-content-end">
                          <Input
                            type="switch"
                            checked={isCustomIconUrl}
                            onChange={() => onCustomIconUrlSwitchChange()}
                          />
                        </div>
                      </Col>
                    </Row>
                  </FormGroup>
                  <FormGroup id="editUserAppCustomIconUrlInput" className="d-none">
                    <Input
                      id="customIconUrl"
                      name="customIconUrl"
                      type="text"
                      value={customIconUrl}
                      onChange={(e) => setCustomIconUrl(e.target.value)}
                      placeholder="Paste the link here.(ex. https://google.com)"
                    />
                  </FormGroup>
                  <FormGroup className='align-left'>
                    <Label for="iconFile">
                      Upload Custom Icon
                    </Label>
                    <Input
                      id="iconFile"
                      name="iconFile"
                      type="file"
                      accept="image/*"
                      onChange={handleIconFileChange}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Form>
            <br/><br/>
            <Button color="primary" onClick={save}>
              Update
            </Button>{" "}
            <Button color="secondary" onClick={toggleEditUserAppModal}>
              Cancel
            </Button>
        </Modal>
        </div>
      </div>
    </>
  );
}

export default EditUserAppModalWindow;
