import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import log from 'electron-log';

const SCREENSHOT_PREFIX = 'screenshot-';

function getScreenshotDir(): string {
  const dir = path.join(app.getPath('userData'), 'tab-screenshots');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function toFileSafeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getScreenshotPath(key: string): string {
  return path.join(getScreenshotDir(), `${toFileSafeKey(key)}.png`);
}

export function normalizeScreenshotKey(tabIdOrKey: string): string {
  if (!tabIdOrKey) return '';
  return tabIdOrKey.startsWith(SCREENSHOT_PREFIX)
    ? tabIdOrKey
    : `${SCREENSHOT_PREFIX}${tabIdOrKey}`;
}

/** Reject empty / truncated captures so we never overwrite a good preview. */
export function isValidScreenshotDataUrl(dataUrl: unknown): dataUrl is string {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return false;
  }
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return false;
  // Empty NativeImage.toDataURL() yields a tiny / empty payload — treat as invalid
  return dataUrl.length - comma - 1 > 64;
}

/**
 * Persist a data-URL screenshot under userData/tab-screenshots.
 * Keeps in-memory map as the fast path; disk survives app restarts.
 */
export function saveScreenshotToDisk(key: string, dataUrl: string): void {
  try {
    const normalized = normalizeScreenshotKey(key);
    if (!normalized || !isValidScreenshotDataUrl(dataUrl)) return;

    const base64 = dataUrl.includes(',')
      ? dataUrl.split(',')[1]
      : dataUrl;
    if (!base64) return;

    const filePath = getScreenshotPath(normalized);
    fs.writeFile(filePath, Buffer.from(base64, 'base64'), (err) => {
      if (err) {
        log.error('saveScreenshotToDisk failed', normalized, err);
      }
    });
  } catch (error) {
    log.error('saveScreenshotToDisk error', key, error);
  }
}

export function loadScreenshotFromDisk(key: string): string | null {
  try {
    const normalized = normalizeScreenshotKey(key);
    if (!normalized) return null;

    const filePath = getScreenshotPath(normalized);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const buffer = fs.readFileSync(filePath);
    if (!buffer || buffer.length < 32) {
      return null;
    }
    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
    return isValidScreenshotDataUrl(dataUrl) ? dataUrl : null;
  } catch (error) {
    log.error('loadScreenshotFromDisk error', key, error);
    return null;
  }
}

export function deleteScreenshotFromDisk(key: string): void {
  try {
    const normalized = normalizeScreenshotKey(key);
    if (!normalized) return;

    const filePath = getScreenshotPath(normalized);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    log.error('deleteScreenshotFromDisk error', key, error);
  }
}

/**
 * Flush in-memory screenshots for the given tab ids to disk.
 */
export function flushScreenshotsToDisk(
  screenShots: { [key: string]: string },
  tabIds: string[]
): number {
  let saved = 0;
  tabIds.forEach((tabId) => {
    const key = normalizeScreenshotKey(tabId);
    const dataUrl = screenShots[key];
    if (dataUrl) {
      saveScreenshotToDisk(key, dataUrl);
      saved += 1;
    }
  });
  return saved;
}
