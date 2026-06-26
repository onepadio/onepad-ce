import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from 'uuid';
import log from 'loglevel';
import {
  Button,
  Container,
  Row,
  Col,
} from 'reactstrap';
import Modal from "../lib/Modal";
import { modalActions } from "../../store/modal-slice";
import { storeActions } from '../../store/store-slice';

import './AppStoreModalWindow.css';
import AppStoreCategorySideBar from './AppStoreCategorySideBar';
import AppStoreBody from './AppStoreBody';
import AppStoreSearch from '../AppStoreSearch/AppStoreSearch';

function AppStoreModalWindow(args: any) {
  const dispatch = useDispatch();
  const route = useSelector((state: any) => state.session.route);
  const sessionState = useSelector((state: any) => state.session);

  const isAppStoreModalOpen = useSelector((state: any) => state.modal.isAppStoreModalOpen);

  const location = useSelector((state: any) => state.modal.location);

  const links = useSelector((state: any) => state.workspace.links);

  const linksLimit = useSelector((state: any) => state.app.linksLimit);

  const selectedStore = useSelector((state: any) => state.store.selectedStore);

  const [header, setHeader] = useState("Web Store");

  useEffect(() => {
    if(selectedStore === "web"){
      setHeader("Web Store");
    } else if(selectedStore === "docker"){
      setHeader("Docker Store");
    } else if(selectedStore === "remote"){
      setHeader("Cloud Store");
    } else {
      setHeader("Web Store");
    }
  }, [selectedStore]);

  const toggleAppStore = () => {
    dispatch(modalActions.toggleAppStoreModal({}));
  }

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
      dispatch(modalActions.toggleAddLinkModal({data: {
        url: "https://",
        title: "",
      }}));
    }
  }

  function filter(query: any){
    log.debug("Filtering", query);
  }

  function reload(){
    log.debug("Fetching apps");
  }

  function onClose(){
    dispatch(storeActions.setSearchQuery(""));
    dispatch(storeActions.setActiveCategory(1));
    toggleAppStore();
  }

  return (
    <div className='w-100'>
      <Modal id={uuidv4()} heading={header} className="app-store-modal position-absolute" show={isAppStoreModalOpen} onClose={() => onClose()}>
        <Container fluid>
          <AppStoreSearch id="storeSearchBar" filter={filter} reload={reload}/>
        </Container>
        <Container fluid>
          <Row className='mb-2'>
            <Col md={3} sm={3} xs={4} className="mt-1 d-flex justify-content-start">
              <AppStoreCategorySideBar className="category-sidebar bg-dark border-end"/>
            </Col>
            <Col md={9} sm={9} xs={8} className="mt-1 d-flex justify-content-start store-body">
              <AppStoreBody name="Discover" key="discovery" onSelectApp={() => alert("")}/>
            </Col>
          </Row>
        </Container>
        {
            <Container className='add-link-button'>
              <Row>
                <Col md={3} sm={3} xs={4}>
                  <Button id="add-link-button" color="secondary" onClick={() => {
                    dispatch(modalActions.setLocation("launchpad"));
                    toggleAppStore();
                    toggleAddLinkModal();
                  }}>Add Custom Website</Button>
                </Col>
                <Col md={9} sm={9} xs={8} className="d-flex justify-content-end">
                </Col>
              </Row>
            </Container>
        }
      </Modal>
    </div>
  );
}

export default AppStoreModalWindow;
