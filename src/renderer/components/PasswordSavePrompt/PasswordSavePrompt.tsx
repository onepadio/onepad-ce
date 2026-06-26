import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, CardBody, Input, Label } from 'reactstrap';
import { X, Key, Check } from 'react-bootstrap-icons';
import './PasswordSavePrompt.css';
import { modalActions } from '../../store/modal-slice';
import PasswordService from '../../services/password';
import log from 'loglevel';

function PasswordSavePrompt() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: any) => state.modal.isPasswordSavePromptOpen);
  const promptData = useSelector((state: any) => state.modal.passwordSavePromptData);
  const workspaces = useSelector((state: any) => state.workspace.workspaces || []);
  const personId = useSelector((state: any) => state.app.personId);
  const currentWorkspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all');
  const [editedUsername, setEditedUsername] = useState('');

  useEffect(() => {
    if (promptData) {
      setEditedUsername(promptData.username || '');
      if (currentWorkspace?.id) {
        setSelectedWorkspace(currentWorkspace.id);
      }
    }
  }, [promptData, currentWorkspace]);

  if (!isOpen || !promptData) {
    return null;
  }

  const handleSave = async () => {
    try {
      // Check if electronAPI is available
      // @ts-expect-error
      if (!window.electronAPI?.invoke) {
        console.error('Password encryption is only available in Electron environment');
        return;
      }

      // Encrypt the password
      // @ts-expect-error
      const result = await window.electronAPI.invoke('password-encrypt', promptData.password, personId);
      
      if (result.success) {
        // Save to database
        await PasswordService.save(
          personId,
          promptData.hostname,
          editedUsername,
          result.encrypted,
          '',
          selectedWorkspace === 'all' ? undefined : selectedWorkspace
        );
        
        log.info('Password saved successfully');
        dispatch(modalActions.hidePasswordSavePrompt({}));
      } else {
        log.error('Failed to encrypt password:', result.error);
        alert('Failed to save password. Please make sure you are authenticated.');
      }
    } catch (error) {
      log.error('Error saving password:', error);
      alert('Failed to save password: ' + error);
    }
  };

  const handleNever = async () => {
    try {
      // TODO: Add to never-save list
      log.info('Never save for:', promptData.hostname);
      dispatch(modalActions.hidePasswordSavePrompt({}));
    } catch (error) {
      log.error('Error adding to never-save list:', error);
    }
  };

  const handleDismiss = () => {
    dispatch(modalActions.hidePasswordSavePrompt({}));
  };

  return (
    <div className="password-save-prompt-overlay">
      <Card className="password-save-prompt">
        <CardBody>
          <div className="prompt-header">
            <div className="prompt-icon">
              <Key size={20} />
            </div>
            <div className="prompt-title">
              Save Password?
            </div>
            <button className="prompt-close" onClick={handleDismiss}>
              <X size={18} />
            </button>
          </div>

          <div className="prompt-content">
            <div className="prompt-site">
              <strong>{promptData.hostname}</strong>
            </div>

            <div className="prompt-field">
              <Label for="username-field">Username</Label>
              <Input
                id="username-field"
                type="text"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
              />
            </div>

            <div className="prompt-field">
              <Label for="password-field">Password</Label>
              <Input
                id="password-field"
                type="password"
                value="••••••••"
                disabled
              />
            </div>

            {workspaces.length > 0 && (
              <div className="prompt-field">
                <Label for="workspace-field">Save to Workspace</Label>
                <Input
                  id="workspace-field"
                  type="select"
                  value={selectedWorkspace}
                  onChange={(e) => setSelectedWorkspace(e.target.value)}
                >
                  <option value="all">All Workspaces</option>
                  {workspaces.map((ws: any) => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </Input>
              </div>
            )}
          </div>

          <div className="prompt-actions">
            <Button
              color="primary"
              onClick={handleSave}
              className="save-btn"
            >
              <Check size={16} />
              Save
            </Button>
            <Button
              color="link"
              onClick={handleNever}
              className="never-btn"
            >
              Never for this site
            </Button>
            <Button
              color="secondary"
              onClick={handleDismiss}
              className="dismiss-btn"
            >
              Not now
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default PasswordSavePrompt;
