import type { ComponentType } from 'react';

/** Stable ids for first-class native (non-webview) apps */
export type BuiltinAppId = 'terminal' | 'calculator' | 'notes' | 'docker';

/**
 * fullscreen — real session window (can be activeWindow)
 * modal — overlay UI only; does not change activeWindow
 */
export type BuiltinWindowMode = 'fullscreen' | 'modal';

export type BuiltinAppDef = {
  id: BuiltinAppId;
  /** session openWindows[].type (fullscreen only) */
  type: string;
  label: string;
  /** Synthetic url stored on the window record */
  url: string;
  hideAddressBar: boolean;
  hideSideBars: boolean;
  /** Listed in the Utilities switcher grid */
  showInLauncher: boolean;
  /**
   * When set, app is only available on these process.platform values
   * (e.g. ['darwin', 'linux']). Omit for all platforms.
   */
  platforms?: string[];
  windowMode: BuiltinWindowMode;
  DockIcon: ComponentType<{ color?: string; size?: number | string }>;
  getWindowId: (workspaceId: string) => string;
};

export function windowIdPrefix(appId: BuiltinAppId): string {
  return `${appId}_`;
}
