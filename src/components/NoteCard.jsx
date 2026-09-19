import React, { useState } from 'react'
import { isLightColor, FONT_SIZE_MAP } from '../utils/noteUtils'

export default function NoteCard({
  note,
  onClick,
  onToggleDesktop,
  onToggleLock,
  onTogglePin,
  onToggleAlwaysOnTop,
  onDelete,
  selectionMode = false,
  selected = false,
  onSelect
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const light = isLightColor(note.color)

  const stop = (fn) => (e) => {
    e.stopPropagation()
    if (selectionMode) {
      if (onSelect) onSelect(note.id)
      return
    }
    fn()
  }

  const handleClick = () => {
    if (selectionMode && onSelect) {
      onSelect(note.id)
    } else {
      onClick()
    }
  }

  return (
    <div
      className={`note-card ${selectionMode ? 'selection-mode' : ''} ${selected ? 'selected' : ''}`}
      style={{ backgroundColor: note.color }}
      onClick={handleClick}
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
          title={note.lockedOnDesktop ? 'Locked on desktop — cannot be removed until this option is off' : 'Lock on desktop — cannot be removed until this option is off'}
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
          fontSize: `${FONT_SIZE_MAP[note.fontSize] || 16}px`,
          color: note.fontColor || undefined
        }}
      >
        {note.content || 'Empty note'}
      </div>

      {/* Bottom actions */}
      <div className={`card-actions-bottom ${note.alwaysOnTop ? 'has-active' : ''}`}>
        {/* Always on Top — downward arrow at bottom left */}
        <button
          className={`card-btn aot-btn ${note.alwaysOnTop ? 'active' : ''}`}
          onClick={stop(onToggleAlwaysOnTop)}
          title={note.alwaysOnTop ? 'Always on top: ON — click to turn off' : 'Always on top: OFF — click to keep this note above other windows'}
        >
          ⬇
        </button>

        <div className="card-actions-bottom-right">
          <button
            className="card-btn export-btn"
            onClick={async (e) => { 
              e.stopPropagation(); 
              if (window.api && window.api.exportSingleNote) {
                await window.api.exportSingleNote(note.content || 'Empty note', 'note.txt');
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
    </div>
  )
}
