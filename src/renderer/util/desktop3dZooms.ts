import { settingsActions } from "../store/settings-slice";
import { workspaceActions } from "../store/workspace-slice";
import { WorkspaceService } from "../services/workspace";

export type Desktop3dZoomKey = "scene" | "ring" | "mission" | "ringPitch";

export interface Desktop3dLayoutZooms {
  scene?: number | null;
  ring?: number | null;
  mission?: number | null;
  /** Ring camera pitch around look-at (radians) */
  ringPitch?: number | null;
}

/** Apply a space's saved layout zooms into Redux (clears to defaults when missing). */
export function hydrateDesktop3dZoomsFromWorkspace(
  dispatch: any,
  workspace: any
) {
  const zooms = (workspace?.config?.desktop3dZooms ||
    {}) as Desktop3dLayoutZooms;
  dispatch(
    settingsActions.setDesktop3dLayoutZooms({
      scene: zooms.scene ?? null,
      ring: zooms.ring ?? null,
      mission: zooms.mission ?? null,
      ringPitch: zooms.ringPitch ?? null,
    })
  );
}

/**
 * Persist one layout zoom/pitch on the current space and keep Redux + selected
 * workspace config in sync.
 */
export async function persistDesktop3dZoomForWorkspace(
  dispatch: any,
  workspace: any,
  key: Desktop3dZoomKey,
  value: number | null
) {
  if (key === "scene") {
    dispatch(settingsActions.setDesktop3dSceneZoomDistance(value));
  } else if (key === "ring") {
    dispatch(settingsActions.setDesktop3dRingZoomDistance(value));
  } else if (key === "ringPitch") {
    dispatch(settingsActions.setDesktop3dRingViewPitch(value));
  } else {
    dispatch(settingsActions.setDesktop3dMissionZoomDistance(value));
  }

  if (!workspace?.id) return;

  const prevConfig = workspace.config || {};
  const prevZooms = (prevConfig.desktop3dZooms || {}) as Desktop3dLayoutZooms;
  const desktop3dZooms: Desktop3dLayoutZooms = {
    ...prevZooms,
    [key]: value,
  };
  const config = { ...prevConfig, desktop3dZooms };
  const nextWorkspace = { ...workspace, config };

  try {
    await WorkspaceService.updateConfig(workspace.id, config);
    dispatch(workspaceActions.selectWorkspace({ workspace: nextWorkspace }));
    dispatch(workspaceActions.updateWorkspace({ workspace: nextWorkspace }));
  } catch (err) {
    console.error("Failed to persist desktop 3D zoom for space", err);
  }
}
