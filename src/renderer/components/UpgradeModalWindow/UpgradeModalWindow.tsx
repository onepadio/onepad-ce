import { v4 as uuidv4 } from "uuid";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Button, ModalHeader, ModalBody, ModalFooter, Input, FormGroup, Row, Label, Col, Form, Container } from "reactstrap";
import isElectron from "is-electron";
import Switch from "react-switch";

import Modal from "../lib/Modal";

import { modalActions } from "../../store/modal-slice";

// @ts-expect-error
import sign_up_compare_year from '../../images/sup_compare_year.png';
// @ts-expect-error
import sign_up_compare_month from '../../images/sup_compare_month.png';
import { appActions } from "../../store/app-slice";

import "./UpgradeModalWindow.css";
import { Check, Grid, PlusSquare, Repeat } from "react-feather";
import { Gear } from "react-bootstrap-icons";

function UpgradeModalWindow(props: any) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const route = useSelector((state: any) => state.session.route);
  
  const isUpgradeModalOpen = useSelector((state: any) => state.modal.isUpgradeModalOpen);
  
  const paymentCycle = useSelector((state: any) => state.app.paymentCycle);

  function toggle() {
    dispatch(modalActions.toggleUpgradeModalWindow({}));
  }

  function onUpgrade() {
    dispatch(modalActions.toggleUpgradeModalWindow({}));
    if(route === "authenticated"){
        dispatch(modalActions.toggleStripeModalWindow({}));
    }else{
        dispatch(modalActions.setOpenStripeModalWhenLoggedIn(true));
        dispatch(modalActions.setShowLoginPage(true));
    }
  }

  function openPrivacyPolicy(){
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
          action: "privacy-policy",
      });
    }
  }

  function openTermsOfUse(){
    if(isElectron()){
      // @ts-expect-error
      window.electronAPI.send("toMain", {
          action: "terms-of-use",
      });
    }
  }

  return (
    <div >
      <Modal id={uuidv4()} className="upgrade-modal" heading="" show={isUpgradeModalOpen} onClose={() => toggle()}>
        <div className="d-flex justify-content-center" >
            <Row className="w-100">
              <Col lg={6} md={6} sm={6}>
                  <div className="d-flex flex-column w-100 justify-content-start" >
                    <div className="d-flex justify-content-start  mb-2">
                      <h5>Try OnePad+ for free</h5>
                    </div>
                    <div className="d-flex justify-content-start mb-2">
                      <Check size={20} color="green"/>
                    
                      <span className="ml-2">
                        Free 30 day trial, cancel any time
                      </span>
                    </div>
                    <div className="d-flex justify-content-start mb-2">
                      <Check size={20} color="green"/>
                      <span className="ml-2">
                        No credit card required
                      </span>
                    </div>
                    <div className="d-flex justify-content-start mb-4">
                      <Check size={20} color="green"/>
                      <span className="ml-2">
                        We'll remind you before your trial ends
                      </span>
                    </div>
                    
                    <Form className="d-flex flex-column mt-3">
                      <FormGroup
                        check
                        inline
                      >
                        <Input
                          className="mt-1"
                          type="radio" 
                          checked={paymentCycle === "yearly"} 
                          onChange={() => {
                              // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                              dispatch(appActions.togglePaymentCycle());
                            }}/>
                        <Label check className="d-flex flex-column justify-content-start">
                          <span className="d-flex justify-content-start font-weight-bold">
                            Yearly
                          </span>
                          <div className="d-flex justify-content-start">
                            <span className="d-flex justify-content-start text-sm text-secondary text-decoration-line-through">
                              $79.90
                            </span>
                            <span className="d-flex justify-content-start text-sm text-secondary fw-bold ml-2">
                              $49.90 ($4.16/month)
                            </span>
                          </div>
                        </Label>
                      </FormGroup>
                      <div>

                      </div>
                      <FormGroup
                        check
                        inline
                      >
                        <Input
                          className="mt-1"
                          type="radio" 
                          checked={paymentCycle === "monthly"} 
                          onChange={() => {
                                // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                                dispatch(appActions.togglePaymentCycle());
                              }}/>
                        <Label check className="d-flex flex-column justify-content-start">
                          <span className="d-flex justify-content-start font-weight-bold">
                            Monthly
                          </span>
                          <div className="d-flex justify-content-start">
                            <span className="d-flex justify-content-start text-sm text-secondary text-decoration-line-through">
                              $7.99
                            </span>
                            <span className="d-flex justify-content-start text-sm text-secondary fw-bold ml-2">
                              $4.99
                            </span>
                          </div>
                        </Label>
                      </FormGroup>
                    </Form>
                    <div className="d-flex justify-content-center mt-4">
                      <Button color="primary" onClick={onUpgrade}>
                        {
                          route === "authenticated" ? "Start your free trial" : "Sign up for free trial"
                        }
                      </Button>
                    </div>
                    <FormGroup className="w-100 d-none">
                      <Row>
                        <Col className="d-flex justify-content-end">
                          <Label className="mt-2 mb-2 font-weight-bold" check>
                            Monthly
                          </Label>
                        </Col>
                        <Col lg={1} md={1} sm={1} className="container">
                          <div className="d-flex justify-content-center">
                            <Switch 
                                className="m-2"
                                uncheckedIcon={false}
                                checkedIcon={false}
                                offColor="#080"
                                onChange={() => {
                                // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                                dispatch(appActions.togglePaymentCycle());
                              }} 
                              checked={paymentCycle === "yearly"} />
                          </div>
                        </Col>
                        <Col className="d-flex justify-content-start">
                          <Label className="mt-2 mb-2 font-weight-bold" check>
                            Annually
                          </Label>
                        </Col>
                      </Row>
                    </FormGroup>
                </div>
              </Col>
              <Col lg={6} md={6} sm={6}>
                <div className="d-flex justify-content-start mt-4 mb-2">
                    <span className="mt-3">This is what you'll get with OnePad+</span>
                </div>
                <div className="d-flex mt-2" >
                  <FormGroup className="feature-item">
                    <Row>
                      <Col lg={2} md={2} sm={2} className="d-flex justify-content-end">
                        <Grid size={24} color="gray" className="mt-2"/>
                      </Col>
                      <Col lg={9} md={9} sm={9} className="d-flex container justify-content-start">
                          <span className="mt-2">Unlimited spaces</span>
                      </Col>
                    </Row>
                  </FormGroup>
                </div>
                <div className="d-flex" >
                    <FormGroup className="feature-item">
                      <Row>
                        <Col lg={2} md={2} sm={2} className="d-flex justify-content-end">
                          <PlusSquare size={24} color="gray" className="mt-2"/>
                        </Col>
                        <Col lg={9} md={9} sm={9} className="d-flex flex-column container">
                            {}
                            <span className="mt-2 align-self-start">Cross space apps</span>
                        </Col>
                      </Row>
                    </FormGroup>
                </div>     
                <div className="d-flex" >
                    <FormGroup className="feature-item">
                      <Row>
                        <Col lg={2} md={2} sm={2} className="d-flex justify-content-end">
                          <Gear size={24} color="gray" className="mt-2"/>
                        </Col>
                        <Col lg={9} md={9} sm={9} className="d-flex">
                            {}
                            <span className="d-flex justify-content-start mt-2">Advanced app configuration</span>
                        </Col>
                      </Row>
                    </FormGroup>
                </div>
                <div className="d-flex " >
                    <FormGroup className="feature-item">
                      <Row>
                        <Col lg={2} md={2} sm={2} className="d-flex justify-content-end">
                          <Repeat size={24} color="gray" className="mt-2"/>
                        </Col>
                        <Col lg={9} md={9} sm={9} className="d-flex flex-column container ">
                            {}
                            <span className="mt-2 d-flex justify-content-start text-muted">Cross device sync (coming soon) </span>
                        </Col>
                      </Row>
                    </FormGroup>
                </div>
              </Col>
            </Row>
        </div>
        <Container fluid className="d-flex justify-content-start mt-3">
          <Row className="w-100">
              <Col lg={6} md={6} sm={6}>
                <div className="d-flex justify-content-start">
                    <span className="mt-3 text-xs">By continuing, you agree to the <span className="text-primary external-link" onClick={openTermsOfUse}>Terms of Use</span> applicable to Onepad+ and confirm you have read our <span className="text-primary external-link" onClick={openPrivacyPolicy}>Privacy Policy</span></span>
                </div>
              </Col>
              <Col lg={6} md={6} sm={6}></Col>
          </Row>
        </Container>
        
      </Modal>
    </div>
  );
}

export default UpgradeModalWindow;
