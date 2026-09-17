import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, X } from 'react-bootstrap-icons';
import { v4 as uuidv4 } from 'uuid';

import BuiltinWindowChrome from '../BuiltinApps/BuiltinWindowChrome';
import TerminalPane from './TerminalPane';
import {
  TERMINAL_THEMES,
  loadTerminalThemeId,
  saveTerminalThemeId,
  getTerminalTheme,
  type TerminalThemeId,
} from './terminalThemes';
import { getBuiltinWindowVisibility } from '../../builtin';
import { getTerminalWindowId } from '../../util/terminal';
import './TerminalApp.css';

type TerminalTab = {
  id: string;
  title: string;
};

type WindowSession = {
  tabs: TerminalTab[];
  activeTabId: string;
  tabCounter: number;
};

function createTab(index: number): TerminalTab {
  return {
    id: uuidv4(),
    title: `Terminal ${index}`,
  };
}

function createSession(): WindowSession {
  const tab = createTab(1);
  return {
    tabs: [tab],
    activeTabId: tab.id,
    tabCounter: 1,
  };
}

function TerminalApp() {
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const sessionActiveTabId = useSelector(
    (state: any) => state.session.activeTabId
  );
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const workspaceId = useSelector(
    (state: any) => state.workspace.selectedWorkspace?.id
  );
  const isAIAssistantOpen = useSelector((state: any) => state.ai.isOpen);

  const terminalWindowId = workspaceId
    ? getTerminalWindowId(workspaceId)
    : null;

  const [sessionsByWindow, setSessionsByWindow] = useState<
    Record<string, WindowSession>
  >({});
  const [themeId, setThemeId] = useState<TerminalThemeId>(() =>
    loadTerminalThemeId()
  );

  const themeDef = useMemo(() => getTerminalTheme(themeId), [themeId]);

  // Create a session when this space's terminal window first appears
  useEffect(() => {
    if (!terminalWindowId) return;
    if (!openWindows?.[terminalWindowId]) return;
    setSessionsByWindow((prev) => {
      if (prev[terminalWindowId]) return prev;
      return { ...prev, [terminalWindowId]: createSession() };
    });
  }, [terminalWindowId, openWindows]);

  // Drop sessions when the window is closed
  useEffect(() => {
    setSessionsByWindow((prev) => {
      let changed = false;
      const next: Record<string, WindowSession> = {};
      Object.keys(prev).forEach((id) => {
        if (openWindows?.[id]) {
          next[id] = prev[id];
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [openWindows]);

  const { visible, active } = getBuiltinWindowVisibility({
    appId: 'terminal',
    windowId: terminalWindowId,
    openWindows,
    activeWindowId,
    activeTabId: sessionActiveTabId,
  });

  const updateSession = useCallback(
    (windowId: string, updater: (s: WindowSession) => WindowSession) => {
      setSessionsByWindow((prev) => {
        const current = prev[windowId] || createSession();
        return { ...prev, [windowId]: updater(current) };
      });
    },
    []
  );

  const handleNewTab = useCallback(() => {
    if (!terminalWindowId) return;
    updateSession(terminalWindowId, (s) => {
      const next = s.tabCounter + 1;
      const tab = createTab(next);
      return {
        tabs: [...s.tabs, tab],
        activeTabId: tab.id,
        tabCounter: next,
      };
    });
  }, [terminalWindowId, updateSession]);

  const handleCloseTab = useCallback(
    (windowId: string, tabId: string) => {
      updateSession(windowId, (s) => {
        if (s.tabs.length <= 1) {
          const replacement = createTab(1);
          return {
            tabs: [replacement],
            activeTabId: replacement.id,
            tabCounter: 1,
          };
        }
        const tabs = s.tabs.filter((t) => t.id !== tabId);
        const activeTabId =
          s.activeTabId === tabId
            ? tabs[tabs.length - 1].id
            : s.activeTabId;
        return { ...s, tabs, activeTabId };
      });
    },
    [updateSession]
  );

  const handleSelectTab = useCallback(
    (tabId: string) => {
      if (!terminalWindowId) return;
      updateSession(terminalWindowId, (s) => ({ ...s, activeTabId: tabId }));
    },
    [terminalWindowId, updateSession]
  );

  const handleTitle = useCallback(
    (windowId: string, tabId: string, title: string) => {
      const short = title.length > 28 ? `${title.slice(0, 25)}…` : title;
      updateSession(windowId, (s) => ({
        ...s,
        tabs: s.tabs.map((t) =>
          t.id === tabId ? { ...t, title: short || t.title } : t
        ),
      }));
    },
    [updateSession]
  );

  const handleThemeChange = useCallback(
    (e: { target: { value: string } }) => {
      const next = e.target.value as TerminalThemeId;
      setThemeId(next);
      saveTerminalThemeId(next);
    },
    []
  );

  const windowIds = Object.keys(sessionsByWindow);
  if (windowIds.length === 0) {
    return null;
  }

  const themeExtra = (
    <>
      <label className="terminal-theme-picker">
        <span className="terminal-theme-label">Theme</span>
        <select
          value={themeId}
          onChange={handleThemeChange}
          aria-label="Terminal color scheme"
        >
          {TERMINAL_THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="terminal-new-tab"
        onClick={handleNewTab}
        title="New terminal"
        aria-label="New terminal"
      >
        <Plus size={16} />
      </button>
    </>
  );

  return (
    <>
      {windowIds.map((windowId) => {
        const winSession = sessionsByWindow[windowId];
        const isThisSpace =
          !!terminalWindowId && windowId === terminalWindowId && !!winSession;
        const showWindow = isThisSpace && visible;
        const showChrome = showWindow;

        return (
          <BuiltinWindowChrome
            key={windowId}
            appId="terminal"
            visible={showWindow}
            active={isThisSpace && active}
            className={isAIAssistantOpen ? 'chat-assistant-open' : ''}
            style={{ backgroundColor: themeDef.theme.background }}
            toolbarExtra={showChrome ? themeExtra : undefined}
          >
            {showChrome && (
              <div
                className="terminal-tab-bar"
                style={{
                  backgroundColor: themeDef.theme.background,
                  borderBottomColor:
                    themeDef.theme.selectionBackground || '#333',
                }}
              >
                <div className="terminal-tabs">
                  {winSession.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`terminal-tab ${
                        tab.id === winSession.activeTabId ? 'active' : ''
                      }`}
                      onClick={() => handleSelectTab(tab.id)}
                    >
                      <span className="terminal-tab-title">{tab.title}</span>
                      <span
                        className="terminal-tab-close"
                        role="button"
                        tabIndex={0}
                        aria-label="Close tab"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseTab(windowId, tab.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            handleCloseTab(windowId, tab.id);
                          }
                        }}
                      >
                        <X size={12} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="terminal-panes">
              {winSession.tabs.map((tab) => (
                <TerminalPane
                  key={tab.id}
                  tabId={tab.id}
                  visible={showChrome && tab.id === winSession.activeTabId}
                  theme={themeDef.theme}
                  onTitle={(tabId, title) =>
                    handleTitle(windowId, tabId, title)
                  }
                  onExited={(tabId) => handleCloseTab(windowId, tabId)}
                />
              ))}
            </div>
          </BuiltinWindowChrome>
        );
      })}
    </>
  );
}

export default TerminalApp;
