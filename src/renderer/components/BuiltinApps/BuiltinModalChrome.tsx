import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'react-bootstrap-icons';

import {
  closeBuiltinApp,
  getBuiltinApp,
  hideBuiltinModal,
  type BuiltinAppId,
} from '../../builtin';
import './BuiltinWindowChrome.css';

interface BuiltinModalChromeProps {
  appId: BuiltinAppId;
  title?: string;
  children: ReactNode;
  className?: string;
}

function BuiltinModalChrome({
  appId,
  title,
  children,
  className = '',
}: BuiltinModalChromeProps) {
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
  const activeDesktopWindows = useSelector(
    (state: any) => state.session.activeDesktopWindows
  );
  const activeModalId = useSelector(
    (state: any) => state.builtin?.activeModalId
  );

  const open = activeModalId === appId;
  const DockIcon = app.DockIcon;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Hide to dock — keep icon until X / close
        hideBuiltinModal(dispatch);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, dispatch]);

  if (!open) return null;

  function handleHide() {
    hideBuiltinModal(dispatch);
  }

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

  return (
    <div className="builtin-modal-root" role="presentation">
      <div
        className="builtin-modal-backdrop"
        onClick={handleHide}
        aria-hidden="true"
      />
      <div
        className={`builtin-modal-panel builtin-modal-${appId} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title || app.label}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="builtin-window-chrome">
          <div className="builtin-window-chrome-left">
            <DockIcon size={16} color="currentColor" />
            <span className="builtin-window-title">{title || app.label}</span>
          </div>
          <div className="builtin-window-chrome-right">
            <button
              type="button"
              className="builtin-window-close"
              onClick={handleClose}
              title={`Close ${app.label}`}
              aria-label={`Close ${app.label}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="builtin-window-body">{children}</div>
      </div>
    </div>
  );
}

export default BuiltinModalChrome;
