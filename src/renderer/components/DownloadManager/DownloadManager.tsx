import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from 'reactstrap';
import {
  Download as DownloadIcon,
  Pause,
  Play,
  X,
  Folder,
  FileEarmark,
  Trash,
} from 'react-bootstrap-icons';
import isElectron from 'is-electron';
import clsx from 'clsx';

import { modalActions } from '../../store/modal-slice';
import { downloadActions, Download } from '../../store/download-slice';

import './DownloadManager.css';

function DownloadManager() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: any) => state.modal.isDownloadManagerOpen);
  const downloads = useSelector((state: any) => state.downloads.downloads as Download[]);

  useEffect(() => {
    if (!isElectron()) {
      console.log('Not running in Electron');
      return;
    }

    console.log('Setting up download event listener');

    const handleDownloadEvent = (event: any, { channel, data }: any) => {
      console.log('Download event received:', channel, data);
      switch (channel) {
        case 'download-started':
          console.log('Dispatching addDownload action');
          dispatch(downloadActions.addDownload(data));
          break;
        case 'download-progress':
          dispatch(downloadActions.updateDownload(data));
          break;
        case 'download-done':
        case 'download-paused':
        case 'download-resumed':
        case 'download-cancelled':
          dispatch(downloadActions.updateDownload(data));
          break;
        case 'download-removed':
          console.log('Removing download from Redux:', data);
          dispatch(downloadActions.removeDownload(data));
          break;
      }
    };

    // @ts-expect-error
    if (window.electronAPI?.receive) {
      console.log('Registering download-event listener');
      // @ts-expect-error
      window.electronAPI.receive('download-event', handleDownloadEvent);
    } else {
      console.error('electronAPI.receive is not available');
    }

    return () => {
      console.log('Cleaning up download event listener');
      // @ts-expect-error
      window.electronAPI?.removeListener?.('download-event', handleDownloadEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    dispatch(modalActions.toggleDownloadManager());
  };

  const close = () => {
    dispatch(modalActions.closeDownloadManager());
  };

  const sendAction = (action: string, downloadId: string) => {
    if (!isElectron()) return;

    // @ts-expect-error
    window.electronAPI.send('toMain', {
      action: 'download-action',
      downloadAction: action,
      downloadId,
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  const getProgressPercentage = (download: Download) => {
    if (download.totalBytes === 0) return 0;
    return Math.round((download.receivedBytes / download.totalBytes) * 100);
  };

  const handleClearCompleted = () => {
    const completedIds = downloads
      .filter(d => d.state === 'completed' || d.state === 'cancelled')
      .map(d => d.id);
    
    console.log('Clearing completed downloads:', completedIds);
    completedIds.forEach(id => {
      console.log('Sending remove action for:', id);
      sendAction('remove', id);
    });
  };

  useEffect(() => {
    const modalx = document.getElementById('download-manager-modal');
    const modalBody = document.getElementById('download-manager-body');
    if (isOpen) {
      modalx?.classList.remove('hidden');
      setTimeout(() => {
        modalBody?.classList.add('opened');
      }, 100);
    } else {
      modalBody?.classList.remove('opened');
      setTimeout(() => {
        modalx?.classList.add('hidden');
      }, 250);
    }
  }, [isOpen]);

  return (
    <div
      id="download-manager-modal"
      onClick={close}
      className={clsx(
        '!m-0 fixed inset-0 z-1099',
        'items-center justify-center',
        'bg-black/50',
        'modalx',
        'flex',
        !isOpen && 'hidden'
      )}
      style={{
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: '20px'
      }}
    >
      <div
        id="download-manager-body"
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          'rounded-xl shadow-xl',
          'bg-dark dark:bg-dark',
          'text-gray-200',
          'modal-body-x',
          'download-manager-modal'
        )}
      >
        <div className="download-manager-header">
          <h3 className="download-manager-title">Downloads</h3>
          <Button
            color="secondary"
            size="sm"
            onClick={handleClearCompleted}
            disabled={!downloads.some(d => d.state === 'completed' || d.state === 'cancelled')}
            className="clear-completed-btn"
          >
            Clear Completed
          </Button>
        </div>
        
        <div className="download-manager-container">
        {downloads.length === 0 ? (
          <div className="no-downloads">
            <DownloadIcon size={48} className="mb-3 text-muted" />
            <p className="text-muted">No downloads yet</p>
          </div>
        ) : (
          <>
            <div className="downloads-list">
              {downloads.map(download => (
                <div key={download.id} className={`download-item ${download.state}`}>
                  <div className="download-icon">
                    <FileEarmark size={24} />
                  </div>
                  <div className="download-info">
                    <div className="download-filename" title={download.filename}>
                      {download.filename}
                    </div>
                    <div className="download-progress-bar">
                      <div
                        className="download-progress-fill"
                        style={{
                          width: `${getProgressPercentage(download)}%`,
                        }}
                      />
                    </div>
                    <div className="download-stats">
                      <span className="download-size">
                        {formatBytes(download.receivedBytes)} / {formatBytes(download.totalBytes)}
                      </span>
                      {download.state === 'progressing' && (
                        <>
                          <span className="download-separator">•</span>
                          <span className="download-speed">{formatSpeed(download.speed)}</span>
                          <span className="download-separator">•</span>
                          <span className="download-percentage">{getProgressPercentage(download)}%</span>
                        </>
                      )}
                      {download.state === 'completed' && (
                        <>
                          <span className="download-separator">•</span>
                          <span className="download-status text-success">Complete</span>
                        </>
                      )}
                      {download.state === 'cancelled' && (
                        <>
                          <span className="download-separator">•</span>
                          <span className="download-status text-danger">Cancelled</span>
                        </>
                      )}
                      {download.state === 'paused' && (
                        <>
                          <span className="download-separator">•</span>
                          <span className="download-status text-warning">Paused</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="download-controls">
                    {download.state === 'progressing' && (
                      <Button
                        color="dark"
                        size="sm"
                        onClick={() => sendAction('pause', download.id)}
                        title="Pause"
                      >
                        <Pause size={16} />
                      </Button>
                    )}
                    {download.state === 'paused' && (
                      <Button
                        color="dark"
                        size="sm"
                        onClick={() => sendAction('resume', download.id)}
                        title="Resume"
                      >
                        <Play size={16} />
                      </Button>
                    )}
                    {(download.state === 'progressing' || download.state === 'paused') && (
                      <Button
                        color="dark"
                        size="sm"
                        onClick={() => sendAction('cancel', download.id)}
                        title="Cancel"
                      >
                        <X size={16} />
                      </Button>
                    )}
                    {download.state === 'completed' && (
                      <>
                        <Button
                          color="dark"
                          size="sm"
                          onClick={() => sendAction('open-file', download.id)}
                          title="Open File"
                        >
                          <FileEarmark size={16} />
                        </Button>
                        <Button
                          color="dark"
                          size="sm"
                          onClick={() => sendAction('show-in-folder', download.id)}
                          title="Show in Folder"
                        >
                          <Folder size={16} />
                        </Button>
                      </>
                    )}
                    {(download.state === 'completed' || download.state === 'cancelled') && (
                      <Button
                        color="dark"
                        size="sm"
                        onClick={() => sendAction('remove', download.id)}
                        title="Remove from List"
                      >
                        <Trash size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

export default DownloadManager;
