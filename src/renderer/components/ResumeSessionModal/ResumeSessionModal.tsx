import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { modalActions } from "../../store/modal-slice";
import { SpaceService } from "../../services/space";
import Modal from "../lib/Modal";
import { v4 as uuidv4 } from "uuid";
import "./ResumeSessionModal.css";

function ResumeSessionModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: any) => state.modal.isResumeSessionModalOpen);
  const resumeSessionData = useSelector((state: any) => state.modal.resumeSessionData);
  
  // Get current session state
  const currentSessionState = useSelector((state: any) => state.session);

  const handleResume = async () => {
    if (resumeSessionData && resumeSessionData.workspaceId) {
      try {
        // Use SpaceService to resume the paused session
        // This will merge with current state and delete the paused session from DB
        const resumed = await SpaceService.resumePausedSession(
          resumeSessionData.workspaceId,
          currentSessionState,
          dispatch
        );
        
        if (resumed) {
          dispatch(modalActions.closeResumeSessionModal());
        } else {
          console.error("No paused session found for workspace:", resumeSessionData.workspaceId);
          dispatch(modalActions.closeResumeSessionModal());
        }
      } catch (error) {
        console.error("Failed to resume session:", error);
      }
    }
  };

  const handleStartFresh = async () => {
    if (resumeSessionData && resumeSessionData.workspaceId) {
      try {
        // Delete the paused session and start fresh
        await SpaceService.deletePausedSession(resumeSessionData.workspaceId);
        dispatch(modalActions.closeResumeSessionModal());
      } catch (error) {
        console.error("Failed to delete paused session:", error);
      }
    }
  };

  const handleClose = () => {
    dispatch(modalActions.closeResumeSessionModal());
  };

  return (
    <Modal
      id={uuidv4()}
      heading="Resume Paused Session?"
      className="resume-session-modal"
      show={isOpen}
      onClose={handleClose}
    >
      <div className="resume-session-content">
        <div className="resume-session-message">
          <p>
            This space has a paused session with your previous apps and tabs.
          </p>
          <p>
            Would you like to resume where you left off?
          </p>
        </div>

        <div className="resume-session-actions">
          <button 
            className="resume-button primary-button" 
            onClick={handleResume}
          >
            Resume Session
          </button>
          <button 
            className="start-fresh-button secondary-button" 
            onClick={handleStartFresh}
          >
            Start Fresh
          </button>
          <button 
            className="cancel-button tertiary-button" 
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ResumeSessionModal;
