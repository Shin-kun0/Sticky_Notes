import React, { useState } from 'react'
import { isLightColor, FONT_SIZE_MAP } from '../utils/noteUtils'

export default function NoteCard({
  note,
  onClick,
  onToggleDesktop,
  onToggleLock,
  onTogglePin,
  onDelete
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const light = isLightColor(note.color)

  const stop = (fn) => (e) => { e.stopPropagation(); fn() }

  return (
    <div
      className="note-card"
      style={{ backgroundColor: note.color }}
      onClick={onClick}
      id={`note-card-${note.id}`}
    >
      {/* Delete confirmation overlay */}
      {showConfirm && (
        <div className="delete-confirm">
          <p>Are you sure?</p>
          <div className="delete-confirm-actions">
            <button
              className="delete-confirm-btn confirm"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
            >
              Delete
            </button>
            <button
              className="delete-confirm-btn cancel"
              onClick={(e) => { e.stopPropagation(); setShowConfirm(false) }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header: star and lock (left), desktop pin (right) */}
      <div className="note-card-header">
        <button
          className={`card-btn star-btn ${note.isPinned ? 'active' : ''}`}
          onClick={stop(onTogglePin)}
          title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
        >
          {note.isPinned ? '⭐' : '☆'}
        </button>

        <button
          className={`card-btn lock-btn ${note.showOnDesktop ? 'visible' : ''} ${note.lockedOnDesktop ? 'active' : ''}`}
          onClick={stop(onToggleLock)}
          title={note.lockedOnDesktop ? 'Unlock from desktop' : 'Lock on desktop'}
          style={{ visibility: note.showOnDesktop ? 'visible' : 'hidden' }}
        >
          {note.lockedOnDesktop ? '🔒' : '🔓'}
        </button>

        <div style={{ flex: 1 }} />

        <button
          className={`card-btn pin-btn ${note.showOnDesktop ? 'active' : ''}`}
          onClick={stop(onToggleDesktop)}
          title={note.showOnDesktop ? 'Hide from desktop' : 'Show on desktop'}
        >
          {note.showOnDesktop ? '📌' : '📍'}
        </button>
      </div>

      {/* Content preview */}
      <div
        className={`note-card-content ${light ? 'dark-text' : 'light-text'}`}
        style={{
          fontFamily: note.font,
          fontSize: `${FONT_SIZE_MAP[note.fontSize] || 16}px`
        }}
      >
        {note.content || 'Empty note'}
      </div>

      {/* Export & Trash icons (hover-visible) */}
      <div className="card-actions-bottom">
        <button
          className="card-btn export-btn"
          onClick={async (e) => { 
            e.stopPropagation(); 
            if (window.api && window.api.exportSingleNote) {
              await window.api.exportSingleNote(note.content || 'Empty note');
            }
          }}
          title="Export note as .txt"
        >
          📤
        </button>
        <button
          className="card-btn delete-btn"
          onClick={(e) => { e.stopPropagation(); setShowConfirm(true) }}
          title="Delete note"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
