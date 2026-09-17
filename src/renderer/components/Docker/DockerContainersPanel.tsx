import { useCallback, useEffect, useMemo, useState } from 'react';
import log from 'loglevel';
import { v4 as uuidv4 } from 'uuid';
import {
  Button,
  Collapse,
  Form,
  FormGroup,
  Input,
  Label,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  PlayCircle,
  Plus,
  StopCircle,
  ThreeDotsVertical,
  XCircle,
} from 'react-bootstrap-icons';

import { dockerService } from '../../services/docker';

type ContainerRow = {
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

type ContainerGroup = {
  key: string;
  kind: 'compose' | 'swarm' | 'standalone';
  title: string;
  containers: ContainerRow[];
};

interface DockerContainersPanelProps {
  onOpenStore: () => void;
  onSelectContainer: (container: ContainerRow) => void;
}

function groupContainers(containers: ContainerRow[]): ContainerGroup[] {
  const map = new Map<string, ContainerGroup>();

  containers.forEach((c) => {
    const kind = c.stackKind || 'standalone';
    const stackName = c.stackName || '';
    const key =
      kind === 'standalone' || !stackName
        ? 'standalone'
        : `${kind}:${stackName}`;

    if (!map.has(key)) {
      let title = 'Standalone';
      if (kind === 'compose' && stackName) title = `Compose · ${stackName}`;
      if (kind === 'swarm' && stackName) title = `Swarm · ${stackName}`;
      map.set(key, { key, kind, title, containers: [] });
    }
    map.get(key)!.containers.push(c);
  });

  const groups = Array.from(map.values());
  groups.sort((a, b) => {
    if (a.kind === 'standalone') return 1;
    if (b.kind === 'standalone') return -1;
    return a.title.localeCompare(b.title);
  });
  groups.forEach((g) => {
    g.containers.sort((a, b) => {
      const as = a.serviceName || a.names?.[0] || '';
      const bs = b.serviceName || b.names?.[0] || '';
      return as.localeCompare(bs);
    });
  });
  return groups;
}

function DockerContainersPanel({
  onOpenStore,
  onSelectContainer,
}: DockerContainersPanelProps) {
  const [containers, setContainers] = useState<ContainerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>(
    {}
  );
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [showAllContainers, setShowAllContainers] = useState(true);
  const [groupByStack, setGroupByStack] = useState(true);
  const [stoppingContainers, setStoppingContainers] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const containerList = await dockerService.getContainers(showAllContainers);
      const updated = (containerList || []).map((container: ContainerRow) => {
        if (stoppingContainers.includes(container.id)) {
          return { ...container, state: 'stopping' };
        }
        return container;
      });
      setContainers(updated);
      setLoading(false);
      setTimeout(() => setVersion(uuidv4()), 5000);
    } catch (error) {
      log.error('Failed to fetch Docker containers:', error);
      setLoading(false);
    }
  }, [showAllContainers, stoppingContainers]);

  useEffect(() => {
    refresh();
  }, [version, showAllContainers]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => groupContainers(containers), [containers]);

  function toggleRow(containerId: string) {
    setExpandedRows((prev) => ({
      ...prev,
      [containerId]: !prev[containerId],
    }));
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function startContainer(containerId: string) {
    try {
      await dockerService.resumeContainer(containerId);
      refresh();
    } catch (error: any) {
      log.error('Failed to start container:', error);
      alert('Error starting container: ' + error.message);
    }
  }

  async function stopContainer(containerId: string) {
    try {
      setStoppingContainers((prev) => [...prev, containerId]);
      await dockerService.stopContainer(containerId);
      setStoppingContainers((prev) => prev.filter((id) => id !== containerId));
      refresh();
    } catch (error: any) {
      log.error('Failed to stop container:', error);
      alert('Error stopping container: ' + error.message);
    }
  }

  async function removeContainer(containerId: string) {
    if (!window.confirm('Are you sure you want to remove this container?')) {
      return;
    }
    try {
      await dockerService.removeContainer(containerId);
      refresh();
    } catch (error: any) {
      log.error('Failed to remove container:', error);
      alert('Error removing container: ' + error.message);
    }
  }

  function renderContainerRow(container: ContainerRow) {
    const name = (container.names?.[0] || '').replace(/^\//, '');
    const displayName = container.serviceName
      ? `${container.serviceName}`
      : name;
    const subtitle = container.serviceName && name !== container.serviceName
      ? name
      : null;

    return (
      <div key={container.id} className="docker-row">
        <div
          className="docker-row-main docker-row-clickable"
          onClick={() => onSelectContainer(container)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectContainer(container);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="docker-col-expand">
            <Button
              color="link"
              className="p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleRow(container.id);
              }}
            >
              {expandedRows[container.id] ? <ChevronDown /> : <ChevronRight />}
            </Button>
          </div>
          <div>{container.id.substring(0, 12)}</div>
          <div title={name} className="docker-row-name-link">
            {displayName.length > 20
              ? `${displayName.slice(0, 20)}…`
              : displayName}
            {subtitle ? (
              <div className="docker-muted">{subtitle}</div>
            ) : null}
          </div>
          <div>
            {container.ports
              ? container.ports
                  .replace(/0\.0\.0\.0:/g, '')
                  .replace(/\/tcp/g, '')
              : 'None'}
          </div>
          <div>
            <span
              className={container.state === 'running' ? 'text-success' : ''}
            >
              {container.state
                ? container.state.charAt(0).toUpperCase() +
                  container.state.slice(1)
                : ''}
            </span>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <UncontrolledDropdown>
              <DropdownToggle color="dark" size="sm">
                <ThreeDotsVertical />
              </DropdownToggle>
              <DropdownMenu dark>
                <DropdownItem onClick={() => onSelectContainer(container)}>
                  Open
                </DropdownItem>
                {container.state !== 'running' && (
                  <DropdownItem onClick={() => startContainer(container.id)}>
                    <PlayCircle className="me-1" /> Start
                  </DropdownItem>
                )}
                {container.state === 'running' && (
                  <DropdownItem onClick={() => stopContainer(container.id)}>
                    <StopCircle className="me-1" /> Stop
                  </DropdownItem>
                )}
                <DropdownItem onClick={() => removeContainer(container.id)}>
                  <XCircle className="me-1" /> Remove
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </div>
        </div>
        <Collapse isOpen={!!expandedRows[container.id]}>
          <div className="docker-row-details">
            <div>
              <strong>Full ID:</strong> {container.id}
            </div>
            <div>
              <strong>Image:</strong> {container.image}
            </div>
            {container.stackKind && container.stackKind !== 'standalone' && (
              <div>
                <strong>Stack:</strong>{' '}
                {container.stackKind === 'compose' ? 'Compose' : 'Swarm'} /{' '}
                {container.stackName}
                {container.serviceName
                  ? ` · service ${container.serviceName}`
                  : ''}
              </div>
            )}
            <div>
              <strong>Created:</strong>{' '}
              {container.created
                ? new Date(container.created).toLocaleString()
                : '—'}
            </div>
            <div>
              <strong>Status:</strong> {container.status}
            </div>
            <div>
              <strong>Environment:</strong>
              {container.environment?.length ? (
                <ul className="mb-0 mt-1">
                  {container.environment.map((env, i) => (
                    <li key={i}>{env}</li>
                  ))}
                </ul>
              ) : (
                ' None'
              )}
            </div>
          </div>
        </Collapse>
      </div>
    );
  }

  if (loading) {
    return <p className="docker-panel-loading">Loading containers…</p>;
  }

  return (
    <div className="docker-panel">
      <div className="docker-panel-toolbar">
        <div className="docker-toolbar-switches">
          <Form>
            <FormGroup switch className="mb-0 d-flex align-items-center">
              <Input
                type="switch"
                checked={showAllContainers}
                onChange={() => setShowAllContainers(!showAllContainers)}
              />
              <Label check className="ms-2 mb-0">
                Show all
              </Label>
            </FormGroup>
          </Form>
          <Form>
            <FormGroup switch className="mb-0 d-flex align-items-center">
              <Input
                type="switch"
                checked={groupByStack}
                onChange={() => setGroupByStack(!groupByStack)}
              />
              <Label check className="ms-2 mb-0">
                Group by stack
              </Label>
            </FormGroup>
          </Form>
        </div>
        <Button
          color="primary"
          size="sm"
          className="d-flex align-items-center"
          onClick={onOpenStore}
        >
          <Plus className="me-1" /> New Container
        </Button>
      </div>

      <div className="docker-table">
        <div className="docker-table-header">
          <div className="docker-col-expand" />
          <div>Container ID</div>
          <div>Name</div>
          <div>Ports</div>
          <div>State</div>
          <div />
        </div>
        <div className="docker-table-body">
          {containers.length === 0 && (
            <div className="docker-empty">No containers found</div>
          )}

          {!groupByStack && containers.map(renderContainerRow)}

          {groupByStack &&
            groups.map((group) => {
              const collapsed = !!collapsedGroups[group.key];
              const running = group.containers.filter(
                (c) => c.state === 'running'
              ).length;
              return (
                <div key={group.key} className="docker-stack-group">
                  <button
                    type="button"
                    className="docker-stack-header"
                    onClick={() => toggleGroup(group.key)}
                  >
                    <span className="docker-stack-header-left">
                      {collapsed ? (
                        <ChevronRight size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      <Layers size={14} />
                      <span className="docker-stack-title">{group.title}</span>
                      <span
                        className={`docker-stack-badge docker-stack-badge-${group.kind}`}
                      >
                        {group.kind === 'compose'
                          ? 'Compose'
                          : group.kind === 'swarm'
                            ? 'Swarm'
                            : 'Other'}
                      </span>
                    </span>
                    <span className="docker-muted">
                      {running}/{group.containers.length} running
                    </span>
                  </button>
                  {!collapsed && group.containers.map(renderContainerRow)}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default DockerContainersPanel;
