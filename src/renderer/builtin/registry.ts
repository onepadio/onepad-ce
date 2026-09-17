import { BoxSeam, Calculator, JournalText, Terminal } from 'react-bootstrap-icons';

import { builtinActions } from '../store/builtin-slice';
import { sessionActions } from '../store/session-slice';
import { Platform } from '../enum';
import type { BuiltinAppDef, BuiltinAppId } from './types';
import { windowIdPrefix } from './types';

/**
 * Registry metadata for built-in native apps.
 * UI components are mounted via BuiltinAppsHost to avoid circular imports.
 */
export const BUILTIN_APP_META: BuiltinAppDef[] = [
  {
    id: 'terminal',
    type: 'terminal',
    label: 'Terminal',
    url: ':terminal',
    hideAddressBar: true,
    hideSideBars: true,
    showInLauncher: true,
    windowMode: 'fullscreen',
    DockIcon: Terminal,
    getWindowId: (workspaceId: string) =>
      `${windowIdPrefix('terminal')}${workspaceId}`,
  },
  {
    id: 'calculator',
    type: 'calculator',
    label: 'Calculator',
    url: ':calculator',
    hideAddressBar: false,
    hideSideBars: false,
    showInLauncher: true,
    windowMode: 'modal',
    DockIcon: Calculator,
    getWindowId: (workspaceId: string) =>
      `${windowIdPrefix('calculator')}${workspaceId}`,
  },
  {
    id: 'notes',
    type: 'notes',
    label: 'Notes',
    url: ':notes',
    hideAddressBar: false,
    hideSideBars: false,
    showInLauncher: true,
    windowMode: 'modal',
    DockIcon: JournalText,
    getWindowId: (workspaceId: string) =>
      `${windowIdPrefix('notes')}${workspaceId}`,
  },
  {
    id: 'docker',
    type: 'docker',
    label: 'Docker',
    url: ':docker',
    hideAddressBar: true,
    hideSideBars: true,
    showInLauncher: true,
    platforms: [Platform.MacOS, Platform.Linux],
    windowMode: 'fullscreen',
    DockIcon: BoxSeam,
    getWindowId: (workspaceId: string) =>
      `${windowIdPrefix('docker')}${workspaceId}`,
  },
];

const byId = Object.fromEntries(
  BUILTIN_APP_META.map((app) => [app.id, app])
) as Record<BuiltinAppId, BuiltinAppDef>;

const byType = Object.fromEntries(
  BUILTIN_APP_META.map((app) => [app.type, app])
) as Record<string, BuiltinAppDef>;

export function getBuiltinApp(id: BuiltinAppId): BuiltinAppDef {
  return byId[id];
}

export function getBuiltinAppByType(
  type: string | undefined
): BuiltinAppDef | undefined {
  if (!type) return undefined;
  return byType[type];
}

export function isBuiltinAppSupported(
  app: BuiltinAppDef,
  platform: string | null | undefined
): boolean {
  if (!app.platforms || app.platforms.length === 0) return true;
  // Hide platform-restricted apps until OS is known (avoids flashing on Windows)
  if (!platform) return false;
  return app.platforms.includes(platform);
}

export function isModalBuiltin(appId: BuiltinAppId): boolean {
  return getBuiltinApp(appId)?.windowMode === 'modal';
}

export function isFullscreenBuiltin(appId: BuiltinAppId): boolean {
  return getBuiltinApp(appId)?.windowMode === 'fullscreen';
}

/** Apps shown in the Utilities switcher grid */
export function getLauncherBuiltinApps(
  platform?: string | null
): BuiltinAppDef[] {
  return BUILTIN_APP_META.filter(
    (app) => app.showInLauncher && isBuiltinAppSupported(app, platform)
  );
}

/** Built-ins to show in the dock: open fullscreen windows + open modal apps. */
export function getOpenBuiltinApps(
  openWindows: Record<string, any> | null | undefined,
  workspaceId: string | null | undefined,
  openModalIds: BuiltinAppId[] | null | undefined = [],
  platform?: string | null
): BuiltinAppDef[] {
  const modals = new Set(openModalIds || []);
  return BUILTIN_APP_META.filter((app) => {
    if (!isBuiltinAppSupported(app, platform)) return false;
    if (app.windowMode === 'modal') {
      return modals.has(app.id);
    }
    if (!openWindows || !workspaceId) return false;
    const id = app.getWindowId(workspaceId);
    return openWindows[id] != null;
  });
}

/** Hide a modal panel without removing its dock icon. */
export function hideBuiltinModal(dispatch: any) {
  dispatch(builtinActions.hideModal());
}

/** @deprecated Prefer getOpenBuiltinApps for the dock */
export function getDockBuiltinApps(): BuiltinAppDef[] {
  return BUILTIN_APP_META.filter((app) => app.windowMode === 'fullscreen');
}

/**
 * Visibility for fullscreen built-in windows only.
 * Modal apps use builtin.activeModalId instead.
 */
export function getBuiltinWindowVisibility(options: {
  appId: BuiltinAppId;
  windowId: string | null | undefined;
  openWindows: Record<string, any> | null | undefined;
  activeWindowId: string | null | undefined;
  activeTabId: string | null | undefined;
}): { visible: boolean; active: boolean } {
  const { appId, windowId, openWindows, activeWindowId, activeTabId } =
    options;
  const app = getBuiltinApp(appId);
  if (!app || app.windowMode !== 'fullscreen') {
    return { visible: false, active: false };
  }

  const onLaunchpad =
    activeTabId === 'launchpad' || activeWindowId === 'launchpad';
  const hasWindow = !!(windowId && openWindows?.[windowId]);

  if (!hasWindow || onLaunchpad) {
    return { visible: false, active: false };
  }

  const active = activeWindowId === windowId;
  return { visible: active, active };
}

/** Remove leftover session windows for modal apps (legacy / mistaken opens). */
function purgeModalSessionWindow(
  app: BuiltinAppDef,
  workspace: any,
  openWindows: any,
  dispatch: any
) {
  if (!workspace?.id || !openWindows) return openWindows;
  const id = app.getWindowId(workspace.id);
  if (!openWindows[id]) return openWindows;
  const next = { ...openWindows };
  delete next[id];
  dispatch(sessionActions.setOpenWindows({ data: next }));
  return next;
}

export function isBuiltinWindowId(
  windowId: string | null | undefined
): boolean {
  if (typeof windowId !== 'string') return false;
  return BUILTIN_APP_META.some(
    (app) =>
      app.windowMode === 'fullscreen' &&
      windowId.startsWith(windowIdPrefix(app.id))
  );
}

export function isBuiltinWindow(window: any): boolean {
  if (!window) return false;
  const app =
    getBuiltinAppByType(window.type) ||
    (typeof window.id === 'string'
      ? BUILTIN_APP_META.find((a) =>
          window.id.startsWith(windowIdPrefix(a.id))
        )
      : undefined);
  return !!app && app.windowMode === 'fullscreen';
}

export function getBuiltinAppForWindow(
  window: any
): BuiltinAppDef | undefined {
  if (!window) return undefined;
  const byTypeMatch = getBuiltinAppByType(window.type);
  if (byTypeMatch?.windowMode === 'fullscreen') return byTypeMatch;
  if (typeof window.id === 'string') {
    return BUILTIN_APP_META.find(
      (app) =>
        app.windowMode === 'fullscreen' &&
        window.id.startsWith(windowIdPrefix(app.id))
    );
  }
  return undefined;
}

/** Synthetic session tab — fullscreen builtins are not stored in openTabs/webviews. */
export function getBuiltinActiveTab(window: any) {
  const app = getBuiltinAppForWindow(window);
  const id = window?.id;
  if (!app || !id) return null;
  return {
    id: `${id}_tab`,
    type: app.type,
    window: id,
    workspace: window.workspace,
    desktop: window.desktop,
  };
}

export function focusBuiltinWindow(dispatch: any, window: any) {
  if (!window) return;
  dispatch(sessionActions.setActiveWindow({ data: window }));
  const tab = getBuiltinActiveTab(window);
  if (tab) {
    dispatch(sessionActions.setActiveTab({ data: tab }));
  }
}

export function shouldHideAddressBar(windowOrTab: any): boolean {
  const app = getBuiltinAppByType(windowOrTab?.type);
  return !!app?.hideAddressBar && app.windowMode === 'fullscreen';
}

export function shouldHideSideBars(window: any): boolean {
  const app = getBuiltinAppForWindow(window);
  return !!app?.hideSideBars;
}

/**
 * Open or focus a built-in app.
 * Fullscreen apps become the active session window.
 * Modal apps only toggle overlay state and leave the underlying window focused.
 */
export function activateBuiltinApp(
  appId: BuiltinAppId,
  workspace: any,
  desktop: any,
  openWindows: any,
  dispatch: any,
  platform?: string | null
) {
  if (!workspace?.id) return;

  const app = getBuiltinApp(appId);
  if (!app) return;
  if (!isBuiltinAppSupported(app, platform)) return;

  if (app.windowMode === 'modal') {
    purgeModalSessionWindow(app, workspace, openWindows, dispatch);
    dispatch(builtinActions.openModal(appId));
    return;
  }

  const id = app.getWindowId(workspace.id);
  const existing = openWindows?.[id];

  if (existing) {
    focusBuiltinWindow(dispatch, existing);
    return;
  }

  const window = {
    id,
    type: app.type,
    name: app.label,
    url: app.url,
    location: 'main',
    workspace: workspace.id,
    desktop: desktop?.id,
    sleeping: false,
    data: {
      id,
      name: app.label,
      startUrl: app.url,
      start_url: app.url,
      icon: null,
    },
  };

  dispatch(
    sessionActions.setOpenWindows({
      data: { ...openWindows, [id]: window },
    })
  );
  focusBuiltinWindow(dispatch, window);
}

/**
 * Close a built-in app (fullscreen window or modal overlay).
 */
export function closeBuiltinApp(
  appId: BuiltinAppId,
  workspace: any,
  desktop: any,
  openWindows: any,
  activeWindowId: string | null | undefined,
  activeDesktopWindows: Record<string, string>,
  dispatch: any
) {
  const app = getBuiltinApp(appId);
  if (!app) return;

  if (app.windowMode === 'modal') {
    dispatch(builtinActions.closeModal(appId));
    if (workspace?.id) {
      purgeModalSessionWindow(app, workspace, openWindows, dispatch);
    }
    return;
  }

  if (!workspace?.id) return;

  const id = app.getWindowId(workspace.id);
  if (!openWindows?.[id]) return;

  const nextWindows = { ...openWindows };
  delete nextWindows[id];
  dispatch(sessionActions.setOpenWindows({ data: nextWindows }));

  const desktopId = desktop?.id;
  if (desktopId && activeDesktopWindows?.[desktopId] === id) {
    dispatch(
      sessionActions.setActiveDesktopWindows({
        data: { ...activeDesktopWindows, [desktopId]: 'launchpad' },
      })
    );
  }

  if (activeWindowId === id && desktopId) {
    dispatch(
      sessionActions.getBackToLaunchPad({
        data: { desktopId },
      })
    );
  }
}

/** @deprecated Prefer activateBuiltinApp('terminal', ...) */
export function activateTerminal(
  workspace: any,
  desktop: any,
  openWindows: any,
  dispatch: any
) {
  activateBuiltinApp('terminal', workspace, desktop, openWindows, dispatch);
}
