const { ipcRenderer } = require('electron');

const timeDisplay = document.getElementById('time-display');
const statusDisplay = document.getElementById('status-display');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const stopBtn = document.getElementById('stop-btn');
const restartBtn = document.getElementById('restart-btn');
const settingsBtn = document.getElementById('settings-btn');
const closeBtn = document.getElementById('close-btn');
const minutesInput = document.getElementById('minutes-input');
const secondsInput = document.getElementById('seconds-input');
const setTimeBtn = document.getElementById('set-time-btn');

let currentState = {
    isRunning: false,
    isPaused: false,
    timeRemaining: 300000
};

function formatTime(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateDisplay(state) {
    currentState = state;
    timeDisplay.textContent = formatTime(state.timeRemaining);
    
    if (!state.isRunning) {
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

pauseResumeBtn.addEventListener('click', () => {
    if (!currentState.isRunning) {
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

settingsBtn.addEventListener('click', () => {
    ipcRenderer.send('open-settings');
});

closeBtn.addEventListener('click', () => {
    ipcRenderer.send('close-controls');
});

ipcRenderer.on('timer-update', (event, state) => {
    updateDisplay(state);
});

ipcRenderer.on('timer-command', (event, command, data) => {
    sendTimerCommand(command, data);
});