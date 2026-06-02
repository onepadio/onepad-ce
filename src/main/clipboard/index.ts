import { app } from 'electron';
import { EventEmitter } from 'events';
import * as path from 'path';
import { execFile, ChildProcess } from 'child_process';

// import { fileURLToPath } from 'url';
// const dirName = path.dirname(fileURLToPath(import.meta.url));

class ClipboardEventListener extends EventEmitter {
  private child: ChildProcess | null;

  constructor() {
    super();
    this.child = null;
  }

  startListening(): void {
    const { platform } = process;
    if (platform === 'darwin') {
      if (app.isPackaged) {
        this.child = execFile(
          path.join(
            process.resourcesPath,
            'assets',
            'clipboard-sync/clipboard-event-handler-mac'
          )
        );
      } else {
        this.child = execFile(
          path.join(
            __dirname,
            '../../../assets/clipboard-sync/clipboard-event-handler-mac'
          )
        );
      }
    } else {
      throw new Error('Unsupported platform');
    }
    /*
    else if (platform === 'linux') {
      this.child = execFile(
        path.join(__dirname, runFrom, 'clipboard-event-handler-linux')
      );
    } else if (platform === 'win32') {
      this.child = execFile(
        path.join(__dirname, runFrom, 'clipboard-event-handler-win32.exe')
      );
    } */

    if (this.child) {
      this.child.stdout?.on('data', (data) => {
        if (data.trim() === 'CLIPBOARD_CHANGE') {
          this.emit('change');
        }
      });
    }
  }

  stopListening(): boolean {
    const res = this.child?.kill();
    return res !== undefined && res;
  }
}

export default new ClipboardEventListener();

// Sample usage
/*
import clipboardListener from 'clipboard-event'

// To start listening
clipboardListener.startListening();

clipboardListener.on('change', () => {
  console.log('Clipboard changed');
});

// To stop listening
clipboardListener.stopListening();
*/
