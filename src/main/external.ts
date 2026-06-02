import { app, BrowserWindow, shell } from 'electron';

export default function openExternalWindow(
  ww: number,
  wh: number,
  iconPath: string,
  url: string,
  tabId: string,
  partition: string,
  mainWindow: BrowserWindow | undefined
): BrowserWindow | null {
  let externalWindow: BrowserWindow | null = new BrowserWindow({
    show: true,
    width: ww,
    height: wh,
    icon: iconPath,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
      plugins: true,
      webviewTag: true,
      spellcheck: true,
      partition,
      nodeIntegration: true,
    },
  });

  // mainWindow.loadURL(resolveHtmlPath('index.html'));
  externalWindow.loadURL(url);

  externalWindow.on('ready-to-show', () => {
    if (!externalWindow) {
      throw new Error('"externalWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      externalWindow.minimize();
    } else {
      externalWindow.show();
    }
  });

  // Open urls in the user's browser
  externalWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  externalWindow.webContents.on('did-finish-load', function () {
    // Mainwindow reloaded cache cleanup required
    console.log('did-finish-load');
    externalWindow?.webContents.send('set-app-version', app.getVersion());
    externalWindow?.webContents.send('fromMain', {
      action: 'app-ready',
    });
  });

  return externalWindow;
}
