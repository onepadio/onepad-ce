import { settingsActions } from "../store/settings-slice";
import { workspaceActions } from "../store/workspace-slice";
import { WorkspaceService } from "../services/workspace";
import {
  DEFAULT_EXPERIENCE_ID,
  getExperience,
} from "../components/LaunchPad3D/experiences/registry";
import type { Desktop3dExperienceId } from "../components/LaunchPad3D/experiences/types";

/** Apply a space's saved 3D experience into Redux. */
export function hydrateDesktop3dExperienceFromWorkspace(
  dispatch: any,
  workspace: any
) {
  const raw = workspace?.config?.desktop3dExperience as
    | string
    | null
    | undefined;
  const id = getExperience(raw).id;
  dispatch(settingsActions.setDesktop3dExperience(id));
}

/**
 * Persist experience on the current space and keep Redux + selected workspace
 * config in sync.
 */
export async function persistDesktop3dExperienceForWorkspace(
  dispatch: any,
  workspace: any,
  experienceId: Desktop3dExperienceId
) {
  const id = getExperience(experienceId).id;
  dispatch(settingsActions.setDesktop3dExperience(id));

  if (!workspace?.id) return;

  const prevConfig = workspace.config || {};
  const config = { ...prevConfig, desktop3dExperience: id };
  const nextWorkspace = { ...workspace, config };

  try {
    await WorkspaceService.updateConfig(workspace.id, config);
    dispatch(workspaceActions.selectWorkspace({ workspace: nextWorkspace }));
    dispatch(workspaceActions.updateWorkspace({ workspace: nextWorkspace }));
  } catch (err) {
    console.error("Failed to persist desktop 3D experience for space", err);
  }
}

export { DEFAULT_EXPERIENCE_ID, getExperience };
