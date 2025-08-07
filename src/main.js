const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let widgetWindow;
let controlsWindow;

const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');
const timerStatePath = path.join(userDataPath, 'timerState.json');

let settings = {
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
  
  const widgetWidth = settings.widgetSize;
  const widgetHeight = settings.widgetSize;
  
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
  
  widgetWindow = new BrowserWindow({
    width: settings.widgetSize,
    height: settings.widgetSize,
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
    
    // Handle window sizing
    if (settings.widgetSize !== widgetWindow.getBounds().width) {
      const currentBounds = widgetWindow.getBounds();
      widgetWindow.setBounds({
        x: currentBounds.x,
        y: currentBounds.y,
        width: settings.widgetSize,
        height: settings.widgetSize
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
    // Create a fullscreen overlay window for maximum visibility
    const { width: screenWidth, height: screenHeight } = require('electron').screen.getPrimaryDisplay().workAreaSize;
    
    const popupWindow = new BrowserWindow({
      width: screenWidth,
      height: screenHeight,
      x: 0,
      y: 0,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      focusable: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });
    
    // Create HTML content for the popup
    const popupHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.8);
            animation: fadeIn 0.3s ease-in;
            cursor: pointer;
            user-select: none;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .message-container {
            background-color: #ff4444;
            color: white;
            padding: 60px 80px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            animation: pulse 1s ease-in-out infinite;
          }
          .message {
            font-size: 48px;
            font-weight: bold;
            font-family: Arial, sans-serif;
            margin-bottom: 30px;
          }
          .instruction {
            font-size: 24px;
            opacity: 0.9;
            font-family: Arial, sans-serif;
          }
        </style>
      </head>
      <body onclick="window.close()">
        <div class="message-container">
          <div class="message">${settings.popupMessage}</div>
          <div class="instruction">Click anywhere to dismiss</div>
        </div>
      </body>
      </html>
    `;
    
    popupWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(popupHTML)}`);
    
    // Focus the window and bring it to front
    popupWindow.show();
    popupWindow.focus();
    popupWindow.setAlwaysOnTop(true, 'screen-saver');
    
    // Auto-close after 10 seconds if not clicked
    setTimeout(() => {
      if (!popupWindow.isDestroyed()) {
        popupWindow.close();
      }
    }, 10000);
  }
});

ipcMain.on('request-timer-state', (event) => {
  // Forward request to widget window which has the timer
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('request-timer-state');
  }
});