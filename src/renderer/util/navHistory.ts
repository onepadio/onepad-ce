import log from "loglevel";
import { WorkspaceService } from "../services/workspace";
import { SessionService } from "../services/session";
import BrowserStateService from "../services/browsers";

export const MAX_NAV_HISTORY = 50;
export const NAV_HISTORY_PERSIST_DEBOUNCE_MS = 400;

export type NavHistoryEntry = {
  url: string;
  title?: string;
};

export type TabNavState = {
  url?: string;
  title?: string;
  icon?: any;
  history?: NavHistoryEntry[];
  historyIndex?: number;
  [key: string]: any;
};

const pendingPatches = new Map<string, ReturnType<typeof setTimeout>>();

export function createNavHistoryState(
  url: string,
  title = "",
  icon?: any
): TabNavState {
  const hasUrl = !!url;
  return {
    url: url || "",
    title: title || "",
    icon,
    history: hasUrl ? [{ url, title: title || "" }] : [],
    historyIndex: hasUrl ? 0 : -1,
  };
}

export function ensureNavHistory(state: TabNavState = {}): TabNavState {
  if (Array.isArray(state.history) && typeof state.historyIndex === "number") {
    return state;
  }
  const url = state.url || "";
  if (!url) {
    return {
      ...state,
      history: [],
      historyIndex: -1,
    };
  }
  return {
    ...state,
    history: [{ url, title: state.title || "" }],
    historyIndex: 0,
  };
}

export function canGoBackInHistory(state: TabNavState = {}): boolean {
  const index = state.historyIndex ?? -1;
  return index > 0;
}

export function canGoForwardInHistory(state: TabNavState = {}): boolean {
  const history = state.history || [];
  const index = state.historyIndex ?? -1;
  return index >= 0 && index < history.length - 1;
}

export function moveHistoryIndex(
  state: TabNavState,
  newIndex: number
): TabNavState {
  const ensured = ensureNavHistory(state);
  const history = ensured.history || [];
  if (newIndex < 0 || newIndex >= history.length) {
    return ensured;
  }
  const entry = history[newIndex];
  return {
    ...ensured,
    historyIndex: newIndex,
    url: entry.url,
    title: entry.title ?? ensured.title,
  };
}

/**
 * Apply a navigation URL to tab state.
 * Detects back/forward when the URL matches an adjacent history entry.
 */
export function applyNavigationToTabState(
  state: TabNavState,
  url: string,
  title?: string
): TabNavState {
  if (!url) {
    return state;
  }

  const ensured = ensureNavHistory(state);
  let history = [...(ensured.history || [])];
  let index = ensured.historyIndex ?? -1;
  const nextTitle = title ?? ensured.title ?? "";

  if (history.length === 0 || index < 0) {
    return {
      ...ensured,
      url,
      title: nextTitle,
      history: [{ url, title: nextTitle }],
      historyIndex: 0,
    };
  }

  if (history[index]?.url === url) {
    const updated = [...history];
    updated[index] = {
      ...updated[index],
      url,
      title: nextTitle || updated[index].title || "",
    };
    return {
      ...ensured,
      url,
      title: nextTitle || ensured.title,
      history: updated,
      historyIndex: index,
    };
  }

  if (index > 0 && history[index - 1]?.url === url) {
    return {
      ...ensured,
      url,
      title: nextTitle || history[index - 1].title || ensured.title,
      historyIndex: index - 1,
    };
  }

  if (index < history.length - 1 && history[index + 1]?.url === url) {
    return {
      ...ensured,
      url,
      title: nextTitle || history[index + 1].title || ensured.title,
      historyIndex: index + 1,
    };
  }

  // New navigation: drop any forward entries, then push
  history = history.slice(0, index + 1);
  history.push({ url, title: nextTitle });

  if (history.length > MAX_NAV_HISTORY) {
    const overflow = history.length - MAX_NAV_HISTORY;
    history = history.slice(overflow);
  }

  return {
    ...ensured,
    url,
    title: nextTitle,
    history,
    historyIndex: history.length - 1,
  };
}

export function scheduleTabNavHistoryPersist(options: {
  workspaceId?: string | null;
  sessionId?: string | null;
  isInSession?: boolean;
  tabId: string;
  tabType?: string | null;
  navState: TabNavState;
}) {
  const { workspaceId, sessionId, isInSession, tabId, tabType, navState } =
    options;
  if (!tabId || !navState) return;

  const isBrowserTab = tabType === "browser";
  const targetId = isInSession && !isBrowserTab ? sessionId : workspaceId;
  if (!targetId && !isBrowserTab) return;
  if (isBrowserTab && !workspaceId) return;

  const key = isBrowserTab
    ? `browser:${workspaceId}:${tabId}`
    : `${isInSession ? "session" : "workspace"}:${targetId}:${tabId}`;
  const existing = pendingPatches.get(key);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    pendingPatches.delete(key);
    const payload = {
      url: navState.url,
      title: navState.title,
      history: navState.history || [],
      historyIndex: navState.historyIndex ?? -1,
    };

    let persist: Promise<any>;
    if (isBrowserTab) {
      // Browser tabs are stored in db.browsers, not workspace/session state
      persist = BrowserStateService.patchTabNavHistory(
        workspaceId,
        tabId,
        payload
      );
    } else if (isInSession && sessionId) {
      persist = SessionService.patchTabNavHistory(sessionId, tabId, payload);
    } else if (workspaceId) {
      persist = WorkspaceService.patchTabNavHistory(workspaceId, tabId, payload);
    } else {
      return;
    }

    Promise.resolve(persist).catch((error) => {
      log.error("Failed to patch tab nav history", error);
    });
  }, NAV_HISTORY_PERSIST_DEBOUNCE_MS);

  pendingPatches.set(key, timer);
}
