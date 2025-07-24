const { ipcRenderer } = require('electron');
const Timer = require('../timer');

const widget = document.getElementById('widget');
const timerDisplay = document.getElementById('timer-display');
let timer = new Timer();
let settings = null;
let isClicking = false;
let flashInterval = null;

async function init() {
  settings = await ipcRenderer.invoke('get-settings');
  applySettings();
  
  const savedState = await ipcRenderer.invoke('load-timer-state');
  if (savedState) {
    timer.restoreState(savedState);
  }
  
  timer.setCallbacks({
    onUpdate: updateWidget,
    onComplete: handleComplete,
    onStateChange: saveTimerState
  });
  
  updateWidget(timer.getState());
  
  if (!savedState || (!savedState.isRunning && !savedState.isPaused)) {
    timer.start(settings.defaultDuration);
  }
}

function applySettings() {
  widget.className = `widget ${settings.shape}`;
  
  // Calculate font size scale based on widget size (100px is the default)
  const sizeScale = settings.widgetSize / 100;
  document.documentElement.style.setProperty('--size-scale', sizeScale);
  
  // Apply opacity
  const opacity = (settings.opacity || 100) / 100;
  widget.style.opacity = opacity;
}

function interpolateColor(progress) {
  const startColor = { h: 120, s: 100, l: 50 };
  const midColor = { h: 60, s: 100, l: 50 };
  const endColor = { h: 0, s: 100, l: 50 };
  
  let h, s, l;
  
  if (progress < 0.5) {
    const localProgress = progress * 2;
    h = startColor.h + (midColor.h - startColor.h) * localProgress;
    s = startColor.s + (midColor.s - startColor.s) * localProgress;
    l = startColor.l + (midColor.l - startColor.l) * localProgress;
  } else {
    const localProgress = (progress - 0.5) * 2;
    h = midColor.h + (endColor.h - midColor.h) * localProgress;
    s = midColor.s + (endColor.s - midColor.s) * localProgress;
    l = midColor.l + (endColor.l - midColor.l) * localProgress;
  }
  
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function updateWidget(state) {
  const color = interpolateColor(state.progress);
  
  if (state.isCompleted) {
    widget.style.backgroundColor = 'hsl(0, 100%, 50%)';
    
    if (settings.flashOnComplete && !flashInterval) {
      let isRed = true;
      flashInterval = setInterval(() => {
        widget.style.backgroundColor = isRed ? 'hsl(0, 100%, 50%)' : 'hsl(0, 100%, 30%)';
        isRed = !isRed;
      }, 500);
    }
  } else {
    if (flashInterval) {
      clearInterval(flashInterval);
      flashInterval = null;
    }
    widget.style.backgroundColor = color;
  }
  
  if (settings.showTimerDisplay && (state.isRunning || state.isPaused || state.timeRemaining < state.duration)) {
    timerDisplay.textContent = timer.formatTime();
    timerDisplay.style.display = 'block';
  } else {
    timerDisplay.style.display = 'none';
  }
  
  ipcRenderer.send('timer-update', state);
}

function handleComplete() {
  console.log('Timer completed!');
  ipcRenderer.send('show-completion-popup');
}

function saveTimerState() {
  const state = timer.getState();
  ipcRenderer.send('save-timer-state', state);
}

// Simple click handler to open controls
widget.addEventListener('click', (e) => {
  console.log('Widget clicked!');
  e.preventDefault();
  e.stopPropagation();
  ipcRenderer.send('open-controls');
});

// Also try mouseup as backup
widget.addEventListener('mouseup', (e) => {
  console.log('Widget mouse up!');
  if (e.button === 0) { // Left click
    ipcRenderer.send('open-controls');
  }
});

// Right-click to open settings
widget.addEventListener('contextmenu', (e) => {
  console.log('Widget right-clicked!');
  e.preventDefault();
  ipcRenderer.send('open-settings');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'o') {
    e.preventDefault();
    ipcRenderer.send('open-controls');
  }
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    ipcRenderer.send('open-settings');
  }
  if (e.key === 'r') {
    e.preventDefault();
    timer.stop();
    timer.start(settings.defaultDuration);
  }
});

ipcRenderer.on('settings-updated', (event, newSettings) => {
  settings = newSettings;
  applySettings();
  
  // Clear flashing if disabled
  if (!settings.flashOnComplete && flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }
  
  // Update display based on new settings
  updateWidget(timer.getState());
});

ipcRenderer.on('timer-command', (event, command, data) => {
  switch (command) {
    case 'start':
      timer.start(data);
      break;
    case 'stop':
      timer.stop();
      break;
    case 'pause':
      timer.pause();
      break;
    case 'resume':
      timer.resume();
      break;
    case 'restart':
      timer.restart();
      break;
    case 'addTime':
      timer.addTime(data);
      break;
    case 'setTime':
      timer.setTime(data);
      break;
  }
});

ipcRenderer.on('request-timer-state', () => {
  // Send current timer state
  const state = timer.getState();
  ipcRenderer.send('timer-update', state);
});

init();