import isElectron from "is-electron";
import log from "loglevel";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";

import {
  activateBuiltinApp,
  activateOnlineTool,
  getLauncherBuiltinApps,
  getLauncherOnlineTools,
  type BuiltinAppId,
} from "../../builtin";
import { openInternalWindow } from "../../services/window";
import { appActions } from "../../store/app-slice";
import { modalActions } from "../../store/modal-slice";
import { sessionActions } from "../../store/session-slice";
import { createBrowserGroup } from "../../util/browser";
import {
  switchAppTab,
  switchBrowserTab,
} from "../../util/browserTabGroups";
import { createNavHistoryState } from "../../util/navHistory";
import { isValidDomain4 } from "../../util/search";
import { fetchSearchSuggestions } from "../../util/searchSuggestions";
import { resolveIconUrl } from "../LaunchPad3D/resolveIconUrl";

import "./CenterSearchOverlay.css";

type SpaceSearchItem = {
  id: string;
  type: "app" | "link" | "builtin" | "online-tool";
  title: string;
  url: string;
  icon: string;
  DockIcon?: ComponentType<{ color?: string; size?: number | string }>;
  raw: any;
};

type TabSearchItem = {
  id: string;
  title: string;
  url: string;
  icon: string;
  windowId: string;
  isBrowser: boolean;
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
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
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
  const platform = useSelector((state: any) => state.app.platform);
  const username = useSelector((state: any) => state.user.username);
  const isInSession = useSelector((state: any) => state.session.isInSession);
  const currentSession = useSelector(
    (state: any) => state.workspace.currentSession
  );

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isOpenRef = useRef(isOpen);
  const lastToggleAtRef = useRef(0);
  const suggestRequestIdRef = useRef(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const close = useCallback(() => {
    dispatch(modalActions.hideCenterSearch());
    setQuery("");
    setSuggestions([]);
  }, [dispatch]);

  const toggle = useCallback(() => {
    const now = Date.now();
    // Global shortcut + in-window keydown can both fire for one press
    if (now - lastToggleAtRef.current < 250) return;
    lastToggleAtRef.current = now;

    if (isOpenRef.current) {
      dispatch(modalActions.hideCenterSearch());
      setQuery("");
      setSuggestions([]);
    } else {
      dispatch(modalActions.showCenterSearch());
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isOpen) {
      setSuggestions([]);
      return;
    }

    const raw = query.trim();
    if (
      !raw ||
      raw.length < 2 ||
      isValidDomain4(raw) ||
      /^https?:\/\//i.test(raw)
    ) {
      setSuggestions([]);
      return;
    }

    const requestId = ++suggestRequestIdRef.current;
    const timer = setTimeout(() => {
      fetchSearchSuggestions(raw).then((next) => {
        if (suggestRequestIdRef.current !== requestId) return;
        const lower = raw.toLowerCase();
        setSuggestions(
          next.filter((phrase) => phrase.trim().toLowerCase() !== lower)
        );
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      suggestRequestIdRef.current += 1;
    };
  }, [query, isOpen]);

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

    getLauncherBuiltinApps(platform).forEach((tool) => {
      list.push({
        id: `builtin-${tool.id}`,
        type: "builtin",
        title: tool.label,
        url: "",
        icon: "",
        DockIcon: tool.DockIcon,
        raw: tool,
      });
    });

    getLauncherOnlineTools().forEach((tool) => {
      list.push({
        id: `online-tool-${tool.id}`,
        type: "online-tool",
        title: tool.label,
        url: tool.url || "",
        icon: "",
        DockIcon: tool.DockIcon,
        raw: tool,
      });
    });

    return list;
  }, [apps, links, profileId, platform]);

  const matchedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return spaceItems
      .filter((item) => item.title.toLowerCase().includes(q))
      .slice(0, 24);
  }, [query, spaceItems]);

  const matchedTabs: TabSearchItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const list: TabSearchItem[] = [];
    Object.values(openTabs || {}).forEach((tab: any) => {
      if (!tab?.id || tab.id === "launchpad") return;

      const win = openWindows?.[tab.window];
      const tabWorkspace = tab.workspace || win?.workspace;
      if (
        workspace?.id &&
        tabWorkspace &&
        tabWorkspace !== workspace.id &&
        tabWorkspace !== "all"
      ) {
        return;
      }

      const title = (tab.state?.title || tab.state?.name || "").toString();
      const url = (tab.state?.url || tab.url || "").toString();
      const haystack = `${title} ${url}`.toLowerCase();
      if (!haystack.includes(q)) return;

      const isBrowser =
        win?.type === "browser" ||
        tab.type === "browser" ||
        (typeof tab.window === "string" && tab.window.startsWith("browser_"));

      list.push({
        id: tab.id,
        title: title || url || "Tab",
        url,
        icon: resolveIconUrl(
          tab.state?.favIcon || tab.state?.icon,
          url
        ),
        windowId: tab.window,
        isBrowser,
        raw: tab,
      });
    });

    return list
      .sort((a, b) => {
        const aTs = a.raw?.lastAccessed || a.raw?.created || 0;
        const bTs = b.raw?.lastAccessed || b.raw?.created || 0;
        return bTs - aTs;
      })
      .slice(0, 16);
  }, [query, openTabs, openWindows, workspace?.id]);

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

  function activateTab(item: TabSearchItem) {
    close();
    const tab = item.raw;
    if (!tab) return;

    if (item.isBrowser) {
      switchBrowserTab(tab, dispatch, openWindows, activeTabs, activeWindowId);
    } else {
      switchAppTab(tab, dispatch, openWindows, activeTabs, activeWindowId);
    }

    if (tab.sleeping === true || openWindows?.[item.windowId]?.sleeping) {
      dispatch(appActions.showSplashScreen({}));
    }
  }

  function openNewItemWindow(item: SpaceSearchItem, source: any) {
    if (source == null) {
      log.warn("Center search could not open item", item.id);
      return;
    }

    const nextOpenWindows = Object.assign({}, openWindows);
    const nextOpenTabs = Object.assign({}, openTabs);
    const nextWindowTabs = Object.assign({}, windowTabs);

    const windowRecord = Object.assign({}, source, {
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
      source.data?.icon || item.raw?.data?.icon,
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

  function activateItem(item: SpaceSearchItem) {
    close();

    if (item.type === "builtin") {
      activateBuiltinApp(
        item.raw.id as BuiltinAppId,
        workspace,
        desktop,
        openWindows,
        dispatch,
        platform
      );
      return;
    }

    if (item.type === "online-tool") {
      activateOnlineTool({
        toolId: item.raw.id,
        workspace,
        desktop,
        openWindows,
        openTabs,
        windowTabs,
        username,
        route,
        isInSession,
        currentSession,
        dispatch,
      });
      return;
    }

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

    // workspace.items can be [] (truthy) and miss apps/links — always include them.
    const catalog = [
      ...(Array.isArray(items) ? items : []),
      ...(apps || []),
      ...(links || []),
    ];
    if (item.raw && !catalog.some((entry: any) => entry?.id === item.id)) {
      catalog.push(item.raw);
    }

    let opened = false;
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
        opened = true;
        openNewItemWindow(item, result || item.raw);
      }
    );

    // openInternalWindow only calls back when catalog contains the id
    if (!opened) {
      openNewItemWindow(item, item.raw);
    }
  }

  function runBrowserQuery(rawInput: string) {
    const raw = rawInput.trim();
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

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    runBrowserQuery(query);
  }

  function applySuggestion(phrase: string) {
    runBrowserQuery(phrase);
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
            placeholder="Search apps, tools, tabs, or enter a website address"
            aria-label="Search address bar"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="center-search-go">
            Go
          </button>
        </form>

        {query.trim().length > 0 && (
          <div className="center-search-results-wrap">
            {matchedTabs.length === 0 &&
            matchedItems.length === 0 &&
            suggestions.length === 0 ? (
              <div className="center-search-empty">
                No matching apps, tools, tabs, or suggestions
              </div>
            ) : (
              <>
                {matchedItems.length > 0 && (
                  <div className="center-search-section">
                    <div className="center-search-section-title">
                      Apps & Tools
                    </div>
                    <div className="center-search-results" role="listbox">
                      {matchedItems.map((item) => {
                        const Icon = item.DockIcon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className="center-search-result"
                            title={item.title}
                            onClick={() => activateItem(item)}
                          >
                            {Icon ? (
                              <span className="center-search-result-icon center-search-result-icon-tool">
                                <Icon size={22} color="white" />
                              </span>
                            ) : (
                              <img
                                className="center-search-result-icon"
                                src={item.icon}
                                alt=""
                              />
                            )}
                            <span className="center-search-result-label">
                              {item.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {matchedTabs.length > 0 && (
                  <div className="center-search-section">
                    <div className="center-search-section-title">Tabs</div>
                    <div className="center-search-tab-results" role="listbox">
                      {matchedTabs.map((item) => (
                        <button
                          key={`tab-${item.id}`}
                          type="button"
                          className="center-search-tab-result"
                          title={item.url || item.title}
                          onClick={() => activateTab(item)}
                        >
                          <img
                            className="center-search-tab-icon"
                            src={item.icon}
                            alt=""
                          />
                          <span className="center-search-tab-text">
                            <span className="center-search-tab-title">
                              {item.title}
                            </span>
                            {item.url ? (
                              <span className="center-search-tab-url">
                                {item.url}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div className="center-search-section center-search-section-suggestions">
                    <div className="center-search-section-title">
                      Suggestions
                    </div>
                    <div
                      className="center-search-suggestion-results"
                      role="listbox"
                    >
                      {suggestions.map((phrase) => (
                        <button
                          key={phrase}
                          type="button"
                          className="center-search-suggestion-result"
                          title={phrase}
                          onClick={() => applySuggestion(phrase)}
                        >
                          <span className="center-search-suggestion-label">
                            {phrase}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CenterSearchOverlay;
