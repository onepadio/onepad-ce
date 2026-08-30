/** Shared helpers for apps sidebar + vertical tab bar hover coordination */

export const SIDEBAR_AUTOHIDE_EVENT = "onepad-sidebar-autohide";

export function requestSidebarAutoHide() {
  window.dispatchEvent(new CustomEvent(SIDEBAR_AUTOHIDE_EVENT));
}

export function isNodeInSidebarChrome(node: EventTarget | null): boolean {
  if (!(node instanceof Node)) return false;
  const appsMenu = document.getElementById("globalAppsMenu");
  const tabBar = document.getElementById("vertical-tab-bar");
  return !!(appsMenu?.contains(node) || tabBar?.contains(node));
}

export function isNodeInAppsMenu(node: EventTarget | null): boolean {
  if (!(node instanceof Node)) return false;
  const appsMenu = document.getElementById("globalAppsMenu");
  return !!appsMenu?.contains(node);
}

export function isNodeInVerticalTabBar(node: EventTarget | null): boolean {
  if (!(node instanceof Node)) return false;
  const tabBar = document.getElementById("vertical-tab-bar");
  return !!tabBar?.contains(node);
}
