import { BrowserWindow } from 'electron';
import contextMenu from 'electron-context-menu';

export function SPContextMenu(
  contents: {
    canGoBack: any;
    goBack: () => void;
    canGoForward: any;
    goForward: () => void;
    reload: () => void;
    executeJavaScript: (arg0: string) => void;
  },
  mainWindow: BrowserWindow
) {
  return contextMenu({
    window: contents,
    labels: {
      cut: 'Cut',
      copy: 'Copy',
      paste: 'Paste',
      save: 'Save Image',
      saveImageAs: 'Save Image As…',
      copyLink: 'Copy Link',
      saveLinkAs: 'Save Link As…',
    },
    prepend: (defaultActions, params, browserWindow) => [
      {
        label: 'New Tab',
        click: () => {
          // open in foreground tab
          contents.executeJavaScript(
            `window.open('about:blank', '_blank' );`
          );
        },
        visible: params.linkURL === '',
      },
      {
        label: 'Open in New Tab',
        click: () => {
          // open in foreground tab
          contents.executeJavaScript(
            `window.open('${params.linkURL}', '_blank' );`
          );
        },
        visible: params.linkURL !== '',
      },
      {
        label: 'Open in New Window',
        click: () => {
          // open in new window
          mainWindow.webContents.send('open-external-window', params.linkURL);
        },
        visible: params.linkURL !== '',
      },
      {
        label: 'Open in New Incognito Window',
        click: () => {
          // open in new incognito window
          mainWindow.webContents.send('open-external-window', params.linkURL, 'private');
        },
        visible: params.linkURL !== '',
      },
      {
        label: 'Close Tab',
        click: () => {
          mainWindow.webContents.send('close-tab');
        },
      },
      // divider
      { type: 'separator' },
      {
        label: 'Home',
        click: async () => {
          mainWindow.show();
        },
      },
      {
        label: 'Back',
        click: async () => {
          if (contents.canGoBack) {
            contents.goBack();
          }
        },
      },
      {
        label: 'Forward',
        click: async () => {
          if (contents.canGoForward) {
            contents.goForward();
          }
        },
      },
      {
        label: 'Reload',
        click: async () => {
          contents.reload();
        },
      },
      {
        label: 'Search for “{selection}”',
        // Only show it when right-clicking text
        visible: params.selectionText.trim().length > 0,
        click: () => {
          // open in new tab
          contents.executeJavaScript(
            `window.open('https://google.com/search?q=${encodeURIComponent(params.selectionText)}', '_blank');`
          );
        },
    }
    ],
    append: () => [],
    showInspectElement: true,
    showCopyImageAddress: true,
    showSaveImageAs: true,
    showSaveLinkAs: true,
    showSearchWithGoogle: false,
    showSelectAll: false,
    cut: true,
    copy: true,
    paste: true,
    save: true,
    saveImageAs: true,
    copyLink: true,
    saveLinkAs: true,
    inspectElement: true,
  });
}

export function SPShortContextMenu(contents: any) {
  return contextMenu({
    window: contents,
    labels: {
      cut: 'Cut',
      copy: 'Copy',
      paste: 'Paste',
      save: 'Save Image',
      saveImageAs: 'Save Image As…',
      copyLink: 'Copy Link',
      saveLinkAs: 'Save Link As…',
    },
    prepend: () => [],
    append: () => [

    ],
    showInspectElement: false,
    showCopyImageAddress: true,
    showSaveImageAs: true,
    showSaveLinkAs: true,
    showSearchWithGoogle: false,
    showSelectAll: false,
    cut: true,
    copy: true,
    paste: true,
    save: true,
    saveImageAs: true,
    copyLink: true,
    saveLinkAs: true,
    inspectElement: true,
  });
}
