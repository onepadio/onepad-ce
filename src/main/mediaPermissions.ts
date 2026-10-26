import {
  Session,
  desktopCapturer,
  dialog,
  BrowserWindow,
  systemPreferences,
  shell,
} from 'electron';
import log from 'electron-log';

const configuredSessions = new WeakSet<Session>();

const ALLOWED_PERMISSIONS = new Set([
  'media',
  'display-capture',
  'fullscreen',
  'notifications',
  'pointerLock',
  'clipboard-read',
  'clipboard-sanitized-write',
  'speaker-selection',
  'storage-access',
  'idle-detection',
]);

async function ensureMacMediaAccess(
  mediaTypes?: Array<'video' | 'audio'>
): Promise<boolean> {
  if (process.platform !== 'darwin') return true;

  const types = mediaTypes?.length ? mediaTypes : ['video', 'audio'];
  let granted = true;

  for (const type of types) {
    const mediaType = type === 'video' ? 'camera' : 'microphone';
    const status = systemPreferences.getMediaAccessStatus(mediaType);
    if (status === 'granted') continue;

    try {
      const ok = await systemPreferences.askForMediaAccess(mediaType);
      if (!ok) granted = false;
    } catch (error) {
      log.error(`askForMediaAccess(${mediaType}) failed`, error);
      granted = false;
    }
  }

  return granted;
}

async function ensureMacScreenCaptureAccess(
  parentWindow?: BrowserWindow | null
): Promise<boolean> {
  if (process.platform !== 'darwin') return true;

  const status = systemPreferences.getMediaAccessStatus('screen');
  if (status === 'granted') return true;

  // Touching getSources triggers the macOS Screen Recording prompt when status
  // is not-determined. Denied/restricted needs System Settings.
  try {
    await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1, height: 1 },
    });
  } catch (error) {
    log.warn('desktopCapturer.getSources during screen consent failed', error);
  }

  const after = systemPreferences.getMediaAccessStatus('screen');
  if (after === 'granted') return true;

  if (after === 'denied' || after === 'restricted') {
    const options: Electron.MessageBoxOptions = {
      type: 'warning',
      title: 'Screen Sharing Permission',
      message: 'Screen Recording permission is required for screen sharing.',
      detail:
        'Enable OnePad under System Settings → Privacy & Security → Screen Recording, then try again.',
      buttons: ['Open System Settings', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
    };
    const { response } =
      parentWindow && !parentWindow.isDestroyed()
        ? await dialog.showMessageBox(parentWindow, options)
        : await dialog.showMessageBox(options);

    if (response === 0) {
      shell.openExternal(
        'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
      );
    }
    return false;
  }

  // not-determined / unknown: allow the request so Chromium can continue into
  // getDisplayMedia; the OS prompt is triggered by capturing sources.
  return true;
}

async function pickDisplayMediaSource(
  parentWindow?: BrowserWindow | null
): Promise<Electron.DesktopCapturerSource | null> {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 0, height: 0 },
    fetchWindowIcons: false,
  });

  if (!sources.length) return null;

  const screens = sources.filter((s) => s.id.startsWith('screen:'));
  const windows = sources.filter((s) => s.id.startsWith('window:'));
  // Prefer screens, then a limited set of windows so the dialog stays usable.
  const choices = [...screens, ...windows].slice(0, 8);

  if (choices.length === 1) return choices[0];

  const options: Electron.MessageBoxOptions = {
    type: 'question',
    title: 'Share your screen',
    message: 'Choose what to share',
    detail: 'Google Meet, Teams, and similar apps can use this selection.',
    buttons: [...choices.map((s) => s.name), 'Cancel'],
    cancelId: choices.length,
    defaultId: 0,
  };
  const { response } =
    parentWindow && !parentWindow.isDestroyed()
      ? await dialog.showMessageBox(parentWindow, options)
      : await dialog.showMessageBox(options);

  if (response < 0 || response >= choices.length) return null;
  return choices[response];
}

function getParentWindow(
  contents: Electron.WebContents | null | undefined
): BrowserWindow | null {
  if (!contents || contents.isDestroyed()) return null;
  return BrowserWindow.fromWebContents(contents) ?? BrowserWindow.getFocusedWindow();
}

/**
 * Enable camera/mic and screen sharing (getDisplayMedia) for a session so
 * sites like Google Meet and Teams can request permissions when needed.
 */
export function setupMediaPermissions(ses: Session): void {
  if (configuredSessions.has(ses)) return;
  configuredSessions.add(ses);

  ses.setPermissionCheckHandler((_webContents, permission) => {
    return ALLOWED_PERMISSIONS.has(permission);
  });

  ses.setPermissionRequestHandler(async (webContents, permission, callback, details) => {
    try {
      if (!ALLOWED_PERMISSIONS.has(permission)) {
        callback(false);
        return;
      }

      if (permission === 'media') {
        const mediaDetails = details as Electron.MediaAccessPermissionRequest;
        const ok = await ensureMacMediaAccess(mediaDetails.mediaTypes);
        callback(ok);
        return;
      }

      if (permission === 'display-capture') {
        const parent = getParentWindow(webContents);
        const ok = await ensureMacScreenCaptureAccess(parent);
        callback(ok);
        return;
      }

      callback(true);
    } catch (error) {
      log.error('setPermissionRequestHandler failed', permission, error);
      callback(false);
    }
  });

  ses.setDisplayMediaRequestHandler(
    async (request, callback) => {
      try {
        const parent = BrowserWindow.getFocusedWindow();

        const screenOk = await ensureMacScreenCaptureAccess(parent);
        if (!screenOk) {
          callback({});
          return;
        }

        if (!request.videoRequested) {
          callback(
            request.audioRequested && process.platform === 'win32'
              ? { audio: 'loopback' }
              : {}
          );
          return;
        }

        const source = await pickDisplayMediaSource(parent);
        if (!source) {
          callback({});
          return;
        }

        const streams: Electron.Streams = { video: source };
        if (request.audioRequested && process.platform === 'win32') {
          streams.audio = 'loopback';
        }
        callback(streams);
      } catch (error) {
        log.error('setDisplayMediaRequestHandler failed', error);
        callback({});
      }
    },
    // macOS 15+: native system picker when available (handler skipped).
    { useSystemPicker: true }
  );

  log.info('Media / screen-sharing permissions configured for session');
}
