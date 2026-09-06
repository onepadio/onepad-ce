import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';
import { ScreenshotService } from '../services/screenshot';
import { appActions } from '../store/app-slice';

/**
 * Hub that captures a screenshot of the previous tab after switching away.
 * Capture is deferred so the incoming tab can paint and read its cached
 * screenshot without waiting on capturePage.
 *
 * Empty/hidden captures are rejected in the main process, so a failed
 * capture never overwrites the last good preview (needed for sleeping tabs).
 */
const CAPTURE_DELAY_MS = 150;
const VERSION_BUMP_DELAY_MS = 500;

function TabSwitchScreenshotHub() {
  const dispatch = useDispatch();
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const previousTabId = useSelector((state: any) => state.session.previousTabId);
  const openTabs = useSelector((state: any) => state.session.openTabs);

  const prevActiveTabIdRef = useRef(activeTabId);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevActiveTabIdRef.current === activeTabId || activeTabId === previousTabId) {
      return;
    }

    // Snapshot ids at switch time — openTabs may change before the timer fires
    const tabIdToCapture = previousTabId;
    const previousTab = tabIdToCapture ? openTabs[tabIdToCapture] : null;
    prevActiveTabIdRef.current = activeTabId;

    if (
      !previousTab ||
      previousTab.sleeping ||
      previousTab.location === 'external' ||
      previousTab.type === 'xapp' ||
      typeof previousTab.webContentsId !== 'number'
    ) {
      // Still refresh switchers so they pick up any existing cache for sleeping tabs
      dispatch(appActions.updateScreenShotStatusVersion());
      return;
    }

    const { webContentsId } = previousTab;

    if (captureTimerRef.current) {
      clearTimeout(captureTimerRef.current);
    }
    if (versionTimerRef.current) {
      clearTimeout(versionTimerRef.current);
    }

    captureTimerRef.current = setTimeout(() => {
      captureTimerRef.current = null;
      log.info(`TabSwitchScreenshot: Capturing previous tab ${tabIdToCapture}`);
      ScreenshotService.capture(webContentsId, tabIdToCapture, 'TabSwitch');
      versionTimerRef.current = setTimeout(() => {
        versionTimerRef.current = null;
        dispatch(appActions.updateScreenShotStatusVersion());
      }, VERSION_BUMP_DELAY_MS);
    }, CAPTURE_DELAY_MS);
  }, [activeTabId, previousTabId, openTabs, dispatch]);

  useEffect(() => {
    return () => {
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current);
      }
      if (versionTimerRef.current) {
        clearTimeout(versionTimerRef.current);
      }
    };
  }, []);

  return null;
}

export default TabSwitchScreenshotHub;
