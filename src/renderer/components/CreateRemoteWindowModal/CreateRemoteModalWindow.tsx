import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import DesktopService from "../../services/desktop";
import { WorkspaceService } from "../../services/workspace";
import { openAppWindow, openInternalWindow, handleWindowClosed} from '../../services/window'

import { createProcess, getProcessDetails } from "../../api/ProcessApi";

import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from "../../store/workspace-slice";
import { sessionActions } from '../../store/session-slice';
import { cloudServiceActions } from '../../store/cloud-service-slice';

import { instanceTypes } from "../../data/remote";

import { Button, Form, FormGroup, Label, Input, Row, Col, FormFeedback } from "reactstrap";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import Modal from "../lib/Modal";
import "./CreateRemoteModalWindow.css";
// @ts-expect-error
import globe_icon from '../../images/globe_icon_96.png';
import { Cpu, Hdd, Link45deg, Stop, StopCircle } from "react-bootstrap-icons";

function CreateRemoteModalWindow(props: any) {
  const dispatch = useDispatch();

  const items = useSelector((state: any) => state.workspace.apps);

  const isExternalWindowMode = useSelector((state: any) => state.settings.isExternalWindowMode);

  const isLocal = useSelector((state: any) => state.workspace.isLocal);

  const sessionState = useSelector((state: any) => state.session);

  const openWindows = useSelector((state: any) => state.session.openWindows);

  const openTabs = useSelector((state: any) => state.session.openTabs);

  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  const activeTabs = useSelector((state: any) => state.session.activeTabs);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const personId = useSelector((state: any) => state.app.personId);

  const user = useSelector((state: any) => state.user);

  const selectedRemoteApp = useSelector(

    (state: any) => state.modal.selectedRemoteApp
  );
  const isRemoteLaunchModalOpen = useSelector(

    (state: any) => state.modal.isRemoteLaunchModalOpen
  );

  const [application, setApplication] = useState("");
  const [instanceType, setInstanceType] = useState(null);
  const [resources, setResources] = useState("");
  const [price, setPrice] = useState("");
  const [icon, setIcon] = useState("");
  const [status, setStatus] = useState("");
  const [processId, setProcessId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isResourcesDDOpen, setIsResourcesDDOpen] = useState(false);
  const [isTimeOutDDOpen, setIsTimeOutDDOpen] = useState(false);
  const [diskSize, setDiskSize] = useState(32);
  const [taskName, setTaskName] = useState("");
  const [enableAutoStop, setEnableAutoStop] = useState(true);
  const [timeOut, setTimeOut] = useState(10);
  const [enableCustomUrl, setEnableCustomUrl] = useState(false);
  const [subdomain, setSubdomain] = useState("");

  function toggle() {
    refresh();
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleRemoteLaunchModal());
  }

  const toggleDropdown = () => setDropdownOpen(prevState => !prevState);
  const toggleResourcesDD = () => setIsResourcesDDOpen(prevState => !prevState);
  const toggleTimeOutDD = () => setIsTimeOutDDOpen(prevState => !prevState);


  function install() {
    if(!selectedRemoteApp || !instanceType){
      alert("Please select an application and instance type.");
      return;
    }

    if(taskName.length < 1){
      alert("Please enter a task name.");
      return;
    }

    dispatch(cloudServiceActions.installProcess({
      user: user.uid,
      application: selectedRemoteApp.app,
      applicationId: selectedRemoteApp.id,
      instanceType: instanceType,
      name: taskName,
      diskSize: diskSize,
      timeOut: timeOut,
      subdomain: subdomain,
    }));

    if(selectedRemoteApp.category === "Operating Systems"){
      dispatch(modalActions.toggleCloudPad("pcs"));
    }else{
      dispatch(modalActions.toggleCloudPad("apps"));
    }
    toggle();
  }

  function refresh() {
    setApplication("");
    setInstanceType(null);
    setResources("");
    setSubdomain("");
    setTaskName("");
    setDiskSize(32);
    setEnableAutoStop(true);
    setTimeOut(10);
    setEnableCustomUrl(false);
  }

  useEffect(() => {
    log.debug("useEffect");
    refresh();
    setTaskName(selectedRemoteApp.app.charAt(0).toUpperCase()+ selectedRemoteApp.app.slice(1));
  }, [selectedRemoteApp]);

  function onAppSelect(event: any){
    setApplication( event.target.getAttribute("value"));
  }

  function onResourcesSelect(event: any){
    setInstanceType(event.target.getAttribute("value"));
    setResources(event.target.getAttribute("resources"));
    setPrice(event.target.getAttribute("price"));
  }

  function handleDiskSizeChange(event: any){
    setDiskSize(event.target.value);
  }

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="Install Application"
        className="launch-remote-modal"
        show={isRemoteLaunchModalOpen}
        onClose={() => toggle()}
      >
        <Form>
          <Row>
              <Col md={3} className="d-flex justify-content-center">
                <FormGroup>

                  <img
                    id="iconImg"
                    src={"./images/store/icon/"+selectedRemoteApp.icon}
                    width={64}
                    height={64}
                    alt=""
                    className="app-icon"
                  ></img>
                </FormGroup>
              </Col>
              <Col md={9}>
                <FormGroup className='align-left'>
                  <Label for="taskName">
                    Task Name
                  </Label>
                  <Input
                    id="taskName"
                    name="taskName"
                    placeholder="Please enter a task name"
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}

                  />
                  <FormFeedback tooltip>
                    Oh noes! that name is already taken
                  </FormFeedback>
                </FormGroup>
              </Col>
          </Row>
          <FormGroup className="align-left w-100">
            <Label for="machine-type">
              <div className="d-flex align-items-center justify-content-between">
                <Cpu size={16} color="white"/> <span className="ml-2">Machine Type </span>
              </div>
            </Label>
            <Dropdown id="machine-type" className="w-100" isOpen={isResourcesDDOpen} toggle={toggleResourcesDD} defaultValue="t2.micro">
              <DropdownToggle className="w-100" color='dark' caret>
                {
                  resources === "" ? "Select" : resources
                }
              </DropdownToggle>
              <DropdownMenu className="w-100" dark>
                <DropdownItem header> Machine Type </DropdownItem>

                  {
                    Object.keys(instanceTypes).map((key) => {
                      return <DropdownItem value={key} resources={instanceTypes[key].title} price={instanceTypes[key].price} onClick={(e) => onResourcesSelect(e) }> <span className="text-white font-weight-bold h6">{instanceTypes[key].cpu}-core</span> <br/> <span className="text-secondary">{instanceTypes[key].title} - {instanceTypes[key].price} $/hour</span> </DropdownItem>
                    })
                  }
              </DropdownMenu>
            </Dropdown>
            <Label for="disk-size" className="w-100">
              <div className="d-flex align-items-center justify-content-between w-100">
                Price: <span> {price} $/hour </span>
              </div>
            </Label>
          </FormGroup>
          <FormGroup className="align-left">
            <Label for="disk-size">
              <div className="d-flex align-items-center justify-content-between">
                <Hdd size={16} color="white"/> <span className="ml-2">Disk Size: {diskSize} GB </span>
              </div>
            </Label>
            <Input
              id="disk-size"
              name="disk-size"
              type="range"
              min="32"
              max="512"
              step="32"
              value={diskSize}
              onChange={handleDiskSizeChange}
            />
            <div>
              <span>Min: 32</span> | <span>Max: 512</span>
            </div>
          </FormGroup>
          <FormGroup switch className='pl-0 mt-3 align-left'>
            <Row className="mr-1">
              <Col md={9}>
                <Label for="machine-type">
                  <div className="d-flex align-items-center justify-content-between">
                    <StopCircle size={16} color="white"/> <span className="ml-2">Auto stop if not active in last</span>
                  </div>
                </Label>
              </Col>
              <Col className="container">
                <div className="d-flex justify-content-end">
                  <Dropdown id="time-out-dd" isOpen={isTimeOutDDOpen} toggle={toggleTimeOutDD} defaultValue={timeOut}>
                    <DropdownToggle color="dark" caret>
                      {
                        timeOut === 0 ? "Never" : timeOut + " minutes"
                      }
                    </DropdownToggle>
                    <DropdownMenu dark>
                      <DropdownItem value={10} onClick={() => setTimeOut(10)}>10 minutes</DropdownItem>
                      <DropdownItem value={20} onClick={() => setTimeOut(20)}>20 minutes</DropdownItem>
                      <DropdownItem value={30} onClick={() => setTimeOut(30)}>30 minutes</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </Col>
            </Row>
          </FormGroup>
          <FormGroup switch className='pl-0 mt-3 align-left'>
            <Row className="mr-1">
              <Col md={9}>
                <Label for="machine-type">
                  <div className="d-flex align-items-center justify-content-between">
                    <Link45deg size={16} color="white"/> <span className="ml-2">Collaboration Url</span>
                  </div>
                </Label>
              </Col>
              <Col className="container">
                <div className="d-flex justify-content-end">
                  <Input
                    type="switch"
                    checked={enableCustomUrl}
                    onChange={() => {
                      setEnableCustomUrl(!enableCustomUrl);
                    }}
                  />
                </div>
              </Col>
            </Row>
          </FormGroup>
          {
            enableCustomUrl && (
              <FormGroup className="align-center">
                <Row>
                  <Col md={7} className="container">
                    <div className="d-flex align-items-center justify-content-end">
                      http://
                      <Input
                        id="subdomain"
                        name="subdomain"
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value)}
                        placeholder=""
                        className="ml-2"
                      />
                    </div>
                  </Col>
                  <Col md={2} className="d-flex align-items-center justify-content-start">
                      .onepad.io
                  </Col>
                  <Col md={3} className="d-flex align-items-center justify-content-end">
                    <Button color="primary" onClick={() => {
                      // openInternalWindow(processUrl);
                    }} disabled={subdomain.length < 5}>
                      Check Url
                    </Button>
                  </Col>

                </Row>

              </FormGroup>
            )
          }
        </Form>
        <Button color="primary" onClick={install}>
          Install
        </Button>{" "}
        <Button color="secondary" onClick={toggle}>
          Close
        </Button>
      </Modal>
    </div>
  );
}

export default CreateRemoteModalWindow;
