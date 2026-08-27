import { app, BrowserWindow, shell, dialog } from 'electron';
import * as path from 'path';
import installer from 'electron-devtools-installer';

import MenuBuilder from './menu';
import { getAssetPath, getPreloadPath, resolveHtmlPath } from './util';
import AppUpdater from './updater';
import ProfileManager from './controller/ProfileManager';

export default function createMainWindow(
  ww: number,
  wh: number,
  zoomFactor: number,
  profileManager: ProfileManager,
  channel: string,
  initAutoUpdate: boolean,
  version: string
): BrowserWindow {
  let win: BrowserWindow | undefined;
  const startInKiosk = process.argv.includes('--kiosk') || app.commandLine.hasSwitch('kiosk');
  let isKiosk = startInKiosk;
  const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
  let homePage = 'https://app.onepad.io';

  if (channel === 'dev') {
    homePage = 'https://dev.shortpath.link';
  }

  if (channel === 'beta') {
    homePage = 'https://beta.onepad.io';
  }

  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    homePage = `http://localhost:${port}`;
  }
  if (isDebug) {
    //await installExtensions();
  }
  console.log(
    'createWindow:partition',
    profileManager.getActiveProfile()?.partition
  );
  win = new BrowserWindow({
    show: false,
    width: ww,
    height: wh,
    icon: getAssetPath('icon.png'),
    frame: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    kiosk: startInKiosk,
    webPreferences: {
      sandbox: false,
      preload: getPreloadPath(),
      plugins: true,
      webviewTag: true,
      spellcheck: true,
      partition: profileManager.getActiveProfile()?.partition || 'persist:main',
      nodeIntegration: true,
      experimentalFeatures: true,
      zoomFactor,
    },
  });
  console.log('win', win);

  while (win === undefined) {
    // await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('waiting for win...');
  }

  win.loadURL(resolveHtmlPath('index.html'));
  // win.loadURL(homePage);
  // load content from url and save to cache

  // Open DevTools automatically for dev builds
  if (version.endsWith('-dev')) {
    win.webContents.openDevTools();
  }

  win.on('ready-to-show', async () => {
    if (!win) {
      // throw new Error('"win" is not defined');
      while (win === undefined) {
        // await new Promise((resolve) => setTimeout(resolve, 100));
        console.log('waiting for win...');
      }
    }
    if (process.env.START_MINIMIZED) {
      win?.minimize();
    } else {
      win?.webContents.setZoomFactor(1);
      win?.show();
    }
    console.log('ready-to-show');
    // await sleep(1000);
  });

  win?.on('closed', () => {
    // win = undefined;
  });

  win?.on('enter-full-screen', () => {
    win?.webContents.send('fromMain', {
      action: 'toggle-full-screen',
      data: {
        isFullScreen: true,
      },
    });
  });

  win?.on('leave-full-screen', () => {
    win?.webContents.send('fromMain', {
      action: 'toggle-full-screen',
      data: {
        isFullScreen: false,
      },
    });
  });

  const menuBuilder = new MenuBuilder(win);
  menuBuilder.buildMenu();
  if (startInKiosk) {
    win.setMenu(null);
  }

  // Open urls in the user's browser
  win.webContents.setWindowOpenHandler((edata) => {
    // Check if URL is a downloadable file
    const downloadableExtensions = [
      '.dmg', '.exe', '.zip', '.rar', '.7z', '.tar', '.gz',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.iso', '.img', '.apk', '.deb', '.rpm', '.pkg'
    ];
    
    const isDownloadableFile = downloadableExtensions.some(ext => 
      edata.url.toLowerCase().endsWith(ext)
    );
    
    // If it's a downloadable file, manually trigger download
    if (isDownloadableFile) {
      console.log('Detected downloadable file in main window, manually triggering download');
      win.webContents.session.downloadURL(edata.url);
      return { action: 'deny' };
    }
    
    // Otherwise open in external browser
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  win.webContents.on('did-finish-load', function () {
    // win reloaded cache cleanup required
    console.log('did-finish-load');
    win?.webContents.send('set-app-version', version);
    win?.webContents.send('set-platform', process.platform);
    win?.webContents.send('fromMain', {
      action: 'app-ready',
    });
  });

  win.webContents.on('zoom-changed', (e, zoomDirection) => {
    console.log('zoom-changed', zoomDirection);
  });

  win.webContents.on('before-input-event', async (event, input) => {
    // Enable kiosk mode with Shift+Ctrl+K
    if (input.key === 'K' && input.control && !input.meta && input.shift) {
      if (!isKiosk) {
        const result = await dialog.showMessageBox(win!, {
          type: 'question',
          buttons: ['OK', 'Cancel'],
          defaultId: 0,
          title: 'Enable Kiosk Mode',
          message: 'Would you like to enable Kiosk mode?'
        });

        if (result.response === 0) { // OK clicked
          isKiosk = true;
          win?.setKiosk(true);
        }
      }
    }

    // Disable kiosk mode with Shift+Escape
    if (input.key === 'Escape' && !input.control && !input.meta && input.shift && isKiosk) {
      isKiosk = false;
      win?.setKiosk(false);
    }

    // open developer tools with Shift+Ctrl+D
    if (input.key === '0' && input.control && !input.meta && input.shift) {
      win?.webContents.openDevTools();
    }

  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  if(initAutoUpdate){
    // eslint-disable-next-line no-new
    new AppUpdater(win, channel);
  }

  return win;
}
