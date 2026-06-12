// db.js
import {Dexie} from 'dexie';
import 'dexie-observable';
import log from 'loglevel';
import { v4 as uuidv4 } from "uuid";

import ProfileApi from '../api/ProfileApi';
import { USER_TYPE } from '../model/user';
import WorkspaceApi from '../api/WorkspaceApi';
import { WorkspaceService } from '../services/workspace';

export const db = new Dexie('switchpad');
db.version(9).stores({
  workspaces: '$$id, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
});

db.version(10).stores({
  workspaces: '$$id, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
}).upgrade (trans => {
  // @ts-expect-error
  let _appsModified = trans.apps.toCollection().modify ((app: any) => {
      app.state = {tabs: []};
  });

  // @ts-expect-error
  let _linksModified = trans.links.toCollection().modify ((link: any) => {
    link.state = {tabs: []};
  });
});

db.version(11).stores({
  workspaces: '$$id, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
});

db.version(12).stores({
  workspaces: '$$id, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
});

db.version(13).stores({
  workspaces: '$$id, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
  browsers: '$$id, workspace', // Primary key and indexed props
});

db.version(14).stores({
  workspaces: '$$id, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
  browsers: '$$id, workspace', // Primary key and indexed props
  xapps:'$$id, createdAt, updatedAt, data, state', // Primary key and indexed props
});

db.version(16).stores({
  users: '$$id, email, name, createdAt, updatedAt, profiles',
  profiles: '$$id, name, user, createdAt, updatedAt, data ',
  workspaces: '$$id, profile, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
  browsers: '$$id, workspace', // Primary key and indexed props
  xapps:'$$id, createdAt, updatedAt, data, state', // Primary key and indexed props
}).upgrade (trans => {
  // @ts-expect-error
  let _wsModified = trans.workspaces.toCollection().modify ((workspace: any) => {
    workspace.profile = "default";
  });
});

db.version(17).stores({
  users: '$$id, email, name, createdAt, updatedAt, profiles',
  profiles: '$$id, name, user, createdAt, updatedAt, data ',
  workspaces: '$$id, profile, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data', // Primary key and indexed props
  browsers: '$$id, workspace', // Primary key and indexed props
  xapps:'$$id, createdAt, updatedAt, data, state, profile', // Primary key and indexed props
}).upgrade (trans => {
  // @ts-expect-error
  let _app = trans.xapps.toCollection().modify ((app: any) => {
    app.profile = "default";
  });
});

db.version(18).stores({
  users: '$$id, email, name, createdAt, updatedAt, profiles',
  profiles: '$$id, name, user, createdAt, updatedAt, data, uid',
  workspaces: '$$id, profile, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault, uid',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state, uid', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data, uid', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync, uid', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  browsers: '$$id, workspace, uid', // Primary key and indexed props
  xapps:'$$id, createdAt, updatedAt, data, state, profile, uid', // Primary key and indexed props
}).upgrade (trans => {
  // @ts-expect-error
  let _p = trans.profiles.toCollection().modify ((profile: any) => {
    profile.sync = 0;
    profile.uid = "";
  });
});

db.version(19).stores({
  users: '$$id, email, name, createdAt, updatedAt, profiles',
  profiles: '$$id, name, user, createdAt, updatedAt, data, uid',
  workspaces: '$$id, profile, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault, uid',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state, uid', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data, uid', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync, uid', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  browsers: '$$id, workspace, uid', // Primary key and indexed props
  xapps:'$$id, createdAt, updatedAt, data, state, profile, uid', // Primary key and indexed props
}).upgrade (trans => {
  // @ts-expect-error
  let _a = trans.apps.toCollection().modify ((app: any) => {
    app.data.autoSave = true;
    app.data.suspendTabs = true;
  });

  // @ts-expect-error
  let _xa = trans.xapps.toCollection().modify ((xapp: any) => {
    xapp.data.autoSave = true;
    xapp.data.suspendTabs = true;
  });
});

db.version(20).stores({
  users: '$$id, email, name, createdAt, updatedAt, person',
  profiles: '$$id, name, createdAt, updatedAt, data, uid, user',
  workspaces: '$$id, profile, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault, uid, user',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state, uid', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data, uid', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync, uid', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  browsers: '$$id, workspace, uid', // Primary key and indexed props
  xapps:'$$id, createdAt, updatedAt, data, state, profile, uid', // Primary key and indexed props
  persons: '$$id, name, uid', // Primary key and indexed props
}).upgrade (trans => {
  // add a new person
  // @ts-expect-error TS(2339): Property 'persons' does not exist on type 'Dexie'.
  let _person = db.persons.add({
    name: "Person 1",
    uid: "default"
  }).then((id: any) => {
    log.debug("person created: ", id);
    // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
    let _user= db.users.add({
      email: "",
      name: "Guest",
      person: id,
      type: USER_TYPE.GUEST,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).then((user_id: any) => {
      // @ts-expect-error
      trans.profiles.toCollection().modify ((profile: any) => {
        profile.user = user_id;
      });
      // @ts-expect-error
      trans.workspaces.toCollection().modify ((workspace: any) => {
        workspace.user = user_id;
      });
    }).catch((error: any) => {
      log.error("error adding user: ", error);
    });

  }).catch((error: any) => {
    log.error("error adding person: ", error);
  });
  
});

db.version(21).stores({
  users: '$$id, email, name, createdAt, updatedAt, person',
  profiles: '$$id, name, createdAt, updatedAt, data, uid, user',
  workspaces: '$$id, profile, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault, uid, user',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state, uid', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data, uid', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync, uid', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  browsers: '$$id, workspace, uid', // Primary key and indexed props
  xapps:'$$id, createdAt, updatedAt, data, state, profile, uid', // Primary key and indexed props
  persons: '$$id, name, uid', // Primary key and indexed props
  passwords: '$$id, person, hostname, createdAt, updatedAt, username, password, notes', // Primary key and indexed props
});

db.version(22).stores({
  users: '$$id, email, name, createdAt, updatedAt, person',
  profiles: '$$id, name, createdAt, updatedAt, data, uid, user',
  workspaces: '$$id, profile, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault, uid, user',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state, uid', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data, uid', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync, uid', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  browsers: '$$id, workspace, uid', // Primary key and indexed props
  xapps:'$$id, createdAt, updatedAt, data, state, profile, uid', // Primary key and indexed props
  persons: '$$id, name, uid', // Primary key and indexed props
  passwords: '$$id, person, hostname, createdAt, updatedAt, username, password, notes, workspace', // Primary key and indexed props
  tversions: '$$id, table, version', // Primary key and indexed props
});

db.version(23).stores({
  users: '$$id, email, name, createdAt, updatedAt, person',
  profiles: '$$id, name, createdAt, updatedAt, data, uid, user',
  workspaces: '$$id, profile, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault, uid, user',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state, uid', // Primary key and indexed props
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  categories: '$$id, workspace, name, createdAt, updatedAt, data, uid', // Primary key and indexed props
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state, uid', // Primary key and indexed props
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync, uid', // Primary key and indexed props
  sync: '$$id, createdAt, action, table, data', // Primary key and indexed props
  favourites: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  bookmarks: '$$id, parent , createdAt, updatedAt, data, uid', // Primary key and indexed props
  browsers: '$$id, workspace, uid', // Primary key and indexed props
  xapps:'$$id, createdAt, updatedAt, data, state, profile, uid', // Primary key and indexed props
  persons: '$$id, name, uid', // Primary key and indexed props
  passwords: '$$id, person, hostname, createdAt, updatedAt, username, password, notes, workspace', // Primary key and indexed props
  tversions: '$$id, table, version', // Primary key and indexed pro
}).upgrade (trans => {
  // @ts-expect-error
  let _ws = trans.workspaces.toCollection().modify ((ws: any) => {
    ws.version = uuidv4();
    ws.lastSyncVersion = "";
  });

  // @ts-expect-error
  let _d = trans.desktops.toCollection().modify ((d: any) => {
    d.version = uuidv4();
    d.lastSyncVersion = "";
  });

  // @ts-expect-error
  let _app = trans.apps.toCollection().modify ((app: any) => {
    app.version = uuidv4();
    app.lastSyncVersion = "";
  });

  // @ts-expect-error
  let _link = trans.links.toCollection().modify ((link: any) => {
    link.version = uuidv4();
    link.lastSyncVersion = "";
  });

  // @ts-expect-error
  let _session = trans.sessions.toCollection().modify ((session: any) => {
    session.version = uuidv4();
    session.lastSyncVersion = "";
  });
});

// Version 24: Add person authentication and neverSave list for password manager
db.version(24).stores({
  users: '$$id, email, name, createdAt, updatedAt, person',
  profiles: '$$id, name, createdAt, updatedAt, data, uid, user',
  workspaces: '$$id, profile, name, createdAt, updatedAt, archived, isDefault, state, sync, profileDefault, uid, user',
  desktops: '$$id, workspace, createdAt, updatedAt, default, state, uid',
  apps: '$$id, workspace, desktop, createdAt, updatedAt, data, state, uid',
  categories: '$$id, workspace, name, createdAt, updatedAt, data, uid',
  links: '$$id, workspace, desktop, category, createdAt, updatedAt, data, state, uid',
  sessions: '$$id, workspace, createdAt, updatedAt, data, archived, state, sync, uid',
  sync: '$$id, createdAt, action, table, data',
  favourites: '$$id, parent , createdAt, updatedAt, data, uid',
  bookmarks: '$$id, parent , createdAt, updatedAt, data, uid',
  browsers: '$$id, workspace, uid',
  xapps:'$$id, createdAt, updatedAt, data, state, profile, uid',
  persons: '$$id, name, uid, authType, locked, lastAuthAt', // Added auth fields
  passwords: '$$id, person, hostname, createdAt, updatedAt, username, password, notes, workspace',
  passwordNeverSave: '$$id, person, hostname', // Sites to never offer password saving
  tversions: '$$id, table, version',
  userSettings: '$$id, userId, createdAt, updatedAt, settings', // User-specific settings
}).upgrade(trans => {
  // @ts-expect-error
  trans.persons.toCollection().modify((person: any) => {
    person.authType = 'none'; // 'none', 'password', 'biometric'
    person.locked = false;
    person.lastAuthAt = null;
  });
});

db.on('changes', function (changes) {
  changes.forEach(function (change) {
    log.debug(change);
    switch (change.type) {
        case 1: // CREATED
          log.debug(change.table + ' object  was created: ' + JSON.stringify(change.obj));
          switch (change.table) {
            case 'profiles':
              break;
              try {
                // @ts-expect-error
                if(change.obj.sync === undefined || change.obj.sync === 0){
                  log.debug(change.table + ' object  was created, but not syncing' );
                  return;
                }
              } catch (error) {
                return;
              }
              log.debug("syncing profile created");
              // @ts-expect-error
              ProfileApi.getProfileByUserAndId(change.obj.user, change.obj.uid).then((response: any) => {
                log.debug("profile exist: ", response);
              }).catch((error) => {
                log.error("error getting profile: ", error);
                let _input = {
                  // @ts-expect-error
                  name: change.obj.name,
                  // @ts-expect-error
                  user: change.obj.user,
                };
                ProfileApi.createProfile(_input).then((response: any) => {
                  log.debug("profile created: ", response);
                  // @ts-expect-error
                  db.profiles.update(change.obj.id, {
                    uid: response.id,
                  }).then((id: any) => {
                    log.debug("profile updated: ", id);
                  }).catch((error: any) => {
                    log.error("error updating profile: ", error);
                  });
                }).catch((error: any) => {
                  log.error("error creating profile: ", error);
                });
              });
              break;
            case 'workspaces':
              if(change.obj.sync === 0 || change.obj.uid !== "" ){
                log.debug("workspace is not syncing , skipping");
                break;
              }
              // @ts-expect-error TS(2339): Property 'users' does not exist on type 'Dexie'.
              db.users.get(change.obj.user).then((user: any) => {
                if(user.uid === undefined || user.uid === null || user.uid === "" ){
                  log.error("user.uid is undefined, skipping");
                  return;
                }
                WorkspaceApi.createWorkspace({
                  name: change.obj.name,
                  user: user.uid,
                  bgImage: "",
                }).then((response: any) => {
                    log.debug("SyncHub createWorkspace", response);
                    WorkspaceService.updateWorkspaceUID(change.obj.id, response.id);
                }).catch((error) => {
                    log.error('Error:', error);
                });
              }).catch((error: any) => {
                log.error("error getting user: ", error);
              });
              
              break;
            case 'desktops':
              break;
            case 'apps':
              break;
            case 'categories':
              break;
            case 'links':
              break;
            default:
              break;
          }
          break;
        case 2: // UPDATED
          log.debug(change.table + ' object with key ' + change.key + ' was updated with modifications: ' + JSON.stringify(change.mods));
          switch (change.table) {
            case 'profiles':
              log.debug("profile updated");
              break;
            case 'workspaces':
              log.debug("syncing workspace updated...");
              log.debug(change.obj);
              break;
            case 'apps':
              break;
            case 'desktops':
              break;
            case 'categories':
              break;
            case 'links':
              break;
            default:
              break;
          }
          break;
        case 3: // DELETED
          log.debug(change.table + ' object was deleted: ' + JSON.stringify(change.oldObj));
          switch (change.table) {
            case 'profiles':
              log.debug("profile deleted");
              // delete all workspaces
              // @ts-expect-error
              db.workspaces.where("profile").equals(change.oldObj.id).delete().then(() => {
                log.debug("workspaces deleted");
              }).catch((error: any) => {
                log.error("error deleting workspaces: ", error);
              });

              // delete all xapps
              // @ts-expect-error TS(2339): Property 'xapps' does not exist on type 'Dexie'.
              db.xapps.where("profile").equals(change.oldObj.id).delete().then(() => {
                log.debug("xapps deleted");
              }).catch((error: any) => {
                log.error("error deleting xapps: ", error);
              });
              break;
            case 'workspaces':
              if(change.oldObj.sync === 1){
                log.debug("syncing workspace");
                log.debug(change.oldObj);
              }else{
                log.debug("not syncing workspace");
                log.debug(change.oldObj);
              }

              // delete all desktops
              // @ts-expect-error
              db.desktops.where("workspace").equals(change.oldObj.id).delete().then(() => {
                log.debug("desktops deleted");
              }).catch((error: any) => {
                log.error("error deleting desktops: ", error);
              });

              // delete all browsers
              // @ts-expect-error
              db.browsers.where("workspace").equals(change.oldObj.id).delete().then(() => {
                log.debug("browsers deleted");
              }).catch((error: any) => {
                log.error("error deleting browsers: ", error);
              });

              // delete all sessions
              // @ts-expect-error
              db.sessions.where("workspace").equals(change.oldObj.id).delete().then(() => {
                log.debug("sessions deleted");
              }).catch((error: any) => {
                log.error("error deleting sessions: ", error);
              });

              break;
            case 'desktops':
              // delete all apps
              // @ts-expect-error TS(2339): Property 'apps' does not exist on type 'Dexie'.
              db.apps.where("desktop").equals(change.oldObj.id).delete().then(() => {
                log.debug("apps deleted");
              }).catch((error: any) => {
                log.error("error deleting apps: ", error);
              });

              // delete all links
              // @ts-expect-error TS(2339): Property 'links' does not exist on type 'Dexie'.
              db.links.where("desktop").equals(change.oldObj.id).delete().then(() => {
                log.debug("links deleted");
              }).catch((error: any) => {
                log.error("error deleting links: ", error);
              });
              break;
            case 'apps':
              // delete all favourites
              // @ts-expect-error
              db.favourites.where("parent").equals(change.oldObj.id).delete().then(() => {
                log.debug("favourites deleted");
              }).catch((error: any) => {
                log.error("error deleting favourites: ", error);
              });

              // delete all bookmarks
              // @ts-expect-error
              db.bookmarks.where("parent").equals(change.oldObj.id).delete().then(() => {
                log.debug("bookmarks deleted");
              }).catch((error: any) => {
                log.error("error deleting bookmarks: ", error);
              });
              break;
            case 'categories':
              break;
            case 'links':
              break;
            default:
              break;
          }
          break;
        default:
          break;
    }
  });
});