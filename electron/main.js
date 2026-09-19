import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, protocol, net, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import url from 'url'
import appIconAsset from '../src/assets/app-icon.png?asset'
import log from 'electron-log'
import { loadData, saveData } from './storage.js'

// ────────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────────
let mainWindow = null
const desktopWindows = new Map() // noteId → BrowserWindow
let appData = null
let tray = null

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
    icon: appIconAsset,
    backgroundColor: '#0a0a14',
    show: false,
    autoHideMenuBar: true,
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
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('note:stateChanged', {
        noteId: note.id,
        changes: { desktopX: nx, desktopY: ny }
      })
    }
  })

  // Persist size after resize
  noteWin.on('resized', () => {
    if (noteWin.isDestroyed()) return
    const [nw, nh] = noteWin.getSize()
    const idx = appData.notes.findIndex(n => n.id === note.id)
    if (idx !== -1) {
      appData.notes[idx].customWidth = nw
      appData.notes[idx].customHeight = nh
      appData.notes[idx].noteSize = 'custom'
      saveData(appData)
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('note:stateChanged', {
        noteId: note.id,
        changes: { customWidth: nw, customHeight: nh, noteSize: 'custom' }
      })
    }
  })

  noteWin.on('closed', () => {
    desktopWindows.delete(note.id)
  })

  desktopWindows.set(note.id, noteWin)
}

function closeDesktopNoteWindow(noteId) {
  const win = desktopWindows.get(noteId)
  let nx, ny
  if (win && !win.isDestroyed()) {
    // Persist final position before closing so re-open restores it
    [nx, ny] = win.getPosition()
    const idx = appData.notes.findIndex(n => n.id === noteId)
    if (idx !== -1) {
      appData.notes[idx].desktopX = nx
      appData.notes[idx].desktopY = ny
      saveData(appData)
    }
    win.close()
  }
  desktopWindows.delete(noteId)
  return { desktopX: nx, desktopY: ny }
}

// ────────────────────────────────────────────────────────
// IPC Handlers
// ────────────────────────────────────────────────────────
function setupIPC() {
  // Fetch all data
  ipcMain.handle('notes:getAll', () => appData)

  // Save notes array
  ipcMain.handle('notes:save', (_, notes) => {
    // Preserve current positions of any active desktop windows so they aren't overwritten by stale React state
    for (const [noteId, win] of desktopWindows) {
      if (!win.isDestroyed()) {
        const [curX, curY] = win.getPosition()
        const incoming = notes.find(n => n.id === noteId)
        if (incoming) {
          incoming.desktopX = curX
          incoming.desktopY = curY
        }
      }
    }

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

  // Synchronous saves to guarantee data writes when the window unloads
  ipcMain.on('settings:saveSync', (event, settings) => {
    appData.settings = settings
    saveData(appData)
    event.returnValue = true
  })

  ipcMain.on('notes:saveSync', (event, notes) => {
    appData.notes = notes
    saveData(appData)
    event.returnValue = true
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
    // Close window and get final position before close
    const pos = closeDesktopNoteWindow(noteId)

    // Update data
    const idx = appData.notes.findIndex(n => n.id === noteId)
    if (idx !== -1) {
      appData.notes[idx].showOnDesktop = false
      if (pos && pos.desktopX !== undefined) {
        appData.notes[idx].desktopX = pos.desktopX
        appData.notes[idx].desktopY = pos.desktopY
      }
      saveData(appData)
    }

    // Tell the Manager so it can update React state with both showOnDesktop and final position
    if (mainWindow && !mainWindow.isDestroyed()) {
      const changes = { showOnDesktop: false }
      if (pos && pos.desktopX !== undefined) {
        changes.desktopX = pos.desktopX
        changes.desktopY = pos.desktopY
      }
      mainWindow.webContents.send('note:stateChanged', {
        noteId,
        changes
      })
    }
  })

  // Startup toggle (explicit channel, kept for clarity)
  ipcMain.handle('startup:set', (_, enabled) => {
    app.setLoginItemSettings({ openAtLogin: !!enabled })
  })

  // Upload Custom Background
  ipcMain.handle('upload-background', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Custom Background',
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]

    try {
      const stat = fs.statSync(filePath)

      // 5MB limit to prevent memory bloat and slow down
      if (stat.size > 5 * 1024 * 1024) {
        return { error: 'File size must be under 5MB.' }
      }

      const userDataDir = app.getPath('userData')
      const bgDir = path.join(userDataDir, 'custom-backgrounds')
      if (!fs.existsSync(bgDir)) fs.mkdirSync(bgDir, { recursive: true })

      const ext = path.extname(filePath)
      const filename = crypto.randomUUID() + ext
      const dest = path.join(bgDir, filename)

      fs.copyFileSync(filePath, dest)

      return { filename }
    } catch (err) {
      log.error('upload-background failed:', err.message)
      return { error: 'Failed to process the selected file. It may have been moved or deleted.' }
    }
  })

  // Delete Custom Background
  ipcMain.handle('delete-background', (_, filename) => {
    try {
      const userDataDir = app.getPath('userData')
      const targetPath = path.join(userDataDir, 'custom-backgrounds', filename)
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath)
        return { success: true }
      }
      return { error: 'File not found' }
    } catch (err) {
      return { error: err.message }
    }
  })

  // Export Notes Backup
  ipcMain.handle('notes:export', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Sticky Notes Backup',
      defaultPath: 'sticky-notes-backup.sticky',
      filters: [{ name: 'Sticky Notes Backup', extensions: ['sticky', 'json'] }]
    })

    if (result.canceled || !result.filePath) return { canceled: true }

    try {
      fs.writeFileSync(result.filePath, JSON.stringify(appData, null, 2))
      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  })

  // Export Single / Multiple Notes as TXT
  ipcMain.handle('notes:exportSingle', async (_, content, defaultPath = 'note.txt') => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Notes',
      defaultPath,
      filters: [{ name: 'Text File', extensions: ['txt'] }]
    })

    if (result.canceled || !result.filePath) return { canceled: true }

    try {
      fs.writeFileSync(result.filePath, content, 'utf-8')
      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  })

  // Import Notes
  ipcMain.handle('notes:import', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Sticky Notes Backup',
      filters: [{ name: 'Sticky Notes Backup', extensions: ['sticky', 'json'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return { canceled: true }

    try {
      const dataStr = fs.readFileSync(result.filePaths[0], 'utf-8')
      const importedData = JSON.parse(dataStr)

      // ── Structural validation ─────────────────────────
      if (!Array.isArray(importedData.notes) || typeof importedData.settings !== 'object' || importedData.settings === null || Array.isArray(importedData.settings)) {
        return { error: 'Invalid backup file format: notes must be an array and settings must be an object.' }
      }

      // ── Sanitize notes ────────────────────────────────
      const sanitizedNotes = importedData.notes.filter(note => {
        return note && typeof note === 'object' && typeof note.id === 'string' && typeof note.content === 'string'
      }).map(note => ({
        ...note,
        id: String(note.id),
        content: String(note.content || ''),
        color: typeof note.color === 'string' ? note.color : '#FFF176',
        font: typeof note.font === 'string' ? note.font : 'Caveat',
        fontSize: typeof note.fontSize === 'string' ? note.fontSize : 'medium',
        noteSize: typeof note.noteSize === 'string' ? note.noteSize : 'medium',
        showOnDesktop: typeof note.showOnDesktop === 'boolean' ? note.showOnDesktop : false,
        lockedOnDesktop: typeof note.lockedOnDesktop === 'boolean' ? note.lockedOnDesktop : false,
        alwaysOnTop: typeof note.alwaysOnTop === 'boolean' ? note.alwaysOnTop : false,
        // Strip path-traversal sequences from backgroundImage
        backgroundImage: typeof note.backgroundImage === 'string' && !note.backgroundImage.includes('..') ? note.backgroundImage : undefined
      }))

      // ── Sanitize settings ─────────────────────────────
      const s = importedData.settings
      const sanitizedSettings = {
        launchOnStartup: typeof s.launchOnStartup === 'boolean' ? s.launchOnStartup : false,
        showDesktopNotesOnLaunch: typeof s.showDesktopNotesOnLaunch === 'boolean' ? s.showDesktopNotesOnLaunch : true,
        defaultColor: typeof s.defaultColor === 'string' ? s.defaultColor : '#FFF176',
        defaultFont: typeof s.defaultFont === 'string' ? s.defaultFont : 'Caveat',
        defaultFontSize: typeof s.defaultFontSize === 'string' ? s.defaultFontSize : 'medium',
        defaultNoteSize: typeof s.defaultNoteSize === 'string' ? s.defaultNoteSize : 'medium',
        defaultCustomWidth: typeof s.defaultCustomWidth === 'number' ? s.defaultCustomWidth : 220,
        defaultCustomHeight: typeof s.defaultCustomHeight === 'number' ? s.defaultCustomHeight : 220,
        defaultAlwaysOnTop: typeof s.defaultAlwaysOnTop === 'boolean' ? s.defaultAlwaysOnTop : false,
        hasSeenPrivacy: typeof s.hasSeenPrivacy === 'boolean' ? s.hasSeenPrivacy : false,
        backgroundImage: typeof s.backgroundImage === 'string' && !s.backgroundImage.includes('..') ? s.backgroundImage : 'none',
        customBackgrounds: Array.isArray(s.customBackgrounds) ? s.customBackgrounds.filter(b => typeof b === 'string' && !b.includes('..')) : [],
        uiScale: typeof s.uiScale === 'string' ? s.uiScale : 'default',
        uiScaleCustom: typeof s.uiScaleCustom === 'number' ? s.uiScaleCustom : 100,
        viewMode: typeof s.viewMode === 'string' ? s.viewMode : 'grid',
        sortOrder: typeof s.sortOrder === 'string' ? s.sortOrder : 'newest'
      }

      appData = { notes: sanitizedNotes, settings: sanitizedSettings }
      saveData(appData)
      return { success: true, data: appData }
    } catch (err) {
      return { error: err.message }
    }
  })
}

// ────────────────────────────────────────────────────────
// App Lifecycle
// ────────────────────────────────────────────────────────

protocol.registerSchemesAsPrivileged([
  { scheme: 'custom-bg', privileges: { secure: true, standard: true, supportFetchAPI: true } }
])

app.whenReady().then(() => {
  protocol.handle('custom-bg', (request) => {
    let filename = decodeURIComponent(request.url.replace(/^custom-bg:\/\/(\.\/)?/, ''))
    filename = filename.replace(/[/\\]+$/, '')
    const bgDir = path.resolve(app.getPath('userData'), 'custom-backgrounds')
    const fullPath = path.resolve(bgDir, filename)

    // Security: prevent path traversal — resolved path must stay within bgDir
    if (!fullPath.startsWith(bgDir + path.sep) && fullPath !== bgDir) {
      return new Response('Forbidden', { status: 403 })
    }

    return net.fetch(url.pathToFileURL(fullPath).toString())
  })

  appData = loadData()
  setupIPC()
  createMainWindow()

  // Auto-show desktop notes on launch if configured
  if (appData.settings.showDesktopNotesOnLaunch) {
    for (const note of appData.notes) {
      if (note.showOnDesktop) createDesktopNoteWindow(note)
    }
  }

  // Setup Tray
  const trayIcon = nativeImage.createFromPath(appIconAsset)
  tray = new Tray(trayIcon)
  tray.setToolTip('Sticky Notes')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Sticky Notes', click: () => {
      if (mainWindow === null) createMainWindow()
      else { mainWindow.show(); mainWindow.focus(); }
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow === null) createMainWindow()
    else { mainWindow.show(); mainWindow.focus(); }
  })
})

app.on('window-all-closed', () => {
  // On macOS, apps conventionally stay alive in the dock when all windows close
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) createMainWindow()
})
