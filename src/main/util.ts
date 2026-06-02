/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { app } from 'electron';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.VITE_DEV_SERVER_PORT || 5175;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function getAssetPath(...paths: string[]): string {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');
  return path.join(RESOURCES_PATH, ...paths);
}

export function getPreloadPath(): string {
  if (app.isPackaged) {
    return path.join(__dirname, '../preload/preload.js');
  }
  // In development, main.js is in release/app/dist/main/
  return path.join(__dirname, '../preload/preload.js');
}
