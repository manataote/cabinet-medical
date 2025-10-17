const { contextBridge } = require('electron');

// Exposer des APIs protégées au renderer process
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  version: process.versions.electron,
  isElectron: true
});

console.log('Preload script chargé avec succès');
