import { app, BrowserWindow } from 'electron';
import path from 'path';
import { getAssetPath, getPreloadPath } from './util';

export default function getProfileWindow(
  mainWindow: BrowserWindow | undefined,
  isModal: boolean = true,
  channel: string = ''
): BrowserWindow {
  let win: BrowserWindow | undefined;
  let profilePage = 'https://dev.shortpath.link/profiles';
  if (process.env.NODE_ENV === 'development') {
    profilePage = 'http://localhost:3000/profiles';
  }

  const optionsModal = {
    modal: isModal,
    closable: true,
    parent: mainWindow,
    width: 800,
    height: 600,
    icon: getAssetPath('icon.png'),
    frame: !isModal,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
      preload: getPreloadPath(),
      plugins: true,
      webviewTag: true,
      spellcheck: true,
      partition: 'persist:device',
      nodeIntegration: true,
    },
  };

  const optionsStandalone = {
    width: 800,
    height: 600,
    icon: getAssetPath('icon.png'),
    frame: !isModal,
    autoHideMenuBar: true,
    resizable: false,
    webPreferences: {
      sandbox: false,
      preload: getPreloadPath(),
      plugins: true,
      webviewTag: true,
      spellcheck: true,
      partition: 'persist:device',
      nodeIntegration: true,
    },
  };

  if (isModal && process.platform === 'darwin') {
    win = new BrowserWindow(optionsModal);
  } else {
    win = new BrowserWindow(optionsStandalone);
  }

  win.loadURL(profilePage);

  win.on('ready-to-show', () => {
    if (!win) {
      throw new Error('"profileWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      win.minimize();
    } else {
      win.show();
      win.focus();
    }
  });

  win.on('page-title-updated', (e) => {
    e.preventDefault();
  });

  win.on('blur', () => {
    if (win && isModal) {
      win.close();
    }
  });

  win.on('closed', () => {
    win = undefined;
  });

  win.show();
  win.focus();
  return win;
}
