import { session, BrowserWindow, DownloadItem, dialog, app, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';

function getUniqueFilePath(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return filePath;
  }

  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const nameWithoutExt = path.basename(filePath, ext);

  let counter = 1;
  let newPath = path.join(dir, `${nameWithoutExt} (${counter})${ext}`);

  while (fs.existsSync(newPath)) {
    counter++;
    newPath = path.join(dir, `${nameWithoutExt} (${counter})${ext}`);
  }

  return newPath;
}

export interface Download {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'paused';
  savePath: string;
  startTime: number;
  speed: number;
  mimeType?: string;
  isPaused: boolean;
}

class DownloadManager {
  private downloads: Map<string, Download> = new Map();
  private downloadItems: Map<string, DownloadItem> = new Map();
  private mainWindow: BrowserWindow | null = null;
  private currentSession: any = null;

  initialize(window: BrowserWindow, sessionPartition: string) {
    this.mainWindow = window;
    console.log('Download manager initialized with window:', window ? 'YES' : 'NO');
    console.log('Main window ID:', window?.id);
    
    // Remove previous listener if exists
    if (this.currentSession) {
      this.currentSession.removeAllListeners('will-download');
    }

    this.currentSession = session.fromPartition(sessionPartition);

    // Listen for downloads
    this.currentSession.on('will-download', (event: any, item: DownloadItem, webContents: any) => {
      console.log('Main session will-download triggered');
      this.handleDownload(item, webContents);
    });

    log.info(`Download manager initialized for session: ${sessionPartition}`);
  }

  handleDownload(item: DownloadItem, webContents: any) {
    const filename = item.getFilename();
    const url = item.getURL();
    
    // Check if we're already downloading this file
    const existingDownload = Array.from(this.downloads.values()).find(
      d => d.url === url && (d.state === 'progressing' || d.state === 'paused')
    );
    
    if (existingDownload) {
      console.log(`Download already in progress for: ${filename}, cancelling duplicate`);
      item.cancel();
      return;
    }

    const downloadId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
    const defaultPath = path.join(app.getPath('downloads'), filename);
    
    // Get unique file path if file already exists
    const uniquePath = getUniqueFilePath(defaultPath);
    const actualFilename = path.basename(uniquePath);

    log.info(`handleDownload called for: ${filename}`);
    console.log(`handleDownload called for: ${filename} with id: ${downloadId}`);
    
    if (uniquePath !== defaultPath) {
      console.log(`File exists, using unique name: ${actualFilename}`);
    }

    // Auto-save to downloads folder with unique name
    item.setSavePath(uniquePath);

    // Track download
    const download: Download = {
      id: downloadId,
      filename: actualFilename,
      url: item.getURL(),
      totalBytes: item.getTotalBytes(),
      receivedBytes: 0,
      state: 'progressing',
      savePath: uniquePath,
      startTime: Date.now(),
      speed: 0,
      mimeType: item.getMimeType(),
      isPaused: false,
    };

    this.downloads.set(downloadId, download);
    this.downloadItems.set(downloadId, item);

    // Send initial state to renderer
    this.sendToRenderer('download-started', download);

    log.info(`Download started: ${filename}`);

    // Track progress
    item.on('updated', (event: any, state: string) => {
      const received = item.getReceivedBytes();
      const total = item.getTotalBytes();
      const currentDownload = this.downloads.get(downloadId);
      
      if (currentDownload) {
        currentDownload.receivedBytes = received;
        currentDownload.state = state as any;
        currentDownload.totalBytes = total;

        // Calculate speed (bytes per second)
        const elapsed = (Date.now() - currentDownload.startTime) / 1000;
        currentDownload.speed = elapsed > 0 ? received / elapsed : 0;

        this.sendToRenderer('download-progress', currentDownload);
      }
    });

    // Handle completion
    item.once('done', (event: any, state: string) => {
      const currentDownload = this.downloads.get(downloadId);
      
      if (currentDownload) {
        currentDownload.state = state as any;
        this.sendToRenderer('download-done', currentDownload);

        if (state === 'completed') {
          log.info(`Download completed: ${filename}`);
        } else if (state === 'cancelled') {
          log.info(`Download cancelled: ${filename}`);
        } else if (state === 'interrupted') {
          log.warn(`Download interrupted: ${filename}`);
        }
      }
    });
  }

  pauseDownload(downloadId: string) {
    const item = this.downloadItems.get(downloadId);
    const download = this.downloads.get(downloadId);
    
    if (item && download && item.canResume()) {
      item.pause();
      download.isPaused = true;
      download.state = 'paused';
      this.sendToRenderer('download-paused', download);
      log.info(`Download paused: ${download.filename}`);
    }
  }

  resumeDownload(downloadId: string) {
    const item = this.downloadItems.get(downloadId);
    const download = this.downloads.get(downloadId);
    
    if (item && download && item.canResume()) {
      item.resume();
      download.isPaused = false;
      download.state = 'progressing';
      this.sendToRenderer('download-resumed', download);
      log.info(`Download resumed: ${download.filename}`);
    }
  }

  cancelDownload(downloadId: string) {
    const item = this.downloadItems.get(downloadId);
    const download = this.downloads.get(downloadId);
    
    if (item && download) {
      item.cancel();
      download.state = 'cancelled';
      this.sendToRenderer('download-cancelled', download);
      log.info(`Download cancelled: ${download.filename}`);
    }
  }

  openFile(downloadId: string) {
    const download = this.downloads.get(downloadId);
    if (download && download.state === 'completed' && fs.existsSync(download.savePath)) {
      shell.openPath(download.savePath).then(error => {
        if (error) {
          log.error(`Error opening file: ${error}`);
        }
      });
    }
  }

  showInFolder(downloadId: string) {
    const download = this.downloads.get(downloadId);
    if (download && fs.existsSync(download.savePath)) {
      shell.showItemInFolder(download.savePath);
    }
  }

  removeDownload(downloadId: string) {
    const download = this.downloads.get(downloadId);
    console.log(`removeDownload called for: ${downloadId}, exists: ${!!download}`);
    if (download) {
      if (download.state !== 'progressing' && download.state !== 'paused') {
        this.downloads.delete(downloadId);
        this.downloadItems.delete(downloadId);
        console.log(`Download removed from main process, sending to renderer`);
        this.sendToRenderer('download-removed', { id: downloadId });
        log.info(`Download removed from list: ${download.filename}`);
      } else {
        console.log(`Cannot remove download in progress: ${download.filename}`);
      }
    } else {
      console.log(`Download ${downloadId} not found in main process`);
    }
  }

  getDownloads(): Download[] {
    return Array.from(this.downloads.values());
  }

  private sendToRenderer(channel: string, data: any) {
    console.log(`Sending to renderer: ${channel}`, data);
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('download-event', {
        channel,
        data,
      });
      console.log('Event sent to renderer successfully');
    } else {
      console.log('ERROR: mainWindow is not available or destroyed');
    }
  }

  cleanup() {
    if (this.currentSession) {
      this.currentSession.removeAllListeners('will-download');
    }
  }
}

export default new DownloadManager();
