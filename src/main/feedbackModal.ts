import { BrowserWindow } from 'electron';

export default function feedbackModalWindow(
  mainWindow: BrowserWindow | undefined,
  url: string = ''
): BrowserWindow {
  const modalPath = 'https://onepad.io/index.php/send-feedback/';
  let win = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    closable: true,
    autoHideMenuBar: true,
    show: false,
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      spellcheck: true,
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
    win.close();
  });
  return win;
}
