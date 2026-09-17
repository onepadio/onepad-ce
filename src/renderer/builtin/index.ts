export type {
  BuiltinAppDef,
  BuiltinAppId,
  BuiltinWindowMode,
} from './types';
export { windowIdPrefix } from './types';
export {
  BUILTIN_APP_META as BUILTIN_APPS,
  getBuiltinApp,
  getBuiltinAppByType,
  getBuiltinAppForWindow,
  getLauncherBuiltinApps,
  getOpenBuiltinApps,
  getDockBuiltinApps,
  getBuiltinWindowVisibility,
  hideBuiltinModal,
  isBuiltinAppSupported,
  isBuiltinWindow,
  isBuiltinWindowId,
  isModalBuiltin,
  isFullscreenBuiltin,
  getBuiltinActiveTab,
  focusBuiltinWindow,
  shouldHideAddressBar,
  shouldHideSideBars,
  activateBuiltinApp,
  closeBuiltinApp,
  activateTerminal,
} from './registry';
export type { OnlineToolDef } from './onlineTools';
export {
  ONLINE_TOOLS,
  ONLINE_TOOL_WINDOW_PREFIX,
  getLauncherOnlineTools,
  getOnlineTool,
  getOnlineToolWindowId,
  getOpenOnlineTools,
  isOnlineToolWindow,
  isOnlineToolWindowId,
  activateOnlineTool,
} from './onlineTools';
