import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
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

type DragOffset = { x: number; y: number };

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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    baseLeft: number;
    baseTop: number;
    width: number;
    height: number;
  } | null>(null);
  const [offset, setOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

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

  useEffect(() => {
    if (open) return;
    dragRef.current = null;
    setDragging(false);
  }, [open]);

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

  function handleChromePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const target = e.target as Element | null;
    if (target?.closest?.('.builtin-window-close')) return;

    const panel = panelRef.current;
    if (!panel) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = panel.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
      baseLeft: rect.left,
      baseTop: rect.top,
      width: rect.width,
      height: rect.height,
    };
    setDragging(true);
  }

  function handleChromePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    // Keep at least 48px of the panel on-screen
    const minVisible = 48;
    const desiredLeft = drag.baseLeft + dx;
    const desiredTop = drag.baseTop + dy;
    const clampedLeft = Math.min(
      Math.max(desiredLeft, minVisible - drag.width),
      window.innerWidth - minVisible
    );
    const clampedTop = Math.min(
      Math.max(desiredTop, minVisible - drag.height),
      window.innerHeight - minVisible
    );

    setOffset({
      x: drag.origX + (clampedLeft - drag.baseLeft),
      y: drag.origY + (clampedTop - drag.baseTop),
    });
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  return (
    <div className="builtin-modal-root" role="presentation">
      <div
        className="builtin-modal-backdrop"
        onClick={handleHide}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`builtin-modal-panel builtin-modal-${appId}${
          dragging ? ' is-dragging' : ''
        }${offset.x || offset.y ? ' is-moved' : ''} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title || app.label}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        <div
          className={`builtin-window-chrome is-draggable${
            dragging ? ' is-dragging' : ''
          }`}
          onPointerDown={handleChromePointerDown}
          onPointerMove={handleChromePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
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
