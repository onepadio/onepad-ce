import { useEffect, useRef, type ComponentType } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import TerminalApp from '../Terminal/TerminalApp';
import CalculatorApp from '../Calculator/CalculatorApp';
import NotesApp from '../Notes/NotesApp';
import DockerApp from '../Docker/DockerApp';
import {
  BUILTIN_APPS,
  isBuiltinAppSupported,
  type BuiltinAppId,
} from '../../builtin';
import { builtinActions } from '../../store/builtin-slice';

/** UI mounts — kept separate from registry metadata to avoid circular imports */
export const BUILTIN_APP_COMPONENTS: Record<
  BuiltinAppId,
  ComponentType
> = {
  terminal: TerminalApp,
  calculator: CalculatorApp,
  notes: NotesApp,
  docker: DockerApp,
};

function BuiltinAppsHost() {
  const dispatch = useDispatch();
  const workspaceId = useSelector(
    (state: any) => state.workspace.selectedWorkspace?.id
  );
  const platform = useSelector((state: any) => state.app.platform);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const activeModalId = useSelector(
    (state: any) => state.builtin?.activeModalId
  );
  const prevActiveWindowIdRef = useRef(activeWindowId);

  // Dismiss modal overlays when switching spaces
  useEffect(() => {
    dispatch(builtinActions.closeAllModals());
  }, [workspaceId, dispatch]);

  // Hide notes/calculator (and other modal overlays) when switching windows
  // or returning to launchpad — keep dock icons until explicitly closed.
  useEffect(() => {
    const prev = prevActiveWindowIdRef.current;
    prevActiveWindowIdRef.current = activeWindowId;
    if (prev === activeWindowId) return;
    if (!activeModalId) return;
    dispatch(builtinActions.hideModal());
  }, [activeWindowId, activeModalId, dispatch]);

  return (
    <>
      {BUILTIN_APPS.map((app) => {
        if (!isBuiltinAppSupported(app, platform)) return null;
        const AppComponent = BUILTIN_APP_COMPONENTS[app.id];
        if (!AppComponent) return null;
        return <AppComponent key={app.id} />;
      })}
    </>
  );
}

export default BuiltinAppsHost;
