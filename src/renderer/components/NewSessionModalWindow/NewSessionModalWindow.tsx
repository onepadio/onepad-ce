import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import DesktopService from "../../services/desktop";
import { WorkspaceService } from "../../services/workspace";
import { SessionService } from "../../services/session";

import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from "../../store/workspace-slice";

import { 
  Button, 
  Form, 
  FormGroup, 
  Label, 
  Input,
  Row,
  Col 
} from "reactstrap";
import Modal from "../lib/Modal";
import "./NewSessionModalWindow.css";
import { sessionActions } from "../../store/session-slice";

function NewSessionModalWindow(props: any) {
  const dispatch = useDispatch();
  
  const userId = useSelector((state: any) => state.user.id);
  
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const isNewSessionModalWindowOpen = useSelector(
    
    (state: any) => state.modal.isNewSessionModalWindowOpen
  );
  
  const stateData = useSelector((state: any) => state.session);
  
  const openWindows = useSelector((state: any) => state.session.openWindows);
  
  const activeDesktopWindows = useSelector((state: any) => state.session.activeDesktopWindows);
  
  const activeWindow = useSelector((state: any) => state.session.activeWindow);
  
  const openTabs = useSelector((state: any) => state.session.openTabs);
  
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  
  const activeWindowTabs = useSelector((state: any) => state.session.activeWindowTabs);
  
  const activeTab = useSelector((state: any) => state.session.activeTab);
  
  const sessions = useSelector((state: any) => state.workspace.sessions);

  const [name, setName] = useState("");
  const [isolated, setIsolated] = useState(false);

  function toggle() {
    refresh();
    dispatch(modalActions.toggleNewSessionModalWindow({}));
  }
  
  function save() {
    if (name.length < 1) {
      return;
    }

    saveWorkspace().then((workspaceId) => {
      log.debug("WorkspaceID", workspaceId);
      SessionService.newSession(name, workspace.id, false, isolated).then((sessionId) => {
        SessionService.getSession(sessionId).then((session: any) => {
          SessionService.getSessionsByWorkspaceId(workspace.id).then((sessions: any) => {
            dispatch(workspaceActions.setSessions({ data: sessions }));
            dispatch(workspaceActions.setCurrentSession( 
              {
                
                id: session.id,
                
                name: session.name,
                
                isolated: session.isolated,
              }
            ));
            dispatch(sessionActions.startSession({}));
            toggle();
          });
        });
      });
    });
    
  }

  async function saveWorkspace(){
    let _openTabs = Object.assign({},openTabs);
    Object.values(_openTabs).forEach((tab: any) => {
        let _tab = Object.assign({},tab);
        _tab.location = "main";
        _tab.sleeping = true;
        
        _openTabs[tab.id] = _tab;
    });
    let _sessions: any = [];
      sessions.forEach((session: any) => {
          _sessions.push({
              id: session.id,
              name: session.name,
          });
      });
    let workspaceId = await WorkspaceService.saveState(workspace.id,{
      desktop: workspace.state.desktop,
      openWindows: openWindows,
      openTabs: _openTabs,
      windowTabs: windowTabs,
      activeDesktopWindows: activeDesktopWindows,
      activeTabs: activeTabs,
      activeTab: activeTab,
      activeTabId: activeTabId,
      activeWindow: activeWindow,
      activeWindowId: activeWindowId,
      activeWindowTabs: activeWindowTabs,
      activeBrowserWindowId: stateData.activeBrowserWindowId,
      sessions: _sessions,
      currentSession: {},
    });

    return workspaceId;
  }

  function refresh() {
    setName("");
    setIsolated(false);
  }

  useEffect(() => {
    log.debug("useEffect");
  }, []);

  return (
    <div>
      <Modal
        id={uuidv4()}
        heading="New Task"
        className="new-session-modal"
        show={isNewSessionModalWindowOpen}
        onClose={() => toggle()}
      >
        <Form>
          <FormGroup className="align-left">
            <Label for="desktopName">Name</Label>
            <Input
              id="desktopName"
              name="desktopName"
              placeholder=""
              type="text"
              value={name}
              onChange={(e) => {
                if (e.target.value.length > 20) {
                  alert("Task name must be less than 20 characters.");
                  return;
                }
                setName(e.target.value)
              }
              }
            />
          </FormGroup>
          <FormGroup switch className='pl-0 align-left'>
            <Row className="mr-1">
              <Col md={9}>
                <Label check>
                  Isolate
                </Label>
              </Col>
              <Col className="container">
                <div className="d-flex justify-content-end">
                  <Input
                    type="switch"
                    checked={isolated}
                    onChange={() => {
                      setIsolated(!isolated);
                    }}
                  />
                </div>
              </Col>
            </Row>
          </FormGroup>
        </Form>
        <Button color="primary" onClick={save}>
          Save
        </Button>{" "}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}

export default NewSessionModalWindow;
