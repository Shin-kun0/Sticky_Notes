# Sticky Notes Desktop App — Project Specification (v2)

## Overview

A desktop application with two distinct surfaces:

1. **Manager Window** — a proper app with a window, taskbar presence, and Start Menu shortcut. This is where the user creates, reads, edits, deletes, and configures all their notes. It looks like a clean card-based dashboard.
2. **Desktop Notes** — frameless, borderless overlay windows that sit on the desktop layer. Only notes the user has marked as "show on desktop" appear here. They are read-only on the desktop; editing always happens in the Manager. Each desktop note has an **X button** to dismiss it from the desktop — unless the note is marked as **locked**, in which case the X button is hidden and the note can only be dismissed from the Manager.

The app has no system tray. It behaves like a normal application — pinnable to the taskbar, searchable in the Start Menu, with a proper window and title bar.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron (latest stable) |
| UI framework | React (functional components + hooks) |
| Styling | CSS (plain, no framework) |
| Storage | Local JSON file via Node.js `fs` module |
| Build tooling | Vite + `electron-vite` |
| Language | JavaScript (no TypeScript required) |

---

## Surface 1 — Manager Window

### General layout

```
┌─────────────────────────────────────────────┐
│  🗒 Sticky Notes                          ⚙  │  ← top bar: app title + settings gear (top-right)
├─────────────────────────────────────────────┤
│  [ + New Note ]                             │  ← action bar
├──────────┬──────────┬──────────┬────────────┤
│  Card    │  Card    │  Card    │  Card      │  ← note cards grid
│          │          │          │            │
└──────────┴──────────┴──────────┴────────────┘
```

- Fixed-width window, resizable by the user.
- Scrollable grid of note cards if there are many notes.
- The window shows in the taskbar and can be pinned like any normal app.

### Note cards

Each card in the Manager represents one sticky note. Cards display:

- The note's **background color** as the card's background (reflects the note's current color).
- The **text content** of the note (truncated with ellipsis if it overflows the card).
- A **"Show on Desktop" toggle** — a small pin icon or eye icon in the card's top-right corner. Active = the note is currently shown as a desktop overlay. Inactive = hidden from desktop.
- A **lock icon** in the card's top-left corner (visible when the note is showing on the desktop). When locked, the desktop note's X button is hidden — the note can only be dismissed from the Manager. When unlocked, the X button is visible on the desktop note as normal. The lock state is toggled directly on the card without opening the edit modal.
- A **delete button** (trash icon) that appears on hover, bottom-right of the card.
- Clicking the card body **opens the note in an edit modal** (see below).

Card size: fixed at roughly 160×160px in a CSS grid with `auto-fill` columns.

### Edit modal

Clicking a card opens a modal (inside the Manager window, not a new OS window) with:

- A full `textarea` for editing the note's text content.
- A color swatch row + RGB picker (same as described in Customization below).
- Font selector dropdown.
- Font size toggle (Small / Medium / Large).
- A "Show on Desktop" toggle (same as on the card, mirrored here).
- A **"Lock on Desktop" toggle** — when enabled, the desktop note's X button is hidden. The note can only be dismissed by returning to the Manager and toggling "Show on Desktop" off or unlocking it. Mirrors the lock icon on the card.
- Close button saves automatically.

No separate Save button — all changes persist on close (debounced write to disk).

### "+ New Note" button

- Creates a new note with default settings (warm yellow, Caveat font, medium size, empty content).
- Immediately opens the edit modal so the user can start typing.
- The new note is hidden from the desktop by default — the user opts in by toggling "Show on Desktop".

### Delete note

- Trash icon on the card (visible on hover).
- Single confirmation inline (a small "Are you sure?" prompt replaces the card content momentarily).
- Confirmed deletion removes the note from the Manager and closes its desktop window if it was showing.

---

## Surface 2 — Desktop Notes

Desktop notes are Electron `BrowserWindow` instances that render on the desktop layer (below normal app windows).

### Behavior

- Only notes with `showOnDesktop: true` get a desktop window.
- Desktop notes are **not editable** on the desktop — they are display-only. The user edits content in the Manager.
- Notes are **draggable** on the desktop (drag by the note body). The new position is saved.
- Notes are **not resizable** on the desktop in v1 — size is set from the Manager edit modal.
- Desktop windows do **not** appear in the taskbar.

### X button (dismiss from desktop)

- Every desktop note shows a small **× button in the top-right corner**, visible on hover.
- Clicking it sets `showOnDesktop: false` for that note and closes the desktop window. The note is **not deleted** — it remains in the Manager and can be re-shown at any time.
- This is equivalent to toggling "Show on Desktop" off from the Manager card.

### Lock feature

- A note can be marked as **locked** from the Manager (lock icon on the card, or the toggle in the edit modal).
- When a note is locked (`lockedOnDesktop: true`):
  - The X button is **completely hidden** on the desktop note — the user cannot dismiss it from the desktop.
  - The only way to remove a locked note from the desktop is to open the Manager and either unlock it first or toggle "Show on Desktop" off directly.
  - The lock icon on the Manager card shows as active (filled/highlighted) so the user can see at a glance which notes are locked.
- Locking does not prevent dragging — the user can still reposition a locked note on the desktop.
- A locked note that is toggled off via "Show on Desktop" in the Manager loses its desktop window but retains its `lockedOnDesktop: true` state — so if it is re-shown later, it will still be locked.

### Appearance

- Frameless window (`frame: false`), transparent background to allow CSS shadow and rounded corners.
- Default background: warm yellow (`#FFF176`).
- Slight drop shadow (`box-shadow: 3px 4px 12px rgba(0,0,0,0.18)`).
- Folded bottom-right corner via CSS pseudo-element (triangle cutout effect).
- Optional subtle paper texture overlay (a very low-opacity noise pattern via CSS or a tiny PNG).
- Font defaults to `Caveat` (bundled locally, no CDN).

### Electron window config (per desktop note)

```js
{
  width: 220,
  height: 220,
  frame: false,
  transparent: true,
  resizable: false,
  skipTaskbar: true,
  alwaysOnTop: false,
  type: 'desktop',        // renders below normal windows on Windows/Linux
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: 'preload.js'
  }
}
```

---

## Settings Panel

Opened by clicking the **⚙ gear icon** in the Manager's top-right corner.

The settings panel opens as an in-app slide-in panel or modal — not a separate window.

### Settings options

| Setting | Type | Description |
|---|---|---|
| Launch on system startup | Toggle (on/off) | Registers or removes the app from Windows startup via Electron's `app.setLoginItemSettings()` |
| Default note color | RGB color picker | Sets the color applied to every newly created note. Existing notes are not affected. |
| Default font | Dropdown | Sets the font for every newly created note. |
| Default font size | Radio: S / M / L | Sets the font size for every newly created note. |
| Default note size | Dropdown or number inputs (px) | Sets the width × height of newly created notes and their desktop windows. |
| Show desktop notes on launch | Toggle (on/off) | If on, notes marked "Show on Desktop" automatically appear on the desktop when the app starts. If off, desktop notes only appear after the user opens the Manager. |

Settings are saved to the same `notes.json` file under a `"settings"` key (see Storage schema below).

---

## Customization (per note)

Each individual note can override the defaults set in Settings:

- **Color**: Full RGB picker (`<input type="color">`) plus a row of ~6 preset swatches (warm yellow, pink, mint green, sky blue, lavender, white).
- **Font**: Dropdown — Caveat (handwriting), Inter (clean), Courier New (mono), Permanent Marker (bold). All fonts bundled locally.
- **Font size**: Small (13px) / Medium (16px) / Large (20px).
- **Note size** (affects both card size hint and desktop window dimensions): Small (180×180) / Medium (220×220) / Large (280×280).

---

## Data Storage

### Location

`%APPDATA%\StickyNotes\notes.json` on Windows.

### Schema

```json
{
  "settings": {
    "launchOnStartup": false,
    "showDesktopNotesOnLaunch": true,
    "defaultColor": "#FFF176",
    "defaultFont": "Caveat",
    "defaultFontSize": "medium",
    "defaultNoteSize": "medium"
  },
  "notes": [
    {
      "id": "uuid-v4-string",
      "content": "Buy oat milk\nCall dentist at 3pm",
      "color": "#FFF176",
      "font": "Caveat",
      "fontSize": "medium",
      "noteSize": "medium",
      "showOnDesktop": false,
      "lockedOnDesktop": false,
      "desktopX": 120,
      "desktopY": 200,
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-01T10:05:00Z"
    }
  ]
}
```

### Save strategy

- All writes are debounced (500ms after last change).
- Full file is rewritten on each save — no partial updates.
- On app startup, the file is read once and kept in memory. All runtime state lives in memory; disk is only updated on changes.
- If the file does not exist on first launch, it is created with default settings and one empty example note.

---

## IPC Architecture (Electron Main ↔ Renderer)

The Manager (renderer process) communicates with the Electron main process via `contextBridge` and `ipcRenderer`.

| Channel | Direction | Purpose |
|---|---|---|
| `notes:getAll` | Renderer → Main | Fetch all notes from disk on app load |
| `notes:save` | Renderer → Main | Write updated notes array to disk |
| `settings:save` | Renderer → Main | Write updated settings to disk |
| `desktop:show` | Renderer → Main | Open a desktop BrowserWindow for note ID |
| `desktop:hide` | Renderer → Main | Close the desktop window for note ID |
| `desktop:closeFromNote` | Desktop note → Main | User clicked X on the desktop note; sets `showOnDesktop: false` and closes the window |
| `desktop:updatePosition` | Desktop note → Main | Note was dragged; save new x/y |
| `startup:set` | Renderer → Main | Enable or disable OS login item |

---

## Project Structure

```
sticky-notes/
├── electron/
│   ├── main.js            # Main process: Manager window, desktop note windows, IPC handlers
│   ├── preload.js         # contextBridge — exposes IPC to renderer safely
│   └── storage.js         # Read/write notes.json via fs
├── src/
│   ├── App.jsx            # Manager root: loads notes, renders card grid + top bar
│   ├── components/
│   │   ├── NoteCard.jsx         # Card in the grid (color bg, text preview, pin toggle, delete)
│   │   ├── EditModal.jsx        # Full edit modal (textarea, color, font, show-on-desktop)
│   │   └── SettingsPanel.jsx    # Slide-in settings panel (startup, defaults, etc.)
│   ├── desktop/
│   │   └── DesktopNote.jsx      # Standalone React app loaded in each desktop BrowserWindow
│   ├── hooks/
│   │   ├── useNotes.js          # State + CRUD logic for notes (create, update, delete)
│   │   └── useDebounce.js       # Debounce hook for auto-save
│   └── styles/
│       ├── app.css              # Manager window layout, card grid, modal, settings
│       └── desktop-note.css     # Desktop note appearance (shadow, folded corner, texture)
├── assets/
│   ├── app-icon.png             # App icon (shown in taskbar + Start Menu)
│   └── fonts/
│       ├── Caveat.woff2
│       ├── PermanentMarker.woff2
│       └── ...
├── package.json
└── vite.config.js
```

---

## Out of Scope (v1)

- Cloud sync or cross-device support
- Rich text (bold, lists, images) — plain text only
- Note categories, tags, or search
- Undo / redo
- Note sharing or export
- macOS and Linux support (Windows first)
- Animations beyond simple CSS transitions

---

## Nice-to-Have (future)

- Search / filter bar in the Manager to find notes by text
- Note pinning (force above all windows on the desktop)
- Note opacity slider
- Drag-to-reorder cards in the Manager
- Dark mode for the Manager UI
- Note labels / color grouping
