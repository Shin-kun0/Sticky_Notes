import React, { useState } from 'react'
import { useNotes } from './hooks/useNotes'
import NoteCard from './components/NoteCard'
import EditModal from './components/EditModal'
import SettingsPanel from './components/SettingsPanel'
import './styles/app.css'

export default function App() {
  const {
    notes, settings, loading,
    createNote, updateNote, deleteNote,
    toggleShowOnDesktop, toggleLock,
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

  return (
    <>
      {/* ── Top Bar ─────────────────────────────────── */}
      <header className="top-bar">
        <div className="top-bar-title">
          <span className="icon">🗒️</span>
          <span>Sticky Notes</span>
        </div>
        <button
          className="settings-btn"
          onClick={() => setShowSettings(true)}
          id="settings-button"
          title="Settings"
        >
          ⚙
        </button>
      </header>

      {/* ── Action Bar ──────────────────────────────── */}
      <div className="action-bar">
        <button
          className="new-note-btn"
          onClick={handleNewNote}
          id="new-note-button"
        >
          <span className="plus-icon">+</span>
          New Note
        </button>
      </div>

      {/* ── Notes Grid ──────────────────────────────── */}
      <div className="notes-grid" id="notes-grid">
        {notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No notes yet</p>
            <p>Create one to get started!</p>
          </div>
        ) : (
          notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => setEditingNoteId(note.id)}
              onToggleDesktop={() => toggleShowOnDesktop(note.id)}
              onToggleLock={() => toggleLock(note.id)}
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
    </>
  )
}
