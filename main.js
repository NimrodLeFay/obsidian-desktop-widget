const { app, BrowserWindow, ipcMain, screen, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
let vaultPath = null;
let isAlwaysOnTop = false;
let panelVisible = true;

// ─── Config ───────────────────────────────────────────────────────
const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {}
  return {};
}

function saveConfig(data) {
  const existing = loadConfig();
  fs.writeFileSync(configPath, JSON.stringify({ ...existing, ...data }, null, 2));
}

// ─── Startup registration ─────────────────────────────────────────
function setStartup(enable) {
  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath,
      args: ['--hidden']
    });
  } else if (process.platform === 'darwin') {
    app.setLoginItemSettings({ openAtLogin: enable });
  }
  saveConfig({ runOnStartup: enable });
}

function getStartup() {
  if (process.platform === 'win32' || process.platform === 'darwin') {
    return app.getLoginItemSettings().openAtLogin;
  }
  return false;
}

// ─── Vault parser (READ-ONLY — never writes to vault) ─────────────
function parseVault(vaultDir) {
  const nodes = [];
  const nodeMap = new Map();

  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (e) { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(fullPath); continue; }
      if (!entry.name.endsWith('.md')) continue;

      const id = path.relative(vaultDir, fullPath).replace(/\\/g, '/');
      const name = entry.name.replace(/\.md$/, '');
      let stat = { mtimeMs: 0, ctimeMs: 0, size: 0 };
      try { stat = fs.statSync(fullPath); } catch(e) {}

      // Read ONLY — fs.readFileSync with no write anywhere
      let content = '';
      try { content = fs.readFileSync(fullPath, 'utf8'); } catch(e) {}

      const tags = [];
      (content.match(/#[\w/-]+/g) || []).forEach(t => {
        if (!t.startsWith('#!') && t.length > 1) tags.push(t.slice(1));
      });
      const fmMatch = content.match(/^---[\r\n]([\s\S]*?)[\r\n]---/);
      if (fmMatch) {
        // YAML list: - tagname
        const listTags = [...fmMatch[1].matchAll(/^\s*-\s+["']?([^"'\n\r]+)["']?/gm)];
        listTags.forEach(m => tags.push(m[1].trim()));
        // Inline: tags: [a, b]
        const inlineTags = fmMatch[1].match(/^tags:\s*\[([^\]]+)\]/m);
        if (inlineTags) inlineTags[1].split(',').forEach(t => tags.push(t.trim().replace(/['"]/g, '')));
      }

      // Word count (approx)
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      // Heading
      const headingMatch = content.match(/^#\s+(.+)/m);
      const heading = headingMatch ? headingMatch[1].trim() : null;

      nodeMap.set(name.toLowerCase(), id);
      nodes.push({ id, name, heading, mtime: stat.mtimeMs, size: stat.size, wordCount, tags, content });
    }
  }

  walk(vaultDir);

  const links = [];
  for (const node of nodes) {
    const wikiLinks = node.content.match(/\[\[([^\]|#\n]+)(?:[|#][^\]\n]*)?\]\]/g) || [];
    for (const wl of wikiLinks) {
      const raw = wl.replace(/\[\[([^\]|#\n]+).*\]\]/, '$1').trim().toLowerCase();
      const targetId = nodeMap.get(raw) ||
        [...nodeMap.entries()].find(([k]) => k === raw || k.endsWith('/' + raw))?.[1];
      if (targetId && targetId !== node.id) {
        links.push({ source: node.id, target: targetId });
      }
    }
    // Strip content from returned data — we only need metadata
    delete node.content;
  }

  return { nodes, links };
}

// ─── Read single note content (for preview) ──────────────────────
function readNoteContent(vaultDir, noteId) {
  if (!vaultDir || !noteId) return null;
  const fullPath = path.join(vaultDir, noteId);
  // Safety: ensure path is inside vault
  const resolved = path.resolve(fullPath);
  const vaultResolved = path.resolve(vaultDir);
  if (!resolved.startsWith(vaultResolved + path.sep) && resolved !== vaultResolved) return null;
  try {
    const raw = fs.readFileSync(resolved, 'utf8');
    // Strip frontmatter for display
    return raw.replace(/^---[\r\n][\s\S]*?[\r\n]---[\r\n]?/, '').trim();
  } catch(e) { return null; }
}

// ─── IPC ─────────────────────────────────────────────────────────
ipcMain.handle('select-vault', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select your Obsidian Vault folder'
  });
  if (!result.canceled && result.filePaths[0]) {
    vaultPath = result.filePaths[0];
    saveConfig({ vaultPath });
    return vaultPath;
  }
  return null;
});

ipcMain.handle('get-vault-path', () => vaultPath);
ipcMain.handle('load-graph', () => vaultPath ? parseVault(vaultPath) : null);
ipcMain.handle('read-note', (_, noteId) => readNoteContent(vaultPath, noteId));

ipcMain.handle('open-in-obsidian', (_, noteId) => {
  if (!vaultPath || !noteId) return false;
  // Use obsidian:// URI protocol
  const vaultName = path.basename(vaultPath);
  const uri = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(noteId.replace(/\.md$/, ''))}`;
  shell.openExternal(uri);
  return true;
});

ipcMain.handle('open-in-explorer', (_, noteId) => {
  if (!vaultPath || !noteId) return false;
  const fullPath = path.join(vaultPath, noteId);
  shell.showItemInFolder(fullPath);
  return true;
});

ipcMain.handle('toggle-always-on-top', (_, enable) => {
  isAlwaysOnTop = enable;
  saveConfig({ isAlwaysOnTop });
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(enable, enable ? 'screen-saver' : 'normal');
  }
  return isAlwaysOnTop;
});

ipcMain.handle('get-always-on-top', () => isAlwaysOnTop);

ipcMain.handle('set-startup', (_, enable) => { setStartup(enable); return enable; });
ipcMain.handle('get-startup', () => getStartup());

ipcMain.handle('save-prefs', (_, prefs) => saveConfig({ prefs }));
ipcMain.handle('load-prefs', () => loadConfig().prefs || {});

ipcMain.handle('close-app', () => app.quit());
ipcMain.handle('minimize-app', () => mainWindow?.minimize());

// ─── Window ───────────────────────────────────────────────────────
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const config = loadConfig();

  if (config.vaultPath && fs.existsSync(config.vaultPath)) vaultPath = config.vaultPath;
  if (config.isAlwaysOnTop !== undefined) isAlwaysOnTop = config.isAlwaysOnTop;

  const winW = config.winW || Math.min(960, width);
  const winH = config.winH || Math.min(740, height);
  const winX = config.winX !== undefined ? config.winX : width - winW - 20;
  const winY = config.winY !== undefined ? config.winY : 40;

  mainWindow = new BrowserWindow({
    width: winW, height: winH, x: winX, y: winY,
    transparent: true,
    frame: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    hasShadow: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isAlwaysOnTop) mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Save window bounds on move/resize
  mainWindow.on('resized', saveBounds);
  mainWindow.on('moved', saveBounds);
}

function saveBounds() {
  if (!mainWindow) return;
  const [x, y] = mainWindow.getPosition();
  const [w, h] = mainWindow.getSize();
  saveConfig({ winX: x, winY: y, winW: w, winH: h });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
