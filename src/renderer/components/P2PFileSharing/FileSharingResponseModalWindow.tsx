import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

import P2PFileApi from "../../api/P2PFileApi";

import DesktopService from "../../services/desktop";
import { WorkspaceService } from "../../services/workspace";

import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from "../../store/workspace-slice";

import { Button, Form, FormGroup, Label, Input } from "reactstrap";
import Modal from "../lib/Modal";
import CornerWindow from "../lib/CornerWindow";
import "./FileSharingResponseModalWindow.css";

function FileSharingResponseModalWindow(props: any) {
  const dispatch = useDispatch();
  
  const userId = useSelector((state: any) => state.user.id);
  
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  
  const deviceId = useSelector((state: any) => state.app.deviceId);
  
  const userEmail = useSelector((state: any) => state.user.email);
  
  const senderEmail = useSelector((state: any) => state.p2pFile.senderEmail);
  
  const senderDeviceId = useSelector((state: any) => state.p2pFile.senderDeviceId);
  
  const roomId = useSelector((state: any) => state.p2pFile.roomId);
  const isFileSharingResponseModalOpen = useSelector(
    
    (state: any) => state.modal.isFileSharingResponseModalOpen
  );

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("start");
  const [roomUrl, setRoomUrl] = useState("");
  const [extended, setExtended] = useState("");

  function toggle() {
    reset();
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleFileSharingResponseModal());
  }
  
  function sendResponse(answer: any) {
    P2PFileApi.sendResponse(userEmail, senderDeviceId, roomId, answer).then((response) => {
        if(answer === "accepted"){
            setRoomUrl("https://www.sharedrop.io/rooms/" + roomId);
            setExtended("expanded-file-sharing-response-modal");
            setStatus("accepted");
        }else{
            setStatus("rejected");
        }
    });
    
    
  }

  function reset() {
    setEmail("");
    setStatus("start");
    setRoomUrl("");
    setExtended("");
  }

  function handleLoad() {
    log.debug("handleLoad");
  }

  useEffect(() => {
    log.debug("useEffect");
  }, []);

  return (
    <div>
      <CornerWindow
        id={uuidv4()}
        heading="File Transfer Invitation"
        className={"file-sharing-response-modal " + extended }
        show={isFileSharingResponseModalOpen}
        onClose={() => toggle()}
      >
        <Form>
          <FormGroup className="align-left">
            {
                status === "start" && (
                    <Label for="desktopName">
                        <b>{senderEmail}</b> wants to transfer a file to you.
                        Do you accept?
                    </Label>
                )
            }

            {
                status === "accepted" && (
                    <>
                        <Label for="desktopName">
                            File transfer request accepted. Please wait...
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
                        User has been informed that you have rejected the file transfer request.
                    </Label>
                )
            }
          </FormGroup>
        </Form>
        {
            status === "start" && (
                <div className="d-flex justify-content-between">
                    <Button
                        color="primary"
                        onClick={() => sendResponse("accepted")}
                    >
                        Accept
                    </Button>
                    <Button
                        color="danger"
                        onClick={() => sendResponse("rejected")}
                    >
                        Reject
                    </Button>
                </div>
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

export default FileSharingResponseModalWindow;
