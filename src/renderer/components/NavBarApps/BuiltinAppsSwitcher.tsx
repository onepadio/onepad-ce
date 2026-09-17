import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tools, X } from 'react-bootstrap-icons';

import {
  activateBuiltinApp,
  activateOnlineTool,
  getLauncherBuiltinApps,
  getLauncherOnlineTools,
  getOnlineToolWindowId,
  type BuiltinAppId,
} from '../../builtin';

import './BuiltinAppsSwitcher.css';

interface BuiltinAppsSwitcherProps {
  open: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function BuiltinAppsSwitcher({
  open,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: BuiltinAppsSwitcherProps) {
  const dispatch = useDispatch();
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const activeModalId = useSelector(
    (state: any) => state.builtin?.activeModalId
  );
  const openModalIds = useSelector(
    (state: any) => state.builtin?.openModalIds || []
  );
  const platform = useSelector((state: any) => state.app.platform);
  const username = useSelector((state: any) => state.user.username);
  const route = useSelector((state: any) => state.session.route);
  const isInSession = useSelector((state: any) => state.session.isInSession);
  const currentSession = useSelector(
    (state: any) => state.workspace.currentSession
  );

  const apps = getLauncherBuiltinApps(platform);
  const onlineTools = getLauncherOnlineTools();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleSelectBuiltin(appId: BuiltinAppId) {
    activateBuiltinApp(
      appId,
      workspace,
      desktop,
      openWindows,
      dispatch,
      platform
    );
    onClose();
  }

  function handleSelectOnlineTool(toolId: string) {
    activateOnlineTool({
      toolId,
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
    onClose();
  }

  return (
    <>
      <div
        className="builtin-apps-switcher-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="builtin-apps-switcher-panel"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="builtin-apps-switcher-panel-inner">
          <div className="builtin-apps-switcher-toolbar builtin-apps-switcher-toolbar--titled">
            <div className="builtin-apps-switcher-title-block">
              <div className="builtin-apps-switcher-title-row">
                <Tools
                  className="builtin-apps-switcher-title-icon"
                  size={16}
                  aria-hidden="true"
                />
                <h2 className="builtin-apps-switcher-heading">Tools</h2>
              </div>
              <p className="builtin-apps-switcher-subtitle">
                Productivity tools and utilities
              </p>
            </div>
            <button
              type="button"
              className="builtin-apps-switcher-close"
              onClick={onClose}
              aria-label="Close utilities"
            >
              <X size={16} />
            </button>
          </div>
          <div className="builtin-apps-switcher-grid">
            {apps.map((app) => {
              const Icon = app.DockIcon;
              const windowId = workspace?.id
                ? app.getWindowId(workspace.id)
                : null;
              const isModal = app.windowMode === 'modal';
              const isActive = isModal
                ? activeModalId === app.id
                : windowId != null && activeWindowId === windowId;
              const isOpen = isModal
                ? openModalIds.includes(app.id)
                : windowId != null && openWindows?.[windowId] != null;

              return (
                <button
                  key={app.id}
                  type="button"
                  className={`builtin-apps-switcher-tile${
                    isActive ? ' is-active' : ''
                  }${isOpen && !isActive ? ' is-open' : ''}`}
                  onClick={() => handleSelectBuiltin(app.id)}
                >
                  <span className="builtin-apps-switcher-icon">
                    <Icon size={28} color="white" />
                  </span>
                  <span className="builtin-apps-switcher-label">
                    {app.label}
                  </span>
                </button>
              );
            })}
            {onlineTools.map((tool) => {
              const Icon = tool.DockIcon;
              const windowId = workspace?.id
                ? getOnlineToolWindowId(tool.id, workspace.id)
                : null;
              const isActive =
                windowId != null && activeWindowId === windowId;
              const isOpen =
                windowId != null && openWindows?.[windowId] != null;

              return (
                <button
                  key={`online-${tool.id}`}
                  type="button"
                  className={`builtin-apps-switcher-tile${
                    isActive ? ' is-active' : ''
                  }${isOpen && !isActive ? ' is-open' : ''}`}
                  onClick={() => handleSelectOnlineTool(tool.id)}
                >
                  <span className="builtin-apps-switcher-icon">
                    <Icon size={28} color="white" />
                  </span>
                  <span className="builtin-apps-switcher-label">
                    {tool.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default BuiltinAppsSwitcher;
