import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BoxSeam,
  Boxes,
  Collection,
  DeviceHdd,
  Terminal,
} from 'react-bootstrap-icons';
import log from 'loglevel';

import BuiltinWindowChrome from '../BuiltinApps/BuiltinWindowChrome';
import { getBuiltinWindowVisibility, activateBuiltinApp } from '../../builtin';
import { dockerService } from '../../services/docker';
import DockerContainersPanel from './DockerContainersPanel';
import DockerContainerDetail from './DockerContainerDetail';
import DockerImagesPanel from './DockerImagesPanel';
import DockerVolumesPanel from './DockerVolumesPanel';
import DockerStorePanel from './DockerStorePanel';
import './DockerApp.css';

type DockerTab = 'containers' | 'images' | 'volumes' | 'store';

function DockerApp() {
  const dispatch = useDispatch();
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const sessionActiveTabId = useSelector(
    (state: any) => state.session.activeTabId
  );
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const workspaceId = workspace?.id;
  const isAIAssistantOpen = useSelector((state: any) => state.ai.isOpen);

  const windowId = workspaceId ? `docker_${workspaceId}` : null;
  const hasWindow = !!(windowId && openWindows?.[windowId]);
  const { visible, active } = getBuiltinWindowVisibility({
    appId: 'docker',
    windowId,
    openWindows,
    activeWindowId,
    activeTabId: sessionActiveTabId,
  });

  const [tab, setTab] = useState<DockerTab>('containers');
  const [dockerRunning, setDockerRunning] = useState<boolean | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [containerListKey, setContainerListKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const running = await dockerService.isDockerRunning();
        if (!cancelled) setDockerRunning(!!running);
      } catch (error) {
        log.warn('Docker status check failed', error);
        if (!cancelled) setDockerRunning(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, tab]);

  if (!hasWindow) return null;

  function openTerminal() {
    activateBuiltinApp('terminal', workspace, desktop, openWindows, dispatch);
  }

  async function refreshSelectedContainer() {
    setContainerListKey((k) => k + 1);
    if (!selectedContainer?.id) return;
    try {
      const list = await dockerService.getContainers(true);
      const updated = (list || []).find(
        (c: any) => c.id === selectedContainer.id
      );
      if (updated) setSelectedContainer(updated);
    } catch (error) {
      log.warn('Failed to refresh selected container', error);
    }
  }

  const navItems: { id: DockerTab; label: string; Icon: any }[] = [
    { id: 'containers', label: 'Containers', Icon: Boxes },
    { id: 'images', label: 'Images', Icon: Collection },
    { id: 'volumes', label: 'Volumes', Icon: DeviceHdd },
    { id: 'store', label: 'Store', Icon: BoxSeam },
  ];

  return (
    <BuiltinWindowChrome
      appId="docker"
      visible={visible}
      active={active}
      className={isAIAssistantOpen ? 'chat-assistant-open' : ''}
      toolbarExtra={
        <button
          type="button"
          className="builtin-window-close"
          onClick={openTerminal}
          title="Open Terminal"
          aria-label="Open Terminal"
        >
          <Terminal size={16} />
        </button>
      }
    >
      <div className="docker-app">
        <nav className="docker-nav">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`docker-nav-item${tab === id ? ' is-active' : ''}`}
              onClick={() => {
                setSelectedContainer(null);
                setTab(id);
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="docker-main">
          {dockerRunning === false ? (
            <div className="docker-offline">
              <h3>Docker is not running</h3>
              <p>
                Start Docker Desktop (or the Docker daemon), then open this app
                again or switch tabs to refresh.
              </p>
              <button
                type="button"
                className="docker-offline-terminal"
                onClick={openTerminal}
              >
                <Terminal size={14} /> Open Terminal
              </button>
            </div>
          ) : (
            <>
              {tab === 'containers' &&
                (selectedContainer ? (
                  <DockerContainerDetail
                    container={selectedContainer}
                    onBack={() => setSelectedContainer(null)}
                    onChanged={refreshSelectedContainer}
                  />
                ) : (
                  <DockerContainersPanel
                    key={containerListKey}
                    onOpenStore={() => setTab('store')}
                    onSelectContainer={setSelectedContainer}
                  />
                ))}
              {tab === 'images' && <DockerImagesPanel />}
              {tab === 'volumes' && <DockerVolumesPanel />}
              {tab === 'store' && <DockerStorePanel />}
            </>
          )}
        </div>
      </div>
    </BuiltinWindowChrome>
  );
}

export default DockerApp;
