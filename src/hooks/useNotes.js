import { useState, useEffect, useCallback, useRef } from 'react'

const DEFAULT_SETTINGS = {
  launchOnStartup: false,
  showDesktopNotesOnLaunch: true,
  defaultColor: '#FFF176',
  defaultFont: 'Caveat',
  defaultFontSize: 'medium',
  defaultNoteSize: 'medium',
  defaultCustomWidth: 220,
  defaultCustomHeight: 220,
  defaultAlwaysOnTop: false
}

/**
 * Central state + CRUD hook for notes and settings.
 *
 * - Loads data from main process on mount.
 * - Debounced auto-save (500 ms) on every notes mutation.
 * - Immediate save + window management for show/hide desktop operations.
 * - Listens for desktop-note dismissals pushed from main process.
 */
export function useNotes() {
  const [notes, setNotes] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const saveTimerRef = useRef(null)
  const notesRef = useRef(notes)

  // Keep ref in sync so callbacks always see latest notes
  useEffect(() => { notesRef.current = notes }, [notes])

  // ── Load once on mount ─────────────────────────────
  useEffect(() => {
    if (!window.api) {
      console.warn('window.api not available — running outside Electron')
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const data = await window.api.getAll()
        setNotes(data.notes || [])
        setSettings(prev => ({ ...prev, ...data.settings }))
      } catch (err) {
        console.error('Failed to load:', err)
      }
      setLoading(false)
    })()

    // Listen for desktop note X-button dismissals
    const cleanup = window.api.onNoteStateChanged(({ noteId, changes }) => {
      setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, ...changes } : n)))
    })
    return cleanup
  }, [])

  // ── Debounced auto-save ────────────────────────────
  const hasLoaded = useRef(false)
  useEffect(() => {
    if (!hasLoaded.current) {
      if (!loading) hasLoaded.current = true
      return
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (window.api) window.api.saveNotes(notes)
    }, 500)
    return () => clearTimeout(saveTimerRef.current)
  }, [notes, loading])

  // ── Create ─────────────────────────────────────────
  const createNote = useCallback(() => {
    const note = {
      id: crypto.randomUUID(),
      content: '',
      color: settings.defaultColor,
      font: settings.defaultFont,
      fontSize: settings.defaultFontSize,
      noteSize: settings.defaultNoteSize,
      customWidth: settings.defaultCustomWidth,
      customHeight: settings.defaultCustomHeight,
      showOnDesktop: false,
      lockedOnDesktop: false,
      alwaysOnTop: settings.defaultAlwaysOnTop,
      desktopX: 100 + Math.floor(Math.random() * 300),
      desktopY: 100 + Math.floor(Math.random() * 300),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setNotes(prev => [note, ...prev])
    return note
  }, [settings])

  // ── Update ─────────────────────────────────────────
  const updateNote = useCallback((id, changes) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, ...changes, updatedAt: new Date().toISOString() }
          : n
      )
    )
  }, [])

  // ── Delete ─────────────────────────────────────────
  const deleteNote = useCallback(async (id) => {
    const note = notesRef.current.find(n => n.id === id)
    if (note?.showOnDesktop && window.api) {
      await window.api.hideFromDesktop(id)
    }
    setNotes(prev => prev.filter(n => n.id !== id))
  }, [])

  // ── Toggle show-on-desktop (immediate save) ───────
  const toggleShowOnDesktop = useCallback(async (id) => {
    const note = notesRef.current.find(n => n.id === id)
    if (!note) return

    const show = !note.showOnDesktop
    const updated = notesRef.current.map(n =>
      n.id === id
        ? { ...n, showOnDesktop: show, updatedAt: new Date().toISOString() }
        : n
    )
    setNotes(updated)

    // Must save immediately so main process has fresh data before creating window
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (window.api) {
      await window.api.saveNotes(updated)
      if (show) {
        await window.api.showOnDesktop(id)
      } else {
        await window.api.hideFromDesktop(id)
      }
    }
  }, [])

  // ── Toggle lock ────────────────────────────────────
  const toggleLock = useCallback((id) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, lockedOnDesktop: !n.lockedOnDesktop, updatedAt: new Date().toISOString() }
          : n
      )
    )
  }, [])

  // ── Save settings ─────────────────────────────────
  const updateSettings = useCallback(async (newSettings) => {
    setSettings(newSettings)
    if (window.api) await window.api.saveSettings(newSettings)
  }, [])

  return {
    notes,
    settings,
    loading,
    createNote,
    updateNote,
    deleteNote,
    toggleShowOnDesktop,
    toggleLock,
    updateSettings
  }
}
