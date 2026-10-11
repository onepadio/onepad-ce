import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { sessionActions } from "../../store/session-slice";
import { windowServiceActions } from "../../store/window-service-slice";
import { isOnlineToolWindow } from "../../builtin";
import { isSharedAppWindow } from "../../util/sharedApps";
import { resolveIconUrl } from "./resolveIconUrl";
import { getTabScreenshot } from "../../util/browserTabGroups";
import { getSceneMaxCards } from "./layouts/layoutMath";
import { getWindowLiveActiveTab } from "./windowTab";
import LaunchPad3DStage from "./LaunchPad3DStage";
import type { LaunchPadCard } from "./types";
import {
  OTHERS_BROWSER_CARD_ID,
  getRepresentativeBrowserWindowId,
  isBrowserTypeWindow,
  isOthersBrowserActive,
} from "./othersBrowser";

import "./LaunchPad3D.css";

interface DesktopWindows3DProps {
  onZoomedChange?: (zoomed: boolean, windowId: string | null) => void;
  /** Increment to force overview (e.g. launchpad overlay opened) */
  clearZoomToken?: number;
  className?: string;
  /** Override workspace filter (warm-space keep-alive) */
  workspaceId?: string | null;
  /** When false, pause WebGL frameloop */
  sceneActive?: boolean;
  exploreMode?: boolean;
  onExploreModeChange?: (explore: boolean) => void;
  experienceId?: string | null;
  /** My Apps / xapp overlay owns input — freeze scene controls */
  overlayAppFocused?: boolean;
  overlayWindowId?: string | null;
}

function windowToCard(
  win: any,
  cardId: string,
  opts: {
    activeTabs: any;
    openTabs: any;
    windowTabs: any;
    activeWindowId: string | null;
    titleOverride?: string;
    forceActive?: boolean;
  }
): LaunchPadCard {
  const liveTab = getWindowLiveActiveTab(win.id, opts.activeTabs, opts.openTabs);
  const fallbackTabId = opts.windowTabs?.[win.id]?.[0];
  const metaTab = liveTab || (fallbackTabId ? opts.openTabs[fallbackTabId] : null);
  // Title = app / link name; subtitle = active tab page title (fallback URL)
  const title =
    opts.titleOverride ||
    win.name ||
    win.data?.name ||
    win.data?.title ||
    "Window";
  const pageTitle =
    liveTab?.state?.title ||
    liveTab?.title ||
    metaTab?.state?.title ||
    metaTab?.title ||
    "";
  const url =
    liveTab?.state?.url ||
    liveTab?.url ||
    win.start_url ||
    win.data?.startUrl ||
    "";
  const icon = resolveIconUrl(
    liveTab?.state?.favIcon ||
      win.icon ||
      win.data?.icon ||
      metaTab?.state?.favIcon,
    url
  );
  const shot = liveTab ? getTabScreenshot(liveTab.id) : null;
  return {
    id: cardId,
    title,
    imageUrl: shot || icon,
    kind: "tab" as const,
    subtitle: pageTitle || url || undefined,
    isActive: opts.forceActive ?? opts.activeWindowId === win.id,
    isSleeping: !!(win.sleeping || (!liveTab && metaTab?.sleeping)),
    hasLiveTab: !!liveTab,
    previewMode: shot ? "screenshot" : "icon",
  };
}

/**
 * Scene-only 3D desktop of open windows.
 * Browser windows share one "Others" screen — switch via dock / VerticalTabBar / BrowserTabSwitcher.
 */
function DesktopWindows3D({
  onZoomedChange,
  clearZoomToken = 0,
  className,
  workspaceId: workspaceIdProp = null,
  sceneActive = true,
  exploreMode = false,
  onExploreModeChange,
  experienceId = null,
  overlayAppFocused = false,
  overlayWindowId = null,
}: DesktopWindows3DProps) {
  const dispatch = useDispatch();
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const browserWindows = useSelector(
    (state: any) => state.session.browserWindows
  );
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const selectedWorkspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const workspace =
    workspaceIdProp && selectedWorkspace?.id !== workspaceIdProp
      ? { ...selectedWorkspace, id: workspaceIdProp }
      : selectedWorkspace;
  const selectedDesktop = useSelector(
    (state: any) => state.workspace.selectedDesktop
  );
  const homeWorkspaceId = useSelector((state: any) => state.user.homeWorkspace);
  const screenShotStatusVersion = useSelector(
    (state: any) => state.app.screenShotStatusVersion
  );

  const [focusedIndex, setFocusedIndex] = useState(0);
  const [externalZoomCardId, setExternalZoomCardId] = useState<string | null>(
    null
  );
  const [externalClearZoom, setExternalClearZoom] = useState(false);

  const cards: LaunchPadCard[] = useMemo(() => {
    const windows = Object.values(openWindows).filter((window: any) => {
      const isValidType =
        window.type === "app" ||
        window.type === "link" ||
        window.type === "xapp" ||
        window.type === "browser";
      if (!isValidType) return false;
      // My Apps / xapps: overlay-only — never scene cards
      if (isSharedAppWindow(window, homeWorkspaceId)) return false;
      if (isOnlineToolWindow(window)) return false;
      if (window.type === "xapp") return false;
      return window.workspace === workspace?.id;
    }) as any[];

    // Apps/links/xapps only — browsers collapse into a single Others card
    const nonBrowser = windows.filter((w) => !isBrowserTypeWindow(w));
    const maxNonBrowser = Math.max(0, getSceneMaxCards() - 1);
    const appCards = nonBrowser.slice(0, maxNonBrowser).map((win) =>
      windowToCard(win, win.id, {
        activeTabs,
        openTabs,
        windowTabs,
        activeWindowId,
      })
    );

    const repId = getRepresentativeBrowserWindowId(
      openWindows,
      browserWindows,
      windowTabs,
      activeWindowId,
      workspace?.id
    );
    if (repId && openWindows[repId]) {
      appCards.push(
        windowToCard(openWindows[repId], OTHERS_BROWSER_CARD_ID, {
          activeTabs,
          openTabs,
          windowTabs,
          activeWindowId,
          titleOverride: "Others",
          forceActive: isOthersBrowserActive(activeWindowId, openWindows),
        })
      );
    }

    // Ring order is opposite of Object.values / dock insertion order
    return appCards;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    openWindows,
    openTabs,
    activeTabs,
    windowTabs,
    browserWindows,
    activeWindowId,
    workspace,
    homeWorkspaceId,
    screenShotStatusVersion,
  ]);

  useEffect(() => {
    setFocusedIndex((prev) =>
      cards.length === 0 ? 0 : Math.min(prev, cards.length - 1)
    );
  }, [cards.length]);

  // User clicked a scene card → activate opens HUD via externalZoom
  const cardIdsKey = cards.map((c) => c.id).join("|");
  useEffect(() => {
    if (!activeWindowId || activeWindowId === "launchpad") {
      setExternalZoomCardId(null);
      return;
    }
    const zoomCardId = isOthersBrowserActive(activeWindowId, openWindows)
      ? OTHERS_BROWSER_CARD_ID
      : activeWindowId;
    if (!cardIdsKey.split("|").includes(zoomCardId)) return;
    setExternalClearZoom(false);
    setExternalZoomCardId(zoomCardId);
  }, [activeWindowId, cardIdsKey, openWindows]);

  // Dock: orbit card to desk front only — no activate / HUD
  const bringToFrontCardId = useSelector(
    (state: any) => state.windowService.desktop3dBringToFrontCardId || ""
  );
  const bringToFrontToken = useSelector(
    (state: any) => state.windowService.desktop3dBringToFrontToken || 0
  );
  const appliedBringTokenRef = useRef(0);
  useEffect(() => {
    if (!bringToFrontToken || !bringToFrontCardId) return;
    // Only apply once per dock action — re-running on cards/activate would clear HUD
    if (appliedBringTokenRef.current === bringToFrontToken) return;
    appliedBringTokenRef.current = bringToFrontToken;

    let cardId = bringToFrontCardId;
    if (
      cardId.startsWith("browser_") ||
      isOthersBrowserActive(cardId, openWindows)
    ) {
      cardId = OTHERS_BROWSER_CARD_ID;
    }
    const i = cards.findIndex((c) => c.id === cardId);
    if (i < 0) {
      // Card list may not be ready yet; allow retry on next cards update
      appliedBringTokenRef.current = 0;
      return;
    }
    setExternalZoomCardId(null);
    setExternalClearZoom(true);
    setFocusedIndex(i);
    const t = setTimeout(() => setExternalClearZoom(false), 50);
    return () => clearTimeout(t);
  }, [bringToFrontToken, bringToFrontCardId, cards, openWindows]);

  useEffect(() => {
    if (!clearZoomToken) return;
    setExternalZoomCardId(null);
    setExternalClearZoom(true);
    const t = setTimeout(() => setExternalClearZoom(false), 50);
    return () => clearTimeout(t);
  }, [clearZoomToken]);

  const activateWindow = useCallback(
    (cardId: string) => {
      if (cardId === OTHERS_BROWSER_CARD_ID) {
        const repId = getRepresentativeBrowserWindowId(
          openWindows,
          browserWindows,
          windowTabs,
          activeWindowId,
          workspace?.id
        );
        const win = repId ? openWindows[repId] : null;
        if (!win) return;
        dispatch(sessionActions.setActiveWindow({ data: win }));
        return;
      }
      const win = openWindows[cardId];
      if (!win) return;
      dispatch(sessionActions.setActiveWindow({ data: win }));
    },
    [
      dispatch,
      openWindows,
      browserWindows,
      windowTabs,
      activeWindowId,
      workspace?.id,
    ]
  );

  const deactivateFront = useCallback(() => {
    const desktopId = selectedDesktop?.id;
    if (!desktopId) return;
    setExternalZoomCardId(null);
    dispatch(
      sessionActions.getBackToLaunchPad({
        data: { desktopId },
      })
    );
  }, [dispatch, selectedDesktop?.id]);

  const onFocusIndex = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  // Publish desk-front window so the dock can highlight which app is on the monitor
  useEffect(() => {
    if (!sceneActive) {
      dispatch(windowServiceActions.setDesktop3dDeskWindowId(""));
      return;
    }
    const id = cards[focusedIndex]?.id || "";
    dispatch(windowServiceActions.setDesktop3dDeskWindowId(id));
  }, [dispatch, sceneActive, cards, focusedIndex]);

  useEffect(() => {
    return () => {
      dispatch(windowServiceActions.setDesktop3dDeskWindowId(""));
    };
  }, [dispatch]);

  return (
    <div className={className || "launchpad-3d-root launchpad-3d-root-fullscreen"}>
      <LaunchPad3DStage
        className="launchpad-3d-stage launchpad-3d-stage-fullscreen"
        cards={cards}
        layout="scene"
        focusedIndex={focusedIndex}
        onSelect={activateWindow}
        onFocusIndex={onFocusIndex}
        active
        fullscreen
        projectWebViews
        onZoomedChange={onZoomedChange}
        externalZoomCardId={externalZoomCardId}
        externalClearZoom={externalClearZoom}
        onDeactivateFront={deactivateFront}
        sceneActive={sceneActive}
        exploreMode={exploreMode}
        onExploreModeChange={onExploreModeChange}
        experienceId={experienceId}
        overlayAppFocused={overlayAppFocused}
        overlayWindowId={overlayWindowId}
      />
    </div>
  );
}

export default DesktopWindows3D;
