import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // ── Data operations ──────────────────────────────────
  getAll: () => ipcRenderer.invoke('notes:getAll'),
  saveNotes: (notes) => ipcRenderer.invoke('notes:save', notes),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  // ── Desktop window management (called from Manager) ─
  showOnDesktop: (noteId) => ipcRenderer.invoke('desktop:show', noteId),
  hideFromDesktop: (noteId) => ipcRenderer.invoke('desktop:hide', noteId),

  // ── Desktop note operations (called from desktop note renderer) ─
  getNoteData: (noteId) => ipcRenderer.invoke('desktop:getNoteData', noteId),
  closeFromNote: (noteId) => ipcRenderer.invoke('desktop:closeFromNote', noteId),

  // ── System ───────────────────────────────────────────
  setStartup: (enabled) => ipcRenderer.invoke('startup:set', enabled),

  // ── Events from main process ─────────────────────────
  onNoteUpdated: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('note:updated', handler)
    return () => ipcRenderer.removeListener('note:updated', handler)
  },

  onNoteStateChanged: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('note:stateChanged', handler)
    return () => ipcRenderer.removeListener('note:stateChanged', handler)
  }
})
