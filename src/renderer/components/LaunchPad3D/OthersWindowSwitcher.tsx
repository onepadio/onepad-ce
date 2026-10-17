import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import { PlusLg } from "react-bootstrap-icons";

import { sessionActions } from "../../store/session-slice";
import { appActions } from "../../store/app-slice";
import { getBrowserWindowIds } from "../../util/browserWindows";
import { getTabScreenshot, truncateTabTitle } from "../../util/browserTabGroups";
import { createBrowserGroup } from "../../util/browser";
import { ScreenshotService } from "../../services/screenshot";
import { resolveIconUrl } from "./resolveIconUrl";
import { getWindowLiveActiveTab } from "./windowTab";
import {
  OTHERS_BROWSER_CARD_ID,
  getRepresentativeBrowserWindowId,
} from "./othersBrowser";

import "./OthersWindowSwitcher.css";

function captureWindowActiveTab(
  windowId: string,
  activeTabs: Record<string, string>,
  openTabs: Record<string, any>
) {
  const tabId = activeTabs?.[windowId];
  const tab = (tabId && openTabs[tabId]) || getWindowLiveActiveTab(windowId, activeTabs, openTabs);
  if (!tab?.id || typeof tab.webContentsId !== "number") return;
  if (tab.sleeping || tab.location === "external") return;
  ScreenshotService.capture(tab.webContentsId, tab.id, "OthersWindowSwitcher");
}

interface OthersWindowSwitcherProps {
  /** Desk-front card id from scene */
  deskFrontCardId?: string;
  /** Hide when HUD / My Apps overlay is focused */
  visible?: boolean;
}

type WindowThumb = {
  windowId: string;
  title: string;
  imageUrl: string | null;
  previewMode: "screenshot" | "icon";
  isActive: boolean;
};

/**
 * Horizontal strip of browser-window screenshots when the Others desk
 * screen is selected in overview (not HUD-focused).
 */
function OthersWindowSwitcher({
  deskFrontCardId = "",
  visible = true,
}: OthersWindowSwitcherProps) {
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
  const activeBrowserWindowId = useSelector(
    (state: any) => state.session.activeBrowserWindowId
  );
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const desktop = useSelector(
    (state: any) => state.workspace.selectedDesktop
  );
  const items = useSelector((state: any) => state.workspace.items);
  const isLocal = useSelector((state: any) => state.workspace.isLocal);
  const newTabUrl = useSelector((state: any) => state.browser.newTabUrl);
  const screenShotStatusVersion = useSelector(
    (state: any) => state.app.screenShotStatusVersion
  );

  const thumbs: WindowThumb[] = useMemo(() => {
    const ids = getBrowserWindowIds(
      openWindows || {},
      browserWindows || [],
      windowTabs || {}
    ).filter((id) => {
      if (!workspace?.id) return true;
      return openWindows[id]?.workspace === workspace.id;
    });

    const activeRep = getRepresentativeBrowserWindowId(
      openWindows,
      browserWindows,
      windowTabs,
      activeWindowId,
      workspace?.id,
      activeBrowserWindowId
    );

    return ids.map((windowId) => {
      const win = openWindows[windowId];
      const liveTab = getWindowLiveActiveTab(windowId, activeTabs, openTabs);
      const fallbackTabId = windowTabs?.[windowId]?.[0];
      const metaTab = fallbackTabId ? openTabs[fallbackTabId] : null;
      const tab = liveTab || metaTab;
      const title = truncateTabTitle(
        tab || { state: { title: win?.data?.title || "Browser" } },
        28
      );
      const url = tab?.state?.url || tab?.url || win?.start_url || "";
      const icon = resolveIconUrl(
        tab?.state?.favIcon || win?.icon || win?.data?.icon,
        url
      );
      const shot = tab ? getTabScreenshot(tab.id) : null;
      return {
        windowId,
        title,
        imageUrl: shot || icon,
        previewMode: shot ? ("screenshot" as const) : ("icon" as const),
        isActive: windowId === activeRep,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    openWindows,
    openTabs,
    activeTabs,
    windowTabs,
    browserWindows,
    activeWindowId,
    activeBrowserWindowId,
    workspace?.id,
    screenShotStatusVersion,
  ]);

  /** Keyed by imageUrl so a later screenshot isn't blocked by a failed favicon */
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>(
    {}
  );

  const show =
    visible &&
    deskFrontCardId === OTHERS_BROWSER_CARD_ID &&
    thumbs.length >= 1;

  const handleNewWindow = useCallback(() => {
    const homePage = newTabUrl || "https://www.google.com/";
    createBrowserGroup(
      openWindows,
      items,
      isLocal,
      desktop,
      workspace,
      dispatch,
      homePage,
      (browserWindows || []).length
    );
  }, [
    newTabUrl,
    openWindows,
    items,
    isLocal,
    desktop,
    workspace,
    dispatch,
    browserWindows,
  ]);

  const handleSelect = useCallback(
    (windowId: string) => {
      const win = openWindows[windowId];
      if (!win) return;
      // Capture the outgoing window while its webview is still painted
      const currentRep = getRepresentativeBrowserWindowId(
        openWindows,
        browserWindows,
        windowTabs,
        activeWindowId,
        workspace?.id,
        activeBrowserWindowId
      );
      if (currentRep && currentRep !== windowId) {
        captureWindowActiveTab(currentRep, activeTabs, openTabs);
      }
      dispatch(sessionActions.setActiveBrowserWindowId({ data: windowId }));
      dispatch(sessionActions.setActiveWindow({ data: win }));
      // Capture the incoming window after it paints on the desk
      setTimeout(() => {
        captureWindowActiveTab(windowId, activeTabs, openTabs);
        dispatch(appActions.updateScreenShotStatusVersion());
      }, 500);
    },
    [
      dispatch,
      openWindows,
      browserWindows,
      windowTabs,
      activeWindowId,
      activeBrowserWindowId,
      workspace?.id,
      activeTabs,
      openTabs,
    ]
  );

  if (!show) return null;

  return (
    <div
      className="others-window-switcher"
      role="listbox"
      aria-label="Switch browser window"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="others-window-switcher-row">
        <div className="others-window-switcher-scroll">
          {thumbs.map((thumb) => {
            const imgKey = thumb.imageUrl || "";
            const showImg =
              !!thumb.imageUrl &&
              !brokenImages[imgKey] &&
              (thumb.previewMode === "screenshot" ||
                thumb.imageUrl.startsWith("data:image/"));
            return (
              <button
                key={thumb.windowId}
                type="button"
                role="option"
                aria-selected={thumb.isActive}
                className={clsx(
                  "others-window-switcher-item",
                  thumb.isActive && "is-active",
                  (!showImg || thumb.previewMode === "icon") && "is-icon"
                )}
                title={thumb.title}
                onClick={() => handleSelect(thumb.windowId)}
              >
                <span className="others-window-switcher-frame">
                  {showImg ? (
                    <img
                      src={thumb.imageUrl!}
                      alt=""
                      draggable={false}
                      className="others-window-switcher-img"
                      onError={() =>
                        setBrokenImages((prev) => ({
                          ...prev,
                          [imgKey]: true,
                        }))
                      }
                    />
                  ) : (
                    <span className="others-window-switcher-placeholder" />
                  )}
                </span>
                <span className="others-window-switcher-label">{thumb.title}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="others-window-switcher-item others-window-switcher-new"
          title="New window"
          aria-label="New browser window"
          onClick={handleNewWindow}
        >
          <span className="others-window-switcher-frame others-window-switcher-new-frame">
            <PlusLg size={22} />
          </span>
          <span className="others-window-switcher-label">New</span>
        </button>
      </div>
    </div>
  );
}

export default OthersWindowSwitcher;
