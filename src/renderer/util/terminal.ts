/**
 * Terminal helpers — thin wrappers over the shared builtin-app registry.
 * Prefer importing from `renderer/builtin` for new code.
 */
import {
  activateBuiltinApp,
  focusBuiltinWindow,
  getBuiltinActiveTab,
  getBuiltinApp,
  isBuiltinWindow,
  isBuiltinWindowId,
} from '../builtin';

export const TERMINAL_WINDOW_PREFIX = 'terminal_';

export function getTerminalWindowId(workspaceId: string): string {
  return getBuiltinApp('terminal').getWindowId(workspaceId);
}

export function isTerminalWindowId(
  windowId: string | null | undefined
): boolean {
  return (
    typeof windowId === 'string' &&
    windowId.startsWith(TERMINAL_WINDOW_PREFIX) &&
    isBuiltinWindowId(windowId)
  );
}

export function isTerminalWindow(window: any): boolean {
  return window?.type === 'terminal' || isTerminalWindowId(window?.id);
}

export function getTerminalActiveTab(window: any) {
  return getBuiltinActiveTab(window);
}

export function focusTerminalWindow(dispatch: any, window: any) {
  focusBuiltinWindow(dispatch, window);
}

export function activateTerminal(
  workspace: any,
  desktop: any,
  openWindows: any,
  dispatch: any
) {
  activateBuiltinApp('terminal', workspace, desktop, openWindows, dispatch);
}

// Re-export generic checks for gradual migration
export { isBuiltinWindow, focusBuiltinWindow, getBuiltinActiveTab };
