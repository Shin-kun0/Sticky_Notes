import React, { useEffect } from 'react'

const COLOR_PRESETS = [
  { name: 'Yellow',   value: '#FFF176' },
  { name: 'Pink',     value: '#F48FB1' },
  { name: 'Mint',     value: '#80CBC4' },
  { name: 'Sky Blue', value: '#81D4FA' },
  { name: 'Lavender', value: '#CE93D8' },
  { name: 'White',    value: '#FFFFFF' },
]

const FONTS = [
  { name: 'Caveat',           label: 'Caveat (Handwriting)' },
  { name: 'Inter',            label: 'Inter (Clean)' },
  { name: 'Courier New',      label: 'Courier New (Mono)' },
  { name: 'Kalam',            label: 'Kalam (Marker)' },
]

const FONT_SIZES = [
  { value: 'small',  label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large',  label: 'L' },
]

const NOTE_SIZES = [
  { value: 'small',  label: 'Small (180×180)' },
  { value: 'medium', label: 'Medium (220×220)' },
  { value: 'large',  label: 'Large (280×280)' },
  { value: 'custom', label: 'Custom...' },
]

export default function SettingsPanel({ settings, onSave, onClose }) {
  const update = (key, value) => onSave({ ...settings, [key]: value })

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <aside className="settings-panel" id="settings-panel">
        <div className="settings-header">
          <h2>⚙ Settings</h2>
          <button className="settings-close-btn" onClick={onClose} title="Close">×</button>
        </div>

        <div className="settings-body">
          {/* ── System ──────────────────────────────── */}
          <div className="settings-section">
            <span className="settings-section-title">System</span>
            <div className="switch-row">
              <span className="switch-row-label">Launch on system startup</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.launchOnStartup}
                  onChange={e => update('launchOnStartup', e.target.checked)}
                  id="startup-toggle"
                />
                <span className="switch-slider" />
              </label>
            </div>
            <div className="switch-row">
              <span className="switch-row-label">Show desktop notes on launch</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.showDesktopNotesOnLaunch}
                  onChange={e => update('showDesktopNotesOnLaunch', e.target.checked)}
                  id="show-on-launch-toggle"
                />
                <span className="switch-slider" />
              </label>
            </div>
            <div className="switch-row">
              <span className="switch-row-label">Default: Always on Top</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.defaultAlwaysOnTop || false}
                  onChange={e => update('defaultAlwaysOnTop', e.target.checked)}
                  id="default-always-on-top-toggle"
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>

          {/* ── Default Color ───────────────────────── */}
          <div className="settings-section">
            <span className="settings-section-title">Default Note Color</span>
            <div className="color-row">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c.value}
                  className={`color-swatch ${settings.defaultColor.toUpperCase() === c.value ? 'active' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => update('defaultColor', c.value)}
                  title={c.name}
                />
              ))}
              <div className="color-input-wrapper">
                <input
                  type="color"
                  className="color-input"
                  value={settings.defaultColor}
                  onChange={e => update('defaultColor', e.target.value)}
                  title="Custom color"
                  id="default-color-picker"
                />
              </div>
            </div>
          </div>

          {/* ── Default Font ────────────────────────── */}
          <div className="settings-section">
            <span className="settings-section-title">Default Font</span>
            <select
              className="form-select"
              value={settings.defaultFont}
              onChange={e => update('defaultFont', e.target.value)}
              id="default-font-select"
            >
              {FONTS.map(f => (
                <option key={f.name} value={f.name}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* ── Default Font Size ───────────────────── */}
          <div className="settings-section">
            <span className="settings-section-title">Default Font Size</span>
            <div className="toggle-group">
              {FONT_SIZES.map(s => (
                <button
                  key={s.value}
                  className={`toggle-option ${settings.defaultFontSize === s.value ? 'active' : ''}`}
                  onClick={() => update('defaultFontSize', s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Default Note Size ───────────────────── */}
          <div className="settings-section">
            <span className="settings-section-title">Default Note Size</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                className="form-select"
                value={settings.defaultNoteSize}
                onChange={e => update('defaultNoteSize', e.target.value)}
                id="default-note-size-select"
              >
                {NOTE_SIZES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {settings.defaultNoteSize === 'custom' && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-select"
                    style={{ width: '80px', minWidth: 'auto', padding: '8px' }}
                    value={settings.defaultCustomWidth || 220}
                    onChange={e => update('defaultCustomWidth', Number(e.target.value))}
                    title="Width"
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>×</span>
                  <input
                    type="number"
                    className="form-select"
                    style={{ width: '80px', minWidth: 'auto', padding: '8px' }}
                    value={settings.defaultCustomHeight || 220}
                    onChange={e => update('defaultCustomHeight', Number(e.target.value))}
                    title="Height"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
