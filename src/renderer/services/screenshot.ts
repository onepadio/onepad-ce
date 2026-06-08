import isElectron from 'is-electron';
import log from 'loglevel';

/**
 * Centralized screenshot service for capturing tab screenshots
 * All screenshot operations should go through this service
 */
export const ScreenshotService = {
  /**
   * Capture a screenshot for a specific tab
   * @param webContentsId - The Electron webContents ID (must be a number)
   * @param tabId - The tab ID for storing the screenshot
   * @param source - The source component/service requesting the screenshot (for debugging)
   */
  capture: (
    webContentsId: number | string | undefined,
    tabId: string,
    source: string
  ): void => {
    if (!isElectron()) {
      log.debug('ScreenshotService: Not in Electron environment, skipping screenshot');
      return;
    }

    // Validate webContentsId is a number
    if (typeof webContentsId !== 'number') {
      log.warn(
        `ScreenshotService: Invalid webContentsId for tab ${tabId} from ${source}:`,
        webContentsId,
        'Expected number, got',
        typeof webContentsId
      );
      return;
    }

    // @ts-expect-error - electronAPI is available in Electron context
    window.electronAPI.send('toMain', {
      action: 'screenshot',
      id: webContentsId,
      tab: tabId,
      from: source,
    });
  },
};

export default ScreenshotService;
