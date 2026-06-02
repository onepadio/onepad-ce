import { BrowserWindow } from 'electron';

export default function OPModalWindow(
  mainWindow: BrowserWindow | undefined,
  url: string = '',
  width: number = 900,
  height: number = 700,
  partitionId: string = 'persist:main'
): BrowserWindow {
  let win = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    closable: true,
    autoHideMenuBar: true,
    show: false,
    width,
    height,
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
    win.close();
  });
  return win;
}


export function OPFloatingWindow(
  mainWindow: BrowserWindow | undefined,
  url: string = '',
  width: number = 900,
  height: number = 700,
  partitionId: string = 'persist:main'
): BrowserWindow {
  let win = new BrowserWindow({
    parent: mainWindow,
    closable: true,
    autoHideMenuBar: true,
    show: false,
    width,
    height,
    alwaysOnTop: true,
    frame: true,
    resizable: true,
    minimizable: true,
    fullscreenable: false,
    titleBarStyle: 'default',
    alwasVisibleOnAllWorkspaces: true,
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
  win.on('minimize', () => {
    win.hide();
  });
  win.on('closed', () => {
    win = null;
  });
  win.on('blur', () => {
    //win.close();
  });

  // Restrict child window movement within the parent window
  win.on('move', () => {
    const parentBounds = mainWindow.getBounds();
    const childBounds = win.getBounds();

    // Calculate the new position to keep the child inside the parent
    let newX = childBounds.x;
    let newY = childBounds.y;

    // Horizontal bounds
    if (newX < parentBounds.x) {
        newX = parentBounds.x;
    } else if (newX + childBounds.width > parentBounds.x + parentBounds.width) {
        newX = parentBounds.x + parentBounds.width - childBounds.width;
    }

    // Vertical bounds
    if (newY < parentBounds.y) {
        newY = parentBounds.y;
    } else if (newY + childBounds.height > parentBounds.y + parentBounds.height) {
        newY = parentBounds.y + parentBounds.height - childBounds.height;
    }

    // Update the child window's position if it's outside the parent's bounds
    if (newX !== childBounds.x || newY !== childBounds.y) {
      win.setPosition(newX, newY);
    }
  });
  return win;
}
