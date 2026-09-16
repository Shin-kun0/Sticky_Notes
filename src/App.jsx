import React, { useState, useEffect } from 'react'
import { useNotes } from './hooks/useNotes'
import NoteCard from './components/NoteCard'
import EditModal from './components/EditModal'
import SettingsPanel from './components/SettingsPanel'
import PrivacyModal from './components/PrivacyModal'
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
    createNote, updateNote, deleteNote,
    toggleShowOnDesktop, toggleLock, togglePin,
    updateSettings
  } = useNotes()

  const [editingNoteId, setEditingNoteId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  // Derive editing note from latest notes array (always in sync)
  const editingNote = editingNoteId
    ? notes.find(n => n.id === editingNoteId) || null
    : null

  const handleNewNote = () => {
    const note = createNote()
    setEditingNoteId(note.id)
  }

  // ── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const aTime = new Date(a.createdAt || 0).getTime()
    const bTime = new Date(b.createdAt || 0).getTime()
    return settings.sortOrder === 'newest' ? bTime - aTime : aTime - bTime
  });

  const resolvedBg = BACKGROUND_MAP[settings.backgroundImage]

  const backgroundStyle = {
    backgroundImage: resolvedBg ? `url(${resolvedBg})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    width: '100%',
  };

  const appStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
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
          </div>

        <div className="action-bar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center', WebkitAppRegion: 'no-drag' }}>
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
      <div className={`notes-${settings.viewMode}`} id="notes-container" style={notesStyle}>
        {sortedNotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No notes yet</p>
            <p>Create one to get started!</p>
          </div>
        ) : (
          sortedNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => setEditingNoteId(note.id)}
              onToggleDesktop={() => toggleShowOnDesktop(note.id)}
              onToggleLock={() => toggleLock(note.id)}
              onTogglePin={() => togglePin(note.id)}
              onDelete={() => deleteNote(note.id)}
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
