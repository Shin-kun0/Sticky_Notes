import React, { useEffect } from 'react'
import { COLOR_PRESETS, FONTS, FONT_SIZES, NOTE_SIZES } from '../utils/noteUtils'

const BACKGROUNDS = [
  { value: 'none', label: 'None', url: 'none' },
  { value: 'bg-1.png', label: 'Wallpaper 1', url: bg1 },
  { value: 'bg-2.png', label: 'Wallpaper 2', url: bg2 },
  { value: 'bg-3.png', label: 'Background 1', url: bg3 },
  { value: 'bg-4.png', label: 'Background 2', url: bg4 },
  { value: 'bg-5.png', label: 'Background 3', url: bg5 },
]

const UI_SIZES = [
  { value: 'small', label: 'Small (-30%)' },
  { value: 'default', label: 'Default' },
  { value: 'big', label: 'Big (+30%)' },
  { value: 'huge', label: 'Huge (+50%)' },
  { value: 'custom', label: 'Custom' }
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
            <div className="switch-row" title="Automatically start Sticky Notes when you log in to your computer">
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
            <div className="switch-row" title="Open all desktop-pinned notes automatically when the app starts">
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
            <div className="switch-row" title="Set newly created notes to stay on top of other windows by default">
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
                <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>{f.label}</option>
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

          {/* ── Background Image ────────────────────── */}
          <div className="settings-section" title="Set a custom background image for the main app window">
            <span className="settings-section-title">App Background Image</span>
            <div className="background-grid">
              {BACKGROUNDS.map(bg => (
                <div 
                  key={bg.value}
                  className={`bg-preview-btn ${settings.backgroundImage === bg.value ? 'active' : ''}`}
                  onClick={() => update('backgroundImage', bg.value)}
                  style={{ 
                    backgroundImage: bg.url !== 'none' ? `url(${bg.url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  title={bg.label}
                >
                  {bg.value === 'none' && <span className="bg-label">None</span>}
                </div>
              ))}
              
              {/* Custom Backgrounds */}
              {(settings.customBackgrounds || []).map((filename, idx) => (
                <div 
                  key={filename}
                  className={`bg-preview-btn ${settings.backgroundImage === filename ? 'active' : ''}`}
                  onClick={() => update('backgroundImage', filename)}
                  style={{ 
                    backgroundImage: `url(custom-bg://${filename})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}
                  title={`Custom ${idx + 1}`}
                >
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.api && window.api.deleteBackground) {
                        await window.api.deleteBackground(filename);
                        const newBgs = settings.customBackgrounds.filter(bg => bg !== filename);
                        const newBgImage = settings.backgroundImage === filename ? 'none' : settings.backgroundImage;
                        onSave({
                          ...settings,
                          customBackgrounds: newBgs,
                          backgroundImage: newBgImage
                        });
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete Background"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              <div 
                className="bg-preview-btn upload-bg-btn"
                onClick={async () => {
                  if (window.api && window.api.uploadBackground) {
                    const res = await window.api.uploadBackground();
                    if (res?.error) {
                      alert(res.error);
                    } else if (res?.filename) {
                      const newBgs = [...(settings.customBackgrounds || []), res.filename];
                      // Save both at once to avoid multiple renders
                      onSave({
                        ...settings,
                        customBackgrounds: newBgs,
                        backgroundImage: res.filename
                      });
                    }
                  }
                }}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-secondary)',
                  border: '2px dashed var(--border)',
                  cursor: 'pointer'
                }}
                title="Upload custom background image"
              >
                <span style={{ fontSize: '24px', opacity: 0.5 }}>+</span>
              </div>
            </div>
          </div>

          {/* ── UI Scale ────────────────────────────── */}
          <div className="settings-section" title="Adjust the overall size of the application interface">
            <span className="settings-section-title">Note Card Size</span>
            <select
              className="form-select"
              value={settings.uiScale}
              onChange={e => update('uiScale', e.target.value)}
              style={{ marginBottom: '8px' }}
            >
              {UI_SIZES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            
            {settings.uiScale === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={settings.uiScaleCustom}
                  onChange={e => update('uiScaleCustom', Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '13px' }}>{settings.uiScaleCustom}%</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
