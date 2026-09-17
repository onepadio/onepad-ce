import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { ITheme } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

type PtyCreateResult = { id: string } | { error: string };

interface TerminalPaneProps {
  /** Local tab id (UI). PTY session is created once on mount. */
  tabId: string;
  visible: boolean;
  theme: ITheme;
  onTitle?: (tabId: string, title: string) => void;
  onExited?: (tabId: string) => void;
}

function getElectronAPI(): any {
  return (window as any).electronAPI;
}

function TerminalPane({
  tabId,
  visible,
  theme,
  onTitle,
  onExited,
}: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const ptyIdRef = useRef<string | null>(null);
  const disposedRef = useRef(false);
  // Keep latest callbacks without recreating the PTY when parents re-render
  const onTitleRef = useRef(onTitle);
  const onExitedRef = useRef(onExited);
  const themeRef = useRef(theme);
  onTitleRef.current = onTitle;
  onExitedRef.current = onExited;
  themeRef.current = theme;

  useEffect(() => {
    disposedRef.current = false;
    const container = containerRef.current;
    const api = getElectronAPI();
    if (!container || !api?.invoke) {
      return undefined;
    }

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      theme: themeRef.current,
      allowProposedApi: true,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    termRef.current = term;
    fitRef.current = fitAddon;

    const fit = () => {
      try {
        fitAddon.fit();
        const { cols, rows } = term;
        if (ptyIdRef.current) {
          api.invoke('pty-resize', ptyIdRef.current, cols, rows);
        }
      } catch {
        // ignore fit errors before layout is ready
      }
    };

    const onData = (_event: unknown, payload: { id: string; data: string }) => {
      if (payload?.id === ptyIdRef.current) {
        term.write(payload.data);
      }
    };

    const onExit = (
      _event: unknown,
      payload: { id: string; exitCode: number }
    ) => {
      if (payload?.id !== ptyIdRef.current) return;
      term.writeln(`\r\n[Process exited with code ${payload.exitCode}]`);
      term.writeln('Press any key to close this tab…');
      const disposable = term.onData(() => {
        disposable.dispose();
        onExitedRef.current?.(tabId);
      });
    };

    api.receive('pty-data', onData);
    api.receive('pty-exit', onExit);

    const dataDisposable = term.onData((data: string) => {
      if (ptyIdRef.current) {
        api.invoke('pty-write', ptyIdRef.current, data);
      }
    });

    const titleDisposable = term.onTitleChange((title: string) => {
      if (title) onTitleRef.current?.(tabId, title);
    });

    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      fit();
      const result = (await api.invoke('pty-create', {
        cols: term.cols,
        rows: term.rows,
      })) as PtyCreateResult;

      if (disposedRef.current) {
        if ('id' in result) {
          api.invoke('pty-kill', result.id);
        }
        return;
      }

      if ('error' in result) {
        term.writeln(`\x1b[31m${result.error}\x1b[0m`);
        return;
      }

      ptyIdRef.current = result.id;
      fit();
      term.focus();

      resizeObserver = new ResizeObserver(() => fit());
      resizeObserver.observe(container);
    })();

    return () => {
      disposedRef.current = true;
      dataDisposable.dispose();
      titleDisposable.dispose();
      resizeObserver?.disconnect();
      api.removeListener?.('pty-data', onData);
      api.removeListener?.('pty-exit', onExit);
      if (ptyIdRef.current) {
        api.invoke?.('pty-kill', ptyIdRef.current);
        ptyIdRef.current = null;
      }
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
    // Only recreate when this tab's identity changes — never on parent re-renders
  }, [tabId]);

  // Apply theme live without killing the shell
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = theme;
    }
  }, [theme]);

  useEffect(() => {
    if (!visible) return;
    // Refit and focus when tab becomes visible; keep scrollback/history intact
    requestAnimationFrame(() => {
      try {
        fitRef.current?.fit();
        const term = termRef.current;
        const api = getElectronAPI();
        if (term && ptyIdRef.current && api?.invoke) {
          api.invoke('pty-resize', ptyIdRef.current, term.cols, term.rows);
          term.focus();
        }
      } catch {
        // ignore
      }
    });
  }, [visible]);

  return (
    <div
      className={`terminal-pane ${visible ? 'is-visible' : 'is-hidden'}`}
      style={{ backgroundColor: theme.background || '#1e1e1e' }}
      ref={containerRef}
      aria-hidden={!visible}
    />
  );
}

export default TerminalPane;
