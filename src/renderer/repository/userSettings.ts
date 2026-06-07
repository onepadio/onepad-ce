import { db } from "./db";

export class UserSettingsRepository {
  static async getByUserId(userId: string): Promise<any> {
    try {
      // @ts-expect-error
      const settings = await db.userSettings.where('userId').equals(userId).first();
      return settings;
    } catch (error) {
      console.error('Failed to get user settings:', error);
      throw error;
    }
  }

  static async upsert(userId: string, settings: any): Promise<any> {
    try {
      // @ts-expect-error
      const existing = await db.userSettings.where('userId').equals(userId).first();
      
      if (existing) {
        // Update existing settings
        // @ts-expect-error
        await db.userSettings.update(existing.id, {
          settings: settings,
          updatedAt: Date.now(),
        });
        return existing.id;
      } else {
        // Create new settings entry
        // @ts-expect-error
        const id = await db.userSettings.add({
          userId: userId,
          settings: settings,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        return id;
      }
    } catch (error) {
      console.error('Failed to upsert user settings:', error);
      throw error;
    }
  }

  static async deleteByUserId(userId: string): Promise<void> {
    try {
      // @ts-expect-error
      const existing = await db.userSettings.where('userId').equals(userId).first();
      if (existing) {
        // @ts-expect-error
        await db.userSettings.delete(existing.id);
      }
    } catch (error) {
      console.error('Failed to delete user settings:', error);
      throw error;
    }
  }
}
