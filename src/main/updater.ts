import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { BrowserWindow, dialog, net, powerMonitor } from 'electron';

const NETWORK_SETTLE_MS = 5000;
const NETWORK_RETRY_MS = 10000;
const MAX_NETWORK_RETRIES = 3;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

const TRANSIENT_NETWORK_ERROR_PATTERNS = [
  'ERR_NETWORK_CHANGED',
  'ERR_INTERNET_DISCONNECTED',
  'ERR_NETWORK_IO_SUSPENDED',
  'ERR_CONNECTION_RESET',
  'ERR_CONNECTION_ABORTED',
  'ERR_NAME_NOT_RESOLVED',
  'ENOTFOUND',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENETUNREACH',
];

function isTransientNetworkError(error: unknown): boolean {
  const message = String(error ?? '');
  return TRANSIENT_NETWORK_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern)
  );
}

let appUpdaterInstance: AppUpdater | null = null;

export function getAppUpdater(): AppUpdater | null {
  return appUpdaterInstance;
}

export function checkForAppUpdates(options?: { background?: boolean }) {
  if (appUpdaterInstance) {
    appUpdaterInstance.checkForUpdates(options);
    return;
  }

  // Fallback before the updater is initialized (e.g. early dock menu click)
  if (!net.isOnline()) {
    if (!options?.background) {
      dialog.showMessageBox({
        title: 'No Internet Connection',
        message: 'Connect to the internet and try again to check for updates.',
      });
    }
    return;
  }

  autoUpdater.checkForUpdates();
}

export default class AppUpdater {
  window: BrowserWindow;

  backgroundCheck: boolean;

  updateDownloaded: boolean;

  private networkSettling = false;

  private settleTimer: ReturnType<typeof setTimeout> | null = null;

  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  private networkRetryCount = 0;

  constructor(window: any, channel: string) {
    this.window = window;
    this.backgroundCheck = false;
    this.updateDownloaded = false;
    appUpdaterInstance = this;

    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.channel = channel;

    this.watchNetworkResume();
    this.scheduleBackgroundChecks();

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
      this.updateDownloaded = true;
      this.window.webContents.send('fromMain', {
        action: 'autoupdater-update-downloaded',
        data: 'update-downloaded',
      });
    });

    autoUpdater.on('error', (error) => {
      console.log(error);
      const wasBackground = this.backgroundCheck;
      this.backgroundCheck = false;

      if (isTransientNetworkError(error)) {
        log.info(
          'Update check hit transient network error:',
          String(error)
        );
        this.scheduleRetryAfterNetworkSettles(wasBackground);

        // Don't interrupt the user for background/resume races.
        if (wasBackground || this.networkSettling) {
          return;
        }

        dialog.showMessageBox({
          title: 'Update Check Unavailable',
          message:
            'Could not reach the update server. Check your internet connection and try again.',
        });
        return;
      }

      if (wasBackground) {
        log.warn('Background update check failed:', String(error));
        return;
      }

      dialog.showMessageBox({
        title: 'Error',
        message: `An error occurred while checking for updates.${error}`,
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
        data: progressObj,
      });
    });
  }

  checkForUpdates({ background = false }: { background?: boolean } = {}) {
    if (this.networkSettling) {
      log.info('Update check deferred: network still settling after resume');
      this.scheduleRetryAfterNetworkSettles(background);
      return;
    }

    if (!net.isOnline()) {
      log.info('Update check skipped: offline');
      if (!background) {
        dialog.showMessageBox({
          title: 'No Internet Connection',
          message:
            'Connect to the internet and try again to check for updates.',
        });
      }
      return;
    }

    this.backgroundCheck = background;
    autoUpdater.checkForUpdates().then(() => {
      this.networkRetryCount = 0;
    }).catch((error) => {
      log.warn('checkForUpdates rejected:', String(error));
    });
  }

  private scheduleBackgroundChecks() {
    setInterval(() => {
      this.checkForUpdates({ background: true });
    }, CHECK_INTERVAL_MS);
  }

  private watchNetworkResume() {
    powerMonitor.on('resume', () => {
      log.info('System resumed; waiting for network to settle before updates');
      this.networkSettling = true;
      this.networkRetryCount = 0;

      if (this.settleTimer) {
        clearTimeout(this.settleTimer);
      }
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }

      this.settleTimer = setTimeout(() => {
        this.networkSettling = false;
        this.settleTimer = null;
        this.checkForUpdates({ background: true });
      }, NETWORK_SETTLE_MS);
    });

    powerMonitor.on('suspend', () => {
      this.networkSettling = true;
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
    });
  }

  private scheduleRetryAfterNetworkSettles(background = true) {
    if (this.retryTimer) {
      return;
    }

    if (this.networkRetryCount >= MAX_NETWORK_RETRIES) {
      log.info('Update check retries exhausted after network errors');
      this.networkRetryCount = 0;
      return;
    }

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this.networkSettling) {
        this.scheduleRetryAfterNetworkSettles(background);
        return;
      }
      if (!net.isOnline()) {
        log.info('Update retry skipped: still offline');
        this.networkRetryCount = 0;
        return;
      }
      this.networkRetryCount += 1;
      this.checkForUpdates({ background });
    }, NETWORK_RETRY_MS);
  }
}
