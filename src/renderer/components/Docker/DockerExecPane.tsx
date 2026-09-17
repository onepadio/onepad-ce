import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { ITheme } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

type PtyCreateResult = { id: string } | { error: string };

interface DockerExecPaneProps {
  containerId: string;
  visible: boolean;
  theme: ITheme;
}

function getElectronAPI(): any {
  return (window as any).electronAPI;
}

function DockerExecPane({ containerId, visible, theme }: DockerExecPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const ptyIdRef = useRef<string | null>(null);
  const disposedRef = useRef(false);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    disposedRef.current = false;
    const el = containerRef.current;
    const api = getElectronAPI();
    if (!el || !api?.invoke) {
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
    term.open(el);
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
        // ignore
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
    };

    api.receive('pty-data', onData);
    api.receive('pty-exit', onExit);

    const dataDisposable = term.onData((data: string) => {
      if (ptyIdRef.current) {
        api.invoke('pty-write', ptyIdRef.current, data);
      }
    });

    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      fit();
      const result = (await api.invoke('pty-create', {
        cols: term.cols,
        rows: term.rows,
        shell: 'docker',
        args: ['exec', '-it', containerId, 'sh'],
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
      resizeObserver.observe(el);
    })();

    return () => {
      disposedRef.current = true;
      dataDisposable.dispose();
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
  }, [containerId]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = theme;
    }
  }, [theme]);

  useEffect(() => {
    if (!visible) return;
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
      className={`docker-exec-pane ${visible ? 'is-visible' : 'is-hidden'}`}
      style={{ backgroundColor: theme.background || '#1e1e1e' }}
      ref={containerRef}
      aria-hidden={!visible}
    />
  );
}

export default DockerExecPane;
