const { ipcRenderer } = require('electron');

// ---------- Tab switching ----------
const tabs = {
    controls: { btn: document.getElementById('controls-tab'), panel: document.getElementById('controls-panel') },
    planner: { btn: document.getElementById('planner-tab'), panel: document.getElementById('planner-panel') },
    settings: { btn: document.getElementById('settings-tab'), panel: document.getElementById('settings-panel') }
};

function activateTab(name) {
    Object.entries(tabs).forEach(([key, t]) => {
        const active = key === name;
        t.btn.classList.toggle('active', active);
        t.panel.classList.toggle('active', active);
    });
}

Object.entries(tabs).forEach(([key, t]) => {
    t.btn.addEventListener('click', () => activateTab(key));
});

// ---------- Time helpers ----------
function timeToMinutes(str) {
    if (!str || !str.includes(':')) return null;
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(mins) {
    mins = ((Math.round(mins) % 1440) + 1440) % 1440;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatClock(min) {
    if (min === null || isNaN(min)) return '';
    const t = minutesToTime(min);
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

// =====================================================================
//  TIMER TAB
// =====================================================================
const timeDisplay = document.getElementById('time-display');
const statusDisplay = document.getElementById('status-display');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const stopBtn = document.getElementById('stop-btn');
const restartBtn = document.getElementById('restart-btn');
const closeBtn = document.getElementById('close-btn');
const minutesInput = document.getElementById('minutes-input');
const secondsInput = document.getElementById('seconds-input');
const setTimeBtn = document.getElementById('set-time-btn');

const activeTaskBanner = document.getElementById('active-task-banner');
const activeTaskName = document.getElementById('active-task-name');
const nextTaskHint = document.getElementById('next-task-hint');

let currentState = { isRunning: false, isPaused: false, isCompleted: false, timeRemaining: 300000 };
let wasCompleted = false;

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
        pauseResumeBtn.className = 'control-btn go';
    } else if (!state.isRunning) {
        statusDisplay.textContent = 'Stopped';
        pauseResumeBtn.textContent = 'Start';
        pauseResumeBtn.className = 'control-btn go';
    } else if (state.isPaused) {
        statusDisplay.textContent = 'Paused';
        pauseResumeBtn.textContent = 'Resume';
        pauseResumeBtn.className = 'control-btn go';
    } else {
        statusDisplay.textContent = 'Running';
        pauseResumeBtn.textContent = 'Pause';
        pauseResumeBtn.className = 'control-btn pause';
    }

    // Detect completion transition to offer advancing the schedule
    if (state.isCompleted && !wasCompleted) {
        handleBlockCompletion();
    }
    wasCompleted = state.isCompleted;
}

function sendTimerCommand(command, data = null) {
    ipcRenderer.send('timer-command', command, data);
}

pauseResumeBtn.addEventListener('click', () => {
    if (!currentState.isRunning || currentState.isCompleted) {
        sendTimerCommand('start');
    } else if (currentState.isPaused) {
        sendTimerCommand('resume');
    } else {
        sendTimerCommand('pause');
    }
});

stopBtn.addEventListener('click', () => sendTimerCommand('stop'));
restartBtn.addEventListener('click', () => sendTimerCommand('restart'));

document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        sendTimerCommand('addTime', parseInt(e.currentTarget.dataset.time));
    });
});

setTimeBtn.addEventListener('click', () => {
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    const ms = (minutes * 60 + seconds) * 1000;
    if (ms > 0) sendTimerCommand('setTime', ms);
});

minutesInput.addEventListener('input', (e) => {
    if (e.target.value > 999) e.target.value = 999;
    if (e.target.value < 0) e.target.value = 0;
});
secondsInput.addEventListener('input', (e) => {
    if (e.target.value > 59) e.target.value = 59;
    if (e.target.value < 0) e.target.value = 0;
});

closeBtn.addEventListener('click', () => ipcRenderer.send('close-controls'));

// =====================================================================
//  PLANNER TAB
// =====================================================================
const dayStart = document.getElementById('day-start');
const dayEnd = document.getElementById('day-end');
const dayLunch = document.getElementById('day-lunch');
const dayLunchDuration = document.getElementById('day-lunch-duration');
const resetDayDefaultsBtn = document.getElementById('reset-day-defaults');

const plannerBreaksEnabled = document.getElementById('planner-breaks-enabled');
const breakSummary = document.getElementById('break-summary');

const blocksList = document.getElementById('blocks-list');
const blocksEmpty = document.getElementById('blocks-empty');
const blockName = document.getElementById('block-name');
const blockStart = document.getElementById('block-start');
const blockDuration = document.getElementById('block-duration');
const addBlockBtn = document.getElementById('add-block-btn');
const autoscheduleBtn = document.getElementById('autoschedule-btn');
const clearBlocksBtn = document.getElementById('clear-blocks-btn');

let schedule = null;
let currentSettings = null;
let activeBlockId = null;

function persistSchedule() {
    ipcRenderer.send('save-schedule', schedule);
}

function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function renderDayFields() {
    if (!schedule) return;
    dayStart.value = schedule.startTime || '';
    dayEnd.value = schedule.endTime || '';
    dayLunch.value = schedule.lunchTime || '';
    dayLunchDuration.value = schedule.lunchDuration != null ? schedule.lunchDuration : 60;
}

function renderBlocks() {
    if (!schedule) return;
    blocksList.innerHTML = '';
    const blocks = schedule.blocks || [];
    blocksEmpty.style.display = blocks.length ? 'none' : 'block';

    blocks.forEach((block) => {
        const li = document.createElement('li');
        li.className = 'block-row';
        if (block.done) li.classList.add('done');
        if (block.id === activeBlockId) li.classList.add('active');

        const startMin = timeToMinutes(block.startTime);
        const endLabel = startMin != null ? ` – ${formatClock(startMin + Number(block.duration))}` : '';

        li.innerHTML = `
            <button class="block-status" title="Toggle done">${block.done ? '✓' : '○'}</button>
            <div class="block-main">
                <input class="block-name-field" type="text" value="${escapeHtml(block.name)}" placeholder="Task">
                <div class="block-meta">
                    <input class="block-time-field" type="time" value="${block.startTime || ''}">
                    <input class="block-dur-field" type="number" min="1" max="600" step="5" value="${block.duration}">
                    <span class="block-range">min${block.startTime ? ' · ' + formatClock(startMin) + endLabel : ''}</span>
                </div>
            </div>
            <div class="block-buttons">
                <button class="block-start" title="Start this block">▶</button>
                <button class="block-del" title="Delete">✕</button>
            </div>
        `;

        li.querySelector('.block-status').addEventListener('click', () => {
            block.done = !block.done;
            persistSchedule();
            renderBlocks();
        });
        li.querySelector('.block-name-field').addEventListener('change', (e) => {
            block.name = e.target.value;
            persistSchedule();
        });
        li.querySelector('.block-time-field').addEventListener('change', (e) => {
            block.startTime = e.target.value;
            persistSchedule();
            renderBlocks();
        });
        li.querySelector('.block-dur-field').addEventListener('change', (e) => {
            block.duration = Math.max(1, parseInt(e.target.value) || 1);
            persistSchedule();
            renderBlocks();
        });
        li.querySelector('.block-start').addEventListener('click', () => startBlock(block));
        li.querySelector('.block-del').addEventListener('click', () => {
            schedule.blocks = schedule.blocks.filter(b => b.id !== block.id);
            if (activeBlockId === block.id) activeBlockId = null;
            persistSchedule();
            renderBlocks();
        });

        blocksList.appendChild(li);
    });

    updateActiveBanner();
}

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function startBlock(block) {
    activeBlockId = block.id;
    const ms = Math.max(1, Number(block.duration)) * 60 * 1000;
    sendTimerCommand('setTime', ms);
    sendTimerCommand('start');
    ipcRenderer.send('set-active-task', { name: block.name });
    activateTab('controls');
    renderBlocks();
}

function nextUndoneBlock(afterId) {
    const blocks = schedule ? schedule.blocks : [];
    const idx = blocks.findIndex(b => b.id === afterId);
    for (let i = idx + 1; i < blocks.length; i++) {
        if (!blocks[i].done) return blocks[i];
    }
    // fall back to the first undone block anywhere
    return blocks.find(b => !b.done && b.id !== afterId) || null;
}

function updateActiveBanner() {
    const active = schedule && schedule.blocks.find(b => b.id === activeBlockId);
    if (!active) {
        activeTaskBanner.style.display = 'none';
        return;
    }
    activeTaskBanner.style.display = 'block';
    activeTaskName.textContent = active.name || 'Untitled task';
    const next = nextUndoneBlock(active.id);
    nextTaskHint.textContent = next ? `Next: ${next.name || 'Untitled'}` : 'Last task of the day';
}

function handleBlockCompletion() {
    if (!activeBlockId || !schedule) return;
    const active = schedule.blocks.find(b => b.id === activeBlockId);
    if (!active) return;
    active.done = true;
    persistSchedule();
    const next = nextUndoneBlock(active.id);

    // Re-render the list first; then override the banner with the advance prompt
    renderBlocks();

    activeTaskBanner.style.display = 'block';
    activeTaskName.textContent = `✓ ${active.name || 'Task'} complete`;
    nextTaskHint.innerHTML = '';
    if (next) {
        const btn = document.createElement('button');
        btn.className = 'advance-btn';
        btn.textContent = `Start next: ${next.name || 'Untitled'}`;
        btn.addEventListener('click', () => startBlock(next));
        nextTaskHint.appendChild(btn);
    } else {
        nextTaskHint.textContent = 'All blocks complete — nice work!';
    }
}

// Day field changes
dayStart.addEventListener('change', () => { schedule.startTime = dayStart.value; persistSchedule(); });
dayEnd.addEventListener('change', () => { schedule.endTime = dayEnd.value; persistSchedule(); });
dayLunch.addEventListener('change', () => { schedule.lunchTime = dayLunch.value; persistSchedule(); });
dayLunchDuration.addEventListener('change', () => {
    schedule.lunchDuration = Math.max(0, parseInt(dayLunchDuration.value) || 0);
    persistSchedule();
});

resetDayDefaultsBtn.addEventListener('click', () => {
    if (!currentSettings) return;
    schedule.startTime = currentSettings.defaultStartTime;
    schedule.endTime = currentSettings.defaultEndTime;
    schedule.lunchTime = currentSettings.defaultLunchTime;
    schedule.lunchDuration = currentSettings.defaultLunchDuration;
    persistSchedule();
    renderDayFields();
});

addBlockBtn.addEventListener('click', () => {
    const name = blockName.value.trim();
    if (!name) { blockName.focus(); return; }
    schedule.blocks.push({
        id: newId(),
        name,
        startTime: blockStart.value || '',
        duration: Math.max(1, parseInt(blockDuration.value) || 30),
        done: false
    });
    persistSchedule();
    blockName.value = '';
    blockStart.value = '';
    renderBlocks();
    blockName.focus();
});

blockName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBlockBtn.click();
});

// Lay out block start times back-to-back from the day's start, skipping lunch
autoscheduleBtn.addEventListener('click', () => {
    if (!schedule || !schedule.blocks.length) return;
    let cursor = timeToMinutes(schedule.startTime);
    if (cursor == null) cursor = 9 * 60;
    const lunchStart = timeToMinutes(schedule.lunchTime);
    const lunchLen = Number(schedule.lunchDuration) || 0;

    schedule.blocks.forEach((block) => {
        const dur = Math.max(1, Number(block.duration));
        // If this block would overlap lunch, push it past lunch
        if (lunchStart != null && cursor < lunchStart + lunchLen && cursor + dur > lunchStart) {
            cursor = lunchStart + lunchLen;
        }
        block.startTime = minutesToTime(cursor);
        cursor += dur;
    });
    persistSchedule();
    renderBlocks();
});

clearBlocksBtn.addEventListener('click', () => {
    schedule.blocks = [];
    activeBlockId = null;
    persistSchedule();
    renderBlocks();
});

plannerBreaksEnabled.addEventListener('change', () => {
    currentSettings.breaksEnabled = plannerBreaksEnabled.checked;
    breaksEnabledCheckbox.checked = plannerBreaksEnabled.checked;
    ipcRenderer.send('save-settings', { breaksEnabled: plannerBreaksEnabled.checked });
});

function updateBreakSummary() {
    if (!currentSettings) return;
    breakSummary.textContent =
        `Every ${currentSettings.breakInterval} min · ${currentSettings.breakDuration} min break`;
    plannerBreaksEnabled.checked = currentSettings.breaksEnabled !== false;
}

// =====================================================================
//  SETTINGS TAB
// =====================================================================
const screenPositionSelect = document.getElementById('screen-position');
const sizeSlider = document.getElementById('size-slider');
const sizeDisplay = document.getElementById('size-display');
const opacitySlider = document.getElementById('opacity-slider');
const opacityDisplay = document.getElementById('opacity-display');
const defaultMinutes = document.getElementById('default-minutes');
const defaultSeconds = document.getElementById('default-seconds');
const defaultStartTime = document.getElementById('default-start-time');
const defaultEndTime = document.getElementById('default-end-time');
const defaultLunchTime = document.getElementById('default-lunch-time');
const defaultLunchDuration = document.getElementById('default-lunch-duration');
const breaksEnabledCheckbox = document.getElementById('breaks-enabled');
const breakIntervalInput = document.getElementById('break-interval');
const breakDurationInput = document.getElementById('break-duration');
const breakMessageInput = document.getElementById('break-message');
const alwaysOnTopCheckbox = document.getElementById('always-on-top');
const showTimerDisplayCheckbox = document.getElementById('show-timer-display');
const flashOnCompleteCheckbox = document.getElementById('flash-on-complete');
const showPopupOnCompleteCheckbox = document.getElementById('show-popup-on-complete');
const flashOption = document.getElementById('flash-option');
const popupMessageInput = document.getElementById('popup-message');
const popupMessageGroup = document.getElementById('popup-message-group');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const saveConfirm = document.getElementById('save-confirm');

function applySettingsToForm() {
    const s = currentSettings;
    screenPositionSelect.value = s.screenPosition || 'bottom-right';
    sizeSlider.value = s.widgetSize;
    sizeDisplay.textContent = `${s.widgetSize}px`;
    opacitySlider.value = s.opacity || 100;
    opacityDisplay.textContent = `${s.opacity || 100}%`;

    const totalSeconds = Math.floor((s.defaultDuration || 300000) / 1000);
    defaultMinutes.value = Math.floor(totalSeconds / 60);
    defaultSeconds.value = totalSeconds % 60;

    defaultStartTime.value = s.defaultStartTime || '09:00';
    defaultEndTime.value = s.defaultEndTime || '17:00';
    defaultLunchTime.value = s.defaultLunchTime || '12:30';
    defaultLunchDuration.value = s.defaultLunchDuration != null ? s.defaultLunchDuration : 60;

    breaksEnabledCheckbox.checked = s.breaksEnabled !== false;
    breakIntervalInput.value = s.breakInterval || 20;
    breakDurationInput.value = s.breakDuration || 5;
    breakMessageInput.value = s.breakMessage || '';

    alwaysOnTopCheckbox.checked = s.alwaysOnTop;
    showTimerDisplayCheckbox.checked = s.showTimerDisplay !== false;
    flashOnCompleteCheckbox.checked = s.flashOnComplete === true;
    showPopupOnCompleteCheckbox.checked = s.showPopupOnComplete === true;
    popupMessageInput.value = s.popupMessage || 'Timer completed!';
    popupMessageGroup.style.display = s.showPopupOnComplete ? 'block' : 'none';

    updateFlashDependency();
}

sizeSlider.addEventListener('input', (e) => sizeDisplay.textContent = `${e.target.value}px`);
opacitySlider.addEventListener('input', (e) => opacityDisplay.textContent = `${e.target.value}%`);

function updateFlashDependency() {
    if (showPopupOnCompleteCheckbox.checked) {
        flashOption.classList.add('enabled');
        flashOnCompleteCheckbox.disabled = false;
    } else {
        flashOption.classList.remove('enabled');
        flashOnCompleteCheckbox.disabled = true;
        flashOnCompleteCheckbox.checked = false;
    }
}

showPopupOnCompleteCheckbox.addEventListener('change', (e) => {
    popupMessageGroup.style.display = e.target.checked ? 'block' : 'none';
    updateFlashDependency();
});

saveSettingsBtn.addEventListener('click', () => {
    const newSettings = {
        screenPosition: screenPositionSelect.value,
        widgetSize: parseInt(sizeSlider.value),
        opacity: parseInt(opacitySlider.value),
        defaultDuration: ((parseInt(defaultMinutes.value) || 0) * 60 + (parseInt(defaultSeconds.value) || 0)) * 1000,
        defaultStartTime: defaultStartTime.value || '09:00',
        defaultEndTime: defaultEndTime.value || '17:00',
        defaultLunchTime: defaultLunchTime.value || '12:30',
        defaultLunchDuration: Math.max(0, parseInt(defaultLunchDuration.value) || 0),
        breaksEnabled: breaksEnabledCheckbox.checked,
        breakInterval: Math.max(1, parseInt(breakIntervalInput.value) || 20),
        breakDuration: Math.max(1, parseInt(breakDurationInput.value) || 5),
        breakMessage: breakMessageInput.value || 'Time for a break!',
        alwaysOnTop: alwaysOnTopCheckbox.checked,
        showTimerDisplay: showTimerDisplayCheckbox.checked,
        flashOnComplete: flashOnCompleteCheckbox.checked,
        showPopupOnComplete: showPopupOnCompleteCheckbox.checked,
        popupMessage: popupMessageInput.value || 'Timer completed!'
    };

    currentSettings = { ...currentSettings, ...newSettings };
    ipcRenderer.send('save-settings', newSettings);
    updateBreakSummary();

    saveConfirm.style.display = 'block';
    setTimeout(() => { saveConfirm.style.display = 'none'; }, 1800);
});

// =====================================================================
//  IPC + init
// =====================================================================
ipcRenderer.on('timer-update', (event, state) => updateDisplay(state));
ipcRenderer.on('timer-command', (event, command, data) => sendTimerCommand(command, data));
ipcRenderer.on('schedule-updated', (event, updated) => {
    schedule = updated;
    renderDayFields();
    renderBlocks();
});

async function init() {
    currentSettings = await ipcRenderer.invoke('get-settings');
    schedule = await ipcRenderer.invoke('get-schedule');

    applySettingsToForm();
    updateBreakSummary();
    renderDayFields();
    renderBlocks();

    ipcRenderer.send('request-timer-state');
}

init();
