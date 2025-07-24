class Timer {
  constructor() {
    this.duration = 300000;
    this.timeRemaining = this.duration;
    this.startTime = null;
    this.pausedTime = 0;
    this.isPaused = false;
    this.isRunning = false;
    this.isCompleted = false;
    this.interval = null;
    this.callbacks = {
      onUpdate: null,
      onComplete: null,
      onStateChange: null
    };
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  start(duration = null) {
    if (duration !== null) {
      this.duration = duration;
      this.timeRemaining = duration;
    }
    
    this.startTime = Date.now() - (this.duration - this.timeRemaining);
    this.isPaused = false;
    this.isRunning = true;
    this.isCompleted = false;
    this.pausedTime = 0;
    
    this._startInterval();
    this._notifyStateChange();
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.isCompleted = false;
    this.timeRemaining = this.duration;
    this.startTime = null;
    this.pausedTime = 0;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this._notifyUpdate();
    this._notifyStateChange();
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    
    // Save current time remaining before pausing
    const elapsed = Date.now() - this.startTime;
    this.timeRemaining = Math.max(0, this.duration - elapsed);
    
    this.isPaused = true;
    this.pausedTime = Date.now();
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this._notifyUpdate();
    this._notifyStateChange();
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    
    // Reset start time based on remaining time
    this.startTime = Date.now() - (this.duration - this.timeRemaining);
    this.isPaused = false;
    this.pausedTime = 0;
    
    this._startInterval();
    this._notifyUpdate();
    this._notifyStateChange();
  }

  restart() {
    this.stop();
    this.start();
  }

  addTime(milliseconds) {
    this.duration += milliseconds;
    if (this.isRunning && !this.isPaused) {
      this.timeRemaining = Math.max(0, this.duration - (Date.now() - this.startTime));
    } else {
      this.timeRemaining += milliseconds;
    }
    this._notifyUpdate();
  }

  setTime(milliseconds) {
    this.duration = milliseconds;
    this.timeRemaining = milliseconds;
    if (this.isRunning && !this.isPaused) {
      this.startTime = Date.now();
    }
    this._notifyUpdate();
  }

  getProgress() {
    if (this.duration === 0) return 1;
    return 1 - (this.timeRemaining / this.duration);
  }

  getState() {
    return {
      duration: this.duration,
      timeRemaining: this.timeRemaining,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isCompleted: this.isCompleted,
      progress: this.getProgress()
    };
  }

  restoreState(state) {
    if (!state) return;
    
    this.duration = state.duration || 300000;
    this.timeRemaining = state.timeRemaining || this.duration;
    this.isCompleted = state.isCompleted || false;
    
    if (state.isRunning && !state.isPaused) {
      this.start();
      const elapsed = this.duration - this.timeRemaining;
      this.startTime = Date.now() - elapsed;
    } else if (state.isRunning && state.isPaused) {
      this.isRunning = true;
      this.isPaused = true;
      this._notifyUpdate();
      this._notifyStateChange();
    } else if (this.isCompleted) {
      this._notifyUpdate();
      this._notifyStateChange();
    }
  }

  _startInterval() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    this.interval = setInterval(() => {
      this._update();
    }, 16);
  }

  _update() {
    if (!this.isRunning || this.isPaused) return;
    
    const elapsed = Date.now() - this.startTime;
    this.timeRemaining = Math.max(0, this.duration - elapsed);
    
    this._notifyUpdate();
    
    if (this.timeRemaining === 0) {
      this.isRunning = false;
      this.isCompleted = true;
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      this._notifyUpdate();
      this._notifyStateChange();
      if (this.callbacks.onComplete) {
        this.callbacks.onComplete();
      }
    }
  }

  _notifyUpdate() {
    if (this.callbacks.onUpdate) {
      this.callbacks.onUpdate(this.getState());
    }
  }

  _notifyStateChange() {
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.getState());
    }
  }

  formatTime() {
    const totalSeconds = Math.ceil(this.timeRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

module.exports = Timer;