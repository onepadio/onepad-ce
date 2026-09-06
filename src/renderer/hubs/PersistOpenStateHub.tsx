import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { schedulePersistOpenState } from "../util/persistOpenState";

/**
 * Watches structural open-state changes (windows/tabs/active selection)
 * and debounces a Dexie persist so app switches and tab open/close
 * do not lose data on crash/quit.
 */
function PersistOpenStateHub() {
  const workspaceId = useSelector(
    (state: any) => state.workspace.selectedWorkspace?.id
  );
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const browserWindows = useSelector(
    (state: any) => state.session.browserWindows
  );
  const activeBrowserWindowId = useSelector(
    (state: any) => state.session.activeBrowserWindowId
  );

  const skipFirst = useRef(true);

  const structureKey = [
    workspaceId || "",
    activeWindowId || "",
    activeTabId || "",
    activeBrowserWindowId || "",
    Object.keys(openWindows || {}).sort().join(","),
    Object.keys(openTabs || {}).sort().join(","),
    JSON.stringify(windowTabs || {}),
    JSON.stringify(activeTabs || {}),
    JSON.stringify(browserWindows || []),
  ].join("|");

  useEffect(() => {
    if (!workspaceId) {
      return;
    }
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    schedulePersistOpenState("structure-change");
  }, [structureKey, workspaceId]);

  return null;
}

export default PersistOpenStateHub;
