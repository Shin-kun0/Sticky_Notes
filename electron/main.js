import { app, BrowserWindow, ipcMain, screen } from 'electron'
import path from 'path'
import { loadData, saveData } from './storage.js'

// ────────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────────
let mainWindow = null
const desktopWindows = new Map() // noteId → BrowserWindow
let appData = null

function getPreloadPath() {
  return path.join(__dirname, '../preload/index.js')
}

// ────────────────────────────────────────────────────────
// Manager Window
// ────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 520,
    minHeight: 400,
    title: 'Sticky Notes',
    backgroundColor: '#0a0a14',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath()
    }
  })

  // Load renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    // Close all desktop note windows when Manager closes
    for (const [, win] of desktopWindows) {
      if (!win.isDestroyed()) win.close()
    }
    desktopWindows.clear()
  })
}

// ────────────────────────────────────────────────────────
// Desktop Note Windows
// ────────────────────────────────────────────────────────
function createDesktopNoteWindow(note) {
  // Don't duplicate
  if (desktopWindows.has(note.id)) {
    const existing = desktopWindows.get(note.id)
    if (!existing.isDestroyed()) {
      existing.focus()
      return
    }
  }

  const sizes = { small: 180, medium: 220, large: 280 }
  const width = note.noteSize === 'custom' ? (note.customWidth || 220) : (sizes[note.noteSize] || 220)
  const height = note.noteSize === 'custom' ? (note.customHeight || 220) : (sizes[note.noteSize] || 220)

  // Clamp position within screen bounds
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const x = Math.min(Math.max(note.desktopX ?? 100, 0), sw - width)
  const y = Math.min(Math.max(note.desktopY ?? 100, 0), sh - height)

  const noteWin = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: note.alwaysOnTop || false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath()
    }
  })

  // Load desktop note renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    noteWin.loadURL(
      `${process.env.ELECTRON_RENDERER_URL}/desktop.html?noteId=${note.id}`
    )
  } else {
    noteWin.loadFile(
      path.join(__dirname, '../renderer/desktop.html'),
      { query: { noteId: note.id } }
    )
  }

  // Persist position after drag
  noteWin.on('moved', () => {
    if (noteWin.isDestroyed()) return
    const [nx, ny] = noteWin.getPosition()
    const idx = appData.notes.findIndex(n => n.id === note.id)
    if (idx !== -1) {
      appData.notes[idx].desktopX = nx
      appData.notes[idx].desktopY = ny
      saveData(appData)
    }
  })

  noteWin.on('closed', () => {
    desktopWindows.delete(note.id)
  })

  desktopWindows.set(note.id, noteWin)
}

function closeDesktopNoteWindow(noteId) {
  const win = desktopWindows.get(noteId)
  if (win && !win.isDestroyed()) {
    win.close()
  }
  desktopWindows.delete(noteId)
}

// ────────────────────────────────────────────────────────
// IPC Handlers
// ────────────────────────────────────────────────────────
function setupIPC() {
  // Fetch all data
  ipcMain.handle('notes:getAll', () => appData)

  // Save notes array
  ipcMain.handle('notes:save', (_, notes) => {
    appData.notes = notes
    saveData(appData)

    // Sync open desktop windows
    for (const [noteId, win] of desktopWindows) {
      if (win.isDestroyed()) continue
      const note = notes.find(n => n.id === noteId)
      if (!note) {
        // Note was deleted — close its window
        win.close()
      } else {
        // Resize if note size changed
        const sizes = { small: 180, medium: 220, large: 280 }
        const newWidth = note.noteSize === 'custom' ? (note.customWidth || 220) : (sizes[note.noteSize] || 220)
        const newHeight = note.noteSize === 'custom' ? (note.customHeight || 220) : (sizes[note.noteSize] || 220)
        
        const [curW, curH] = win.getSize()
        if (curW !== newWidth || curH !== newHeight) win.setSize(newWidth, newHeight)
        
        // Update always-on-top status
        win.setAlwaysOnTop(note.alwaysOnTop || false)
        
        // Push updated data to the desktop note renderer
        win.webContents.send('note:updated', note)
      }
    }
  })

  // Save settings
  ipcMain.handle('settings:save', (_, settings) => {
    appData.settings = settings
    saveData(appData)

    // Apply launch-on-startup
    app.setLoginItemSettings({ openAtLogin: !!settings.launchOnStartup })
  })

  // Show a note on the desktop
  ipcMain.handle('desktop:show', (_, noteId) => {
    const note = appData.notes.find(n => n.id === noteId)
    if (note) createDesktopNoteWindow(note)
  })

  // Hide a note from the desktop
  ipcMain.handle('desktop:hide', (_, noteId) => {
    closeDesktopNoteWindow(noteId)
  })

  // Desktop note renderer asks for its own data
  ipcMain.handle('desktop:getNoteData', (_, noteId) => {
    return appData.notes.find(n => n.id === noteId) || null
  })

  // User clicked X on a desktop note
  ipcMain.handle('desktop:closeFromNote', (_, noteId) => {
    // Update data
    const idx = appData.notes.findIndex(n => n.id === noteId)
    if (idx !== -1) {
      appData.notes[idx].showOnDesktop = false
      saveData(appData)
    }
    closeDesktopNoteWindow(noteId)

    // Tell the Manager so it can update React state
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('note:stateChanged', {
        noteId,
        changes: { showOnDesktop: false }
      })
    }
  })

  // Startup toggle (explicit channel, kept for clarity)
  ipcMain.handle('startup:set', (_, enabled) => {
    app.setLoginItemSettings({ openAtLogin: !!enabled })
  })
}

// ────────────────────────────────────────────────────────
// App Lifecycle
// ────────────────────────────────────────────────────────
app.whenReady().then(() => {
  appData = loadData()
  setupIPC()
  createMainWindow()

  // Auto-show desktop notes on launch if configured
  if (appData.settings.showDesktopNotesOnLaunch) {
    for (const note of appData.notes) {
      if (note.showOnDesktop) createDesktopNoteWindow(note)
    }
  }
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createMainWindow()
})
