import { v4 as uuidv4 } from 'uuid';
import Store from 'electron-store';
import { Profile } from '../model/Profile';

export default class ProfileManager {
  private profiles: Profile[] = [];

  private defaultProfile: Profile | undefined;

  private profileMap: Map<string, Profile> = new Map();

  private store: Store;

  constructor(store: Store) {
    this.store = store;

    this.profiles = [];
    this.profileMap = new Map();
  }

  public init(): void {
    // console.log('ProfileManager init');
    // console.log('Store', this.store);
    // let defaultProfileId = this.store.get('defaultProfileId') as string;
    // this.removeProfile(defaultProfileId);
    // this.store.delete('defaultProfileId');
    const defaultProfileId = this.store.get('defaultProfileId') as string;
    let profiles = this.store.get('profiles') as { [key: string]: Profile };
    let profilesArray = this.store.get('profilesArray') as Profile[];
    if (profiles && profilesArray && defaultProfileId) {
      this.profiles = profilesArray;
      profilesArray.forEach((profile) => {
        this.profileMap.set(profile.id, profile);
      });
      this.defaultProfile = this.profileMap.get(defaultProfileId);
    } else {
      profiles = {};
      profilesArray = [];
      const key: string = uuidv4();
      profiles[key] = {
        id: key,
        name: 'Guest',
        partition: 'persist:guest',
        userId: '',
        email: '',
        isDefault: true,
        isGuest: true,
        icon: 'default',
        color: 'default',
        passCode: '',
        orgId: '',
        createdAt: Date.now(),
      };
      profilesArray.push(profiles[key]);
      this.store.set('profiles', profiles);
      this.store.set('defaultProfileId', profiles[key].id);
      this.store.set('profilesArray', profilesArray);
      this.store.set('activeProfileId', profiles[key].id);
      this.defaultProfile = profiles[key];
      this.profiles = profilesArray;
      this.profileMap.set(key, profiles[key]);
    }
  }

  public getProfiles(): Profile[] {
    return this.profiles;
  }

  public getProfileMap(): Map<string, Profile> {
    return this.profileMap;
  }

  public getProfile(id: string): Profile | undefined {
    const xprofiles = this.store.get('profiles') as { [key: string]: Profile };
    return xprofiles[id];
  }

  public getDefaultProfile(): Profile | undefined {
    const defaultProfileId = this.store.get('defaultProfileId') as string;
    const xprofiles = this.store.get('profiles') as { [key: string]: Profile };
    return xprofiles[defaultProfileId];
  }

  public getActiveProfileId(): string | undefined {
    return this.store.get('activeProfileId') as string;
  }

  public setActiveProfileId(id: string): void {
    this.store.set('activeProfileId', id);
  }

  public getActiveProfile(): Profile | undefined {
    const xprofiles = this.store.get('profiles') as { [key: string]: Profile };
    return xprofiles[this.getActiveProfileId() as string];
  }

  public addProfile(profile: Profile): void {
    const profiles = this.store.get('profiles') as { [key: string]: Profile };
    const profilesArray = this.store.get('profilesArray') as Profile[];
    profiles[profile.id] = {
      id: profile.id,
      name: profile.name,
      partition: profile.partition,
      icon: 'default',
      color: 'default',
      isDefault: false,
      isGuest: false,
      email: '',
      userId: '',
      passCode: profile.passCode,
      orgId: '',
      createdAt: Date.now(),
    };
    console.log('addProfile', profiles[profile.id]);
    profilesArray.push(profiles[profile.id]);
    this.store.set('profiles', profiles);
    this.store.set('profilesArray', profilesArray);
    this.profiles = profilesArray;
    this.profileMap.set(profile.id, profile);
  }

  public removeProfile(id: string): void {
    const profiles = this.store.get('profiles') as { [key: string]: Profile };
    const profile = profiles[id];
    if (profile) {
      let profilesArray = this.store.get('profilesArray') as Profile[];
      profilesArray = profilesArray.filter((p) => p.id !== id);
      this.store.set('profilesArray', profilesArray);
      this.profiles = profilesArray;

      delete profiles[id];
      this.store.set('profiles', profiles);
      this.profileMap.delete(id);
    }
  }

  public updateProfile(id: string, profile: Profile): void {
    const profiles = this.store.get('profiles') as { [key: string]: Profile };
    const profilesArray = this.store.get('profilesArray') as Profile[];
    profiles[profile.id] = {
      id: profile.id,
      name: profile.name,
      partition: profile.partition,
    };
    const indexx = profilesArray.findIndex((p) => p.id === id);
    if (indexx !== -1) {
      profilesArray[indexx] = profiles[profile.id];
    }
    const index = this.profiles.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.profiles[index] = profile;
      this.profileMap.set(profile.id, profile);
    }
  }

  public getProfileIndex(id: string): number {
    return this.profiles.findIndex((p) => p.id === id);
  }

  public getProfileCount(): number {
    return this.profiles.length;
  }

  public getProfileName(id: string): string {
    const profile = this.profileMap.get(id);
    if (profile) {
      return profile.name;
    }
    return '';
  }

  public getProfilePartition(id: string): string {
    const profile = this.profileMap.get(id);
    if (profile) {
      return profile.partition;
    }
    return '';
  }

  public getProfileId(name: string): string {
    const profile = this.profiles.find((p) => p.name === name);
    if (profile) {
      return profile.id;
    }
    return '';
  }

  public getProfileNameFromPartition(partition: string): string {
    const profile = this.profiles.find((p) => p.partition === partition);
    if (profile) {
      return profile.name;
    }
    return '';
  }

  public getProfileIdFromPartition(partition: string): string {
    const profile = this.profiles.find((p) => p.partition === partition);
    if (profile) {
      return profile.id;
    }
    return '';
  }

  public getProfileIdFromName(name: string): string {
    const profile = this.profiles.find((p) => p.name === name);
    if (profile) {
      return profile.id;
    }
    return '';
  }

  public getProfileNameFromId(id: string): string {
    const profile = this.profileMap.get(id);
    if (profile) {
      return profile.name;
    }
    return '';
  }

  public getProfilePartitionFromId(id: string): string {
    const profile = this.profileMap.get(id);
    if (profile) {
      return profile.partition;
    }
    return '';
  }
}
