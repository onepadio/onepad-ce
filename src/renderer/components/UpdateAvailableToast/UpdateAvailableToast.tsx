import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Gift } from 'react-bootstrap-icons';
import isElectron from 'is-electron';
import { appActions } from '../../store/app-slice';
import './UpdateAvailableToast.css';

function UpdateAvailableToast() {
  const dispatch = useDispatch();
  const isUpdateReady = useSelector((state: any) => state.app.isUpdateReady);

  if (!isUpdateReady) {
    return null;
  }

  const handleLater = () => {
    dispatch(appActions.setIsUpdateReady(false));
  };

  const handleInstallNow = () => {
    if (isElectron()) {
      // @ts-expect-error electronAPI is injected by preload
      window.electronAPI.send('toMain', {
        action: 'install-update',
      });
    }
  };

  return (
    <div className="update-available-toast" role="status" aria-live="polite">
      <div className="update-available-toast__message">
        <Gift className="update-available-toast__icon" size={16} aria-hidden />
        <span>New update available</span>
      </div>
      <div className="update-available-toast__actions">
        <button
          type="button"
          className="update-available-toast__btn update-available-toast__btn--later"
          onClick={handleLater}
        >
          Later
        </button>
        <button
          type="button"
          className="update-available-toast__btn update-available-toast__btn--install"
          onClick={handleInstallNow}
        >
          Install Now
        </button>
      </div>
    </div>
  );
}

export default UpdateAvailableToast;
