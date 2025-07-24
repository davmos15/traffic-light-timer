const { ipcRenderer } = require('electron');

const defaultMinutesInput = document.getElementById('default-minutes');
const defaultSecondsInput = document.getElementById('default-seconds');
const sizeSlider = document.getElementById('size-slider');
const sizeDisplay = document.getElementById('size-display');
const alwaysOnTopCheckbox = document.getElementById('always-on-top');
const showTimerDisplayCheckbox = document.getElementById('show-timer-display');
const flashOnCompleteCheckbox = document.getElementById('flash-on-complete');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');

let currentSettings = null;

async function loadSettings() {
    currentSettings = await ipcRenderer.invoke('get-settings');
    
    document.querySelector(`input[name="shape"][value="${currentSettings.shape}"]`).checked = true;
    
    const totalSeconds = Math.floor(currentSettings.defaultDuration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    defaultMinutesInput.value = minutes;
    defaultSecondsInput.value = seconds;
    
    sizeSlider.value = currentSettings.widgetSize;
    sizeDisplay.textContent = `${currentSettings.widgetSize}px`;
    
    alwaysOnTopCheckbox.checked = currentSettings.alwaysOnTop;
    
    // Set new checkbox values
    showTimerDisplayCheckbox.checked = currentSettings.showTimerDisplay !== false;
    flashOnCompleteCheckbox.checked = currentSettings.flashOnComplete === true;
}

sizeSlider.addEventListener('input', (e) => {
    sizeDisplay.textContent = `${e.target.value}px`;
});

defaultMinutesInput.addEventListener('input', (e) => {
    if (e.target.value > 999) e.target.value = 999;
    if (e.target.value < 0) e.target.value = 0;
});

defaultSecondsInput.addEventListener('input', (e) => {
    if (e.target.value > 59) e.target.value = 59;
    if (e.target.value < 0) e.target.value = 0;
});

saveBtn.addEventListener('click', () => {
    const shape = document.querySelector('input[name="shape"]:checked').value;
    const minutes = parseInt(defaultMinutesInput.value) || 0;
    const seconds = parseInt(defaultSecondsInput.value) || 0;
    const defaultDuration = (minutes * 60 + seconds) * 1000;
    const widgetSize = parseInt(sizeSlider.value);
    const alwaysOnTop = alwaysOnTopCheckbox.checked;
    const showTimerDisplay = showTimerDisplayCheckbox.checked;
    const flashOnComplete = flashOnCompleteCheckbox.checked;
    
    const newSettings = {
        shape,
        defaultDuration,
        widgetSize,
        alwaysOnTop,
        showTimerDisplay,
        flashOnComplete
    };
    
    ipcRenderer.send('save-settings', newSettings);
    ipcRenderer.send('close-settings');
});

cancelBtn.addEventListener('click', () => {
    ipcRenderer.send('close-settings');
});

loadSettings();