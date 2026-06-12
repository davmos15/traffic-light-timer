# Traffic Light Timer

A desktop timer widget **and day planner** built with Electron. Plan your day in time blocks, get gentle break reminders, and keep a glanceable color-coded countdown (green → yellow → red) on top of everything you do.

![Traffic Light Timer Demo](src/assets/icon.svg)

## Features

### 🗓️ Day Planner *(new in 1.1)*
- **Time Blocks**: Build your day from named tasks, each with a start time and a duration
- **One-Click Start**: Start any block to load its duration into the timer and show it as the current task
- **Live Editing**: Add, rename, re-time, re-order, complete, or delete blocks at any point — the plan adapts mid-day
- **Auto-Time**: Lay every block back-to-back from your start time, automatically skipping lunch
- **Smart Advance**: When a block's timer finishes you're prompted to start the next one — you stay in control and can always override manually
- **Daily Rollover**: Each day starts with a fresh schedule; today's plan is saved automatically

### ⏰ Day Setup *(new in 1.1)*
- **Start / Finish / Lunch**: Set your working hours and lunch (time + length) for any given day
- **Default Times**: Save your usual start, finish, lunch time, and lunch length, then reset any day back to them with one click

### ☕ Break Reminders *(new in 1.1)*
- **Interval Breaks**: A full-screen break prompt appears after every interval of active work (default **20 minutes**)
- **Work Pauses**: Your task timer automatically pauses during a break and resumes when it ends
- **Adjustable**: Set the work interval and break length (default **5 minutes**), customise the message, or toggle breaks off
- **Flexible**: Add a minute, end early ("Back to work"), or dismiss with Esc — the widget turns blue while you're on a break

### 🎯 Main Timer Widget
- **Compact Design**: Small, circular widget (100×100px default, customizable 20–200px)
- **Color Transitions**: Smooth progression from green → yellow → red
- **Smart Positioning**: Choose from preset positions (corners, center) or drag anywhere
- **Adjustable Opacity**: Control widget transparency for subtle desktop integration
- **Always on Top**: Stays visible above all other windows (toggleable)
- **Current Task**: Hover the widget to see the active task name
- **Completion Indicator**: Stays red when timer finishes with optional flashing
- **Responsive Text**: Timer display scales proportionally with widget size
- **Transparent**: Frameless design that blends with your desktop

### 🎛️ Control Panel
- **Three Tabs**: **Timer**, **Planner**, and **Settings** in one refreshed, card-based window
- **Timer Controls**: Start, Stop, Pause, Resume, Restart
- **Current Task Banner**: Shows what you're working on and what's next
- **Quick Adjust**: +1/+5/+15 min and −1/−5/−15 min buttons, plus a custom minutes:seconds setter
- **Live Display**: Current time remaining and timer status

### ⚙️ Settings & Customization
- **Widget**: Position, size (20–200px with proportional text), and opacity (20–100%)
- **Default Timer Duration**: Your preferred starting time
- **Default Day Times**: Start, finish, lunch time, and lunch length
- **Break Reminders**: Enable/disable, work interval, break length, and message
- **Display Options**: Toggle time display, flashing on completion, and always-on-top
- **Completion Alerts**: Optional full-screen popup message when a timer finishes
- **Persistent Storage**: All settings, the day's schedule, and timer state are saved automatically

## Download

### 🚀 Download Pre-built Releases
Download the latest version for your platform from the [Releases page](https://github.com/yourusername/traffic-light-timer/releases).

#### Available Downloads:
- **Windows**: 
  - `.exe` installer (recommended) - Full installation with Start Menu shortcuts
  - Portable `.exe` - No installation required, just run
- **macOS**: 
  - `.dmg` disk image - Drag to Applications folder
  - `.zip` archive - Extract and run
- **Linux**: 
  - `.AppImage` - Universal package, works on most distributions
  - `.deb` - For Ubuntu, Debian, and derivatives
  - `.rpm` - For Fedora, RHEL, openSUSE

### 📦 Installation Instructions

#### Windows
1. Download the `.exe` installer from releases
2. Double-click to run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

#### macOS
1. Download the `.dmg` file from releases
2. Double-click to mount the disk image
3. Drag Traffic Light Timer to Applications folder
4. Launch from Applications or Launchpad

#### Linux
- **AppImage**: 
  ```bash
  chmod +x Traffic-Light-Timer-*.AppImage
  ./Traffic-Light-Timer-*.AppImage
  ```
- **DEB** (Ubuntu/Debian): 
  ```bash
  sudo dpkg -i traffic-light-timer_*.deb
  ```
- **RPM** (Fedora/RHEL): 
  ```bash
  sudo rpm -i traffic-light-timer-*.rpm
  ```

## Building from Source

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/traffic-light-timer.git
cd traffic-light-timer

# Install dependencies
npm install

# Run in development mode
npm start
```

## Usage

### Getting Started
1. **Launch the app** - A small green circle appears in the bottom-right corner (default)
2. **Click the widget** - Opens the control panel (right-click works too)
3. **Start timing** - Use the Timer tab to start the countdown
4. **Watch the transition** - Widget smoothly changes from green to yellow to red
5. **Timer completion** - Widget stays red when finished (optional flashing/popup available)

### Planning Your Day
1. Click the widget and open the **Planner** tab
2. **Set your day** - Enter today's Start, Finish, Lunch time and lunch length (or click *Use defaults*)
3. **Add time blocks** - Type a task name, optional start time, and duration, then **Add**
4. **Auto-time** *(optional)* - Click *Auto-time from start* to lay blocks back-to-back, skipping lunch
5. **Start a block** - Press ▶ on a block to load its duration into the timer and mark it as the current task
6. **Adapt anytime** - Rename, re-time, re-order, complete (○/✓), or delete blocks as the day changes
7. **Advance** - When a block finishes you'll be prompted to start the next one — accept it or pick a different block manually

### Taking Breaks
- After every work interval (default **20 minutes** of active timing) a full-screen **break prompt** appears and your task timer pauses.
- The widget turns **blue** while you're on a break.
- Choose **Back to work** to end early, **+1 min** to extend, or press **Esc** to dismiss — your task timer then resumes automatically.
- Configure the interval, break length, message, or turn breaks off entirely under **Settings → Break Reminders** (a quick toggle also lives on the Planner tab).

### Timer Controls
- **Pause/Resume**: Click the pause button to pause, shows "Resume" when paused (with improved synchronization)
- **Add Time**: Use quick buttons (+1, +5, +15 min) or set custom duration
- **Reduce Time**: Use quick buttons (-1, -5, -15 min) to decrease remaining time
- **Restart**: Reset timer to default or last set duration
- **Stop**: Stop timer and reset to beginning
- **Smart Resume**: Timer resumes from exact paused position with fixed state synchronization

### Customization
1. Click the widget to open controls
2. Click the "Settings" tab at the top
3. Choose your preferred:
   - Screen position (corners or center)
   - Size (20px - 200px) with auto-scaling text
   - Opacity (20% - 100%) for transparency control
   - Default timer duration
   - Default day times (start, finish, lunch time and length)
   - Break reminders (enable/disable, interval, break length, message)
   - Display options (time visibility, flashing, always on top)
   - Completion alerts (popup message with custom text)
4. Click "Save Settings" to apply changes

## Building for Distribution

### Create Standalone Executable
```bash
# Build for current platform
npm run build

# Build for all platforms
npm run dist
```

Built applications will be in the `dist/` folder.

### Supported Platforms
- **Windows**: Creates `.exe` installer and portable executable
- **macOS**: Creates `.dmg` and `.zip` packages for Intel and Apple Silicon
- **Linux**: Creates `.AppImage`, `.deb`, and `.rpm` packages

### Creating a New Release

1. Update version in `package.json`:
   ```json
   "version": "1.1.0"
   ```

2. Commit your changes:
   ```bash
   git add .
   git commit -m "Release version 1.1.0"
   ```

3. Create and push a version tag:
   ```bash
   git tag v1.1.0
   git push origin main
   git push origin v1.1.0
   ```

4. GitHub Actions will automatically:
   - Build the app for all platforms
   - Create a new GitHub release
   - Upload all distribution files

The release will be available at `https://github.com/yourusername/traffic-light-timer/releases`

## Project Structure

```
traffic-light-timer/
├── package.json              # Project configuration & dependencies
├── src/
│   ├── main.js              # Main Electron process (windows, settings, schedule, breaks)
│   ├── timer.js             # Timer logic and state management
│   ├── windows/             # HTML files
│   │   ├── widget.html      # Main timer widget
│   │   ├── controls.html    # Control panel (Timer / Planner / Settings tabs)
│   │   └── break.html       # Full-screen break prompt
│   ├── css/                 # Stylesheets
│   │   ├── widget.css       # Widget styling and shapes
│   │   ├── controls.css     # Control panel styling
│   │   └── break.css        # Break prompt styling
│   ├── js/                  # Renderer processes
│   │   ├── widget-renderer.js    # Widget window logic + break tracking
│   │   ├── controls-renderer.js  # Timer, planner, and settings logic
│   │   └── break-renderer.js     # Break prompt countdown logic
│   └── assets/
│       └── icon.png         # Application icon
└── dist/                    # Built applications (after npm run build)
```

## Technical Details

### Architecture
- **Main Process**: Window management, IPC coordination, settings persistence
- **Renderer Processes**: UI logic for widget, controls, and settings windows
- **Timer Engine**: High-precision countdown with pause/resume functionality

### Key Features
- **State Persistence**: Timer state and window positions saved across app restarts
- **IPC Communication**: Seamless data flow between widget and control windows
- **Color Interpolation**: Smooth HSL-based transitions for natural color progression
- **Shape System**: CSS-based geometric shapes using clip-path
- **Cross-platform**: Native look and feel on Windows, macOS, and Linux

### Performance
- **60 FPS Updates**: Smooth color transitions
- **Low Resource Usage**: Minimal CPU and memory footprint
- **Efficient Rendering**: Optimized for desktop widget use

## Development

### Development Mode
```bash
npm run dev
```

### File Structure Notes
- Settings, the day's schedule (`schedule.json`), and timer state are stored in the user data directory
- The schedule automatically resets to a fresh plan each new day
- Timer state and window positions are remembered between sessions

## Troubleshooting

### Common Issues

**App won't start**
- Ensure Node.js v16+ is installed
- Check that all dependencies installed: `npm install`
- On Linux: May need additional system libraries (libnss3, libdrm2, etc.)

**Widget not draggable**
- Widget uses `-webkit-app-region: drag` CSS property
- Some Linux desktop environments may require additional configuration

**Settings not saving**
- Check write permissions to user data directory
- Settings file location varies by OS:
  - Windows: `%APPDATA%/traffic-light-timer/`
  - macOS: `~/Library/Application Support/traffic-light-timer/`
  - Linux: `~/.config/traffic-light-timer/`
- The same directory holds `schedule.json` (today's plan) and `timerState.json`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Electron](https://electronjs.org/)
- Color transitions inspired by traffic light systems
- Icon design using SVG graphics

---

**Need help?** [Open an issue](https://github.com/yourusername/traffic-light-timer/issues) on GitHub.