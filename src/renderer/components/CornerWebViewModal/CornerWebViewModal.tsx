import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Offcanvas, OffcanvasBody, OffcanvasHeader } from "reactstrap";
import { v4 as uuidv4 } from 'uuid';

import clsx from "clsx"
import { X } from "react-bootstrap-icons"
import { CircularButton } from "../lib/Button"

import "./CornerWebViewModal.css"

import { cornerWindowActions } from "../../store/corner-window-slice";

function CornerWebViewModal(props: any){
    const dispatch = useDispatch();
    const route = useSelector((state: any) => state.session.route);
    
    const user = useSelector((state: any) => state.user);
    
    const windowState = useSelector((state: any) => state.cornerWindow);
    
    const isOpen = useSelector((state: any) => state.cornerWindow.isOpen);
    
    const webviewUrl = useSelector((state: any) => state.cornerWindow.webviewUrl);

    
    const backdrop = useSelector((state: any) => state.canvas.backdrop);
    
    const fade = useSelector((state: any) => state.canvas.fade);
    
    const workspaceState = useSelector((state: any) => state.workspace);
    
    const sessionState = useSelector((state: any) => state.session);

    const [partitionId, setPartitionId] = useState("");
    const id = uuidv4();

    function getPartitionId(workspaceId: any){
        let partition = "";
        if(route === "authenticated"){
          partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+user.username+"_"+workspaceState.currentSession.id : "persist:"+user.username+"_"+workspaceId;
        }else{
          partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+workspaceState.currentSession.id : "persist:"+workspaceId;
        }
        return partition;
    }

    useEffect(() => {
        setPartitionId(getPartitionId(workspaceState.selectedWorkspace.id));
    }, [workspaceState, route]);

    useEffect(() => {
        const modalx = document.getElementById("corner-window-" + id);
        const modalBody = document.getElementById("corner-window-body-" + id);
        if (isOpen) {
          modalx.classList.remove("hidden");
          setTimeout(() => {
            modalBody.classList.add("corner-webview-window-opened");
          }, 100);
        } else {
          modalBody.classList.remove("corner-webview-window-opened");
          modalx.classList.add("hidden");
        }
      }, [id, isOpen]);
    
      function onClose(){
        dispatch(cornerWindowActions.close());
      }

      return (
        <div>
            <div
            id={"corner-window-"+id}
            onClick={onClose}
            className={clsx(
                "!m-0 fixed inset-0 z-1099",
                "items-end justify-end",
                "bg-black/50",
                "corner-webview-window",
                "flex hidden",
            )}
            >
            <div
                id={"corner-window-body-"+id}
                onClick={(e) => e.stopPropagation()}
                className={clsx(
                "rounded-xl shadow-xl",
                "text-gray-200",
                "corner-webview-window-body",
                )}
                style={{
                    width: windowState.width+"px",
                    height: windowState.height+"px",
                    }
                    }
            >
                {}
                <div className="flex gap-4 justify-end items-center mb-1">
                <button
                    onClick={() => onClose()} title="Close"
                    className={clsx(
                        "flex item-center justify-center",
                        "bg-gray-700",
                        "font-bold text-white",
                        "disabled:opacity-60 hover:opacity-95",
                        "shadow hover:shadow-lg transition-all",
                        "p-1.5 close-button"
                    )}
                >
                    <X />
                </button>
                </div>
                <div style={{
                    height: (windowState.height-30)+"px",
                    }}
                >
                    <webview partition={partitionId} src={webviewUrl} style={{width: "100%", height: (windowState.height-30)+"px"}}></webview>
                </div>
            </div>
            </div>
        </div>
      )
}

export default CornerWebViewModal;