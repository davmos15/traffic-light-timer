const { ipcRenderer } = require('electron');

// Tab elements
const controlsTab = document.getElementById('controls-tab');
const settingsTab = document.getElementById('settings-tab');
const controlsPanel = document.getElementById('controls-panel');
const settingsPanel = document.getElementById('settings-panel');

// Timer controls
const timeDisplay = document.getElementById('time-display');
const statusDisplay = document.getElementById('status-display');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const stopBtn = document.getElementById('stop-btn');
const restartBtn = document.getElementById('restart-btn');
const closeBtn = document.getElementById('close-btn');
const minutesInput = document.getElementById('minutes-input');
const secondsInput = document.getElementById('seconds-input');
const setTimeBtn = document.getElementById('set-time-btn');

// Settings controls
const screenPositionSelect = document.getElementById('screen-position');
const defaultMinutesInput = document.getElementById('default-minutes');
const defaultSecondsInput = document.getElementById('default-seconds');
const sizeSlider = document.getElementById('size-slider');
const sizeDisplay = document.getElementById('size-display');
const opacitySlider = document.getElementById('opacity-slider');
const opacityDisplay = document.getElementById('opacity-display');
const alwaysOnTopCheckbox = document.getElementById('always-on-top');
const showTimerDisplayCheckbox = document.getElementById('show-timer-display');
const flashOnCompleteCheckbox = document.getElementById('flash-on-complete');
const showPopupOnCompleteCheckbox = document.getElementById('show-popup-on-complete');
const popupMessageInput = document.getElementById('popup-message');
const popupMessageGroup = document.getElementById('popup-message-group');
const saveSettingsBtn = document.getElementById('save-settings-btn');

let currentState = {
    isRunning: false,
    isPaused: false,
    timeRemaining: 300000
};

let currentSettings = null;

// Tab switching
controlsTab.addEventListener('click', () => {
    controlsTab.classList.add('active');
    settingsTab.classList.remove('active');
    controlsPanel.classList.add('active');
    settingsPanel.classList.remove('active');
});

settingsTab.addEventListener('click', () => {
    settingsTab.classList.add('active');
    controlsTab.classList.remove('active');
    settingsPanel.classList.add('active');
    controlsPanel.classList.remove('active');
});

// Timer functions
function formatTime(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateDisplay(state) {
    currentState = state;
    timeDisplay.textContent = formatTime(state.timeRemaining);
    
    if (state.isCompleted) {
        statusDisplay.textContent = 'Completed';
        pauseResumeBtn.textContent = 'Start';
        pauseResumeBtn.style.backgroundColor = '#4CAF50';
    } else if (!state.isRunning) {
        statusDisplay.textContent = 'Stopped';
        pauseResumeBtn.textContent = 'Start';
        pauseResumeBtn.style.backgroundColor = '#4CAF50';
    } else if (state.isPaused) {
        statusDisplay.textContent = 'Paused';
        pauseResumeBtn.textContent = 'Resume';
        pauseResumeBtn.style.backgroundColor = '#4CAF50';
    } else {
        statusDisplay.textContent = 'Running';
        pauseResumeBtn.textContent = 'Pause';
        pauseResumeBtn.style.backgroundColor = '#FF9800';
    }
}

function sendTimerCommand(command, data = null) {
    ipcRenderer.send('timer-command', command, data);
}

// Timer control events
pauseResumeBtn.addEventListener('click', () => {
    if (!currentState.isRunning || currentState.isCompleted) {
        sendTimerCommand('start');
    } else if (currentState.isPaused) {
        sendTimerCommand('resume');
    } else {
        sendTimerCommand('pause');
    }
});

stopBtn.addEventListener('click', () => {
    sendTimerCommand('stop');
});

restartBtn.addEventListener('click', () => {
    sendTimerCommand('restart');
});

document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const time = parseInt(e.target.dataset.time);
        sendTimerCommand('addTime', time);
    });
});

setTimeBtn.addEventListener('click', () => {
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    const totalMilliseconds = (minutes * 60 + seconds) * 1000;
    
    if (totalMilliseconds > 0) {
        sendTimerCommand('setTime', totalMilliseconds);
    }
});

minutesInput.addEventListener('input', (e) => {
    if (e.target.value > 999) e.target.value = 999;
    if (e.target.value < 0) e.target.value = 0;
});

secondsInput.addEventListener('input', (e) => {
    if (e.target.value > 59) e.target.value = 59;
    if (e.target.value < 0) e.target.value = 0;
});

closeBtn.addEventListener('click', () => {
    ipcRenderer.send('close-controls');
});

// Settings functions
async function loadSettings() {
    currentSettings = await ipcRenderer.invoke('get-settings');
    
    // Set screen position
    screenPositionSelect.value = currentSettings.screenPosition || 'bottom-right';
    
    // Set shape
    document.querySelector(`input[name="shape"][value="${currentSettings.shape}"]`).checked = true;
    
    // Set default duration
    const totalSeconds = Math.floor(currentSettings.defaultDuration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    defaultMinutesInput.value = minutes;
    defaultSecondsInput.value = seconds;
    
    // Set size
    sizeSlider.value = currentSettings.widgetSize;
    sizeDisplay.textContent = `${currentSettings.widgetSize}px`;
    
    // Set opacity
    opacitySlider.value = currentSettings.opacity || 100;
    opacityDisplay.textContent = `${currentSettings.opacity || 100}%`;
    
    // Set checkboxes
    alwaysOnTopCheckbox.checked = currentSettings.alwaysOnTop;
    showTimerDisplayCheckbox.checked = currentSettings.showTimerDisplay !== false;
    flashOnCompleteCheckbox.checked = currentSettings.flashOnComplete === true;
    showPopupOnCompleteCheckbox.checked = currentSettings.showPopupOnComplete === true;
    
    // Set popup message
    popupMessageInput.value = currentSettings.popupMessage || 'Timer completed!';
    popupMessageGroup.style.display = currentSettings.showPopupOnComplete ? 'block' : 'none';
}

// Settings events
sizeSlider.addEventListener('input', (e) => {
    sizeDisplay.textContent = `${e.target.value}px`;
});

opacitySlider.addEventListener('input', (e) => {
    opacityDisplay.textContent = `${e.target.value}%`;
});

defaultMinutesInput.addEventListener('input', (e) => {
    if (e.target.value > 999) e.target.value = 999;
    if (e.target.value < 0) e.target.value = 0;
});

defaultSecondsInput.addEventListener('input', (e) => {
    if (e.target.value > 59) e.target.value = 59;
    if (e.target.value < 0) e.target.value = 0;
});

showPopupOnCompleteCheckbox.addEventListener('change', (e) => {
    popupMessageGroup.style.display = e.target.checked ? 'block' : 'none';
});

saveSettingsBtn.addEventListener('click', () => {
    const shape = document.querySelector('input[name="shape"]:checked').value;
    const screenPosition = screenPositionSelect.value;
    const minutes = parseInt(defaultMinutesInput.value) || 0;
    const seconds = parseInt(defaultSecondsInput.value) || 0;
    const defaultDuration = (minutes * 60 + seconds) * 1000;
    const widgetSize = parseInt(sizeSlider.value);
    const opacity = parseInt(opacitySlider.value);
    const alwaysOnTop = alwaysOnTopCheckbox.checked;
    const showTimerDisplay = showTimerDisplayCheckbox.checked;
    const flashOnComplete = flashOnCompleteCheckbox.checked;
    const showPopupOnComplete = showPopupOnCompleteCheckbox.checked;
    const popupMessage = popupMessageInput.value || 'Timer completed!';
    
    const newSettings = {
        shape,
        screenPosition,
        defaultDuration,
        widgetSize,
        opacity,
        alwaysOnTop,
        showTimerDisplay,
        flashOnComplete,
        showPopupOnComplete,
        popupMessage
    };
    
    ipcRenderer.send('save-settings', newSettings);
    
    // Switch back to timer tab
    controlsTab.click();
});

// IPC events
ipcRenderer.on('timer-update', (event, state) => {
    updateDisplay(state);
});

ipcRenderer.on('timer-command', (event, command, data) => {
    sendTimerCommand(command, data);
});

// Initialize
loadSettings();

// Request initial timer state
ipcRenderer.send('request-timer-state');