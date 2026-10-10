import { workspaceActions } from "../store/workspace-slice";
import { SpaceService } from "../services/space";

export const WARM_SPACE_MAX = 3;

function workspaceSlice(state: any) {
  return state?.workspace || {};
}

/**
 * Mark a space as warm (LRU front) and snapshot chrome data for keep-alive mount.
 * Returns workspace ids that fell off the LRU (to pause/evict).
 */
export function touchWarmSpace(
  dispatch: any,
  getState: () => any,
  workspace: any,
  extras?: { apps?: any[]; links?: any[]; desktops?: any[] }
): string[] {
  if (!workspace?.id) return [];
  const prev: string[] = workspaceSlice(getState()).warmSpaceIds || [];
  const wsSlice = workspaceSlice(getState());
  dispatch(
    workspaceActions.touchWarmSpace({
      workspaceId: workspace.id,
      workspace,
      apps: extras?.apps ?? wsSlice.apps,
      links: extras?.links ?? wsSlice.links,
      desktops: extras?.desktops ?? wsSlice.desktops,
      max: WARM_SPACE_MAX,
    })
  );
  const next: string[] = workspaceSlice(getState()).warmSpaceIds || [];
  return prev.filter((id) => !next.includes(id));
}

/** Pause session for an evicted warm space and drop it from the LRU. */
export function evictWarmSpace(
  dispatch: any,
  getState: () => any,
  workspaceId: string
) {
  if (!workspaceId) return;
  try {
    const session = getState()?.session || {};
    SpaceService.pauseSpace(
      workspaceId,
      session.openTabs || {},
      session.openWindows || {},
      dispatch
    );
  } catch (err) {
    console.error("Failed to pause evicted warm space", workspaceId, err);
  }
  dispatch(workspaceActions.evictWarmSpace({ workspaceId }));
}
