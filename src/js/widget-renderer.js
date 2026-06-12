const { ipcRenderer } = require('electron');
const Timer = require('../timer');

const widget = document.getElementById('widget');
const timerDisplay = document.getElementById('timer-display');
let timer = new Timer();
let settings = null;
let isClicking = false;
let flashInterval = null;

// Break-reminder state
let workSecondsSinceBreak = 0;
let isOnBreak = false;
let resumeAfterBreak = false;
let activeTask = null;

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
}

function applySettings() {
  widget.className = 'widget circle';
  
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
  // Break mode takes over the widget's appearance
  if (isOnBreak) {
    if (flashInterval) {
      clearInterval(flashInterval);
      flashInterval = null;
    }
    widget.style.backgroundColor = 'hsl(212, 75%, 52%)';
    if (settings.showTimerDisplay) {
      timerDisplay.textContent = 'Break';
      timerDisplay.style.display = 'block';
    } else {
      timerDisplay.style.display = 'none';
    }
    ipcRenderer.send('timer-update', state);
    return;
  }

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

// ---- Break reminders ----
// Count real seconds of active work; trigger a break every `breakInterval` minutes.
setInterval(() => {
  if (!settings || settings.breaksEnabled === false || isOnBreak) return;
  if (timer.isRunning && !timer.isPaused) {
    workSecondsSinceBreak++;
    const intervalSeconds = (settings.breakInterval || 20) * 60;
    if (workSecondsSinceBreak >= intervalSeconds) {
      triggerBreak();
    }
  }
}, 1000);

function triggerBreak() {
  workSecondsSinceBreak = 0;
  isOnBreak = true;
  // Pause the work timer while on break; remember whether to resume it after
  resumeAfterBreak = timer.isRunning && !timer.isPaused;
  if (resumeAfterBreak) {
    timer.pause();
  }
  updateWidget(timer.getState());
  ipcRenderer.send('show-break-popup', {
    duration: settings.breakDuration || 5,
    message: settings.breakMessage
  });
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

// Right-click also opens the controls window
widget.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  ipcRenderer.send('open-controls');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && (e.key === 'o' || e.key === 's')) {
    e.preventDefault();
    ipcRenderer.send('open-controls');
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

ipcRenderer.on('break-finished', () => {
  isOnBreak = false;
  if (resumeAfterBreak) {
    timer.resume();
  }
  resumeAfterBreak = false;
  updateWidget(timer.getState());
});

ipcRenderer.on('set-active-task', (event, task) => {
  activeTask = task;
  // Reset the break counter when a new task starts
  workSecondsSinceBreak = 0;
  widget.title = task && task.name ? task.name : '';
});

init();