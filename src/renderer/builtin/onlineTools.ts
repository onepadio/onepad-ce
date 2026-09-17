import type { ComponentType } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  FileEarmarkCode,
  GeoAlt,
  Image,
  PencilSquare,
  CheckSquare,
  Kanban
} from 'react-bootstrap-icons';

import { sessionActions } from '../store/session-slice';
import { appActions } from '../store/app-slice';
import { createNavHistoryState } from '../util/navHistory';

export const ONLINE_TOOL_WINDOW_PREFIX = 'onlinetool_';

export type OnlineToolDef = {
  id: string;
  label: string;
  /** Hosted tool URL (separate repo / deploy) */
  url: string;
  DockIcon: ComponentType<{ color?: string; size?: number | string }>;
  showInLauncher?: boolean;
};

/**
 * Curated online tools shown in the Tools switcher.
 * Each tool is maintained in its own repo and loaded in a space-scoped webview.
 * Extend this list as new tool URLs are ready.
 */
export const ONLINE_TOOLS: OnlineToolDef[] = [
  {
    id: 'excalidraw',
    label: 'Excalidraw',
    url: 'https://excalidraw.com',
    DockIcon: PencilSquare,
    showInLauncher: true,
  },
  {
    id: 'maps',
    label: 'Maps',
    url: 'https://www.openstreetmap.org',
    DockIcon: GeoAlt,
    showInLauncher: true,
  },
  {
    id: 'todos',
    label: 'Todo List',
    url: 'https://todolist.onepad.io',
    DockIcon: CheckSquare,
    showInLauncher: true,
  },
  {
    id: 'kanban',
    label: 'KanBan',
    url: 'https://taskboard.onepad.io',
    DockIcon: Kanban,
    showInLauncher: true,
  },

];

export function getOnlineToolWindowId(
  toolId: string,
  workspaceId: string
): string {
  return `${ONLINE_TOOL_WINDOW_PREFIX}${toolId}_${workspaceId}`;
}

export function isOnlineToolWindowId(
  windowId: string | null | undefined
): boolean {
  return (
    typeof windowId === 'string' && windowId.startsWith(ONLINE_TOOL_WINDOW_PREFIX)
  );
}

export function isOnlineToolWindow(window: any): boolean {
  return isOnlineToolWindowId(window?.id) || window?.data?.kind === 'online-tool';
}

export function getLauncherOnlineTools(): OnlineToolDef[] {
  return ONLINE_TOOLS.filter((tool) => tool.showInLauncher !== false);
}

export function getOnlineTool(id: string): OnlineToolDef | undefined {
  return ONLINE_TOOLS.find((tool) => tool.id === id);
}

export function getOpenOnlineTools(
  openWindows: Record<string, any> | null | undefined,
  workspaceId: string | null | undefined
): OnlineToolDef[] {
  if (!openWindows || !workspaceId) return [];
  return getLauncherOnlineTools().filter((tool) => {
    const windowId = getOnlineToolWindowId(tool.id, workspaceId);
    return openWindows[windowId] != null;
  });
}

function getPartitionId(options: {
  workspaceId: string;
  toolId: string;
  username?: string;
  route?: string;
  isInSession?: boolean;
  currentSession?: any;
}): string {
  const { workspaceId, toolId, username, route, isInSession, currentSession } =
    options;

  let partition = '';
  if (route === 'authenticated') {
    partition =
      isInSession && currentSession?.isolated
        ? `persist:${username}_${currentSession.id}`
        : `persist:${username}_${workspaceId}`;
  } else {
    partition =
      isInSession && currentSession?.isolated
        ? `persist:${currentSession.id}`
        : `persist:${workspaceId}`;
  }

  // Isolate each online tool within the space partition family
  return `${partition}_onlinetool_${toolId}`;
}

/**
 * Open or focus a curated online tool as a space-scoped webview window.
 */
export function activateOnlineTool(options: {
  toolId: string;
  workspace: any;
  desktop: any;
  openWindows: Record<string, any>;
  openTabs: Record<string, any>;
  windowTabs: Record<string, any>;
  username?: string;
  route?: string;
  isInSession?: boolean;
  currentSession?: any;
  dispatch: any;
}): void {
  const {
    toolId,
    workspace,
    desktop,
    openWindows,
    openTabs,
    windowTabs,
    username,
    route,
    isInSession,
    currentSession,
    dispatch,
  } = options;

  if (!workspace?.id) return;

  const tool = getOnlineTool(toolId);
  if (!tool?.url) return;

  const windowId = getOnlineToolWindowId(tool.id, workspace.id);
  const existing = openWindows?.[windowId];

  if (existing) {
    dispatch(sessionActions.setActiveWindow({ data: existing }));
    const tabIds = windowTabs?.[windowId] || [];
    const wakeTab = tabIds[0] ? openTabs?.[tabIds[0]] : null;
    if (existing.sleeping === true || wakeTab?.sleeping === true) {
      dispatch(appActions.showSplashScreen({}));
    }
    return;
  }

  const partition = getPartitionId({
    workspaceId: workspace.id,
    toolId: tool.id,
    username,
    route,
    isInSession,
    currentSession,
  });

  const windowRecord = {
    id: windowId,
    type: 'app',
    name: tool.label,
    url: tool.url,
    location: 'main',
    workspace: workspace.id,
    desktop: desktop?.id,
    partition,
    sleeping: false,
    data: {
      id: windowId,
      kind: 'online-tool',
      onlineToolId: tool.id,
      name: tool.label,
      startUrl: tool.url,
      start_url: tool.url,
      icon: null,
    },
  };

  const now = Date.now();
  const tabId = uuidv4();
  const tab = {
    id: tabId,
    url: tool.url,
    location: 'main',
    type: 'app',
    desktop: desktop?.id,
    workspace: workspace.id,
    window: windowId,
    state: createNavHistoryState(tool.url, tool.label, null),
    created: now,
    lastAccessed: now,
    sleeping: true,
    partition,
  };

  dispatch(
    sessionActions.setOpenWindows({
      data: { ...openWindows, [windowId]: windowRecord },
    })
  );
  dispatch(
    sessionActions.setOpenTabs({
      data: { ...openTabs, [tabId]: tab },
    })
  );
  dispatch(
    sessionActions.setWindowTabs({
      data: { ...windowTabs, [windowId]: [tabId] },
    })
  );
  dispatch(sessionActions.setActiveWindow({ data: windowRecord }));
  dispatch(appActions.showSplashScreen({}));
}
