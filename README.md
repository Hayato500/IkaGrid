# Ikariam Resource and Army Grid

A comprehensive Violentmonkey script for Ikariam players to track resources and military forces across all cities in real-time.

## Features

- 📊 **Multi-City Overview**: Simultaneous tracking of resources and military units
- ⚡ **Live Updates**: Automatic refresh every 2 seconds
- 🖱️ **Interactive Interface**:
  - Drag-and-drop positioning
  - Minimize/maximize toggle
  - Switch between Resources/Army views
- 📍 **City Quick Access**: Click city names to instantly switch cities
- 💾 **Persistent Storage**: Saves position and data through browser sessions
- 📱 **Responsive Design**: Adapts to different screen sizes

## Installation

1. Install a userscript manager:
- [Violentmonkey](https://violentmonkey.github.io/) (Firefox/Chrome/Edge)

2. **[Click to Install Script](https://raw.githubusercontent.com/Hayato500/IkaGrid/main/Ikariam%20Resource%20and%20Army%20Grid.js)**

## Usage

- **Toggle Views**: Switch between Resources and Army using header buttons
- **City Navigation**: Click any city name to jump to that city
- **Minimize**: Click the 📌 icon in top-left to collapse
- **Data Collection**:
  - Resources auto-save when changing cities
  - Military data saves when viewing army screens

## Technical Details

- **Storage**: Uses `localStorage` for:
  - Grid position
  - Minimized state
  - Active view preference
  - Resource/military data
- **Dependencies**:
  - jQuery 3.6.0
  - GM_addStyle
- **Compatibility**: Tested on modern Chrome/Firefox/Edge

## Credits

- **Author**: Kronos
- **Graphics**: Custom UI elements with native Ikariam art style
- **Hosting**: GitHub raw file hosting

## Troubleshooting

1. **Script Not Loading**:
   - Ensure userscript manager is enabled
   - Verify script is active in Violentmonkey dashboard

2. **Data Issues**:
   - Clear old data: `localStorage.clear()` in console
   - Refresh page after city changes

3. **Updates**:
   - Script auto-updates through Violentmonkey
   - Manual update URL in script header

---

**Note**: This is an unofficial fan project. Ikariam is property of Gameforge AG.
