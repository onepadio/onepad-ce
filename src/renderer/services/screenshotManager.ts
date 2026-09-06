import log from 'loglevel';
import ScreenshotService from './screenshot';

/**
 * Background Screenshot Manager
 * Captures the active tab at regular intervals so switchers/previews
 * always have a recent cached image — including after the tab sleeps.
 */
class ScreenshotManager {
  private intervalId: NodeJS.Timeout | null = null;
  private captureInterval = 60000; // 60 seconds
  private isRunning = false;

  /**
   * Start the background screenshot capture service
   * @param store - Redux store to access tab state
   */
  start(store: any) {
    if (this.isRunning) {
      log.warn('ScreenshotManager: Already running');
      return;
    }

    log.info('ScreenshotManager: Starting background screenshot service');
    this.isRunning = true;

    this.captureActiveTabScreenshot(store);

    this.intervalId = setInterval(() => {
      this.captureActiveTabScreenshot(store);
    }, this.captureInterval);
  }

  /**
   * Stop the background screenshot capture service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      log.info('ScreenshotManager: Stopped background screenshot service');
    }
  }

  /**
   * Capture screenshot for the currently active tab only.
   * Hidden / sleeping tabs must not be captured — empty captures would
   * overwrite the last good preview used by App/Browser tab switchers.
   */
  private captureActiveTabScreenshot(store: any) {
    try {
      const state = store.getState();
      const openTabs = state.session?.openTabs || {};
      const activeTabId = state.session?.activeTabId;
      const tab = activeTabId ? openTabs[activeTabId] : null;

      if (!tab?.id) {
        log.debug('ScreenshotManager: No active tab to capture');
        return;
      }

      if (tab.location === 'external' || tab.type === 'xapp') {
        return;
      }

      if (tab.sleeping) {
        log.debug(`ScreenshotManager: Active tab ${tab.id} is sleeping, skip`);
        return;
      }

      if (tab.mediaPlaying) {
        return;
      }

      if (typeof tab.webContentsId !== 'number') {
        log.warn(`ScreenshotManager: Tab ${tab.id} has invalid webContentsId:`, tab.webContentsId);
        return;
      }

      ScreenshotService.capture(tab.webContentsId, tab.id, 'ScreenshotManager');
      log.debug(`ScreenshotManager: Captured active tab ${tab.id}`);
    } catch (error) {
      log.error('ScreenshotManager: Error capturing screenshot:', error);
    }
  }

  /**
   * Capture a specific awake tab (e.g. right before sleep).
   */
  captureTab(tab: any, source = 'ScreenshotManager') {
    if (!tab?.id || tab.sleeping) return;
    if (tab.location === 'external' || tab.type === 'xapp') return;
    if (typeof tab.webContentsId !== 'number') return;
    ScreenshotService.capture(tab.webContentsId, tab.id, source);
  }

  /**
   * Manually trigger a screenshot capture for the active tab
   */
  captureNow(store: any) {
    log.debug('ScreenshotManager: Manual capture triggered');
    this.captureActiveTabScreenshot(store);
  }

  /**
   * Update the capture interval
   * @param intervalMs - New interval in milliseconds
   */
  setInterval(intervalMs: number) {
    if (intervalMs < 10000) {
      log.warn('ScreenshotManager: Interval too short, minimum 10 seconds');
      return;
    }
    this.captureInterval = intervalMs;
    log.info(`ScreenshotManager: Capture interval updated to ${intervalMs}ms`);
  }

  /**
   * Check if the manager is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const screenshotManager = new ScreenshotManager();
export default screenshotManager;
