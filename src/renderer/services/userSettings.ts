import { UserSettingsRepository } from "../repository/userSettings";

export interface UserSettings {
  isSpaceBrowserEnabled?: boolean;
  isWorkspacesEnabled?: boolean;
  isDesktopsEnabled?: boolean;
  isSharedAppsEnabled?: boolean;
  isSessionsEnabled?: boolean;
  isSplitWindowsEnabled?: boolean;
  isEfficiencyModeEnabled?: boolean;
  isAdvancedBackgroundEnabled?: boolean;
  isExternalWindowMode?: boolean;
  isDeveloperMode?: boolean;
  isTabGroupsEnabled?: boolean;
  isSpaceOSEnabled?: boolean;
  isSleepingTabsEnabled?: boolean;
  sleepingTabsTimeout?: number;
  isKeepActiveWindowTabsAwake?: boolean;
  desktopVisualMode?: "2d" | "3d";
  desktop3dLayout?: "coverflow" | "mission" | "ring" | "scene";
  /** Scene overview camera distance from look-at */
  desktop3dSceneZoomDistance?: number | null;
  /** @deprecated prefer desktopVisualMode */
  launchpadVisualMode?: "2d" | "3d";
  /** @deprecated prefer desktop3dLayout */
  launchpad3dLayout?: "coverflow" | "mission" | "ring" | "scene";
}

export class UserSettingsService {
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const result = await UserSettingsRepository.getByUserId(userId);
      return result ? result.settings : null;
    } catch (error) {
      console.error("Failed to get user settings:", error);
      return null;
    }
  }

  static async saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
    try {
      await UserSettingsRepository.upsert(userId, settings);
    } catch (error) {
      console.error("Failed to save user settings:", error);
      throw error;
    }
  }

  static async deleteUserSettings(userId: string): Promise<void> {
    try {
      await UserSettingsRepository.deleteByUserId(userId);
    } catch (error) {
      console.error("Failed to delete user settings:", error);
      throw error;
    }
  }
}
