import { v4 as uuidv4 } from 'uuid';
import log from 'loglevel';

import AppService from '../services/app';
import { LinkService } from '../services/link';
import { sessionActions } from '../store/session-slice';
import { appActions } from '../store/app-slice';
import { createNavHistoryState } from './navHistory';

export function isSharedAppWindow(
  window: any,
  homeWorkspaceId: string | null | undefined
): boolean {
  if (!window || !homeWorkspaceId) return false;
  if (window.type === 'xapp') {
    return window.desktop === homeWorkspaceId;
  }
  return window.workspace === homeWorkspaceId;
}

export function hasAwakeTab(
  appId: string,
  openWindows: Record<string, any> | null | undefined,
  openTabs: Record<string, any> | null | undefined,
  windowTabs: Record<string, any> | null | undefined
): boolean {
  const tabIds = windowTabs?.[appId];
  if (!Array.isArray(tabIds) || tabIds.length === 0) {
    return openWindows?.[appId] != null && openWindows[appId].sleeping !== true;
  }
  return tabIds.some((tabId: string) => {
    const tab = openTabs?.[tabId];
    return tab != null && tab.sleeping !== true;
  });
}

function getPartitionId(options: {
  homeWorkspaceId: string;
  appId: string;
  isolated?: boolean;
  username?: string;
  route?: string;
  isInSession?: boolean;
  currentSession?: any;
}): string {
  const {
    homeWorkspaceId,
    appId,
    isolated,
    username,
    route,
    isInSession,
    currentSession,
  } = options;

  let partition = '';
  if (route === 'authenticated') {
    partition =
      isInSession && currentSession?.isolated
        ? `persist:${username}_${currentSession.id}`
        : `persist:${username}_${homeWorkspaceId}`;
  } else {
    partition =
      isInSession && currentSession?.isolated
        ? `persist:${currentSession.id}`
        : `persist:${homeWorkspaceId}`;
  }

  if (isolated) {
    partition = `persist:${appId}`;
  }

  return partition;
}

function focusExistingWindow(options: {
  existing: any;
  windowId: string;
  openTabs: Record<string, any>;
  windowTabs: Record<string, any>;
  dispatch: any;
}): void {
  const { existing, windowId, openTabs, windowTabs, dispatch } = options;
  dispatch(sessionActions.setActiveWindow({ data: existing }));
  const tabIds = windowTabs?.[windowId] || [];
  const wakeTab = tabIds[0] ? openTabs?.[tabIds[0]] : null;
  if (existing.sleeping === true || wakeTab?.sleeping === true) {
    dispatch(appActions.showSplashScreen({}));
  }
}

/**
 * Open or focus a Home (Shared Apps) installed app without switching space.
 * Window/tab workspace stays homeWorkspaceId so persistence remains correct.
 */
export async function activateSharedApp(options: {
  appId: string;
  homeWorkspaceId: string;
  openWindows: Record<string, any>;
  openTabs: Record<string, any>;
  windowTabs: Record<string, any>;
  username?: string;
  route?: string;
  isInSession?: boolean;
  currentSession?: any;
  dispatch: any;
}): Promise<void> {
  const {
    appId,
    homeWorkspaceId,
    openWindows,
    openTabs,
    windowTabs,
    username,
    route,
    isInSession,
    currentSession,
    dispatch,
  } = options;

  const existing = openWindows?.[appId];
  if (existing) {
    focusExistingWindow({
      existing,
      windowId: appId,
      openTabs,
      windowTabs,
      dispatch,
    });
    return;
  }

  try {
    const app: any = await AppService.get(appId);
    if (!app) {
      log.warn('Shared app not found', appId);
      return;
    }

    const url = app.data?.customUrl || app.data?.startUrl;
    if (!url) {
      log.warn('Shared app has no URL', appId);
      return;
    }

    const isolated = !!app.data?.isolated;
    const partition = getPartitionId({
      homeWorkspaceId,
      appId,
      isolated,
      username,
      route,
      isInSession,
      currentSession,
    });

    const windowRecord = {
      ...app,
      type: 'app',
      url,
      location: 'main',
      workspace: homeWorkspaceId,
      desktop: app.desktop,
      partition,
      sleeping: false,
    };

    const now = Date.now();
    const tabId = uuidv4();
    const tab = {
      id: tabId,
      url,
      location: 'main',
      type: 'app',
      desktop: app.desktop,
      workspace: homeWorkspaceId,
      window: appId,
      state: createNavHistoryState(url, app.data?.name || '', app.data?.icon),
      created: now,
      lastAccessed: now,
      sleeping: true,
      isolated,
      partition,
    };

    dispatch(
      sessionActions.setOpenWindows({
        data: { ...openWindows, [appId]: windowRecord },
      })
    );
    dispatch(
      sessionActions.setOpenTabs({
        data: { ...openTabs, [tabId]: tab },
      })
    );
    dispatch(
      sessionActions.setWindowTabs({
        data: { ...windowTabs, [appId]: [tabId] },
      })
    );
    dispatch(sessionActions.setActiveWindow({ data: windowRecord }));
    dispatch(appActions.showSplashScreen({}));
  } catch (error) {
    log.error('Failed to activate shared app', error);
  }
}

/**
 * Open or focus a Home-space link without switching space.
 */
export async function activateSharedLink(options: {
  linkId: string;
  homeWorkspaceId: string;
  openWindows: Record<string, any>;
  openTabs: Record<string, any>;
  windowTabs: Record<string, any>;
  username?: string;
  route?: string;
  isInSession?: boolean;
  currentSession?: any;
  dispatch: any;
}): Promise<void> {
  const {
    linkId,
    homeWorkspaceId,
    openWindows,
    openTabs,
    windowTabs,
    username,
    route,
    isInSession,
    currentSession,
    dispatch,
  } = options;

  const existing = openWindows?.[linkId];
  if (existing) {
    focusExistingWindow({
      existing,
      windowId: linkId,
      openTabs,
      windowTabs,
      dispatch,
    });
    return;
  }

  try {
    const link: any = await LinkService.get(linkId);
    if (!link) {
      log.warn('Shared link not found', linkId);
      return;
    }

    const url = link.data?.startUrl;
    if (!url) {
      log.warn('Shared link has no URL', linkId);
      return;
    }

    const partition = getPartitionId({
      homeWorkspaceId,
      appId: linkId,
      username,
      route,
      isInSession,
      currentSession,
    });

    const windowRecord = {
      ...link,
      type: 'link',
      url,
      location: 'main',
      workspace: homeWorkspaceId,
      desktop: link.desktop,
      partition,
      sleeping: false,
    };

    const now = Date.now();
    const tabId = uuidv4();
    const tab = {
      id: tabId,
      url,
      location: 'main',
      type: 'link',
      desktop: link.desktop,
      workspace: homeWorkspaceId,
      window: linkId,
      state: createNavHistoryState(
        url,
        link.data?.title || '',
        link.data?.icon
      ),
      created: now,
      lastAccessed: now,
      sleeping: true,
      partition,
    };

    dispatch(
      sessionActions.setOpenWindows({
        data: { ...openWindows, [linkId]: windowRecord },
      })
    );
    dispatch(
      sessionActions.setOpenTabs({
        data: { ...openTabs, [tabId]: tab },
      })
    );
    dispatch(
      sessionActions.setWindowTabs({
        data: { ...windowTabs, [linkId]: [tabId] },
      })
    );
    dispatch(sessionActions.setActiveWindow({ data: windowRecord }));
    dispatch(appActions.showSplashScreen({}));
  } catch (error) {
    log.error('Failed to activate shared link', error);
  }
}
