const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let widgetWindow;
let controlsWindow;

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
  showTimerDisplay: true,
  screenPosition: 'bottom-right',
  showPopupOnComplete: false,
  popupMessage: 'Timer completed!',
  opacity: 100
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

function getWidgetPosition() {
  const { width: screenWidth, height: screenHeight } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  const margin = 20;
  
  // Calculate widget dimensions based on shape
  let widgetWidth = settings.widgetSize;
  let widgetHeight = settings.widgetSize;
  
  if (settings.shape === 'bar-horizontal') {
    widgetWidth = settings.widgetSize * 4;
    widgetHeight = Math.max(20, settings.widgetSize / 5);
  } else if (settings.shape === 'bar-vertical') {
    widgetWidth = Math.max(20, settings.widgetSize / 5);
    widgetHeight = settings.widgetSize * 4;
  }
  
  let x, y;
  
  switch (settings.screenPosition) {
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-right':
      x = screenWidth - widgetWidth - margin;
      y = margin;
      break;
    case 'bottom-left':
      x = margin;
      y = screenHeight - widgetHeight - margin;
      break;
    case 'bottom-right':
    default:
      x = screenWidth - widgetWidth - margin;
      y = screenHeight - widgetHeight - margin;
      break;
    case 'center':
      x = Math.floor((screenWidth - widgetWidth) / 2);
      y = Math.floor((screenHeight - widgetHeight) / 2);
      break;
  }
  
  return { x, y };
}

function createWidgetWindow() {
  loadSettings();
  
  const position = getWidgetPosition();
  
  // Calculate window dimensions based on shape
  let width = settings.widgetSize;
  let height = settings.widgetSize;
  
  if (settings.shape === 'bar-horizontal') {
    width = settings.widgetSize * 4;
    height = Math.max(20, settings.widgetSize / 5);
  } else if (settings.shape === 'bar-vertical') {
    width = Math.max(20, settings.widgetSize / 5);
    height = settings.widgetSize * 4;
  }
  
  widgetWindow = new BrowserWindow({
    width: width,
    height: height,
    x: position.x,
    y: position.y,
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
  });

  // Don't use saved bounds anymore since we use screen position setting
}

function createControlsWindow() {
  if (controlsWindow && !controlsWindow.isDestroyed()) {
    controlsWindow.focus();
    return;
  }

  controlsWindow = new BrowserWindow({
    width: 400,
    height: 600,
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


ipcMain.on('close-controls', () => {
  if (controlsWindow && !controlsWindow.isDestroyed()) {
    controlsWindow.close();
  }
});


ipcMain.handle('get-settings', () => {
  return settings;
});

ipcMain.on('save-settings', (event, newSettings) => {
  const currentSettings = { ...settings };
  settings = { ...settings, ...newSettings };
  saveSettings();
  
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('settings-updated', settings);
    
    // Handle window sizing based on shape
    const currentBounds = widgetWindow.getBounds();
    let newWidth = settings.widgetSize;
    let newHeight = settings.widgetSize;
    
    // Adjust dimensions for bar shapes
    if (settings.shape === 'bar-horizontal') {
      newWidth = settings.widgetSize * 4;  // Make horizontal bar wider
      newHeight = Math.max(20, settings.widgetSize / 5);  // Thin height
    } else if (settings.shape === 'bar-vertical') {
      newWidth = Math.max(20, settings.widgetSize / 5);  // Thin width
      newHeight = settings.widgetSize * 4;  // Make vertical bar taller
    }
    
    // Only update if dimensions changed
    if (currentBounds.width !== newWidth || currentBounds.height !== newHeight) {
      widgetWindow.setBounds({
        x: currentBounds.x,
        y: currentBounds.y,
        width: newWidth,
        height: newHeight
      });
    }
    
    // Update position if screen position changed
    if (newSettings.screenPosition && newSettings.screenPosition !== currentSettings.screenPosition) {
      const position = getWidgetPosition();
      widgetWindow.setPosition(position.x, position.y);
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

ipcMain.on('show-completion-popup', () => {
  if (settings.showPopupOnComplete) {
    // Get the focused window or widget window as parent
    const parentWindow = BrowserWindow.getFocusedWindow() || widgetWindow;
    
    dialog.showMessageBox(parentWindow, {
      type: 'info',
      title: 'Timer Complete',
      message: settings.popupMessage,
      buttons: ['OK'],
      defaultId: 0,
      noLink: true
    });
  }
});

ipcMain.on('request-timer-state', (event) => {
  // Forward request to widget window which has the timer
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('request-timer-state');
  }
});