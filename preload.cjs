const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('a2s', Object.freeze({
  setNativeTheme: (theme) => ipcRenderer.invoke('a2s:set-native-theme', theme),
  getNativeTheme: () => ipcRenderer.invoke('a2s:get-native-theme'),
  getState: () => ipcRenderer.invoke('a2s:get-state'),
  saveConfig: (patch) => ipcRenderer.invoke('a2s:save-config', patch),
  startAgent: (type) => ipcRenderer.invoke('a2s:start-agent', type),
  stopAgent: (type) => ipcRenderer.invoke('a2s:stop-agent', type),
  restartAgent: (type) => ipcRenderer.invoke('a2s:restart-agent', type),
  testServer: () => ipcRenderer.invoke('a2s:test-server'),
  copyKey: () => ipcRenderer.invoke('a2s:copy-key'),
  rotateKey: () => ipcRenderer.invoke('a2s:rotate-key'),
  plugins: (refresh = false) => ipcRenderer.invoke('a2s:plugins', refresh),
  installPlugin: (id) => ipcRenderer.invoke('a2s:install-plugin', id),
  installAllPlugins: () => ipcRenderer.invoke('a2s:install-all-plugins'),
  logs: (limit = 300) => ipcRenderer.invoke('a2s:logs', limit),
  probe: () => ipcRenderer.invoke('a2s:probe'),
  openPath: (path) => ipcRenderer.invoke('a2s:open-path', path),
  openExternal: (url) => ipcRenderer.invoke('a2s:open-external', url),
  onLog: (listener) => {
    const handler = (_event, item) => listener(item)
    ipcRenderer.on('a2s:log', handler)
    return () => ipcRenderer.removeListener('a2s:log', handler)
  },
  onStatus: (listener) => {
    const handler = (_event, item) => listener(item)
    ipcRenderer.on('a2s:status', handler)
    return () => ipcRenderer.removeListener('a2s:status', handler)
  },
}))
