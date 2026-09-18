import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import log from 'electron-log'

const DATA_DIR = path.join(app.getPath('appData'), 'StickyNotes')
const DATA_FILE = path.join(DATA_DIR, 'notes.json')

/**
 * Returns fresh default data with a welcome note.
 */
function getDefaultData() {
  return {
    settings: {
      launchOnStartup: false,
      showDesktopNotesOnLaunch: true,
      defaultColor: '#FFF176',
      defaultFont: 'Caveat',
      defaultFontSize: 'medium',
      defaultNoteSize: 'medium'
    },
    notes: [
      {
        id: randomUUID(),
        content: 'Welcome to Sticky Notes! ✨\nClick me to edit.',
        color: '#FFF176',
        font: 'Caveat',
        fontSize: 'medium',
        noteSize: 'medium',
        showOnDesktop: false,
        lockedOnDesktop: false,
        desktopX: 100,
        desktopY: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
}

/**
 * Load data from disk. Creates default file on first launch.
 * If the data file is corrupt, backs it up before returning defaults.
 */
export function loadData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(DATA_FILE)) {
      const defaultData = getDefaultData()
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8')
      return defaultData
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    log.error('Failed to load data:', err)

    // Back up corrupt file before overwriting with defaults
    try {
      if (fs.existsSync(DATA_FILE)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = `${DATA_FILE}.corrupt.${timestamp}`
        fs.copyFileSync(DATA_FILE, backupPath)
        log.warn(`Corrupt data file backed up to: ${backupPath}`)
      }
    } catch (backupErr) { log.warn('Failed to back up corrupt data file:', backupErr.message) }

    return getDefaultData()
  }
}

/**
 * Save data to disk using atomic write (tmp + rename) for safety.
 */
export function saveData(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    const tmpFile = DATA_FILE + '.tmp'
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tmpFile, DATA_FILE)
  } catch (err) {
    log.error('Failed to save data:', err)
    throw err
  }
}
