import React, { useState } from 'react'

const FONT_SIZE_MAP = { small: 13, medium: 16, large: 20 }

/**
 * Returns true if the hex colour is perceptually "light".
 */
function isLightColor(hex) {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
}

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

      {/* Trash icon (hover-visible) */}
      <button
        className="card-btn delete-btn"
        onClick={(e) => { e.stopPropagation(); setShowConfirm(true) }}
        title="Delete note"
      >
        🗑️
      </button>
    </div>
  )
}
