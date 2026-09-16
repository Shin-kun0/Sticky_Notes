# Sticky Notes Desktop App

A premium, modern desktop sticky notes application built with Electron, React, and Vite.

<img src="./src/assets/app-icon.png" alt="App Icon" width="128" />

## Features

- **Dual-Interface Design**: 
  - **Manager Window**: A beautiful dashboard to create, edit, and manage all your notes in a responsive Grid or List view. Supports custom high-resolution backgrounds.
  - **Desktop Overlays**: Individual sticky notes that float directly on your desktop. They are frameless, transparent, and have a subtle paper texture with folded corners.
- **Always on Top**: Pin notes so they float above all your open applications.
- **Customization**:
  - Global UI Scaling: Zoom the interface from -30% to +50% (or custom) without breaking the layout or background.
  - 6 preset pastel colors plus a custom RGB color picker.
  - Multiple bundled handwriting and system fonts (Caveat, Inter, Courier New, Kalam).
  - Select between Small, Medium, Large, or define pixel-perfect Custom Dimensions (Width × Height).
- **Sketch Animations**: Desktop notes feature a charming hand-drawn sketch (coffee cup, pencil, flower, or star) randomly rendered in the bottom right corner with a subtle bounce animation.
- **Persistence**: Notes and settings are safely stored locally via an atomic JSON save mechanism (`%APPDATA%/StickyNotes/notes.json`), ensuring no data corruption.
- **Launch on Startup**: Configure the app to start with your system and optionally restore all your desktop notes automatically.

## Tech Stack

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/) 19
- [Vite](https://vitejs.dev/) + [electron-vite](https://electron-vite.org/)
- Vanilla CSS (Custom Design System)
- `@fontsource` packages for robust offline font rendering

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone this repository (or download the source).
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```

### Building for Production

To compile the source code (outputs to `out/`):
```bash
npm run build
```

To build the standalone distributable installer for your operating system:
```bash
npm run dist
```
The installer will be placed in the `dist` directory.

## Architecture Highlights
- **Preload Scripts**: Uses Electron's `contextBridge` to expose a safe, typed API to the React renderers.
- **Dual Renderers**: `electron-vite.config.mjs` is configured with multiple entry points (`index.html` for Manager, `desktop.html` for overlay notes).
- **Adaptive Contrast**: Text and icons intelligently switch between dark and light modes based on the luminance of the note's background color.
- **Micro-Animations**: Extensive use of CSS transitions and keyframe animations to make the UI feel premium and responsive.
