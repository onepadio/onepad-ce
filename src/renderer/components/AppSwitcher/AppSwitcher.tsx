import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import isElectron from "is-electron";

import { modalActions } from "../../store/modal-slice";
import { sessionActions } from "../../store/session-slice";
import { appActions } from "../../store/app-slice";
import {
  getAppSwitcherEntries,
  type AppSwitcherEntry,
} from "../../util/appSwitcher";
import AppSwitcherBody from "./AppSwitcherBody";
import "./AppSwitcher.css";

function AppSwitcher() {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(false);

  const isAppSwitcherOpen = useSelector(
    (state: any) => state.modal.isAppSwitcherOpen
  );
  const appSwitcherSelectedIndex = useSelector(
    (state: any) => state.modal.appSwitcherSelectedIndex
  );
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const windowHistory = useSelector(
    (state: any) => state.session.windowHistory
  );
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const homeWorkspaceId = useSelector(
    (state: any) => state.user.homeWorkspace
  );

  const entries = useMemo(
    () =>
      getAppSwitcherEntries({
        openWindows,
        openTabs,
        windowTabs,
        activeTabs,
        activeWindowId,
        windowHistory,
        workspaceId: workspace?.id,
        homeWorkspaceId,
      }),
    [
      openWindows,
      openTabs,
      windowTabs,
      activeTabs,
      activeWindowId,
      windowHistory,
      workspace?.id,
      homeWorkspaceId,
    ]
  );

  const entriesRef = useRef(entries);
  const selectedIndexRef = useRef(appSwitcherSelectedIndex);
  const isOpenRef = useRef(isAppSwitcherOpen);
  const isCtrlTabActiveRef = useRef(false);
  const lastCycleAtRef = useRef(0);
  const activeWindowIdRef = useRef(activeWindowId);
  const openWindowsRef = useRef(openWindows);
  const windowTabsRef = useRef(windowTabs);
  const activeTabsRef = useRef(activeTabs);
  const openTabsRef = useRef(openTabs);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    selectedIndexRef.current = appSwitcherSelectedIndex;
  }, [appSwitcherSelectedIndex]);

  useEffect(() => {
    isOpenRef.current = isAppSwitcherOpen;
  }, [isAppSwitcherOpen]);

  useEffect(() => {
    activeWindowIdRef.current = activeWindowId;
  }, [activeWindowId]);

  useEffect(() => {
    openWindowsRef.current = openWindows;
  }, [openWindows]);

  useEffect(() => {
    windowTabsRef.current = windowTabs;
  }, [windowTabs]);

  useEffect(() => {
    activeTabsRef.current = activeTabs;
  }, [activeTabs]);

  useEffect(() => {
    openTabsRef.current = openTabs;
  }, [openTabs]);

  useEffect(() => {
    if (isAppSwitcherOpen) {
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
  }, [isAppSwitcherOpen]);

  const activateEntry = useCallback(
    (entry: AppSwitcherEntry) => {
      const app = entry?.window || openWindowsRef.current?.[entry?.id];
      console.log("[app-switcher] activateEntry", {
        entryId: entry?.id,
        appId: app?.id,
        activeWindowId: activeWindowIdRef.current,
      });
      if (!app) {
        console.log("[app-switcher] activateEntry: no app found");
        return;
      }

      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.hideAppSwitcher());
      isOpenRef.current = false;
      isCtrlTabActiveRef.current = false;

      if (app.id === activeWindowIdRef.current) {
        console.log("[app-switcher] already active, skip");
        return;
      }

      // Always activate — 3D DesktopWindows3D zooms HUD from activeWindowId
      console.log("[app-switcher] setActiveWindow", app.id, app.type);
      dispatch(sessionActions.setActiveWindow({ data: app }));

      const tabIds = windowTabsRef.current?.[app.id] || [];
      const activeTabForApp = activeTabsRef.current?.[app.id];
      const wakeTab =
        (activeTabForApp && openTabsRef.current?.[activeTabForApp]) ||
        (tabIds[0] && openTabsRef.current?.[tabIds[0]]);
      if (app.sleeping === true || wakeTab?.sleeping === true) {
        dispatch(appActions.showSplashScreen({}));
      }
    },
    [dispatch]
  );

  const activateSelected = useCallback(() => {
    const list = entriesRef.current;
    const index = selectedIndexRef.current;
    const entry = list[index] || list[0];
    console.log("[app-switcher] activateSelected", {
      index,
      entryId: entry?.id,
      total: list.length,
    });
    if (entry) activateEntry(entry);
  }, [activateEntry]);

  const handleSwitcherCycle = useCallback(
    (isReverse: boolean, source: string) => {
      const now = Date.now();
      // ipc + keydown can both fire for one physical Ctrl+Tab
      if (now - lastCycleAtRef.current < 80) {
        console.log("[app-switcher] ignoring duplicate cycle from", source);
        return;
      }
      lastCycleAtRef.current = now;

      const list = entriesRef.current;
      console.log("[app-switcher] cycle from", source, {
        entryCount: list.length,
        entryIds: list.map((e) => e.id),
        isOpen: isOpenRef.current,
        selectedIndex: selectedIndexRef.current,
      });

      if (list.length === 0) {
        console.log("[app-switcher] no eligible entries");
        return;
      }

      isCtrlTabActiveRef.current = true;

      if (!isOpenRef.current) {
        // Keep refs in sync immediately so Ctrl-release before paint still commits
        isOpenRef.current = true;
        const initialIndex =
          list.length > 1 ? (isReverse ? list.length - 1 : 1) : 0;
        selectedIndexRef.current = initialIndex;
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(modalActions.showAppSwitcher());
        dispatch(modalActions.setAppSwitcherSelectedIndex(initialIndex));
        console.log("[app-switcher] opened overlay at index", initialIndex);
        return;
      }

      const current = selectedIndexRef.current;
      const nextIndex = isReverse
        ? (current - 1 + list.length) % list.length
        : (current + 1) % list.length;
      selectedIndexRef.current = nextIndex;
      dispatch(modalActions.setAppSwitcherSelectedIndex(nextIndex));
      console.log("[app-switcher] cycled to index", nextIndex);
    },
    [dispatch]
  );

  // Ctrl+Tab from main process (global shortcut) + in-window fallback
  useEffect(() => {
    if (!isElectron()) {
      console.log("[app-switcher] not electron, skipping shortcut listener");
      return;
    }

    console.log(
      "[app-switcher] listener mounted, electronAPI=",
      !!window.electronAPI,
      "entries=",
      entriesRef.current.length
    );

    const commitSelection = () => {
      if (!isCtrlTabActiveRef.current) return;
      console.log(
        "[app-switcher] commit selection index=",
        selectedIndexRef.current,
        "open=",
        isOpenRef.current
      );
      isCtrlTabActiveRef.current = false;
      if (isOpenRef.current) {
        activateSelected();
      }
    };

    // @ts-expect-error
    const handleMainMessage = (_event, data) => {
      if (!data?.action) return;

      if (data.action === "ctrl-key-released") {
        if (isCtrlTabActiveRef.current) {
          console.log("[app-switcher] ctrl-key-released (ipc)");
        }
        commitSelection();
        return;
      }

      if (data.action === "ctrl-tab-pressed") {
        handleSwitcherCycle(false, "ipc");
        return;
      }

      if (data.action === "ctrl-shift-tab-pressed") {
        handleSwitcherCycle(true, "ipc");
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Control" || event.key === "Meta") {
        commitSelection();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // In-window fallback when global shortcut fails / isn't delivered
      if (event.ctrlKey && !event.metaKey && event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        handleSwitcherCycle(event.shiftKey, "keydown");
        return;
      }

      if (!isOpenRef.current) return;
      if (event.key === "Escape") {
        isCtrlTabActiveRef.current = false;
        isOpenRef.current = false;
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(modalActions.hideAppSwitcher());
      }
    };

    // @ts-expect-error
    window.electronAPI?.receive("fromMain", handleMainMessage);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      // @ts-expect-error
      window.electronAPI?.removeListener("fromMain", handleMainMessage);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [dispatch, activateSelected, handleSwitcherCycle]);

  function hideSwitcher() {
    if (isCtrlTabActiveRef.current) return;
    setIsVisible(false);
    isOpenRef.current = false;
    setTimeout(() => {
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.hideAppSwitcher());
    }, 160);
  }

  if (!isAppSwitcherOpen && !isVisible) {
    return null;
  }

  return (
    <>
      <div
        id="app-switcher-backdrop"
        className={`app-switcher-backdrop ${isVisible ? "visible" : ""}`}
        onClick={() => hideSwitcher()}
      />
      <div
        id="app-switcher-modal"
        className={`app-switcher-modal ${isVisible ? "visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Switch apps"
      >
        <AppSwitcherBody onActivate={activateEntry} />
      </div>
    </>
  );
}

export default AppSwitcher;
