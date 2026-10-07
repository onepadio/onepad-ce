import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "reactstrap";
import { Plus } from "react-bootstrap-icons";
import log from "loglevel";

import LaunchIcon from "../LaunchIcon/LaunchIcon";
import LinkIcon from "../LinkIcon/LinkIcon";
import { modalActions } from "../../store/modal-slice";
import { storeActions } from "../../store/store-slice";
import { getTabScreenshot } from "../../util/browserTabGroups";

import LaunchPad3DStage, { type Desktop3DHudSlots } from "./LaunchPad3DStage";
import { resolveIconUrl } from "./resolveIconUrl";
import { getMissionColumns, getSceneColumns } from "./layouts/layoutMath";
import type { LaunchPadCard, Launchpad3dLayoutId } from "./types";

import "./LaunchPad3D.css";

interface LaunchPad3DProps {
  /** When true, fills parent without outer chrome */
  embed?: boolean;
  showChrome?: boolean;
  /** Full-viewport 3D desktop scene */
  fullscreen?: boolean;
  hud?: Desktop3DHudSlots;
}

function selectDesktop3dLayout(state: any): Launchpad3dLayoutId {
  return (
    state.settings.desktop3dLayout ||
    state.settings.launchpad3dLayout ||
    "coverflow"
  );
}

function LaunchPad3D({
  embed = false,
  showChrome = true,
  fullscreen = false,
  hud,
}: LaunchPad3DProps) {
  const dispatch = useDispatch();
  const profileId = useSelector((state: any) => state.app.profileId);
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const selectedDesktop = useSelector(
    (state: any) => state.workspace.selectedDesktop
  );
  const apps = useSelector((state: any) => state.workspace.apps);
  const links = useSelector((state: any) => state.workspace.links);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const searchQuery = useSelector(
    (state: any) => state.launchpad.searchQuery || ""
  );
  const appsLimit = useSelector((state: any) => state.app.appsLimit);
  const layout = useSelector(selectDesktop3dLayout);
  const screenShotStatusVersion = useSelector(
    (state: any) => state.app.screenShotStatusVersion
  );

  const bridgeRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [browseOffset, setBrowseOffset] = useState(0);

  const allItems = useMemo(() => {
    let visibleApps = apps || [];
    if (appsLimit > 0) {
      visibleApps = visibleApps.slice(0, appsLimit);
    }

    let items: any[] = [];
    visibleApps.forEach((item: any) => {
      items.push({ ...item, type: "app" });
    });
    (links || []).forEach((item: any) => {
      const data = { ...item.data, name: item.data?.title };
      items.push({ ...item, type: "link", data });
    });

    items = items.filter((item) => item.workspace !== profileId);

    if (selectedDesktop?.state?.iconOrder?.length > 0) {
      const iconOrder = selectedDesktop.state.iconOrder;
      const ordered: any[] = [];
      const byId = new Map(items.map((item: any) => [item.id, item]));
      iconOrder.forEach((id: string) => {
        if (byId.has(id)) {
          ordered.push(byId.get(id));
          byId.delete(id);
        }
      });
      byId.forEach((item) => ordered.push(item));
      items = ordered;
    } else {
      items.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
    }

    if (searchQuery.length > 0) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item: any) => {
        const name = (item.data?.name || item.data?.title || "").toLowerCase();
        return name.includes(q);
      });
    }

    return items;
  }, [apps, links, appsLimit, profileId, selectedDesktop, searchQuery]);

  const cards: LaunchPadCard[] = useMemo(() => {
    return allItems.map((item: any) => {
      const isApp = item.type === "app";
      const url = isApp
        ? item.data?.customUrl?.length > 0
          ? item.data.customUrl
          : item.data?.startUrl
        : item.data?.startUrl;
      const title = isApp
        ? item.data?.name || "App"
        : item.data?.title || item.data?.name || "Link";
      const icon = resolveIconUrl(item.data?.icon, url);

      // Prefer live screenshot of the active tab for open windows
      let imageUrl: string | null = icon;
      if (openWindows[item.id]) {
        const tabId = activeTabs?.[item.id];
        if (tabId) {
          const shot = getTabScreenshot(tabId);
          if (shot) imageUrl = shot;
        }
      }

      return {
        id: item.id,
        title,
        imageUrl,
        kind: isApp ? "app" : "link",
        subtitle: url,
        isActive: !!openWindows[item.id],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, openWindows, activeTabs, screenShotStatusVersion]);

  useEffect(() => {
    if (cards.length === 0) {
      setFocusedIndex(0);
      return;
    }
    if (layout === "coverflow") {
      // Cover Flow opens centered on the middle icon
      setFocusedIndex(Math.floor((cards.length - 1) / 2));
      return;
    }
    setFocusedIndex((prev) => Math.min(prev, cards.length - 1));
  }, [cards.length, layout]);

  const activateCard = useCallback((id: string) => {
    const root = bridgeRef.current;
    if (!root) return;
    const host = root.querySelector(
      `[data-launchpad-3d-id="${id}"]`
    ) as HTMLElement | null;
    if (!host) {
      log.warn("LaunchPad3D: bridge icon not found", id);
      return;
    }
    const clickable = host.querySelector(
      ".launch-item, .link-item, .card"
    ) as HTMLElement | null;
    (clickable || host).click();
  }, []);

  const onBrowseDelta = useCallback(
    (delta: number) => {
      if (cards.length === 0) return;
      setBrowseOffset(0);
      setFocusedIndex((prev) => {
        const next = (prev + delta + cards.length) % cards.length;
        return next;
      });
    },
    [cards.length]
  );

  const onBrowseRowDelta = useCallback(
    (delta: number) => {
      if (cards.length === 0) return;
      const cols =
        layout === "scene"
          ? getSceneColumns(cards.length)
          : getMissionColumns(cards.length);
      setBrowseOffset(0);
      setFocusedIndex((prev) => {
        let next = prev + delta * cols;
        if (next < 0) next = prev;
        if (next >= cards.length) next = prev;
        return next;
      });
    },
    [cards.length, layout]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (cards.length === 0) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onBrowseDelta(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onBrowseDelta(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (layout === "mission" || layout === "scene") onBrowseRowDelta(-1);
        else onBrowseDelta(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (layout === "mission" || layout === "scene") onBrowseRowDelta(1);
        else onBrowseDelta(1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const card = cards[focusedIndex];
        if (card) activateCard(card.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cards, focusedIndex, onBrowseDelta, onBrowseRowDelta, activateCard, layout]);

  function toggleAppStore() {
    dispatch(storeActions.setSelectedStore("web"));
    dispatch(modalActions.setLocation("launchpad"));
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleAppStoreModal());
  }

  return (
    <div
      className={
        fullscreen
          ? "launchpad-3d-root launchpad-3d-root-fullscreen"
          : embed
            ? "launchpad-3d-root launchpad-3d-root-embed"
            : "launchpad-3d-root"
      }
    >
      {showChrome && !fullscreen && (
        <div className="launchpad-3d-header">
          <div className="d-flex align-items-center justify-content-between w-100">
            <span className="launchpad-3d-workspace-name">{workspace?.name}</span>
            <div className="d-flex align-items-center gap-2">
              <Button
                id="space-apps-add-button-3d"
                color="light"
                className="btn-sm"
                onClick={toggleAppStore}
              >
                <Plus />
              </Button>
            </div>
          </div>
          <div className="launchpad-3d-divider" />
        </div>
      )}

      {cards.length === 0 && !fullscreen ? (
        <div className="launchpad-3d-empty">No apps yet — add one to get started</div>
      ) : (
        <LaunchPad3DStage
          className={
            fullscreen ? "launchpad-3d-stage launchpad-3d-stage-fullscreen" : "launchpad-3d-stage"
          }
          cards={cards}
          layout={layout}
          focusedIndex={focusedIndex}
          browseOffset={browseOffset}
          onSelect={activateCard}
          onFocusIndex={setFocusedIndex}
          onBrowseDelta={onBrowseDelta}
          onBrowseRowDelta={onBrowseRowDelta}
          fullscreen={fullscreen}
          hud={
            fullscreen
              ? {
                  ...hud,
                  top: (
                    <>
                      {hud?.top}
                      {cards.length === 0 ? (
                        <div className="launchpad-3d-empty launchpad-3d-empty-inline">
                          No apps yet — add one to get started
                        </div>
                      ) : null}
                    </>
                  ),
                }
              : hud
          }
          active
        />
      )}

      {/* Hidden icon bridge so open logic stays identical to 2D LaunchPadBody */}
      <div
        ref={bridgeRef}
        className="launchpad-3d-icon-bridge"
        aria-hidden="true"
      >
        {allItems.map((item: any) =>
          item.type === "app" ? (
            <div key={item.id} data-launchpad-3d-id={item.id}>
              <LaunchIcon
                id={item.id}
                data={item}
                iconid={item.id}
                uuid={item.id}
                localid={item.id}
                name={item.data.name}
                url={
                  item.data.customUrl?.length > 0
                    ? item.data.customUrl
                    : item.data.startUrl
                }
                icon={item.data.icon}
                isOpen={openWindows.hasOwnProperty(item.id)}
                windowConfig={item.data.window}
                autoSave={item.data.autoSave}
                isStateful={true}
                showControls={true}
                isInEditMode={false}
                workspaceId={workspace.id}
                desktopId={selectedDesktop.id}
                isolated={item.data.isolated ? item.data.isolated : false}
                showStatusDot={false}
              />
            </div>
          ) : (
            <div key={item.id} data-launchpad-3d-id={item.id}>
              <LinkIcon
                id={item.id}
                data={item}
                url={item.data.startUrl}
                title={item.data.title}
                icon={item.data.icon}
                isInEditMode={false}
                isOpen={openWindows.hasOwnProperty(item.id)}
                workspaceId={workspace.id}
                desktopId={selectedDesktop.id}
                windowType={
                  item.data.windowType ? item.data.windowType : "internal"
                }
                showStatusDot={false}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default LaunchPad3D;
