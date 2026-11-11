import isElectron from "is-electron";
import log from "loglevel";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";

import { openInternalWindow } from "../../services/window";
import { appActions } from "../../store/app-slice";
import { modalActions } from "../../store/modal-slice";
import { sessionActions } from "../../store/session-slice";
import { createBrowserGroup } from "../../util/browser";
import { createNavHistoryState } from "../../util/navHistory";
import { isValidDomain4 } from "../../util/search";
import { resolveIconUrl } from "../LaunchPad3D/resolveIconUrl";

import "./CenterSearchOverlay.css";

type SpaceSearchItem = {
  id: string;
  type: "app" | "link";
  title: string;
  url: string;
  icon: string;
  raw: any;
};

function CenterSearchOverlay() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: any) => state.modal.isCenterSearchOpen);
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const apps = useSelector((state: any) => state.workspace.apps) || [];
  const links = useSelector((state: any) => state.workspace.links) || [];
  const items = useSelector((state: any) => state.workspace.items);
  const isLocal = useSelector((state: any) => state.workspace.isLocal);
  const profileId = useSelector((state: any) => state.workspace.profileId);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const browserWindows = useSelector(
    (state: any) => state.session.browserWindows
  );
  const searchEngine = useSelector(
    (state: any) => state.windowService.searchEngine
  );
  const user = useSelector((state: any) => state.user);
  const route = useSelector((state: any) => state.session.route);
  const sessionState = useSelector((state: any) => state.session);
  const workspaceState = useSelector((state: any) => state.workspace);

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isOpenRef = useRef(isOpen);
  const lastToggleAtRef = useRef(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const close = useCallback(() => {
    dispatch(modalActions.hideCenterSearch());
    setQuery("");
  }, [dispatch]);

  const toggle = useCallback(() => {
    const now = Date.now();
    // Global shortcut + in-window keydown can both fire for one press
    if (now - lastToggleAtRef.current < 250) return;
    lastToggleAtRef.current = now;

    if (isOpenRef.current) {
      dispatch(modalActions.hideCenterSearch());
      setQuery("");
    } else {
      dispatch(modalActions.showCenterSearch());
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && !event.metaKey && event.code === "Space") {
        event.preventDefault();
        event.stopPropagation();
        toggle();
        return;
      }

      if (!isOpenRef.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    // @ts-expect-error electronAPI injected at runtime
    const handleMainMessage = (_event: any, data: any) => {
      if (data?.action === "ctrl-space-pressed") {
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    if (isElectron()) {
      // @ts-expect-error
      window.electronAPI?.receive("fromMain", handleMainMessage);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      if (isElectron()) {
        // @ts-expect-error
        window.electronAPI?.removeListener("fromMain", handleMainMessage);
      }
    };
  }, [close, toggle]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        close();
      }
    };
    window.addEventListener("pointerdown", onPointer, true);
    return () => window.removeEventListener("pointerdown", onPointer, true);
  }, [close, isOpen]);

  const spaceItems: SpaceSearchItem[] = useMemo(() => {
    const list: SpaceSearchItem[] = [];

    (apps || []).forEach((app: any) => {
      if (profileId && app.workspace === profileId) return;
      const url =
        app.data?.customUrl?.length > 0
          ? app.data.customUrl
          : app.data?.startUrl || "";
      list.push({
        id: app.id,
        type: "app",
        title: app.data?.name || "App",
        url,
        icon: resolveIconUrl(app.data?.icon, url),
        raw: app,
      });
    });

    (links || []).forEach((link: any) => {
      if (profileId && link.workspace === profileId) return;
      const url = link.data?.startUrl || "";
      list.push({
        id: link.id,
        type: "link",
        title: link.data?.title || link.data?.name || "Link",
        url,
        icon: resolveIconUrl(link.data?.icon, url),
        raw: link,
      });
    });

    return list;
  }, [apps, links, profileId]);

  const matchedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return spaceItems
      .filter((item) => item.title.toLowerCase().includes(q))
      .slice(0, 24);
  }, [query, spaceItems]);

  function getPartitionId(item: SpaceSearchItem) {
    let partition = "";
    if (route === "authenticated") {
      partition =
        sessionState.isInSession &&
        workspaceState.currentSession &&
        workspaceState.currentSession.isolated
          ? "persist:" + user.username + "_" + workspaceState.currentSession.id
          : "persist:" + user.username + "_" + workspace.id;
    } else {
      partition =
        sessionState.isInSession &&
        workspaceState.currentSession &&
        workspaceState.currentSession.isolated
          ? "persist:" + workspaceState.currentSession.id
          : "persist:" + workspace.id;
    }

    if (item.raw?.workspace === "all" || item.raw?.data?.isolated) {
      partition = "persist:" + item.id;
    }

    return partition;
  }

  function newItemTab(
    item: SpaceSearchItem,
    url: string,
    icon: string,
    title: string
  ) {
    const now = Date.now();
    return {
      id: uuidv4(),
      url,
      location: "main",
      type: item.type,
      desktop: desktop.id,
      workspace: workspace.id,
      window: item.id,
      state: createNavHistoryState(url, title, icon),
      created: now,
      lastAccessed: now,
      sleeping: true,
      isolated: !!item.raw?.data?.isolated,
      partition: getPartitionId(item),
    };
  }

  function activateItem(item: SpaceSearchItem) {
    close();

    if (openWindows?.[item.id] != null) {
      dispatch(sessionActions.setActiveWindow({ data: openWindows[item.id] }));
      if (openWindows[item.id].sleeping === true) {
        dispatch(appActions.showSplashScreen({}));
      }
      return;
    }

    if (!item.url) {
      log.warn("Center search item has no URL", item.id);
      return;
    }

    const catalog = items || [...(apps || []), ...(links || [])];
    const nextOpenWindows = Object.assign({}, openWindows);
    const nextOpenTabs = Object.assign({}, openTabs);
    const nextWindowTabs = Object.assign({}, windowTabs);

    openInternalWindow(
      {
        workspace: workspace.id,
        id: item.id,
        url: item.url,
        location: "main",
      },
      catalog,
      openWindows,
      isLocal,
      (result: any) => {
        if (result == null) return;

        const windowRecord = Object.assign({}, result, {
          type: item.type,
          url: item.url,
          location: "main",
          desktop: desktop.id,
          workspace: workspace.id,
          partition: getPartitionId(item),
        });

        nextOpenWindows[item.id] = windowRecord;
        dispatch(
          sessionActions.setOpenWindows({
            data: nextOpenWindows,
          })
        );

        const tab = newItemTab(
          item,
          item.url,
          result.data?.icon || item.raw?.data?.icon,
          item.title
        );
        nextOpenTabs[tab.id] = tab;
        nextWindowTabs[item.id] = [tab.id];

        dispatch(
          sessionActions.setOpenTabs({
            data: nextOpenTabs,
          })
        );
        dispatch(
          sessionActions.setWindowTabs({
            data: nextWindowTabs,
          })
        );
        dispatch(sessionActions.setActiveWindow({ data: windowRecord }));
        dispatch(appActions.showSplashScreen({}));
      }
    );
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const raw = query.trim();
    if (!raw) return;

    const stripped = raw.replace(/^https?:\/\//i, "");
    let url = "";

    if (isValidDomain4(stripped) || isValidDomain4(raw)) {
      url = /^https?:\/\//i.test(raw) ? raw : `https://${stripped}`;
    } else {
      const engine =
        searchEngine?.search || "https://www.google.com/search?q=";
      url = engine + encodeURIComponent(raw);
    }

    createBrowserGroup(
      openWindows,
      items || links,
      isLocal,
      desktop,
      workspace,
      dispatch,
      url,
      (browserWindows || []).length
    );

    close();
  }

  if (!isOpen) return null;

  return (
    <div className="center-search-overlay" role="dialog" aria-modal="true">
      <div className="center-search-panel" ref={panelRef}>
        <form
          className="center-search-form"
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Layout.tsx preventDefaults Enter globally — handle submit here.
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit();
            }
          }}
        >
          <input
            ref={inputRef}
            id="centerSearchBar"
            className="center-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps, or enter a website address"
            aria-label="Search address bar"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="center-search-go">
            Go
          </button>
        </form>

        {query.trim().length > 0 && (
          <div className="center-search-results" role="listbox">
            {matchedItems.length === 0 ? (
              <div className="center-search-empty">No matching apps</div>
            ) : (
              matchedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="center-search-result"
                  title={item.title}
                  onClick={() => activateItem(item)}
                >
                  <img
                    className="center-search-result-icon"
                    src={item.icon}
                    alt=""
                  />
                  <span className="center-search-result-label">
                    {item.title}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CenterSearchOverlay;
