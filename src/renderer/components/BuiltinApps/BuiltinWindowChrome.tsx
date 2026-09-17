import type { CSSProperties, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'react-bootstrap-icons';

import {
  activateBuiltinApp,
  closeBuiltinApp,
  getBuiltinApp,
  getBuiltinWindowVisibility,
  type BuiltinAppId,
} from '../../builtin';
import './BuiltinWindowChrome.css';

interface BuiltinWindowChromeProps {
  appId: BuiltinAppId;
  title?: string;
  children: ReactNode;
  toolbarExtra?: ReactNode;
  className?: string;
  style?: CSSProperties;
  visible?: boolean;
  active?: boolean;
}

/** Chrome for fullscreen built-in apps (e.g. Terminal). */
function BuiltinWindowChrome({
  appId,
  title,
  children,
  toolbarExtra,
  className = '',
  style,
  visible: visibleProp,
  active: activeProp,
}: BuiltinWindowChromeProps) {
  const dispatch = useDispatch();
  const app = getBuiltinApp(appId);
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const activeDesktopWindows = useSelector(
    (state: any) => state.session.activeDesktopWindows
  );
  const platform = useSelector((state: any) => state.app.platform);

  const windowId = workspace?.id ? app.getWindowId(workspace.id) : null;
  const computed = getBuiltinWindowVisibility({
    appId,
    windowId,
    openWindows,
    activeWindowId,
    activeTabId,
  });
  const visible = visibleProp ?? computed.visible;
  const active = activeProp ?? computed.active;

  const DockIcon = app.DockIcon;
  const stateClass = !visible
    ? ' is-inactive'
    : active
      ? ' is-active'
      : ' is-behind';

  function handleClose() {
    closeBuiltinApp(
      appId,
      workspace,
      desktop,
      openWindows,
      activeWindowId,
      activeDesktopWindows,
      dispatch
    );
  }

  function handleFocus() {
    if (!active) {
      activateBuiltinApp(
        appId,
        workspace,
        desktop,
        openWindows,
        dispatch,
        platform
      );
    }
  }

  return (
    <div
      className={`builtin-window is-fullscreen${stateClass} ${className}`.trim()}
      style={style}
      onMouseDown={handleFocus}
    >
      <div className="builtin-window-chrome">
        <div className="builtin-window-chrome-left">
          <DockIcon size={16} color="currentColor" />
          <span className="builtin-window-title">{title || app.label}</span>
        </div>
        <div className="builtin-window-chrome-right">
          {toolbarExtra}
          <button
            type="button"
            className="builtin-window-close"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title={`Close ${app.label}`}
            aria-label={`Close ${app.label}`}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="builtin-window-body">{children}</div>
    </div>
  );
}

export default BuiltinWindowChrome;
