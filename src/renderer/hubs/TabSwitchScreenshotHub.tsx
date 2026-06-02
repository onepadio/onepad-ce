import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import log from 'loglevel';
import { ScreenshotService } from '../services/screenshot';

/**
 * Hub that captures a screenshot of the previous tab when switching to a new tab.
 * This ensures we always have an up-to-date preview when hovering over tabs.
 */
function TabSwitchScreenshotHub() {
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const previousTabId = useSelector((state: any) => state.session.previousTabId);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  
  // Track the previous activeTabId to detect changes
  const prevActiveTabIdRef = useRef(activeTabId);

  useEffect(() => {
    // Only capture if activeTabId actually changed
    if (prevActiveTabIdRef.current !== activeTabId && activeTabId !== previousTabId) {
      // Capture screenshot of the previous tab
      if (previousTabId && openTabs[previousTabId]) {
        const previousTab = openTabs[previousTabId];
        
        // Make sure the previous tab has a valid webContentsId
        if (typeof previousTab.webContentsId === 'number') {
          log.info(`TabSwitchScreenshot: Capturing screenshot of previous tab ${previousTabId}`);
          ScreenshotService.capture(
            previousTab.webContentsId,
            previousTab.id,
            'TabSwitch'
          );
        } else {
          log.debug(`TabSwitchScreenshot: Previous tab ${previousTabId} has no webContentsId`);
        }
      }
      
      // Update the ref for next comparison
      prevActiveTabIdRef.current = activeTabId;
    }
  }, [activeTabId, previousTabId, openTabs]);

  return null;
}

export default TabSwitchScreenshotHub;
