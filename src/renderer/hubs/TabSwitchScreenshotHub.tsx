import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';
import { ScreenshotService } from '../services/screenshot';
import { appActions } from '../store/app-slice';
import { getWindowLiveActiveTab } from '../components/LaunchPad3D/windowTab';

/**
 * Hub that captures a screenshot of the previous tab/window after switching away.
 * Capture fires immediately so webContents that are about to hide still paint.
 *
 * Empty/hidden captures are rejected in the main process, so a failed
 * capture never overwrites the last good preview (needed for sleeping tabs).
 */
const VERSION_BUMP_DELAY_MS = 400;

function captureTabIfPossible(tab: any, source: string): boolean {
  if (
    !tab?.id ||
    tab.sleeping ||
    tab.location === 'external' ||
    tab.type === 'xapp' ||
    typeof tab.webContentsId !== 'number'
  ) {
    return false;
  }
  log.info(`${source}: Capturing tab ${tab.id}`);
  ScreenshotService.capture(tab.webContentsId, tab.id, source);
  return true;
}

function TabSwitchScreenshotHub() {
  const dispatch = useDispatch();
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const previousTabId = useSelector((state: any) => state.session.previousTabId);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);

  const prevActiveTabIdRef = useRef(activeTabId);
  const prevActiveWindowIdRef = useRef(activeWindowId);
  const versionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpVersion = () => {
    if (versionTimerRef.current) clearTimeout(versionTimerRef.current);
    versionTimerRef.current = setTimeout(() => {
      versionTimerRef.current = null;
      dispatch(appActions.updateScreenShotStatusVersion());
    }, VERSION_BUMP_DELAY_MS);
  };

  // Tab switch within a window (or window switch that changes activeTabId)
  useEffect(() => {
    if (prevActiveTabIdRef.current === activeTabId || activeTabId === previousTabId) {
      return;
    }

    const tabIdToCapture = previousTabId;
    const previousTab = tabIdToCapture ? openTabs[tabIdToCapture] : null;
    prevActiveTabIdRef.current = activeTabId;

    if (!captureTabIfPossible(previousTab, 'TabSwitch')) {
      dispatch(appActions.updateScreenShotStatusVersion());
      return;
    }
    bumpVersion();
  }, [activeTabId, previousTabId, openTabs, dispatch]);

  // Browser window / group switch — capture outgoing window before it hides
  useEffect(() => {
    const prevWindowId = prevActiveWindowIdRef.current;
    if (!activeWindowId || prevWindowId === activeWindowId) {
      prevActiveWindowIdRef.current = activeWindowId;
      return;
    }
    prevActiveWindowIdRef.current = activeWindowId;

    if (!prevWindowId || prevWindowId === 'launchpad') return;

    const outgoing =
      getWindowLiveActiveTab(prevWindowId, activeTabs, openTabs) ||
      (activeTabs?.[prevWindowId] ? openTabs[activeTabs[prevWindowId]] : null);

    if (captureTabIfPossible(outgoing, 'WindowSwitch')) {
      bumpVersion();
    }
  }, [activeWindowId, activeTabs, openTabs, dispatch]);

  useEffect(() => {
    return () => {
      if (versionTimerRef.current) {
        clearTimeout(versionTimerRef.current);
      }
    };
  }, []);

  return null;
}

export default TabSwitchScreenshotHub;
