import path from 'path';
import { app, dialog, BrowserWindow } from 'electron';
import fs from 'fs';

export default function saveToDisk(
  mainWindow: BrowserWindow | undefined,
  content: string
): void {
  console.log('saveToDisk');
  const options = {
    title: 'Save File',
    defaultPath: path.join(app.getPath('downloads'), 'onepad'),
    buttonLabel: 'Save',
    filters: [
      {
        name: 'JSON',
        extensions: ['json'],
      },
    ],
  };
  dialog
    .showSaveDialog(mainWindow, options)
    .then((result) => {
      console.log(result.canceled);
      console.log(result.filePath);
      // eslint-disable-next-line promise/always-return
      if (!result.canceled) {
        fs.writeFile(result.filePath.toString(), content, (err: any) =>
          err ? console.error(err) : console.log('Saved!')
        );
      }
    })
    .catch((err) => {
      console.error(err);
    });
}
