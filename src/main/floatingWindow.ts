import { BrowserWindow } from 'electron';

export default function OPFloatinglWindow(
  mainWindow: BrowserWindow | undefined,
  url: string = '',
  width: number = 900,
  height: number = 700,
  partitionId: string = 'persist:main'
): BrowserWindow {
  let win = new BrowserWindow({
    parent: mainWindow,
    closable: true,
    resizable: true,
    autoHideMenuBar: true,
    show: false,
    width,
    height,
    frame: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      spellcheck: true,
      partition: partitionId,
    },
  });
  win.loadURL(url);
  win.once('ready-to-show', () => {
    win.show();
  });
  win.on('closed', () => {
    win = null;
  });
  win.on('blur', () => {
    //win.close();
    win.setAlwaysOnTop(false);
  });
  win.on('focus', () => {
    win.setAlwaysOnTop(true);
  });
  return win;
}
