const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    traverse: (dir) => ipcRenderer.invoke("fs:traverse", {dir: dir})
})