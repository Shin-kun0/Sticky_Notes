import React, { useState, useEffect, useRef } from 'react'

const DEFAULT_SHORTCUTS = {
  newNote: 'ctrl+n',
  deleteNote: 'ctrl+d',
  toggleSettings: 'ctrl+,',
  toggleDesktop: 'ctrl+shift+d'
}

const SHORTCUT_LABELS = {
  newNote: 'New Note',
  deleteNote: 'Delete Selected Note',
  toggleSettings: 'Open / Close Settings',
  toggleDesktop: 'Toggle Desktop for Selected Note'
}

function formatShortcut(shortcut) {
  if (!shortcut) return '—'
  return shortcut
    .split('+')
    .map(k => k.charAt(0).toUpperCase() + k.slice(1))
    .join(' + ')
}

export default function ShortcutsModal({ shortcuts, onSave, onClose }) {
  const [editing, setEditing] = useState(null) // which key is being re-bound
  const [localShortcuts, setLocalShortcuts] = useState({ ...DEFAULT_SHORTCUTS, ...shortcuts })
  const captureRef = useRef(null)

  // Close on Escape (only when not capturing a key)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !editing) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, editing])

  // Key capture mode
  useEffect(() => {
    if (!editing) return

    const handler = (e) => {
      e.preventDefault()
      e.stopPropagation()

      // Build the shortcut string
      const parts = []
      if (e.ctrlKey || e.metaKey) parts.push('ctrl')
      if (e.shiftKey) parts.push('shift')
      if (e.altKey) parts.push('alt')

      // Ignore modifier-only presses
      const key = e.key.toLowerCase()
      if (['control', 'shift', 'alt', 'meta'].includes(key)) return

      parts.push(key === ' ' ? 'space' : key)
      const combo = parts.join('+')

      setLocalShortcuts(prev => ({ ...prev, [editing]: combo }))
      setEditing(null)
    }

    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [editing])

  const handleSave = () => {
    onSave(localShortcuts)
    onClose()
  }

  const handleReset = () => {
    setLocalShortcuts({ ...DEFAULT_SHORTCUTS })
  }

  return (
    <div className="modal-overlay shortcuts-modal-overlay" onClick={onClose} id="shortcuts-modal-overlay">
      <div className="modal shortcuts-modal" onClick={e => e.stopPropagation()} id="shortcuts-modal">
        <div className="modal-header">
          <h2>⌨ Keyboard Shortcuts</h2>
          <button className="modal-close-btn" onClick={onClose} title="Close">×</button>
        </div>

        <div className="modal-body">
          <div className="shortcuts-list">
            {Object.entries(SHORTCUT_LABELS).map(([key, label]) => (
              <div className="shortcut-row" key={key}>
                <span className="shortcut-label">{label}</span>
                <button
                  ref={editing === key ? captureRef : null}
                  className={`shortcut-key-btn ${editing === key ? 'capturing' : ''}`}
                  onClick={() => setEditing(editing === key ? null : key)}
                  title="Click to reassign"
                >
                  {editing === key ? 'Press a key combo…' : formatShortcut(localShortcuts[key])}
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              className="shortcut-reset-btn"
              onClick={handleReset}
              title="Restore default shortcuts"
            >
              Reset Defaults
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600 }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
