/**
 * Shared constants and utilities used across note components.
 */

/**
 * Returns true if the hex colour is perceptually "light".
 */
export function isLightColor(hex) {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
}

/**
 * Preset note colours shared by EditModal and SettingsPanel.
 */
export const COLOR_PRESETS = [
  { name: 'Yellow',   value: '#FFF176' },
  { name: 'Pink',     value: '#F48FB1' },
  { name: 'Mint',     value: '#80CBC4' },
  { name: 'Sky Blue', value: '#81D4FA' },
  { name: 'Lavender', value: '#CE93D8' },
  { name: 'White',    value: '#FFFFFF' },
]

/**
 * Maps note fontSize enum to pixel values.
 */
export const FONT_SIZE_MAP = { small: 13, medium: 16, large: 20 }

/**
 * Available fonts shared across EditModal and SettingsPanel.
 */
export const FONTS = [
  { name: 'Caveat',      label: 'Caveat (Handwriting)' },
  { name: 'Inter',       label: 'Inter (Clean)' },
  { name: 'Courier New', label: 'Courier New (Mono)' },
  { name: 'Kalam',       label: 'Kalam (Marker)' },
]

/**
 * Font size options shared across EditModal and SettingsPanel.
 */
export const FONT_SIZES = [
  { value: 'small',  label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large',  label: 'L' },
]

/**
 * Note dimensions shared across EditModal and SettingsPanel.
 */
export const NOTE_SIZES = [
  { value: 'small',  label: 'Small (180×180)' },
  { value: 'medium', label: 'Medium (220×220)' },
  { value: 'large',  label: 'Large (280×280)' },
  { value: 'custom', label: 'Custom...' },
]

