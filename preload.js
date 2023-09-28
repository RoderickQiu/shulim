const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    traverse: (dir, maxSize) => ipcRenderer.invoke("fs:traverse",
        {dir: dir, maxSize: maxSize}),
    onUpdateProgress: (callback) => ipcRenderer.on('upd:updateProgress', callback)
})