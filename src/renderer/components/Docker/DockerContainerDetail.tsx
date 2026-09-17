import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import log from 'loglevel';
import { Button } from 'reactstrap';
import {
  ArrowClockwise,
  ArrowLeft,
  Copy,
  PlayCircle,
  StopCircle,
  Trash,
} from 'react-bootstrap-icons';

import { dockerService } from '../../services/docker';
import { getTerminalTheme } from '../Terminal/terminalThemes';
import DockerExecPane from './DockerExecPane';

export type DockerContainerSummary = {
  id: string;
  names: string[];
  image: string;
  state: string;
  status: string;
  ports: string;
  created: string;
  environment?: string[];
  stackKind?: 'compose' | 'swarm' | 'standalone';
  stackName?: string;
  serviceName?: string;
};

type DetailTab = 'logs' | 'inspect' | 'mounts' | 'stats' | 'terminal';

interface DockerContainerDetailProps {
  container: DockerContainerSummary;
  onBack: () => void;
  onChanged: () => void;
}

function DockerContainerDetail({
  container,
  onBack,
  onChanged,
}: DockerContainerDetailProps) {
  const [tab, setTab] = useState<DetailTab>('logs');
  const [logs, setLogs] = useState('');
  const [inspect, setInspect] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [loadingTab, setLoadingTab] = useState(false);
  const [terminalMounted, setTerminalMounted] = useState(false);
  const terminalTheme = getTerminalTheme('one-dark').theme;
  const logsRef = useRef<HTMLPreElement>(null);

  const name = useMemo(() => {
    return (
      container.serviceName ||
      (container.names?.[0] || '').replace(/^\//, '') ||
      container.id.slice(0, 12)
    );
  }, [container]);

  const shortId = container.id.slice(0, 12);
  const isRunning = container.state === 'running';

  const loadTabData = useCallback(async () => {
    if (tab === 'terminal') return;
    setLoadingTab(true);
    try {
      if (tab === 'logs') {
        const text = await dockerService.getContainerLogs(container.id, 400);
        setLogs(text || '');
      } else if (tab === 'inspect' || tab === 'mounts') {
        const data = await dockerService.inspectContainer(container.id);
        setInspect(data);
      } else if (tab === 'stats') {
        if (isRunning) {
          const data = await dockerService.getContainerStats(container.id);
          setStats(data);
        } else {
          setStats(null);
        }
      }
    } catch (error) {
      log.error('Failed to load container detail tab', error);
      if (tab === 'logs') setLogs(String((error as any)?.message || error));
    } finally {
      setLoadingTab(false);
    }
  }, [tab, container.id, isRunning]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const prevContainerIdRef = useRef(container.id);

  useEffect(() => {
    const idChanged = prevContainerIdRef.current !== container.id;
    prevContainerIdRef.current = container.id;

    if (!isRunning) {
      setTerminalMounted(false);
      return;
    }
    if (idChanged) {
      setTerminalMounted(tab === 'terminal');
      return;
    }
    if (tab === 'terminal') {
      setTerminalMounted(true);
    }
  }, [tab, isRunning, container.id]);

  useEffect(() => {
    if (tab !== 'logs' || loadingTab) return;
    const el = logsRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [logs, tab, loadingTab]);

  async function runAction(
    action: 'start' | 'stop' | 'restart' | 'remove'
  ) {
    setBusy(true);
    try {
      if (action === 'start') await dockerService.resumeContainer(container.id);
      if (action === 'stop') await dockerService.stopContainer(container.id);
      if (action === 'restart')
        await dockerService.restartContainer(container.id);
      if (action === 'remove') {
        if (!window.confirm(`Remove container ${name}?`)) return;
        await dockerService.removeContainer(container.id);
        onChanged();
        onBack();
        return;
      }
      onChanged();
      await loadTabData();
    } catch (error: any) {
      alert(error?.message || String(error));
    } finally {
      setBusy(false);
    }
  }

  function copyId() {
    try {
      navigator.clipboard?.writeText(container.id);
    } catch {
      // ignore
    }
  }

  const mounts: any[] = inspect?.Mounts || [];
  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'logs', label: 'Logs' },
    { id: 'inspect', label: 'Inspect' },
    { id: 'mounts', label: 'Bind mounts' },
    { id: 'stats', label: 'Stats' },
    { id: 'terminal', label: 'Terminal' },
  ];

  return (
    <div className="docker-detail">
      <div className="docker-detail-top">
        <button type="button" className="docker-detail-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Containers
        </button>
        <div className="docker-detail-heading">
          <h2 className="docker-detail-title">{name}</h2>
          <div className="docker-detail-actions">
            {!isRunning && (
              <Button
                color="primary"
                size="sm"
                disabled={busy}
                onClick={() => runAction('start')}
                title="Start"
              >
                <PlayCircle />
              </Button>
            )}
            {isRunning && (
              <Button
                color="primary"
                size="sm"
                disabled={busy}
                onClick={() => runAction('stop')}
                title="Stop"
              >
                <StopCircle />
              </Button>
            )}
            <Button
              color="secondary"
              size="sm"
              disabled={busy}
              onClick={() => runAction('restart')}
              title="Restart"
            >
              <ArrowClockwise />
            </Button>
            <Button
              color="danger"
              size="sm"
              disabled={busy}
              onClick={() => runAction('remove')}
              title="Delete"
            >
              <Trash />
            </Button>
          </div>
        </div>
        <div className="docker-detail-meta">
          <span
            className={`docker-detail-status${
              isRunning ? ' is-running' : ''
            }`}
          >
            {container.state
              ? container.state.charAt(0).toUpperCase() + container.state.slice(1)
              : 'Unknown'}
          </span>
          <span className="docker-detail-chip">
            {shortId}
            <button
              type="button"
              className="docker-detail-copy"
              onClick={copyId}
              title="Copy ID"
            >
              <Copy size={12} />
            </button>
          </span>
          <span className="docker-detail-chip" title={container.image}>
            {container.image}
          </span>
          {container.ports ? (
            <span className="docker-detail-chip">{container.ports}</span>
          ) : null}
          {container.status ? (
            <span className="docker-muted">{container.status}</span>
          ) : null}
        </div>
      </div>

      <div className="docker-detail-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`docker-detail-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          className="docker-detail-tab docker-detail-tab-refresh"
          onClick={loadTabData}
          title="Refresh"
        >
          <ArrowClockwise size={14} />
        </button>
      </div>

      <div className="docker-detail-body">
        {loadingTab && <div className="docker-panel-loading">Loading…</div>}

        {!loadingTab && tab === 'logs' && (
          <pre className="docker-detail-logs" ref={logsRef}>
            {logs || 'No logs yet.'}
          </pre>
        )}

        {!loadingTab && tab === 'inspect' && (
          <pre className="docker-detail-logs">
            {inspect
              ? JSON.stringify(inspect, null, 2)
              : 'Inspect data unavailable.'}
          </pre>
        )}

        {!loadingTab && tab === 'mounts' && (
          <div className="docker-detail-mounts">
            {mounts.length === 0 && (
              <div className="docker-empty">No bind mounts</div>
            )}
            {mounts.map((m, i) => (
              <div key={i} className="docker-mount-card">
                <div>
                  <strong>Type:</strong> {m.Type || '—'}
                </div>
                <div>
                  <strong>Source:</strong> {m.Source || m.Name || '—'}
                </div>
                <div>
                  <strong>Destination:</strong> {m.Destination || '—'}
                </div>
                <div>
                  <strong>Mode:</strong> {m.Mode || (m.RW ? 'rw' : 'ro')}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingTab && tab === 'stats' && (
          <div className="docker-detail-stats">
            {!isRunning && (
              <div className="docker-empty">
                Stats are available while the container is running.
              </div>
            )}
            {isRunning && !stats && (
              <div className="docker-empty">No stats available.</div>
            )}
            {stats && (
              <div className="docker-stats-grid">
                <div className="docker-stat">
                  <span className="docker-muted">CPU</span>
                  <strong>{stats.CPUPerc || stats.CPUPercentage || '—'}</strong>
                </div>
                <div className="docker-stat">
                  <span className="docker-muted">Memory</span>
                  <strong>{stats.MemUsage || stats.MemPerc || '—'}</strong>
                </div>
                <div className="docker-stat">
                  <span className="docker-muted">Net I/O</span>
                  <strong>{stats.NetIO || '—'}</strong>
                </div>
                <div className="docker-stat">
                  <span className="docker-muted">Block I/O</span>
                  <strong>{stats.BlockIO || '—'}</strong>
                </div>
                <div className="docker-stat">
                  <span className="docker-muted">PIDs</span>
                  <strong>{stats.PIDs || '—'}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'terminal' && !isRunning && (
          <div className="docker-empty">
            Start the container to open a shell.
          </div>
        )}

        {terminalMounted && isRunning && (
          <div
            className={`docker-detail-terminal${
              tab === 'terminal' ? '' : ' is-inactive'
            }`}
          >
            <DockerExecPane
              containerId={container.id}
              visible={tab === 'terminal'}
              theme={terminalTheme}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default DockerContainerDetail;
