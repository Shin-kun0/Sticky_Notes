import React, { useRef, useEffect } from 'react'
import { COLOR_PRESETS, FONTS, FONT_SIZES, NOTE_SIZES } from '../utils/noteUtils'

export default function EditModal({
  note,
  onChange,
  onToggleDesktop,
  onToggleLock,
  onClose
}) {
  const textareaRef = useRef(null)

  // Auto-focus the textarea when modal opens
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose} id="edit-modal-overlay">
      <div className="modal" onClick={e => e.stopPropagation()} id="edit-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>Edit Note</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            title="Close (saves automatically)"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* ── Content ─────────────────────────────── */}
          <div className="form-section">
            <label className="form-label">Content</label>
            <textarea
              ref={textareaRef}
              className="note-textarea"
              value={note.content}
              onChange={e => onChange({ content: e.target.value })}
              placeholder="Write your note…"
              style={{ fontFamily: note.font }}
              id="note-content-input"
            />
          </div>

          {/* ── Color ───────────────────────────────── */}
          <div className="form-section">
            <label className="form-label">Color</label>
            <div className="color-row">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c.value}
                  className={`color-swatch ${note.color.toUpperCase() === c.value ? 'active' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => onChange({ color: c.value })}
                  title={c.name}
                />
              ))}
              <div className="color-input-wrapper">
                <input
                  type="color"
                  className="color-input"
                  value={note.color}
                  onChange={e => onChange({ color: e.target.value })}
                  title="Custom color"
                  id="color-picker-input"
                />
              </div>
            </div>
          </div>

          {/* ── Font ────────────────────────────────── */}
          <div className="form-section">
            <label className="form-label">Font</label>
            <select
              className="form-select"
              value={note.font}
              onChange={e => onChange({ font: e.target.value })}
              id="font-select"
            >
              {FONTS.map(f => (
                <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Font Size ───────────────────────────── */}
          <div className="form-section">
            <label className="form-label">Font Size</label>
            <div className="toggle-group">
              {FONT_SIZES.map(s => (
                <button
                  key={s.value}
                  className={`toggle-option ${note.fontSize === s.value ? 'active' : ''}`}
                  onClick={() => onChange({ fontSize: s.value })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Note Size ───────────────────────────── */}
          <div className="form-section">
            <label className="form-label">Note Size</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                className="form-select"
                value={note.noteSize}
                onChange={e => onChange({ noteSize: e.target.value })}
                id="note-size-select"
              >
                {NOTE_SIZES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {note.noteSize === 'custom' && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-select"
                    style={{ width: '80px', minWidth: 'auto', padding: '8px' }}
                    value={note.customWidth || 220}
                    onChange={e => onChange({ customWidth: Number(e.target.value) })}
                    title="Width"
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>×</span>
                  <input
                    type="number"
                    className="form-select"
                    style={{ width: '80px', minWidth: 'auto', padding: '8px' }}
                    value={note.customHeight || 220}
                    onChange={e => onChange({ customHeight: Number(e.target.value) })}
                    title="Height"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Toggles ─────────────────────────────── */}
          <div className="form-section">
            <div className="switch-row">
              <span className="switch-row-label">Show on Desktop</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={note.showOnDesktop}
                  onChange={onToggleDesktop}
                  id="show-on-desktop-toggle"
                />
                <span className="switch-slider" />
              </label>
            </div>
            <div className="switch-row">
              <span className="switch-row-label">Lock on Desktop</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={note.lockedOnDesktop}
                  onChange={onToggleLock}
                  id="lock-on-desktop-toggle"
                />
                <span className="switch-slider" />
              </label>
            </div>
            <div className="switch-row">
              <span className="switch-row-label">Always on Top</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={note.alwaysOnTop || false}
                  onChange={e => onChange({ alwaysOnTop: e.target.checked })}
                  id="always-on-top-toggle"
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
