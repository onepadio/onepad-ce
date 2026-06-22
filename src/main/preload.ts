// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  handleCloseTab: (callback: any) => ipcRenderer.on('close-tab', callback),
  handleWindowOpened: (callback: any) =>
    ipcRenderer.on('window-opened', callback),
  handleWindowClosed: (callback: any) =>
    ipcRenderer.on('window-closed', callback),
  handleWindowNavigated: (callback: any) =>
    ipcRenderer.on('window-navigated', callback),
  handleOpenUrl: (callback: any) => ipcRenderer.on('open-url', callback),
  handleAppVersion: (callback: any) =>
    ipcRenderer.on('set-app-version', callback),
  handleSetHostName: (callback: any) =>
    ipcRenderer.on('set-hostname', callback),
  handlePlatform: (callback: any) => ipcRenderer.on('set-platform', callback),
  handleScreenshot: (callback: any) => ipcRenderer.on('screenshot', callback),
  setUserData: (channel: any, data: any) => {
    // whitelist channels
    const validChannels = ['setUserData'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  getUserData: (channel: any, data: any) => {
    // whitelist channels
    const validChannels = ['getUserData'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  send: (channel: any, data: any) => {
    // whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  fromMain: (callback: any) => ipcRenderer.on('fromMain', callback),
  receive: (channel: string, callback: any) => {
    const validChannels = ['fromMain', 'download-event'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },
  removeListener: (channel: string, callback: any) => {
    const validChannels = ['fromMain', 'download-event'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
  store: {
    get(key: string) {
      return ipcRenderer.sendSync('electron-store-get', key);
    },
    set(property: string, val: any) {
      ipcRenderer.send('electron-store-set', property, val);
    },
    // Other method you want to add like has(), reset(), etc.
    has(key: string) {
      return ipcRenderer.sendSync('electron-store-has', key);
    },
    reset(key: string) {
      return ipcRenderer.sendSync('electron-store-reset', key);
    },
  },
  screenshot: {
    get(key: string) {
      return ipcRenderer.sendSync('screenshot-get', key);
    },
  },
  capturescreenshot: {
    get(key: string) {
      return ipcRenderer.sendSync('capture-screenshot', key);
    },
  },
  encrypt: {
    get(key: string) {
      return ipcRenderer.sendSync('encrypt', key);
    },
  },
  decrypt: {
    get(key: string) {
      return ipcRenderer.sendSync('decrypt', key);
    },
  },
  invoke: (channel: string, ...args: any[]) => {
    const validChannels = [
      'get-docker-containers',
      'run-docker-container',
      'stop-docker-container',
      'remove-docker-container',
      'check-docker-status',
      'resume-docker-container',
      'get-tab-memory-info',
      'get-all-tabs-memory',
      'fetch-website-metadata'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid channel: ${channel}`);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronHandler);

export type ElectronHandler = typeof electronHandler;
