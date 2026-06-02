import log from 'loglevel';
import ScreenshotService from './screenshot';

/**
 * Background Screenshot Manager
 * Automatically captures screenshots of all active tabs at regular intervals
 * Components should retrieve cached screenshots, not trigger captures
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

    // Take initial screenshots
    this.captureAllActiveTabScreenshots(store);

    // Set up periodic captures
    this.intervalId = setInterval(() => {
      this.captureAllActiveTabScreenshots(store);
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
   * Capture screenshots for all active tabs
   */
  private captureAllActiveTabScreenshots(store: any) {
    try {
      const state = store.getState();
      const openTabs = state.session?.openTabs || {};
      
      if (!openTabs || Object.keys(openTabs).length === 0) {
        log.debug('ScreenshotManager: No open tabs to capture');
        return;
      }

      let capturedCount = 0;
      let skippedCount = 0;

      Object.values(openTabs).forEach((tab: any) => {
        // Skip tabs without IDs
        if (!tab?.id) {
          skippedCount++;
          return;
        }

        // Skip external windows and xapps (they use separate windows)
        if (tab.location === 'external' || tab.type === 'xapp') {
          skippedCount++;
          return;
        }

        // Skip sleeping tabs (they don't have active webviews)
        if (tab.sleeping) {
          skippedCount++;
          return;
        }

        // Skip tabs with media playing (to avoid interrupting playback)
        if (tab.mediaPlaying) {
          skippedCount++;
          return;
        }

        // Validate webContentsId before capturing
        if (typeof tab.webContentsId !== 'number') {
          log.warn(`ScreenshotManager: Tab ${tab.id} has invalid webContentsId:`, tab.webContentsId);
          skippedCount++;
          return;
        }

        // Capture screenshot for this tab
        ScreenshotService.capture(tab.webContentsId, tab.id, 'ScreenshotManager');
        capturedCount++;
      });

      log.info(
        `ScreenshotManager: Captured ${capturedCount} screenshots, skipped ${skippedCount} tabs`
      );
      
      // Log diagnostic info about tabs with/without webContentsId
      const tabsWithWebContentsId = Object.values(openTabs).filter(
        (tab: any) => typeof tab.webContentsId === 'number'
      );
      const tabsWithoutWebContentsId = Object.values(openTabs).filter(
        (tab: any) => typeof tab.webContentsId !== 'number'
      );
      
      log.info(`ScreenshotManager: ${tabsWithWebContentsId.length} tabs with webContentsId, ${tabsWithoutWebContentsId.length} tabs without`);
      
      if (tabsWithoutWebContentsId.length > 0) {
        log.warn('Tabs without webContentsId:', tabsWithoutWebContentsId.map((tab: any) => ({
          id: tab.id,
          url: tab.state?.url,
          type: tab.type
        })));
      }
    } catch (error) {
      log.error('ScreenshotManager: Error capturing screenshots:', error);
    }
  }

  /**
   * Manually trigger a screenshot capture for all tabs (useful for testing or immediate updates)
   */
  captureNow(store: any) {
    log.debug('ScreenshotManager: Manual capture triggered');
    this.captureAllActiveTabScreenshots(store);
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
