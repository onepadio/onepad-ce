import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { BrowserWindow, dialog, app } from 'electron';

export default class AppUpdater {
  window: BrowserWindow;

  backgroundCheck: boolean;

  updateDownloaded: boolean;

  constructor(window: any, channel: string) {
    this.window = window;
    this.backgroundCheck = false;
    this.updateDownloaded = false;

    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.channel = channel;

    let checkInterval = 6 * 60 * 60 * 1000; // 6 hours default

    const scheduleNextCheck = () => {
      setInterval(() => {
        this.backgroundCheck = true;
        autoUpdater.checkForUpdates();
      }, checkInterval);
    };

    // Initial check
    scheduleNextCheck();

    autoUpdater.on('checking-for-update', () => {
      console.log('checking-for-update');
      this.window.webContents.send('fromMain', {
        action: 'autoupdater-checking-for-update',
        data: 'checking-for-update',
      });
    });

    autoUpdater.on('update-available', () => {
      autoUpdater.checkForUpdatesAndNotify();
    });

    autoUpdater.on('update-not-available', () => {
      console.log('update-not-available');
      this.window.webContents.send('fromMain', {
        action: 'autoupdater-update-not-available',
        data: 'update-not-available',
      });
      if (this.backgroundCheck) {
        this.backgroundCheck = false;
        return;
      }
      dialog.showMessageBox({
        title: 'No Updates',
        message: 'Current version is up-to-date.',
      });
    });

    autoUpdater.on('update-downloaded', () => {
      this.window.webContents.send('fromMain', {
        action: 'autoupdater-update-downloaded',
        data: 'update-downloaded',
      });
      dialog.showMessageBox({
        title: 'Update Available',
        message: 'Updates are ready to be installed.',
        buttons: ['Install and Restart', 'Later'],
        defaultId: 1,
        cancelId: 1
      }).then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });

    autoUpdater.on('error', (error) => {
      console.log(error);
      dialog.showMessageBox({
        title: 'Error',
        message: 'An error occurred while checking for updates.' + error,
      });
    });

    autoUpdater.on('update-cancelled', () => {
      console.log('update-cancelled');
      dialog.showMessageBox({
        title: 'Update Cancelled',
        message: 'The update has been cancelled.',
      });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.window.webContents.send('fromMain', {
        action: 'autoupdater-download-progress',
        data: progressObj
      });
    });

  }
}
