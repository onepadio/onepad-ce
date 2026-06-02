import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import P2PFileApi from "../../api/P2PFileApi";

import DesktopService from "../../services/desktop";
import { WorkspaceService } from "../../services/workspace";

import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from "../../store/workspace-slice";

import { Button, Form, FormGroup, Label, Input, Dropdown, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import Modal from "../lib/Modal";
import CornerWindow from "../lib/CornerWindow";
import "./FileSharingRequestModalWindow.css";
import { p2pFileActions } from "../../store/p2pfile-slice";

function FileSharingRequestModalWindow(props: any) {
  const dispatch = useDispatch();
  
  const userId = useSelector((state: any) => state.user.id);
  
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  
  const userEmail = useSelector((state: any) => state.user.email);
  
  const deviceId = useSelector((state: any) => state.app.deviceId);
  
  const receiverResponse = useSelector((state: any) => state.p2pFile.receiverResponse);
  const isFileSharingRequestModalOpen = useSelector(
    
    (state: any) => state.modal.isFileSharingRequestModalOpen
  );

  const [receiverEmail, setReceiverEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("start");
  const [roomUrl, setRoomUrl] = useState("");
  const [extended, setExtended] = useState("");
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState(false);
  const [saveForFutureUse, setSaveForFutureUse] = useState(false);

  function toggle() {
    reset();
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleFileSharingRequestModal());
    dispatch(p2pFileActions.setReceiverResponse(""));
  }
  
  function sendRequest() {
    // validate email
    if (
      receiverEmail.length < 1 || !receiverEmail.includes("@") || !receiverEmail.includes(".") || receiverEmail.includes(" ") || receiverEmail.includes(",") ||
      receiverEmail.includes(";") || receiverEmail.includes(":") || receiverEmail.includes("/") || receiverEmail.includes("\\") || receiverEmail.includes("|") ||
      receiverEmail.includes("[") || receiverEmail.includes("]") || receiverEmail.includes("{") || receiverEmail.includes("}") || receiverEmail.includes("(") ||
      receiverEmail.includes(")") || receiverEmail.includes("<") || receiverEmail.includes(">")
      ) {
      return;
    }
    let rid = uuidv4();
    setRoomId(rid);
    setRoomUrl("https://www.sharedrop.io/rooms/" + rid);
    log.debug("https://www.sharedrop.io/rooms/" + rid);
    P2PFileApi.sendRequest(userEmail, receiverEmail, deviceId, rid).then((response: any) => {
      log.debug("sendRequest response", response);
      if(response.status === 404){
        setStatus("user_not_found");
      }else if(response.status === 400){
        setStatus("user_not_found");
      }else if(response.status === 500){
        setStatus("server_error");
      }else{
        setStatus("pending");
      }
    });
  }

  function reset() {
    setReceiverEmail("");
    setStatus("start");
    setExtended("");
    setRoomId("");
    setRoomUrl("");
    setNewUser(false);
    setSaveForFutureUse(false);
  }

  function handleLoad() {
    log.debug("handleLoad");
  }

  useEffect(() => {
    if(receiverResponse === "accepted"){
      setStatus("accepted");
    }else if(receiverResponse === "rejected"){
      setStatus("rejected");
    }
  }, [receiverResponse]);

  useEffect(() => {
    if(status === "accepted"){
      setExtended("expanded-file-sharing-request-modal");
      if(saveForFutureUse){
        let _users = users;
        _users.push(receiverEmail);
        localStorage.setItem("P2PUsers", JSON.stringify(_users));
        setUsers(_users);
      }
    }else{
      setExtended("");
    }
  }, [status]);

  useEffect(() => {
    log.debug("isFileSharingRequestModalOpen", isFileSharingRequestModalOpen);
    if(isFileSharingRequestModalOpen){
      if(localStorage.getItem("P2PUsers")){
        setUsers(JSON.parse(localStorage.getItem("P2PUsers")));
      }else{
        localStorage.setItem("P2PUsers", JSON.stringify([]));
        setUsers([]);
      }
    }
  }, [isFileSharingRequestModalOpen]);

  return (
    <div>
      <CornerWindow
        id={uuidv4()}
        heading="Transfer File to User"
        className={"file-sharing-request-modal " + extended }
        show={isFileSharingRequestModalOpen}
        onClose={() => toggle()}
      >
        <Form className="h-100 w-100">
          <FormGroup className="align-left h-100 w-100" >
            {
              status === "start"  && (
                    (users.length === 0 || newUser) ? (
                      <>
                        <Input
                        id="receiverEmail"
                        name="receiverEmail"
                        placeholder="Type email address of the user..."
                        type="text"
                        value={receiverEmail}
                        onChange={(e) => setReceiverEmail(e.target.value)}
                      /> <br />
                      <div className="ml-4">
                        < Input
                          id="saveForFutureUse"
                          name="saveForFutureUse"
                          type="checkbox"
                          checked={saveForFutureUse}
                          onChange={(e) => setSaveForFutureUse(e.target.checked)}
                        />
                        <Label for="receiverEmail">
                          Save this user for future use
                        </Label>
                      </div> 
                      
                      </>
                    ) : (
                      <UncontrolledDropdown direction="up"  className='recentTasks w-100'>
                        <DropdownToggle className="w-100" caret>
                            {
                              receiverEmail.length > 0 ? receiverEmail : "Select User"
                            }
                        </DropdownToggle>
                        <DropdownMenu className="w-100" dark>
                          {
                            users.map((user) => (
                              <DropdownItem onClick={() => setReceiverEmail(user)}>{user}</DropdownItem>
                            ))
                          }
                          <DropdownItem divider />
                          <DropdownItem onClick={() => setNewUser(true)}>New User</DropdownItem>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    )
              )
            }
            {
              status === "user_not_found" && (
                "User not found"
              )
            }
            {
              status === "server_error" && (
                "Server error"
              )
            }
            {
              status === "pending" && (
                "Request sent to "+receiverEmail+". Waiting for response..."
              ) 
            }
            {
              status === "accepted" && (
                <>
                  <Label for="desktopName">
                    <b>{receiverEmail}</b> accepted the request, please transfer the file by clicking the users avatar or drag and drop on the avatar.
                  </Label>
                  <webview
                      id={uuidv4()}
                      className="filesharing-webview"
                      // @ts-expect-error
                      autosize="on"
                      src={roomUrl}
                      // @ts-expect-error
                      nodeintegration="true"
                      // @ts-expect-error
                      allowpopups="true"
                      onLoadCapture={() => handleLoad()}
                  ></webview>
                </>
              ) 
            }
            {
              status === "rejected" && (
                <Label for="desktopName">
                    <b>{receiverEmail}</b> rejected your request...
                </Label>
              ) 
            }
          </FormGroup>
        </Form>
        {
          status === "start" && (
            <Button color="primary" onClick={sendRequest} disabled={status !== "start"} >
              Connect
            </Button>
          )
        }
        {
          status === "rejected" && (
            <Button color="primary" onClick={toggle} >
              Close
            </Button>
          )
        }
      </CornerWindow>
    </div>
  );
}

export default FileSharingRequestModalWindow;
