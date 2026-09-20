import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNotes } from './hooks/useNotes'
import NoteCard from './components/NoteCard'
import EditModal from './components/EditModal'
import SettingsPanel from './components/SettingsPanel'
import PrivacyModal from './components/PrivacyModal'
import ShortcutsModal from './components/ShortcutsModal'
import bg1 from './assets/backgrounds/bg-1.png?asset'
import bg2 from './assets/backgrounds/bg-2.png?asset'
import bg3 from './assets/backgrounds/bg-3.png?asset'
import bg4 from './assets/backgrounds/bg-4.png?asset'
import bg5 from './assets/backgrounds/bg-5.png?asset'
import './styles/app.css'

const BACKGROUND_MAP = {
  'bg-1.png': bg1,
  'bg-2.png': bg2,
  'bg-3.png': bg3,
  'bg-4.png': bg4,
  'bg-5.png': bg5,
}

export default function App() {
  const {
    notes, settings, loading, error,
    createNote, updateNote, deleteNote, deleteMultiple,
    toggleShowOnDesktop, showOnDesktopAt, toggleLock, toggleAlwaysOnTop, togglePin,
    updateSettings
  } = useNotes()

  const [editingNoteId, setEditingNoteId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // ── Selection mode state ────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Track which note is "focused" for keyboard navigation in selection mode
  const [focusedIndex, setFocusedIndex] = useState(-1)

  // Derive editing note from latest notes array (always in sync)
  const editingNote = editingNoteId
    ? notes.find(n => n.id === editingNoteId) || null
    : null

  // ── Drag-to-desktop tracking ref ───────────────────
  const dragNoteIdRef = useRef(null)

  const handleNewNote = useCallback(() => {
    const note = createNote()
    setEditingNoteId(note.id)
  }, [createNote])

  // ── Selection handlers ─────────────────────────────
  const handleToggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleExitSelection = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
    setFocusedIndex(-1)
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    await deleteMultiple([...selectedIds])
    handleExitSelection()
  }

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return
    const selectedNotes = notes.filter(n => selectedIds.has(n.id))
    const content = selectedNotes
      .map((n, i) => `── Note ${i + 1} ──\n${n.content || '(empty)'}`)
      .join('\n\n')
    if (window.api && window.api.exportSingleNote) {
      await window.api.exportSingleNote(content, 'notes.txt')
    }
    handleExitSelection()
  }

  // ── Compute filtered notes (used by both render and shortcuts) ──
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const aTime = new Date(a.createdAt || 0).getTime()
    const bTime = new Date(b.createdAt || 0).getTime()
    return settings.sortOrder === 'newest' ? bTime - aTime : aTime - bTime
  });

  const filteredNotes = sortedNotes.filter(note =>
    !searchQuery.trim() || (note.content || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // ── Select All handler ─────────────────────────────
  const handleSelectAll = useCallback(() => {
    const allVisibleIds = new Set(filteredNotes.map(n => n.id))
    setSelectedIds(prev => {
      // If all are already selected, deselect all (toggle behavior)
      const allSelected = filteredNotes.every(n => prev.has(n.id))
      return allSelected ? new Set() : allVisibleIds
    })
  }, [filteredNotes])

  // ── Drag-to-desktop handlers ───────────────────────
  const handleDragStart = useCallback((e) => {
    // Capture the note ID from the drag event (set by NoteCard)
    const noteId = e.dataTransfer.getData('text/plain') || e.target.closest('.note-card')?.id?.replace('note-card-', '')
    if (noteId) dragNoteIdRef.current = noteId
  }, [])

  const handleDragEnd = useCallback((e) => {
    const noteId = dragNoteIdRef.current
    dragNoteIdRef.current = null
    if (!noteId) return

    // Detect if the note was dropped outside the app window
    // When dragged outside, the drop target is outside the window and
    // the coordinates relative to the viewport will be outside bounds
    const { screenX, screenY } = e
    const windowBounds = {
      left: window.screenX,
      top: window.screenY,
      right: window.screenX + window.innerWidth,
      bottom: window.screenY + window.innerHeight,
    }

    const droppedOutside =
      screenX < windowBounds.left ||
      screenX > windowBounds.right ||
      screenY < windowBounds.top ||
      screenY > windowBounds.bottom

    if (droppedOutside) {
      showOnDesktopAt(noteId, screenX, screenY)
    }
  }, [showOnDesktopAt])

  // ── Keyboard shortcuts ─────────────────────────────
  useEffect(() => {
    const shortcuts = settings.shortcuts || {}

    const matchesShortcut = (e, combo) => {
      if (!combo) return false
      const parts = combo.toLowerCase().split('+')
      const key = parts[parts.length - 1]
      const needCtrl = parts.includes('ctrl')
      const needShift = parts.includes('shift')
      const needAlt = parts.includes('alt')

      // Normalize the event key for comparison
      let eventKey = e.key.toLowerCase()
      // Handle special keys that may differ
      if (eventKey === ' ') eventKey = 'space'

      return (
        (e.ctrlKey || e.metaKey) === needCtrl &&
        e.shiftKey === needShift &&
        e.altKey === needAlt &&
        eventKey === key
      )
    }

    const handler = (e) => {
      // Don't intercept when typing in inputs
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (matchesShortcut(e, shortcuts.newNote)) {
        e.preventDefault()
        handleNewNote()
      } else if (matchesShortcut(e, shortcuts.deleteNote)) {
        e.preventDefault()
        if (selectionMode && selectedIds.size > 0) {
          handleDeleteSelected()
        } else if (editingNoteId) {
          deleteNote(editingNoteId)
          setEditingNoteId(null)
        }
      } else if (matchesShortcut(e, shortcuts.toggleSettings)) {
        e.preventDefault()
        setShowSettings(prev => !prev)
      } else if (matchesShortcut(e, shortcuts.toggleDesktop)) {
        e.preventDefault()
        if (editingNoteId) {
          toggleShowOnDesktop(editingNoteId)
        }
      } else if (matchesShortcut(e, shortcuts.toggleEditMode)) {
        e.preventDefault()
        if (selectionMode) {
          handleExitSelection()
        } else {
          setSelectionMode(true)
          setFocusedIndex(0)
        }
      }

      // ── Keyboard navigation in selection mode ────────
      if (selectionMode && filteredNotes.length > 0) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          setFocusedIndex(prev => Math.min(prev + 1, filteredNotes.length - 1))
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          setFocusedIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === ' ' && focusedIndex >= 0 && focusedIndex < filteredNotes.length) {
          e.preventDefault()
          handleToggleSelect(filteredNotes[focusedIndex].id)
        } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          handleSelectAll()
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settings.shortcuts, editingNoteId, selectionMode, selectedIds, handleNewNote,
      filteredNotes, focusedIndex, handleToggleSelect, handleSelectAll,
      deleteNote, toggleShowOnDesktop, handleDeleteSelected])

  // ── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  const resolvedBg = BACKGROUND_MAP[settings.backgroundImage]
  const bgImageUrl = resolvedBg
    ? `url(${resolvedBg})`
    : settings.backgroundImage !== 'none'
      ? `url(custom-bg://${settings.backgroundImage})`
      : 'none'

  const backgroundStyle = {
    backgroundImage: bgImageUrl,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    height: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const appStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: 1,
    overflow: 'hidden'
  };

  const notesStyle = {
    zoom: settings.uiScale === 'custom' 
      ? `${settings.uiScaleCustom}%` 
      : settings.uiScale === 'small' ? '70%' 
      : settings.uiScale === 'big' ? '130%' 
      : settings.uiScale === 'huge' ? '150%' 
      : '100%'
  };

  return (
    <div style={backgroundStyle}>
      <div style={appStyle} className="app-content-wrapper">
        {/* ── Action Bar ──────────────────────────────── */}
        <div className="action-bar" style={{ WebkitAppRegion: 'drag' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', WebkitAppRegion: 'no-drag' }}>
            <button
              className="new-note-btn"
              onClick={handleNewNote}
              id="new-note-button"
            >
              <span className="plus-icon">+</span>
              New Note
            </button>
            <button
              className="action-btn settings-icon-btn"
              onClick={() => setShowSettings(true)}
              id="settings-button"
              title="App Settings"
              style={{ padding: '0 16px', fontSize: '18px' }}
            >
              ⚙
            </button>
            <input
              type="text"
              className="search-input"
              placeholder="Search notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-notes-input"
            />
          </div>

        <div className="action-bar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center', WebkitAppRegion: 'no-drag' }}>
          {selectionMode ? (
            <>
              {/* Counter, Select All, Delete, and Export to the left of Cancel button */}
              <span className="selection-counter-text">
                {selectedIds.size} selected
              </span>
              <button
                className="action-btn selection-select-all-btn"
                onClick={handleSelectAll}
                title={filteredNotes.every(n => selectedIds.has(n.id)) ? 'Deselect all notes' : 'Select all visible notes'}
                id="bulk-select-all-btn"
              >
                {filteredNotes.every(n => selectedIds.has(n.id)) ? '☐ Deselect All' : '☑ Select All'}
              </button>
              <button
                className="action-btn selection-delete-btn"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                title="Delete selected notes"
                id="bulk-delete-btn"
              >
                🗑️ Delete
              </button>
              <button
                className="action-btn selection-export-btn"
                onClick={handleExportSelected}
                disabled={selectedIds.size === 0}
                title="Export selected notes as .txt"
                id="bulk-export-btn"
              >
                📤 Export as .txt
              </button>
              <button
                className="action-btn active-selection"
                onClick={handleExitSelection}
                title="Cancel edit mode"
                id="selection-mode-btn"
              >
                ✕ Cancel
              </button>
            </>
          ) : (
            <button
              className="action-btn"
              onClick={() => setSelectionMode(true)}
              title="Select multiple notes to delete or export"
              id="selection-mode-btn"
            >
              ☑ Edit
            </button>
          )}

          {/* Sort Order and View Mode are always visible */}
          <select 
            className="action-select" 
            value={settings.sortOrder} 
            onChange={(e) => updateSettings({ ...settings, sortOrder: e.target.value })}
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
          </select>
          <button 
            className="action-btn" 
            onClick={() => updateSettings({ ...settings, viewMode: settings.viewMode === 'grid' ? 'list' : 'grid' })}
            title={settings.viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
          >
            {settings.viewMode === 'grid' ? '☰ List View' : '⊞ Grid View'} 
          </button>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────── */}
      {error && (
        <div className="error-banner" id="error-banner">
          <span className="error-banner-icon">⚠</span>
          <span className="error-banner-text">
            Failed to load your notes — {error}. Your data file may be corrupted.
            A backup was saved automatically.
          </span>
        </div>
      )}

      {/* ── Notes ───────────────────────────────────── */}
      <div
        className={`notes-${settings.viewMode}`}
        id="notes-container"
        style={notesStyle}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      >
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>{searchQuery.trim() ? `No notes matching "${searchQuery}"` : 'No notes yet'}</p>
            <p>{searchQuery.trim() ? 'Try a different search term' : 'Create one to get started!'}</p>
          </div>
        ) : (
          filteredNotes.map((note, idx) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => setEditingNoteId(note.id)}
              onToggleDesktop={() => toggleShowOnDesktop(note.id)}
              onToggleLock={() => toggleLock(note.id)}
              onTogglePin={() => togglePin(note.id)}
              onToggleAlwaysOnTop={() => toggleAlwaysOnTop(note.id)}
              onDelete={() => deleteNote(note.id)}
              selectionMode={selectionMode}
              selected={selectedIds.has(note.id)}
              onSelect={handleToggleSelect}
              focused={selectionMode && focusedIndex === idx}
              editing={editingNoteId === note.id}
              onDragStartCapture={(e) => {
                dragNoteIdRef.current = note.id
              }}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>

      {/* ── Edit Modal ──────────────────────────────── */}
      {editingNote && (
        <EditModal
          note={editingNote}
          onChange={(changes) => updateNote(editingNote.id, changes)}
          onToggleDesktop={() => toggleShowOnDesktop(editingNote.id)}
          onToggleLock={() => toggleLock(editingNote.id)}
          onClose={() => setEditingNoteId(null)}
        />
      )}

      {/* ── Settings Panel ──────────────────────────── */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
          onOpenShortcuts={() => setShowShortcuts(true)}
        />
      )}

      {/* ── Shortcuts Modal ─────────────────────────── */}
      {showShortcuts && (
        <ShortcutsModal
          shortcuts={settings.shortcuts || {}}
          onSave={(shortcuts) => updateSettings({ ...settings, shortcuts })}
          onClose={() => setShowShortcuts(false)}
        />
      )}

      {/* ── Privacy Modal ───────────────────────────── */}
      {!settings.hasSeenPrivacy && (
        <PrivacyModal 
          onAccept={() => updateSettings({ ...settings, hasSeenPrivacy: true })}
        />
      )}
      </div>
    </div>
  )
}
