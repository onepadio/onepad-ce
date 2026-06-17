import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, CheckCircle, XCircle } from 'react-bootstrap-icons';
import { Download } from '../../store/download-slice';
import { modalActions } from '../../store/modal-slice';
import './DownloadProgressToast.css';

function DownloadProgressToast() {
  const dispatch = useDispatch();
  const downloads = useSelector((state: any) => state.downloads.downloads as Download[]);
  const [latestDownload, setLatestDownload] = useState<Download | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('DownloadProgressToast: downloads changed', downloads.length, downloads);
    
    // Get the most recent download that is either progressing or recently completed
    const activeDownload = downloads.find(
      d => d.state === 'progressing' || d.state === 'paused'
    );

    if (activeDownload) {
      setLatestDownload(activeDownload);
      setIsVisible(true);
      // Clear any existing auto-hide timer
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
        setAutoHideTimer(null);
      }
    } else {
      // Check for recently completed downloads
      const completedDownload = downloads.find(
        d => d.state === 'completed' || d.state === 'cancelled' || d.state === 'interrupted'
      );

      if (completedDownload && latestDownload?.id === completedDownload.id) {
        setLatestDownload(completedDownload);
        setIsVisible(true);
        
        // Auto-hide after 3 seconds for completed downloads
        const timer = setTimeout(() => {
          setIsVisible(false);
          setLatestDownload(null);
        }, 3000);
        setAutoHideTimer(timer);
      }
    }

    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloads]);

  const handleClose = () => {
    setIsVisible(false);
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      setAutoHideTimer(null);
    }
    setTimeout(() => setLatestDownload(null), 300);
  };

  const handleOpenManager = () => {
    dispatch(modalActions.openDownloadManager());
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  const getProgressPercentage = (download: Download) => {
    if (download.totalBytes === 0) return 0;
    return Math.round((download.receivedBytes / download.totalBytes) * 100);
  };

  if (!isVisible || !latestDownload) {
    return null;
  }

  const percentage = getProgressPercentage(latestDownload);
  const isActive = latestDownload.state === 'progressing' || latestDownload.state === 'paused';

  return (
    <div className={`download-progress-toast ${isVisible ? 'visible' : ''}`}>
      <div className="toast-header">
        <div className="toast-title">
          {latestDownload.state === 'completed' && (
            <CheckCircle className="status-icon success" size={16} />
          )}
          {(latestDownload.state === 'cancelled' || latestDownload.state === 'interrupted') && (
            <XCircle className="status-icon error" size={16} />
          )}
          <span className="filename" title={latestDownload.filename}>
            {latestDownload.filename}
          </span>
        </div>
        <button className="close-btn" onClick={handleClose} title="Close">
          <X size={16} />
        </button>
      </div>

      {isActive && (
        <>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="toast-stats">
            <span className="percentage">{percentage}%</span>
            <span className="separator">•</span>
            <span className="size">
              {formatBytes(latestDownload.receivedBytes)} / {formatBytes(latestDownload.totalBytes)}
            </span>
            {latestDownload.state === 'progressing' && (
              <>
                <span className="separator">•</span>
                <span className="speed">{formatSpeed(latestDownload.speed)}</span>
              </>
            )}
          </div>
        </>
      )}

      {latestDownload.state === 'completed' && (
        <div className="toast-message success">
          Download complete
        </div>
      )}

      {latestDownload.state === 'cancelled' && (
        <div className="toast-message error">
          Download cancelled
        </div>
      )}

      {latestDownload.state === 'interrupted' && (
        <div className="toast-message error">
          Download interrupted
        </div>
      )}

      <button className="view-all-btn" onClick={handleOpenManager}>
        View all downloads
      </button>
    </div>
  );
}

export default DownloadProgressToast;
