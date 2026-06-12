const { ipcRenderer } = require('electron');

const messageEl = document.getElementById('break-message');
const countdownEl = document.getElementById('break-countdown');
const skipBtn = document.getElementById('skip-btn');
const addMinuteBtn = document.getElementById('add-minute-btn');
const overlay = document.querySelector('.break-overlay');
const card = document.querySelector('.break-card');

let remaining = 5 * 60; // seconds
let interval = null;

function format(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function render() {
  countdownEl.textContent = format(Math.max(0, remaining));
}

function endBreak() {
  if (interval) clearInterval(interval);
  ipcRenderer.send('end-break');
}

function tick() {
  remaining -= 1;
  render();
  if (remaining <= 0) {
    endBreak();
  }
}

ipcRenderer.on('break-config', (event, config) => {
  remaining = Math.max(1, Math.round((config.duration || 5) * 60));
  messageEl.textContent = config.message || 'Time for a break!';
  render();
  if (interval) clearInterval(interval);
  interval = setInterval(tick, 1000);
});

skipBtn.addEventListener('click', endBreak);

addMinuteBtn.addEventListener('click', () => {
  remaining += 60;
  render();
});

// Dismiss by clicking the dimmed area outside the card
overlay.addEventListener('click', (e) => {
  if (!card.contains(e.target)) {
    endBreak();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') endBreak();
});
