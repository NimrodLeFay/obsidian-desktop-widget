# 🔮 Obsidian Graph Widget

A floating, transparent desktop graph for your Obsidian vault. Always on top, click-through by default — your knowledge graph lives on your desktop without getting in the way.

---

## Features

- **Full Graph** — all notes in your vault, force-directed, Obsidian-styled
- **Local Graph** — select any note and see its direct neighbors
- **Focus Mode** — current note + backlinks + notes edited in the last 7 days
- Transparent, always-on-top window (click-through by default)
- Live node drag, zoom & pan
- Hover tooltips with link count, edit recency, tags
- Auto-saves vault path between sessions

---

## Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- Your Obsidian vault folder (with `.md` files using `[[wikilinks]]`)

### Install & Run

```bash
# Clone or unzip this folder, then:
cd obsidian-graph-widget
npm install
npm start
```

On first launch, a setup screen appears — click **Select Vault Folder** and point it at your Obsidian vault.

---

## Controls

| Area | Action |
|---|---|
| Hover window | Shows control panel + legend |
| **Full / Local / Focus** buttons | Switch graph mode |
| Search box (Local/Focus modes) | Find and select a note |
| ↺ Refresh | Re-read vault from disk |
| ⊙ Click-thru / Interact | Toggle mouse interaction |
| ⌂ Vault | Change vault folder |
| ✕ | Close |
| Drag nodes | Reposition |
| Scroll | Zoom in/out |
| Click + drag background | Pan |

### Click-Through Mode

When **Click-thru** is active (default), your desktop clicks pass through the window. Hover over the window to reveal the panel and interact with it. Switch to **Interact** mode to drag nodes and click freely.

---

## Color Legend

| Color | Meaning |
|---|---|
| ⚫ Grey | Regular note |
| 🟣 Purple | Selected / center note |
| 🔵 Blue | Tagged note |
| 🟢 Green | Modified in last 7 days |

---

## Build (optional)

```bash
# Package for current platform
npm run build

# Windows installer
npm run build:win

# macOS DMG
npm run build:mac
```

Built files appear in `dist/`.

---

## How it reads your vault

The widget scans all `.md` files recursively and extracts:
- `[[wikilinks]]` → graph edges
- `#tags` and frontmatter tags → node color
- File `mtime` → recency highlighting

No internet connection needed. Your data never leaves your machine.
