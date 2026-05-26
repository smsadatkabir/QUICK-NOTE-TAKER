const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Note',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          BrowserWindow.getFocusedWindow().webContents.send('menu-new-note');
        }
      },
      {
        label: 'Open File',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          BrowserWindow.getFocusedWindow().webContents.send('menu-open-file');
        }
      },
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click: () => {
          BrowserWindow.getFocusedWindow().webContents.send('menu-save');
        }
      },
      {
        label: 'Save As',
        accelerator: 'CmdOrCtrl+Shift+S',
        click: () => {
          BrowserWindow.getFocusedWindow().webContents.send('menu-save-as');
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => app.quit()
      }
    ]
  }
];
const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// SAVE NOTE (default file)
ipcMain.handle('save-note', async (event, text) => {
  const filePath = path.join(app.getPath('documents'), 'quicknote.txt');
  fs.writeFileSync(filePath, text, 'utf-8');
  return { success: true };
});

// DELETE NOTE
ipcMain.handle('delete-note', async () => {
  const filePath = path.join(app.getPath('documents'), 'quicknote.txt');

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return { success: true };
});

// LOAD NOTE
ipcMain.handle('load-note', async () => {
  const filePath = path.join(app.getPath('documents'), 'quicknote.txt');

  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  return '';
});

// SAVE AS
ipcMain.handle('save-as', async (event, text) => {
  const result = await dialog.showSaveDialog({
    defaultPath: 'mynote.txt',
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });

  if (result.canceled) return { success: false };

  fs.writeFileSync(result.filePath, text, 'utf-8');
  return { success: true, filePath: result.filePath };
});

// NEW NOTE CONFIRM
ipcMain.handle('new-note', async () => {
  const result = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Discard Changes', 'Cancel'],
    defaultId: 1,
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. Start a new note anyway?'
  });

  return { confirmed: result.response === 0 };
});

// OPEN FILE
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });

  if (result.canceled) return { success: false };

  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');

  return { success: true, content, filePath };
});


ipcMain.handle('smart-save', async (event, text, filePath) => {
  const targetPath = filePath || path.join(app.getPath('documents'), 'quicknote.txt');

  fs.writeFileSync(targetPath, text, 'utf-8');

  return { success: true, filePath: targetPath };
});