import { BrowserWindow, WebContents } from 'electron';
import contextMenu from 'electron-context-menu';

type DeviceMode = 'phone' | 'tablet' | 'desktop';

const PHONE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const TABLET_USER_AGENT =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const DEVICE_PROFILES = {
  phone: {
    userAgent: PHONE_USER_AGENT,
    // Landscape by default
    emulation: {
      screenPosition: 'mobile' as const,
      screenSize: { width: 844, height: 390 },
      viewSize: { width: 844, height: 390 },
      viewPosition: { x: 0, y: 0 },
      deviceScaleFactor: 3,
      scale: 1,
    },
  },
  tablet: {
    userAgent: TABLET_USER_AGENT,
    // Landscape by default
    emulation: {
      screenPosition: 'mobile' as const,
      screenSize: { width: 1180, height: 820 },
      viewSize: { width: 1180, height: 820 },
      viewPosition: { x: 0, y: 0 },
      deviceScaleFactor: 2,
      scale: 1,
    },
  },
};

/** Per-webContents desktop UA snapshot so we can restore after mobile mode */
const desktopUserAgents = new WeakMap<object, string>();
const deviceModes = new WeakMap<object, DeviceMode>();

function getDesktopUserAgent(contents: WebContents): string {
  const stored = desktopUserAgents.get(contents);
  if (stored) return stored;

  const chromeVersion = process.versions.chrome;
  if (chromeVersion) {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
  }
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
}

function notifyDeviceModeChanged(
  mainWindow: BrowserWindow,
  contents: WebContents,
  mode: DeviceMode
) {
  const profile = mode === 'desktop' ? null : DEVICE_PROFILES[mode];
  mainWindow.webContents.send('device-mode-changed', {
    webContentsId: contents.id,
    mode,
    width: profile?.emulation.viewSize.width ?? null,
    height: profile?.emulation.viewSize.height ?? null,
  });
}

function applyDeviceMode(
  contents: WebContents,
  mode: DeviceMode,
  mainWindow: BrowserWindow
) {
  if (mode === 'desktop') {
    contents.disableDeviceEmulation();
    contents.setUserAgent(getDesktopUserAgent(contents));
    deviceModes.set(contents, 'desktop');
    notifyDeviceModeChanged(mainWindow, contents, mode);
    contents.reload();
    return;
  }

  if (!desktopUserAgents.has(contents)) {
    try {
      const current = contents.getUserAgent();
      if (current && !current.includes('iPhone') && !current.includes('iPad')) {
        desktopUserAgents.set(contents, current);
      }
    } catch {
      // fall back to generated desktop UA
    }
  }

  const profile = DEVICE_PROFILES[mode];
  contents.setUserAgent(profile.userAgent);
  contents.enableDeviceEmulation(profile.emulation);
  deviceModes.set(contents, mode);
  notifyDeviceModeChanged(mainWindow, contents, mode);
  contents.reload();
}

export function SPContextMenu(
  contents: WebContents,
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
          if (contents.canGoBack()) {
            contents.goBack();
          }
        },
      },
      {
        label: 'Forward',
        click: async () => {
          if (contents.canGoForward()) {
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
        label: 'View As...',
        submenu: [
          {
            label: 'Phone',
            type: 'radio',
            checked: deviceModes.get(contents) === 'phone',
            click: () => applyDeviceMode(contents, 'phone', mainWindow),
          },
          {
            label: 'Tablet',
            type: 'radio',
            checked: deviceModes.get(contents) === 'tablet',
            click: () => applyDeviceMode(contents, 'tablet', mainWindow),
          },
          { type: 'separator' },
          {
            label: 'Desktop Site',
            type: 'radio',
            checked: !deviceModes.get(contents) || deviceModes.get(contents) === 'desktop',
            click: () => applyDeviceMode(contents, 'desktop', mainWindow),
          },
        ],
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
