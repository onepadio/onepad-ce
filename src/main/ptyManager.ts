import { ipcMain, BrowserWindow } from 'electron';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

type PtyHandle = {
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: () => void;
  onData: (cb: (data: string) => void) => void;
  onExit: (cb: (e: { exitCode: number; signal?: number }) => void) => void;
};

let pty: typeof import('node-pty') | null = null;
try {
  // Native module — must stay external to the bundler
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  pty = require('node-pty');
} catch (err) {
  console.error('[PtyManager] Failed to load node-pty:', err);
}

const sessions = new Map<string, PtyHandle>();

function defaultShell(): string {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'powershell.exe';
  }
  return process.env.SHELL || (process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash');
}

function defaultCwd(): string {
  return process.env.HOME || process.env.USERPROFILE || os.homedir() || process.cwd();
}

/** Args so .zshrc/.bashrc load (aliases, oh-my-zsh colors, etc.) */
function shellArgs(shell: string): string[] {
  if (process.platform === 'win32') return [];
  const base = shell.split(/[/\\]/).pop() || '';
  if (base === 'zsh' || base === 'bash' || base === 'sh') {
    // login + interactive → real TTY experience with user config
    return ['-l', '-i'];
  }
  if (base === 'fish') return ['-l'];
  return [];
}

/**
 * Env that makes ls/git/grep emit ANSI colors into our PTY.
 * xterm theme maps those ANSI codes to the chosen color scheme.
 */
function terminalEnv(): Record<string, string> {
  const env = { ...process.env } as Record<string, string>;

  env.TERM = 'xterm-256color';
  env.COLORTERM = 'truecolor';
  env.FORCE_COLOR = '1';

  // macOS / BSD ls
  env.CLICOLOR = '1';
  env.CLICOLOR_FORCE = '1';
  // dirs=bold blue, executables=bold green, symlinks=bold cyan, …
  if (!env.LSCOLORS) {
    env.LSCOLORS = 'ExGxFxdxCxegedabagacad';
  }

  // GNU ls (Linux, or macOS with coreutils)
  if (!env.LS_COLORS) {
    env.LS_COLORS = [
      'di=1;34', // directory
      'ln=1;36', // symlink
      'so=1;35', // socket
      'pi=33', // fifo
      'ex=1;32', // executable
      'bd=1;33', // block device
      'cd=1;33', // char device
      'su=1;31', // setuid
      'sg=1;31', // setgid
      'tw=1;34', // sticky + other-writable
      'ow=1;34', // other-writable
      'or=1;31', // orphan symlink
      'mi=1;31', // missing file
      '*.zip=1;31',
      '*.tar=1;31',
      '*.gz=1;31',
      '*.jpg=1;35',
      '*.jpeg=1;35',
      '*.png=1;35',
      '*.gif=1;35',
      '*.mp4=1;35',
      '*.mp3=1;35',
    ].join(':');
  }

  return env;
}

function broadcast(channel: string, payload: unknown) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  });
}

export function createPtySession(options?: {
  cols?: number;
  rows?: number;
  cwd?: string;
  shell?: string;
  /** When set, used instead of default interactive shell args (e.g. docker exec …) */
  args?: string[];
}): { id: string } | { error: string } {
  if (!pty) {
    return {
      error:
        'Terminal backend unavailable (node-pty failed to load). Rebuild native modules with npm run rebuild.',
    };
  }

  const id = uuidv4();
  const cols = Math.max(20, options?.cols || 80);
  const rows = Math.max(10, options?.rows || 24);
  const cwd = options?.cwd || defaultCwd();
  const shell = options?.shell || defaultShell();
  const args =
    options?.args !== undefined ? options.args : shellArgs(shell);

  try {
    const env = terminalEnv();
    // Ensure Docker CLI is on PATH for docker exec sessions
    if (process.platform === 'darwin') {
      env.PATH = `/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:${env.PATH || ''}`;
    } else if (process.platform === 'linux') {
      env.PATH = `/usr/local/bin:/usr/bin:${env.PATH || ''}`;
    } else if (process.platform === 'win32' && process.env.ProgramFiles) {
      env.PATH = `${process.env.ProgramFiles}\\Docker\\Docker\\resources\\bin;${env.PATH || ''}`;
    }

    const term = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env,
    });

    term.onData((data: string) => {
      broadcast('pty-data', { id, data });
    });

    term.onExit(({ exitCode, signal }) => {
      broadcast('pty-exit', { id, exitCode, signal });
      sessions.delete(id);
    });

    sessions.set(id, term);
    return { id };
  } catch (err: any) {
    console.error('[PtyManager] spawn failed:', err);
    return { error: err?.message || 'Failed to start shell' };
  }
}

export function writePty(id: string, data: string): boolean {
  const term = sessions.get(id);
  if (!term) return false;
  term.write(data);
  return true;
}

export function resizePty(id: string, cols: number, rows: number): boolean {
  const term = sessions.get(id);
  if (!term) return false;
  try {
    term.resize(Math.max(2, cols), Math.max(1, rows));
    return true;
  } catch {
    return false;
  }
}

export function killPty(id: string): boolean {
  const term = sessions.get(id);
  if (!term) return false;
  try {
    term.kill();
  } catch {
    // ignore
  }
  sessions.delete(id);
  return true;
}

export function killAllPtys() {
  for (const id of [...sessions.keys()]) {
    killPty(id);
  }
}

export function registerPtyIpc() {
  ipcMain.handle('pty-create', (_event, options) => createPtySession(options));
  ipcMain.handle('pty-write', (_event, id: string, data: string) => writePty(id, data));
  ipcMain.handle('pty-resize', (_event, id: string, cols: number, rows: number) =>
    resizePty(id, cols, rows)
  );
  ipcMain.handle('pty-kill', (_event, id: string) => killPty(id));
  ipcMain.handle('pty-default-cwd', () => defaultCwd());
  ipcMain.handle('pty-default-shell', () => defaultShell());
}
