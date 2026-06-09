const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectVault:       ()  => ipcRenderer.invoke('select-vault'),
  getVaultPath:      ()  => ipcRenderer.invoke('get-vault-path'),
  loadGraph:         ()  => ipcRenderer.invoke('load-graph'),
  readNote:          (id)=> ipcRenderer.invoke('read-note', id),
  openInObsidian:    (id)=> ipcRenderer.invoke('open-in-obsidian', id),
  openInExplorer:    (id)=> ipcRenderer.invoke('open-in-explorer', id),
  toggleAlwaysOnTop: (v) => ipcRenderer.invoke('toggle-always-on-top', v),
  getAlwaysOnTop:    ()  => ipcRenderer.invoke('get-always-on-top'),
  setStartup:        (v) => ipcRenderer.invoke('set-startup', v),
  getStartup:        ()  => ipcRenderer.invoke('get-startup'),
  savePrefs:         (p) => ipcRenderer.invoke('save-prefs', p),
  loadPrefs:         ()  => ipcRenderer.invoke('load-prefs'),
  closeApp:          ()  => ipcRenderer.invoke('close-app'),
  minimizeApp:       ()  => ipcRenderer.invoke('minimize-app'),
});
