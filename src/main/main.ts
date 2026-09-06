/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  session,
  nativeImage,
  clipboard,
  webContents,
  nativeTheme,
  Menu,
  Dialog,
  desktopCapturer,
  systemPreferences,
  globalShortcut,
} from 'electron';
import util from 'electron-util';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
//import sqlite3 from 'sqlite3';
import fs from 'fs';
import crypto from 'crypto';
import os from 'os';
import { promisify } from 'util';

// DISABLED: Clipboard sync functionality
// import clipboardListener from './clipboard/index';

import ProfileManager from './controller/ProfileManager';
import { Profile } from './model/Profile';

import MenuBuilder from './menu';
import { getAssetPath, resolveHtmlPath } from './util';
import openExternalWindow from './external';
import { platform, hostname } from 'os';

import createMainWindow from './mainWindow';
import feedbackModalWindow from './feedbackModal';
import getProfileWindow from './profileWindow';
import OPModalWindow, { OPFloatingWindow } from './modalWindow';
import saveToDisk from './saveToDisk';
import { execSync } from 'child_process';
// DISABLED: Docker functionality
// import { dockerService, DockerContainer } from './docker/docker';
import { createMasterKeyIfNotExists, getMasterKey, encryptFunc, decryptFunc } from './crypto';
import passwordCrypto from './passwordCrypto';
import { SPContextMenu, SPShortContextMenu } from './contextMenu';
import downloadManager from './downloadManager';
import {
  saveScreenshotToDisk,
  loadScreenshotFromDisk,
  deleteScreenshotFromDisk,
  flushScreenshotsToDisk,
  normalizeScreenshotKey,
  isValidScreenshotDataUrl,
} from './screenshotStore';

const store = new Store();

const windows: { [key: string]: any } = {};
const mainWindows: { [key: string]: BrowserWindow } = {};
const externalTabs = {};
const screenShots: { [key: string]: any } = {};
let activeWindow: BrowserWindow | null = null;
const sessions: { [key: string]: any } = {};
const sessionsWithDownloadListeners: Set<string> = new Set();
let userId: string | null;
let workspaceId: string | undefined = 'device';
const profileManager: ProfileManager = new ProfileManager(store);
let profile: Profile | undefined;
let partitionId: string = 'persist:device';

const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isDarkMode = nativeTheme.shouldUseDarkColors;
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// get channel from environment variable
let channel = 'latest';
let version = app.getVersion();
if (isDev) {
  version = app.getVersion().endsWith('dev')
    ? app.getVersion()
    : app.getVersion() + '-dev';
}
if (version.endsWith('beta')) {
  channel = 'beta';
} else if (version.endsWith('alpha')) {
  channel = 'alpha';
} else if (version.endsWith('dev')) {
  channel = 'dev';
}

// get file path for the app
console.log('app.getAppPath()', app.getAppPath());

let ww = 0;
let wh = 0;
let zoomFactor = 1;

console.log('isDarkMode: ', isDarkMode);

console.log('appData: ', app.getPath('appData'));
console.log('userData: ', app.getPath('userData'));
console.log('sessionData: ', app.getPath('sessionData'));
console.log('temp: ', app.getPath('temp'));
console.log('home: ', app.getPath('home'));
console.log('desktop: ', app.getPath('desktop'));
console.log('documents: ', app.getPath('documents'));
console.log('downloads: ', app.getPath('downloads'));
console.log('music: ', app.getPath('music'));
console.log('pictures: ', app.getPath('pictures'));
console.log('videos: ', app.getPath('videos'));
console.log('logs: ', app.getPath('logs'));

// get host name
console.log('hostname: ', hostname());

let mainWindow: BrowserWindow | undefined;
let mainWindowContentsProcessId: number | null = null;
let profileWindow: BrowserWindow | undefined;
let quitDialog: Dialog | undefined;

const dockMenu = Menu.buildFromTemplate([
  {
    label: 'Check For Updates',
    click() {
      autoUpdater.checkForUpdates();
    },
  },
]);

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

// DISABLED: Docker functionality
// async function runDockerContainer() {
//   try {
//     // Check if Docker is running
//     const isRunning = await dockerService.isDockerRunning();

//     if (!isRunning) {
//       // On Windows, we can try to start Docker Desktop
//       if (process.platform === 'win32') {
//         console.log('Starting Docker Desktop...');
//         await dockerService.startDockerDesktop();
//       } else {
//         throw new Error('Docker is not running');
//       }
//     }

//     console.log('Running container...');
//     const output = await dockerService.runContainer('nginx', [
//       '-d',
//       '-p 8080:80',
//       '--name my-nginx'
//     ]);

//     console.log('Container started:', output);
//   } catch (error) {
//     if (error.message.includes('pull access denied') || error.message.includes('not found')) {
//       console.error('Error: Docker image not found or access denied');
//       // Handle authentication or image not found errors
//     } else if (error.message.includes('network timeout')) {
//       console.error('Error: Network timeout while pulling image');
//       // Handle network issues
//     } else {
//       console.error('Error:', error.message);
//     }
//   }
// }

function getPartitionId(wsid: string | undefined) {
  let _partitionId: string;
  if (userId == null && wsid == null) {
    _partitionId = 'persist:device';
  } else if (userId == null) {
    _partitionId = `persist:${wsid}`;
  } else {
    _partitionId = `persist:${userId}_${wsid}`;
  }
  return _partitionId;
}

function switchSession() {
  if (userId == null && workspaceId == null) {
    partitionId = 'persist:device';
  } else if (userId == null) {
    partitionId = `persist:${workspaceId}`;
  } else {
    partitionId = `persist:${userId}_${workspaceId}`;
  }
  if (sessions[partitionId] == null) {
    sessions[partitionId] = session.fromPartition(partitionId);
  }
  console.log(`Switching session to ${partitionId}`);
  
  // Initialize download manager for the current session
  if (mainWindows['main']) {
    downloadManager.initialize(mainWindows['main'], partitionId);
  }
}

function addWindow(key: string, window: {}) {
  if (key in windows) {
    return window;
  }
  windows[key] = window;
  return window;
}

function getWindow(key: string) {
  if (key in windows) {
    return windows[key];
  }
  return null;
}

function removeWindow(key: string) {
  delete windows[key];
}

/**
 * Add event listeners...
 */

app.on('browser-window-focus', (event, window) => {
  console.log('browser-window-focus');
  activeWindow = window;
});

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

let isMainWebContentsCreated = false;

app.on('web-contents-created', (e, contents) => {
  console.log('web-contents-created', contents.getType());
  const isWindow = contents.getType() === 'window';
  console.log('Content process id:', contents.getProcessId());
  if (contents.getType() === 'window' && !isMainWebContentsCreated) {
    isMainWebContentsCreated = true;
    console.log('Main web contents created');
    mainWindowContentsProcessId = contents.getProcessId();
    console.log(
      `Main window contents process id: ${mainWindowContentsProcessId}`
    );
  }
  if (contents.getProcessId() === mainWindowContentsProcessId) {
    SPShortContextMenu(contents);
  } else {
    SPContextMenu(contents, mainWindow);

    // Set up download handler for this webContents (webview) - only once per session
    // Use the session object itself as the key by converting to string
    const sessionKey = (contents.session as any).partition || 'default';
    
    if (!sessionsWithDownloadListeners.has(sessionKey)) {
      console.log(`Setting up will-download listener for session partition: ${sessionKey}`);
      sessionsWithDownloadListeners.add(sessionKey);
      
      contents.session.on('will-download', (event: any, item: any, webContents: any) => {
        console.log('will-download event triggered for webContents:', item.getFilename());
        console.log('Calling downloadManager.handleDownload');
        try {
          downloadManager.handleDownload(item, webContents);
          console.log('downloadManager.handleDownload completed');
        } catch (error) {
          console.error('Error in downloadManager.handleDownload:', error);
        }
      });
    } else {
      console.log(`Session ${sessionKey} already has download listener, skipping`);
    }

    contents.setWindowOpenHandler(({ url, disposition }) => {
      console.log('setWindowOpenHandler...', url);
      
      // Check if this is a sidebar webview using storagePath (cross-platform)
      const storagePath = contents.session.storagePath || '';
      // Normalize path separators for cross-platform compatibility
      const normalizedPath = storagePath.replace(/\\/g, '/');
      const isSidebarWebview = normalizedPath.includes('/sidebar-');
      
      console.log('setWindowOpenHandler - storagePath:', storagePath, 'isSidebarWebview:', isSidebarWebview);
      
      // For sidebar webviews, load URL in the same webview
      if (isSidebarWebview) {
        console.log('Sidebar webview detected, loading URL in same webview:', url);
        contents.loadURL(url);
        return {
          action: 'deny',
        };
      }
      
      // Check if URL is a downloadable file
      const downloadableExtensions = [
        '.dmg', '.exe', '.zip', '.rar', '.7z', '.tar', '.gz',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.iso', '.img', '.apk', '.deb', '.rpm', '.pkg',
        '.mp4', '.avi', '.mkv', '.mov', '.mp3', '.wav',
        '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
        '.torrent', '.msi', '.bin'
      ];
      
      const isDownloadableFile = downloadableExtensions.some(ext => 
        url.toLowerCase().endsWith(ext)
      );
      
      // If it's a downloadable file, manually trigger download
      if (isDownloadableFile) {
        console.log('Detected downloadable file, manually triggering download');
        // Use the webContents session to trigger the download
        contents.session.downloadURL(url);
        return {
          action: 'deny',
        };
      }
      
      // get active window
      // send the url back to the active window
      // let the active window handle the url
      if (
        disposition === 'foreground-tab' ||
        disposition === 'background-tab'
      ) {
        activeWindow?.webContents.send('open-url', url);
        return {
          action: 'deny',
        };
      }

      return {
        action: 'allow',
      };
    });
  }

  contents?.on('dom-ready', async () => {
    console.log('dom-ready-id...', contents.id);
    //contents.setZoomFactor(zoomFactor);
  });

  contents?.on('did-navigate', (event, url) => {
    console.log('did-navigate', event, url);
    console.log('did-navigate-id...', zoomFactor);
  });

  contents?.on('did-navigate-in-page', (event, url) => {
    console.log('did-navigate-in-page', event, url);
  });

  contents?.on('will-navigate', () => {
    console.log('will-navigate');
    // mainWindow?.webContents.setZoomFactor(zoomFactor);
  });

  contents?.on('will-attach-webview', () => {
    console.log('will-attach-webview');
    // mainWindow?.webContents.setZoomFactor(zoomFactor);
  });

});

app.on(
  'certificate-error',
  (event, webContents, url, error, certificate, callback) => {
    console.log('certificate-error');
    // Prevent having error
    event.preventDefault();
    // and continue
    callback(true);
  }
);

app.on('gpu-process-crashed', () => {
  console.log('gpu-process-crashed');
});

app.on('render-process-gone', () => {
  console.log('render-process-gone');
});

app.on('will-quit', () => {
  console.log('will-quit');
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

app.on('quit', () => {
  console.log('quit');
});

app.on('gpu-info-update', () => {
  console.log('gpu-info-update');
});

app.on('login', () => {
  console.log('login');
});

app.on('new-window-for-tab', () => {
  console.log('new-window-for-tab');
});

function init() {
  console.log('init');
  profileManager.init();
  console.log('profiles', store.get('profiles'));
  profile = profileManager.getActiveProfile();
  console.log('defaultProfile', profile);
  // partitionId = profile?.partition ? profile.partition : 'persist:main';
  console.log('partitionId', partitionId);
}

/**
async function checkChromePasswords() {
  // Execute security command to obtain Chrome's password from Keychain
  const securityCommand = "security find-generic-password -wa 'Chrome'";
  const myPass = execSync(securityCommand, { encoding: 'utf8' }).trim();
  console.log('myPass', myPass);
  // Key derivation parameters
  const iterations = 1003;
  const salt = Buffer.from('saltysalt');
  const length = 16;
  const myKey = crypto.pbkdf2Sync(myPass, salt, iterations, length, 'sha1');
  console.log('myKey', myKey);

  // Path to Chrome's Login Data file
  const loginDataPath = path.join(
    process.env.HOME,
    'Library',
    'Application Support',
    'Google',
    'Chrome',
    'Default',
    'Login Data'
  );

  // Connect to the SQLite database
  const db = new sqlite3.Database(
    loginDataPath,
    sqlite3.OPEN_READONLY,
    (err) => {
      if (err) {
        console.error(err.message);
        return;
      }
      console.log('Connected to the database');
    }
  );

  // Query to retrieve saved passwords
  const query = 'SELECT origin_url, username_value, password_value FROM logins';

  // Retrieve passwords from Chrome's Login Data file
  db.serialize(() => {
    db.each(query, (err, row) => {
      if (err) {
        console.error(err.message);
        return;
      }
      const passwordBytes = Buffer.from(row.password_value, 'base64');

      try {
        const decryptedPassword = decryptFunc(row.password_value, myKey);
        console.log(
          `Origin URL: ${row.origin_url}\nUsername: ${row.username_value}\nPassword: ${decryptedPassword}`
        );
      } catch (error) {
        console.error('Error decrypting password:', error.message);
        console.log(
          `Origin URL: ${row.origin_url}\nUsername: ${row.username_value}\nPassword: ${row.password_value} (encrypted)`
        );
      }
    });
  });

  // Close the database connection
  db.close();
}
*/

// Enable GPU rasterization and ignore GPU blacklist
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('enable-accelerated-video');
app.commandLine.appendSwitch('enable-gpu-compositing');

app
  .whenReady()
  .then(() => {
    // Set up asset serving for production
    if (app.isPackaged) {
      const { session } = require('electron');

      // Intercept file:// requests for assets and images
      session.defaultSession.webRequest.onBeforeRequest(
        { urls: ['file://**/assets/**', 'file://**/images/**'] },
        (details, callback) => {
          const url = details.url;

          // Handle /assets/store/icon/ requests (redirect to /images/store/icon/)
          if (url.includes('/assets/store/icon/')) {
            const filename = url.split('/assets/store/icon/')[1];
            const redirectUrl = `file://${path.join(__dirname, '../renderer/images/store/icon', filename)}`;
            callback({ redirectURL: redirectUrl });
            return;
          }

          // Handle /images/ requests
          if (url.includes('/images/')) {
            const imagePath = url.split('/images/')[1];
            const redirectUrl = `file://${path.join(__dirname, '../renderer/images', imagePath)}`;
            callback({ redirectURL: redirectUrl });
            return;
          }

          callback({});
        }
      );
    }

    // util.openSystemPreferences('security', 'Privacy_ScreenCapture');
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    ww = width;
    wh = height;
    init();
    createMasterKeyIfNotExists();
    console.log('app ready...', store.get('activeProfileId'));
    if (profile?.passCode != null && profile.passCode.length > 0) {
      profileManager.setActiveProfileId('none');
      profileWindow = getProfileWindow(mainWindow, false, channel);
    } else {
      mainWindow = createMainWindow(
        ww,
        wh,
        zoomFactor,
        profileManager,
        channel,
        true,
        version
      );
      
      // Initialize download manager with default session
      if (mainWindow) {
        mainWindows['main'] = mainWindow;
        downloadManager.initialize(mainWindow, partitionId);
      }
    }

    // Register global keyboard shortcut for Ctrl+Tab (app switcher)
    const registerAppSwitcherShortcut = () => {
      // Unregister first in case it's already registered
      globalShortcut.unregister('CommandOrControl+Tab');

      const ret = globalShortcut.register('CommandOrControl+Tab', () => {
        // Send message to renderer to toggle SaasPad
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('fromMain', {
            action: 'ctrl-tab-pressed',
          });
        }
      });

      if (!ret) {
        console.log('Ctrl+Tab registration failed');
      }
    };

    // Register the shortcut after window is ready
    if (mainWindow) {
      registerAppSwitcherShortcut();
    }

    // Also handle Shift+Ctrl+Tab for reverse cycling
    globalShortcut.register('CommandOrControl+Shift+Tab', () => {
      // Shift+Ctrl+Tab cycles backwards through apps
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('fromMain', {
          action: 'ctrl-shift-tab-pressed',
        });
      }
    });

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (
        (mainWindow === undefined || mainWindow.isDestroyed()) &&
        (profileWindow === undefined || profileWindow.isDestroyed())
      ) {
        if (profile?.passCode != null && profile.passCode.length > 0) {
          profileManager.setActiveProfileId('none');
          profileWindow = getProfileWindow(mainWindow, false, channel);
        } else {
          mainWindow = createMainWindow(
            ww,
            wh,
            zoomFactor,
            profileManager,
            channel,
            false,
            version
          );
        }
      } else {
        if (mainWindow?.maximizable) {
          mainWindow?.maximize();
        }
        mainWindow?.show();
        mainWindow?.focus();
      }
    });
    if (process.platform === 'darwin') {
      app.dock.setMenu(dockMenu);
    }

    // DISABLED: Clipboard sync functionality
    // To start listening
    // clipboardListener.startListening();

    // clipboardListener.on('change', () => {
    //   console.log('Clipboard changed', clipboard.readText());
    //   mainWindow?.webContents.send('fromMain', {
    //     action: 'on-clipboard-changed',
    //     data: clipboard.readText(),
    //   });
    // });

  })
  .catch(console.log);

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on(
  'toMain',
  (
    event,
    data: {
      action: string;
      id?: string;
      workspace?: string;
    }
  ) => {
    const { action } = data;

    switch (action) {
      case 'switched-workspace':
        Object.keys(windows).forEach((key) => {
          if (!key.endsWith('xapp')) {
            windows[key].window.close();
          }
        });
        workspaceId = data.workspace;
        console.log(`Switched to workspace...${workspaceId}`);
        switchSession();
        break;
      case 'signed-in':
        userId = data.id;
        console.log(`Signed in...${userId}`);
        switchSession();
        break;
      case 'signed-out':
        console.log(`Signed out...${data.id}`);
        if (data.id === userId) {
          userId = null;
        }
        switchSession();
        break;
      case 'close-window':
        const windowId = data.id;
        Object.keys(windows).forEach((key) => {
          if (key.startsWith(windowId)) {
            windows[key].window.close();
          }
        });
        break;
      case 'close-tab':
        // eslint-disable-next-line no-case-declarations
        const { closeTabWindowId, closeTabId, closeTabType } = data;
        // eslint-disable-next-line no-case-declarations
        const closeTabKey = `${closeTabWindowId}-${closeTabId}-${closeTabType}`;
        Object.keys(windows).forEach((key) => {
          if (key === closeTabKey) {
            windows[key].window.close();
          }
        });
        break;
      case 'save-window-state':
        const { id } = data;
        const { wtype } = data;
        const { state } = data;
        switch (wtype) {
          case 'external':
            console.log(`Saving state for...${id}`);
            break;
          case 'tabs':
            console.log(`Saving state for...${id}`);
            break;
          default:
            break;
        }
        break;
      case 'check-for-updates':
        console.log('Checking for updates...');
        autoUpdater.checkForUpdates();
        break;
      // DISABLED: Clipboard sync functionality
      // case 'clipboard':
      //   clipboard.writeText(data.text);
      //   break;
      case 'app-quit':
        console.log('Quitting app...');
        quitDialog = dialog.showMessageBox({
          title: 'Quit OnePad',
          message: 'Are you sure you want to quit OnePad?',
          buttons: ['Quit', 'Cancel'],
          defaultId: 0,
          cancelId: 1,
        });

        quitDialog.then((returnValue) => {
          if (returnValue.response === 0) {
            app.quit();
          }
        });
        break;
      case 'screenshot':
        // Validate that data.id is a number (webContents ID)
        if (typeof data.id !== 'number') {
          console.error('Invalid webContents ID for screenshot:', data.id, 'Expected number, got', typeof data.id);
          break;
        }
        const wc = webContents.fromId(data.id);
        if (!wc) {
          console.error('WebContents not found for ID:', data.id);
          break;
        }
        wc.capturePage()
          .then((image) => {
            const key: string = 'screenshot-' + data.tab;
            if (!image || image.isEmpty()) {
              console.log('Screenshot skipped (empty image):', key);
              return;
            }
            const dataUrl = image.toDataURL();
            // Never overwrite a good cached preview with a blank/hidden capture
            if (!isValidScreenshotDataUrl(dataUrl)) {
              console.log('Screenshot skipped (invalid data URL):', key);
              return;
            }
            screenShots[key] = dataUrl;
            saveScreenshotToDisk(key, dataUrl);
            console.log('Screenshot captured and stored:', {
              key: key,
              tabId: data.tab,
              webContentsId: data.id,
              totalScreenshots: Object.keys(screenShots).length
            });
          })
          .catch((err) => {
            console.log('Error capturing screenshot:', err);
          });
        break;
      case 'open-external-window':
        // eslint-disable-next-line no-case-declarations
        const { tabWindowId, tabId, url, partition, type } = data;
        // eslint-disable-next-line no-case-declarations
        const key = `${tabWindowId}-${tabId}-${type}`;
        console.log(`Opening external window...${tabWindowId} - ${tabId}`);
        if (getWindow(key) == null) {
          const ew = openExternalWindow(
            ww,
            wh,
            getAssetPath('icon.png'),
            url,
            tabId,
            partition,
            mainWindow
          );
          if (ew == null) {
            break;
          }
          ew.webContents.on('did-navigate', function () {
            console.log('did-navigate');
            mainWindow?.webContents.send('fromMain', {
              action: 'external-tab-navigated',
              data: {
                tabId,
                url: ew.webContents.getURL(),
              },
            });
          });
          ew.on('closed', () => {
            console.log(`Closed external window...${tabWindowId} - ${tabId}`);
            mainWindow?.webContents.send('fromMain', {
              action: 'external-tab-closed',
              data: {
                tabId,
              },
            });
            removeWindow(key);
          });
          addWindow(key, {
            window: ew,
          });
        } else {
          const win = getWindow(key).window;
          win.loadURL(url);
          win.show();
        }
        break;
      case 'switch-to-external-tab':
        // eslint-disable-next-line no-case-declarations
        //const { tabWindowId2, tabId2 } = data;
        // eslint-disable-next-line no-case-declarations
        const key2 = `${data.tabWindowId}-${data.tabId}-${data.type}`;
        //console.log(`Opening external window...${tabWindowId2} - ${tabId2}`);
        if (getWindow(key2) == null) {
          console.log(`External window not found... ${key2}}`);
        } else {
          const win = getWindow(key2).window;
          win.show();
        }
        break;
      case 'open-profile-window':
        console.log('Opening profile window...');
        profileWindow = getProfileWindow(mainWindow, true, channel);
        break;
      case 'switch-profile':
        console.log('Switching profile...');
        console.log(data.id);
        if (data.id) {
          profile = profileManager.getProfile(data.id);
          if (profile === null || profile === undefined) {
            // TODO: Show error
            throw new Error('"Profile" not exist...');
          }
          profileManager.setActiveProfileId(data.id);
          try {
            mainWindow?.hide();
          } catch (error) {
            console.error(error);
          }
          profileWindow?.hide();
          setTimeout(() => {
            mainWindow = createMainWindow(
              ww,
              wh,
              zoomFactor,
              profileManager,
              channel,
              false
            );
            if (profileWindow) {
              profileWindow.close();
              profileWindow = undefined;
            }
          }, 100);
        }
        break;
      case 'set-zoom-level':
        const { level } = data;
        console.log(`Zoom changed...${level}`);
        store.set('zoom', level);
        zoomFactor = parseFloat(level);
        mainWindow?.webContents.setZoomFactor(parseFloat(level));
        mainWindow?.close();
        mainWindow = undefined;
        mainWindow = createMainWindow(
          ww,
          wh,
          zoomFactor,
          profileManager,
          channel,
          false
        );
        break;
      case 'clear-cache':
        console.log('Clearing cache...');
        try {
          session.fromPartition(partitionId).clearStorageData();
          mainWindow?.webContents.send('fromMain', {
            action: 'clear-cache-success',
          });
        } catch (error) {
          console.error(error);
          mainWindow?.webContents.send('fromMain', {
            action: 'clear-cache-error',
          });
        }
        break;
      case 'download-action':
        // @ts-expect-error
        const { downloadAction, downloadId } = data;
        console.log(`Download action: ${downloadAction} for ${downloadId}`);
        switch (downloadAction) {
          case 'pause':
            downloadManager.pauseDownload(downloadId);
            break;
          case 'resume':
            downloadManager.resumeDownload(downloadId);
            break;
          case 'cancel':
            downloadManager.cancelDownload(downloadId);
            break;
          case 'open-file':
            downloadManager.openFile(downloadId);
            break;
          case 'show-in-folder':
            downloadManager.showInFolder(downloadId);
            break;
          case 'remove':
            downloadManager.removeDownload(downloadId);
            break;
        }
        break;
      case 'toggle-dev-tools':
        console.log('Toggle dev tools...');
        mainWindow?.webContents.toggleDevTools();
        break;
      case 'toggle-full-screen':
        console.log('Toggle full screen...');
        mainWindow?.setFullScreen(!mainWindow?.isFullScreen());
        break;
      case 'toggle-minimize':
        console.log('Toggle minimize...');
        mainWindow?.minimize();
        break;
      case 'send-feedback':
        console.log('Send feedback...');
        feedbackModalWindow(
          mainWindow,
          'https://onepad.io/index.php/send-feedback/'
        );
        break;
      case 'privacy-policy':
        console.log('Privacy policy...');
        feedbackModalWindow(
          mainWindow,
          'https://onepad.io/index.php/privacy-policy/'
        );
        break;
      case 'terms-of-use':
        console.log('Terms of service...');
        feedbackModalWindow(
          mainWindow,
          'https://onepad.io/index.php/terms-of-use/'
        );
        break;
      // DISABLED: Clipboard sync functionality
      // case 'update-clipboard':
      //   console.log('Update clipboard...');
      //   clipboard.writeText(data.value);
      //   break;
      case 'open-modal':
        console.log('Open modal...');
        console.log(data);
        let _fw = OPModalWindow(
          mainWindow,
          data.url,
          parseInt(data.width),
          parseInt(data.height),
          partitionId
        );
        break;
      case 'workspace-deleted':
        workspaceId = data.id;
        let _partitionId: string = `persist:${workspaceId}`;
        session
          .fromPartition(_partitionId)
          .clearStorageData()
          .then(() => {
            console.log(`${_partitionId} deleted...`);
        }).catch((error) => {
          console.error(error);
        });
        if (userId != null) {
          _partitionId = `persist:${userId}_${workspaceId}`;
          session
            .fromPartition(_partitionId)
            .clearStorageData()
            .then(() => {
              console.log(`${_partitionId} deleted...`);
          }).catch((error) => {
            console.error(error);
          });
        }
        console.log('Workspace deleted...');
        break;
      case 'save-to-disk':
        console.log('Save to disk...');
        console.log(JSON.stringify(data.val));
        // stringify json data
        saveToDisk(mainWindow as BrowserWindow, JSON.stringify(data.val));
        break;
      case 'import-from-disk':
        console.log('Import from disk...');
        const file = dialog.showOpenDialogSync({
          properties: ['openFile'],
          filters: [
            {
              name: 'JSON',
              extensions: ['json'],
            },
          ],
        });
        if (file) {
          const filePath = file[0];
          console.log('filePath', filePath);
          // read file with fs module
          const fs = require('fs');

          fs.readFile(filePath, 'utf8', (err: any, data: any) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log('data', JSON.parse(data));
            mainWindow?.webContents.send('fromMain', {
              action: 'import-profile',
              data: JSON.parse(data),
            });
          });
        }
        break;
      default:
        break;
    }
  }
);

// IPC listener
ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val);
});

ipcMain.on('electron-store-set', async (event, key, val) => {
  if (key === 'profile') {
    profileManager.addProfile(val);
  } else {
    store.set(key, val);
  }
  console.log('profiles', profileManager.getProfiles());
  console.log('profilesMap', profileManager.getProfileMap());
  console.log('store-get', store.get('profiles'));
});

ipcMain.handle('convert-to-png', async (event, data) => {
  const img = nativeImage.createFromDataURL(data);
  return img.toPNG();
});

ipcMain.handle('get-user-agent', async () => {
  try {
    const chromeVersion = process.versions.chrome;
    
    if (!chromeVersion) {
      log.warn('Chrome version not available, using fallback');
      return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
    }
    
    // Use standard Chrome user agent without Electron identifiers to avoid detection
    const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
    log.info('Generated user agent (masked for compatibility):', userAgent);
    log.info('Chrome version:', chromeVersion);
    return userAgent;
  } catch (error) {
    log.error('Error generating user agent:', error);
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
  }
});

ipcMain.handle('get-tab-memory-info', async (event, webContentsId) => {
  try {
    const wc = webContents.fromId(webContentsId);
    if (!wc) {
      return null;
    }
    
    const osProcessId = wc.getOSProcessId();
    const appMetrics = app.getAppMetrics();
    
    // Find the corresponding process in app metrics
    const processMetrics = appMetrics.find(metric => metric.pid === osProcessId);
    
    return processMetrics ? processMetrics.memory : null;
  } catch (error) {
    log.error('Failed to get memory info for webContents:', webContentsId, error);
    return null;
  }
});

ipcMain.handle('get-all-tabs-memory', async () => {
  try {
    const allWebContents = webContents.getAllWebContents();
    const appMetrics = app.getAppMetrics();
    
    const memoryInfos = allWebContents.map((wc) => {
      try {
        const osProcessId = wc.getOSProcessId();
        
        // Find the corresponding process in app metrics
        const processMetrics = appMetrics.find(metric => metric.pid === osProcessId);
        
        const info = {
          id: wc.id,
          url: wc.getURL(),
          title: wc.getTitle(),
          memory: processMetrics ? processMetrics.memory : null
        };
        
        if (processMetrics) {
          //console.log('WebContents', wc.id, 'memory:', processMetrics.memory);
        } else {
          //console.log('WebContents', wc.id, 'no metrics found for PID:', osProcessId);
        }
        
        return info;
      } catch (error) {
        console.log('Failed to get memory for webContents', wc.id, ':', error);
        return {
          id: wc.id,
          url: wc.getURL(),
          title: wc.getTitle(),
          memory: null
        };
      }
    });
    
    return memoryInfos;
  } catch (error) {
    log.error('Failed to get all tabs memory:', error);
    return [];
  }
});

ipcMain.on('screenshot-get', async (event, val) => {
  const key = normalizeScreenshotKey(val);
  let result = screenShots[key];
  if (!isValidScreenshotDataUrl(result)) {
    result = undefined;
    delete screenShots[key];
  }
  if (!result) {
    const fromDisk = loadScreenshotFromDisk(key);
    if (fromDisk) {
      screenShots[key] = fromDisk;
      result = fromDisk;
    }
  }
  console.log('screenshot-get request:', {
    requestedKey: val,
    found: result ? 'Yes' : 'No',
    totalScreenshots: Object.keys(screenShots).length,
    availableKeys: Object.keys(screenShots).slice(0, 5) // Show first 5 keys
  });
  event.returnValue = result || null;
});

ipcMain.on('screenshot-delete', async (_event, val) => {
  const key = normalizeScreenshotKey(val);
  delete screenShots[key];
  deleteScreenshotFromDisk(key);
});

ipcMain.on('screenshot-flush', async (event, tabIds) => {
  try {
    const ids = Array.isArray(tabIds) ? tabIds : [];
    const saved = flushScreenshotsToDisk(screenShots, ids);
    event.returnValue = { saved };
  } catch (error) {
    log.error('screenshot-flush failed', error);
    event.returnValue = { saved: 0, error: String(error) };
  }
});

ipcMain.on('capture-screenshot', async (event, val) => {
  log.debug('capture-screenshot', val);
  // Validate that val.id is a number (webContents ID)
  if (typeof val.id !== 'number') {
    console.error('Invalid webContents ID for capture-screenshot:', val.id, 'Expected number, got', typeof val.id);
    event.returnValue = null;
    return;
  }
  const wc = webContents.fromId(val.id);
  if (!wc) {
    console.error('WebContents not found for ID:', val.id);
    event.returnValue = null;
    return;
  }
  wc.capturePage()
    .then((image) => {
      const key: string = 'screenshot-' + val.tab;
      if (!image || image.isEmpty()) {
        event.returnValue = null;
        return;
      }
      const dataUrl = image.toDataURL();
      if (!isValidScreenshotDataUrl(dataUrl)) {
        event.returnValue = null;
        return;
      }
      screenShots[key] = dataUrl;
      saveScreenshotToDisk(key, dataUrl);
      event.returnValue = dataUrl;
    })
    .catch((err) => {
      console.log('Error capturing screenshot:', err);
      event.returnValue = null;
    });

});

ipcMain.on('encrypt', async (event, data) => {
  try {
    const masterKey = await getMasterKey();

    event.returnValue = encryptFunc(data, masterKey);
  } catch (error) {
    console.error('Encryption error:', error);
    event.returnValue = null;
  }
});

ipcMain.on('decrypt', async (event, data) => {
  try {
    const masterKey = await getMasterKey();
    const decrypted = decryptFunc(data, masterKey);

    event.returnValue = decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    event.returnValue = null;
  }
});

// Password Manager IPC Handlers
ipcMain.handle('password-create-person-key', async (event, personId, password) => {
  try {
    await passwordCrypto.createPersonKey(personId, password);
    return { success: true };
  } catch (error) {
    console.error('Error creating person key:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('password-authenticate-person', async (event, personId, password) => {
  try {
    const authenticated = await passwordCrypto.authenticatePerson(personId, password);
    return { success: authenticated };
  } catch (error) {
    console.error('Error authenticating person:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('password-is-session-active', async (event, personId) => {
  try {
    const isActive = passwordCrypto.isPersonSessionActive(personId);
    return { active: isActive };
  } catch (error) {
    console.error('Error checking session:', error);
    return { active: false };
  }
});

ipcMain.handle('password-lock-person', async (event, personId) => {
  try {
    passwordCrypto.lockPerson(personId);
    return { success: true };
  } catch (error) {
    console.error('Error locking person:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('password-encrypt', async (event, password, personId) => {
  try {
    const personKey = passwordCrypto.getPersonKey(personId);
    const encrypted = passwordCrypto.encryptPasswordForPerson(password, personKey, personId);
    return { success: true, encrypted };
  } catch (error) {
    console.error('Error encrypting password:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('password-decrypt', async (event, encryptedPassword, personId) => {
  try {
    const personKey = passwordCrypto.getPersonKey(personId);
    const decrypted = passwordCrypto.decryptPasswordForPerson(encryptedPassword, personKey, personId);
    return { success: true, decrypted };
  } catch (error) {
    console.error('Error decrypting password:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('password-check-storage-backend', async (event) => {
  try {
    const backend = passwordCrypto.checkSecretStorageBackend();
    return backend;
  } catch (error) {
    console.error('Error checking storage backend:', error);
    return { backend: 'unknown', isSecure: false, warning: 'Failed to check backend' };
  }
});

// Fetch website metadata
ipcMain.handle('fetch-website-metadata', async (event, url: string) => {
  try {
    console.log('Fetching metadata for:', url);
    
    const https = require('https');
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      const fetchWithRedirect = (urlToFetch: string, redirectCount = 0) => {
        // Prevent infinite redirects
        if (redirectCount > 5) {
          resolve({ description: '', siteName: '', success: false, error: 'Too many redirects' });
          return;
        }
        
        const urlObj = new URL(urlToFetch);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
          },
          timeout: 10000
        };
        
        const req = protocol.get(urlToFetch, options, (res: any) => {
          // Handle redirects
          if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
            const redirectUrl = res.headers.location;
            if (redirectUrl) {
              console.log(`Following redirect to: ${redirectUrl}`);
              // Handle relative URLs
              const newUrl = redirectUrl.startsWith('http') 
                ? redirectUrl 
                : new URL(redirectUrl, urlToFetch).toString();
              fetchWithRedirect(newUrl, redirectCount + 1);
              return;
            }
          }
          
          // Handle non-success status codes
          if (res.statusCode !== 200) {
            console.log(`Non-200 status code: ${res.statusCode}`);
            resolve({ description: '', siteName: '', success: false, error: `HTTP ${res.statusCode}` });
            return;
          }
          
          let data = '';
          
          res.on('data', (chunk: any) => {
            data += chunk;
            // Stop after receiving enough data (first 100KB should have meta tags)
            if (data.length > 100000) {
              req.destroy();
            }
          });
          
          res.on('end', () => {
            try {
              // Extract meta tags using regex (case insensitive)
              const descriptionMatch = 
                data.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                data.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                data.match(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i) ||
                data.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
                
              const siteNameMatch = 
                data.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i) ||
                data.match(/<meta\s+name=["']application-name["']\s+content=["']([^"']+)["']/i) ||
                data.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i) ||
                data.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:site_name["']/i);
                
              const titleMatch = data.match(/<title>([^<]+)<\/title>/i);
              
              const description = descriptionMatch ? descriptionMatch[1].trim() : '';
              const siteName = siteNameMatch ? siteNameMatch[1].trim() : (titleMatch ? titleMatch[1].trim() : '');
              
              console.log('Extracted metadata:', { description, siteName });
              
              resolve({
                description: description || '',
                siteName: siteName || '',
                success: true
              });
            } catch (parseError) {
              console.error('Error parsing HTML:', parseError);
              resolve({ description: '', siteName: '', success: false, error: 'Parse error' });
            }
          });
        });
        
        req.on('error', (error: any) => {
          console.error('Request error:', error);
          resolve({ description: '', siteName: '', success: false, error: error.message });
        });
        
        req.on('timeout', () => {
          req.destroy();
          resolve({ description: '', siteName: '', success: false, error: 'Timeout' });
        });
      };
      
      // Start the fetch
      fetchWithRedirect(url, 0);
    });
  } catch (error) {
    console.error('Error fetching website metadata:', error);
    return { description: '', siteName: '', success: false, error: 'Failed to fetch' };
  }
});

// DISABLED: Docker functionality
// ipcMain.handle('get-docker-containers', async (event, includeAll: boolean = false): Promise<DockerContainer[]> => {
//   try {
//     if (includeAll) {
//       return await dockerService.getAllContainers();
//     } else {
//       return await dockerService.getRunningContainers();
//     }
//   } catch (error) {
//     console.error('Error fetching Docker containers:', error);
//     throw error;
//   }
// });

// // get running containers
// ipcMain.handle('get-running-docker-containers', async (event): Promise<DockerContainer[]> => {
//   try {
//     return await dockerService.getRunningContainers();
//   } catch (error) {
//     console.error('Error fetching Docker containers:', error);
//     throw error;
//   }
// });

// ipcMain.handle('run-docker-container', async (event, config: { image: string, options: string[], runCommand: string }): Promise<string> => {
//   try {
//     const { image, options, runCommand } = config;
//     return await dockerService.runContainer(image, options, runCommand);
//   } catch (error) {
//     console.error('Error running Docker container:', error);
//     throw error;
//   }
// });

// ipcMain.handle('resume-docker-container', async (event, containerId: string): Promise<void> => {
//   try {
//     return await dockerService.resumeContainer(containerId);
//   } catch (error) {
//     console.error('Error resuming Docker container:', error);
//     throw error;
//   }
// });

// ipcMain.handle('check-docker-status', async (): Promise<boolean> => {
//   try {
//     return await dockerService.isDockerRunning();
//   } catch (error) {
//     console.error('Error checking Docker status:', error);
//     throw error;
//   }
// });

// ipcMain.handle('stop-docker-container', async (event, containerId: string): Promise<void> => {
//   try {
//     return await dockerService.stopContainer(containerId);
//   } catch (error) {
//     console.error('Error stopping Docker container:', error);
//     throw error;
//   }
// });

// ipcMain.handle('remove-docker-container', async (event, containerId: string): Promise<void> => {
//   try {
//     return await dockerService.removeContainer(containerId);
//   } catch (error) {
//     console.error('Error removing Docker container:', error);
//     throw error;
//   }
// });



