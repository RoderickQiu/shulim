const {app, BrowserWindow} = require('electron')

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 870,
        height: 300,
        show: false,
        maximizable: false,
        resizable: false,
        webPreferences: {}
    });

    mainWindow.setWindowButtonVisibility(true);

    mainWindow.loadFile('index.html');

    mainWindow.on("ready-to-show", () => {
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})
