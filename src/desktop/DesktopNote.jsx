import React, { useState, useEffect } from 'react'
import '../styles/desktop-note.css'
import starImg from '../assets/sketches/star.png'
import flowerImg from '../assets/sketches/flower.png'
import pencilImg from '../assets/sketches/pencil.png'
import coffeeImg from '../assets/sketches/coffee.png'

const SKETCHES = [starImg, flowerImg, pencilImg, coffeeImg]

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

/**
 * Standalone component rendered inside each frameless desktop BrowserWindow.
 * Read-only display — editing happens in the Manager.
 */
export default function DesktopNote() {
  const [note, setNote] = useState(null)
  const [sketchIndex] = useState(() => Math.floor(Math.random() * SKETCHES.length))

  useEffect(() => {
    const noteId = new URLSearchParams(window.location.search).get('noteId')
    if (!noteId) return

    // Fetch initial data
    window.api.getNoteData(noteId).then(data => {
      if (data) setNote(data)
    })

    // Listen for real-time updates from the Manager
    const cleanup = window.api.onNoteUpdated(updatedNote => {
      setNote(updatedNote)
    })

    return cleanup
  }, [])

  const handleClose = () => {
    if (note) window.api.closeFromNote(note.id)
  }

  if (!note) return null

  const fontSize = FONT_SIZE_MAP[note.fontSize] || 16
  const light = isLightColor(note.color)

  return (
    <div
      className="desktop-note"
      style={{
        backgroundColor: note.color,
        fontFamily: note.font,
        fontSize: `${fontSize}px`
      }}
    >
      {/* Close button — hidden when locked */}
      {!note.lockedOnDesktop && (
        <button
          className={`desktop-close-btn ${light ? 'dark-btn' : 'light-btn'}`}
          onClick={handleClose}
          title="Dismiss from desktop"
        >
          ×
        </button>
      )}

      {/* Content (read-only) */}
      <div className={`desktop-note-content ${light ? 'dark-text' : 'light-text'}`}>
        {note.content}
      </div>

      {/* Sketch animation */}
      <img src={SKETCHES[sketchIndex]} className="sketch-icon" alt="sketch" />
    </div>
  )
}
