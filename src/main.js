const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let widgetWindow;
let controlsWindow;
let settingsWindow;

const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');
const timerStatePath = path.join(userDataPath, 'timerState.json');

let settings = {
  shape: 'circle',
  defaultDuration: 300000,
  widgetSize: 100,
  alwaysOnTop: true,
  colorTheme: 'default',
  flashOnComplete: false,
  showTimerDisplay: true
};

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      settings = { ...settings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

function createWidgetWindow() {
  loadSettings();
  
  widgetWindow = new BrowserWindow({
    width: settings.widgetSize,
    height: settings.widgetSize,
    frame: false,
    transparent: true,
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  widgetWindow.loadFile(path.join(__dirname, 'windows', 'widget.html'));
  
  // Open dev tools for debugging
  if (process.argv.includes('--dev')) {
    widgetWindow.webContents.openDevTools();
  }
  
  widgetWindow.on('closed', () => {
    widgetWindow = null;
    if (controlsWindow && !controlsWindow.isDestroyed()) {
      controlsWindow.close();
    }
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
    }
  });

  const savedBounds = loadWindowBounds();
  if (savedBounds) {
    widgetWindow.setBounds(savedBounds);
  }
}

function createControlsWindow() {
  if (controlsWindow && !controlsWindow.isDestroyed()) {
    controlsWindow.focus();
    return;
  }

  controlsWindow = new BrowserWindow({
    width: 300,
    height: 400,
    frame: true,
    resizable: false,
    alwaysOnTop: settings.alwaysOnTop,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  controlsWindow.loadFile(path.join(__dirname, 'windows', 'controls.html'));

  controlsWindow.on('closed', () => {
    controlsWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 500,
    frame: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, 'windows', 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function loadWindowBounds() {
  try {
    const boundsPath = path.join(userDataPath, 'windowBounds.json');
    if (fs.existsSync(boundsPath)) {
      return JSON.parse(fs.readFileSync(boundsPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading window bounds:', error);
  }
  return null;
}

function saveWindowBounds() {
  try {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      const bounds = widgetWindow.getBounds();
      const boundsPath = path.join(userDataPath, 'windowBounds.json');
      fs.writeFileSync(boundsPath, JSON.stringify(bounds));
    }
  } catch (error) {
    console.error('Error saving window bounds:', error);
  }
}

app.whenReady().then(() => {
  createWidgetWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWidgetWindow();
  }
});

app.on('before-quit', () => {
  saveWindowBounds();
});

ipcMain.on('open-controls', () => {
  createControlsWindow();
});

ipcMain.on('open-settings', () => {
  createSettingsWindow();
});

ipcMain.on('close-controls', () => {
  if (controlsWindow && !controlsWindow.isDestroyed()) {
    controlsWindow.close();
  }
});

ipcMain.on('close-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
});

ipcMain.handle('get-settings', () => {
  return settings;
});

ipcMain.on('save-settings', (event, newSettings) => {
  settings = { ...settings, ...newSettings };
  saveSettings();
  
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('settings-updated', settings);
    
    if (settings.widgetSize !== widgetWindow.getBounds().width) {
      widgetWindow.setSize(settings.widgetSize, settings.widgetSize);
    }
    
    widgetWindow.setAlwaysOnTop(settings.alwaysOnTop);
  }
});

ipcMain.handle('load-timer-state', () => {
  try {
    if (fs.existsSync(timerStatePath)) {
      return JSON.parse(fs.readFileSync(timerStatePath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading timer state:', error);
  }
  return null;
});

ipcMain.on('save-timer-state', (event, state) => {
  try {
    fs.writeFileSync(timerStatePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error saving timer state:', error);
  }
});

ipcMain.on('timer-update', (event, data) => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('timer-update', data);
  }
  if (controlsWindow && !controlsWindow.isDestroyed()) {
    controlsWindow.webContents.send('timer-update', data);
  }
});

ipcMain.on('timer-command', (event, command, data) => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('timer-command', command, data);
  }
});