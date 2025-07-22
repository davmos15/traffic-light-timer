# Traffic Light Timer

A desktop timer widget application built with Electron that visually transitions from green to red over a set duration, helping you track time with an intuitive color-coded system.

![Traffic Light Timer Demo](src/assets/icon.svg)

## Features

### 🎯 Main Timer Widget
- **Compact Design**: Small, circular widget (100x100px default, customizable 50-200px)
- **Color Transitions**: Smooth progression from green → yellow → red
- **Always on Top**: Stays visible above all other windows (toggleable)
- **Draggable**: Position anywhere on your screen
- **Transparent**: Frameless design that blends with your desktop

### 🎨 Visual System
- **Smooth Animations**: 60fps color interpolation using HSL color space
- **Multiple Shapes**: Circle, Square, Star, Triangle, Diamond, Hexagon
- **Real-time Updates**: Millisecond-precision timer with live color feedback

### 🎛️ Control Panel
- **Timer Controls**: Start, Stop, Pause, Resume, Restart
- **Quick Add Time**: +1 min, +5 min, +15 min buttons  
- **Custom Duration**: Set any time with minutes:seconds input
- **Live Display**: Current time remaining and timer status

### ⚙️ Settings & Customization
- **Shape Selection**: Choose from 6 different widget shapes
- **Size Adjustment**: Scale from 50px to 200px
- **Default Duration**: Set your preferred starting time
- **Window Behavior**: Toggle always-on-top functionality
- **Persistent Storage**: All settings and timer state saved automatically

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
1. **Launch the app** - A small green circle appears on your desktop
2. **Click the widget** - Opens the control panel
3. **Start timing** - Timer automatically begins with default 5-minute duration
4. **Watch the transition** - Widget smoothly changes from green to yellow to red

### Timer Controls
- **Pause/Resume**: Click the pause button or use the widget controls
- **Add Time**: Use quick buttons or set custom duration
- **Restart**: Reset timer to default or last set duration
- **Stop**: Stop timer and reset to beginning

### Customization
1. Click the widget to open controls
2. Click "Settings" button
3. Choose your preferred:
   - Widget shape (circle, square, star, etc.)
   - Size (50px - 200px)
   - Default timer duration
   - Always on top behavior
4. Click "Save" to apply changes

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
│   ├── main.js              # Main Electron process
│   ├── timer.js             # Timer logic and state management
│   ├── windows/             # HTML files
│   │   ├── widget.html      # Main timer widget
│   │   ├── controls.html    # Control panel
│   │   └── settings.html    # Settings page
│   ├── css/                 # Stylesheets
│   │   ├── widget.css       # Widget styling and shapes
│   │   ├── controls.css     # Control panel styling
│   │   └── settings.css     # Settings page styling
│   ├── js/                  # Renderer processes
│   │   ├── widget-renderer.js    # Widget window logic
│   │   ├── controls-renderer.js  # Controls window logic
│   │   └── settings-renderer.js  # Settings window logic
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
- Settings stored in user data directory
- Timer state persisted automatically
- Window positions remembered between sessions

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