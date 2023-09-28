const {app, BrowserWindow, dialog, ipcMain} = require('electron')
const path = require('node:path')
const fs = require("fs");

async function handleFileOpen() {
    const {canceled, filePaths} = await dialog.showOpenDialog({
        filters: [
            {name: 'All Files', extensions: ['*']}
        ],
        properties: ['openDirectory', 'openFile']
    })
    if (!canceled) {
        return filePaths[0]
    }
}


let dirs = [];

function traverseDirectory(directory) {
    // 读取目录中的所有文件和子目录
    const files = fs.readdirSync(directory);

    files.forEach(file => {
        const filePath = path.join(directory, file);
        const fileStat = fs.statSync(filePath);

        if (fileStat.isFile()) {
            // 检查文件扩展名是否为jpg、jpeg或png
            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
                console.log(filePath); // 在这里可以处理文件路径
                dirs.push(filePath);
            }
        } else if (fileStat.isDirectory()) {
            // 递归遍历子目录
            traverseDirectory(filePath);
        }
    });
}


const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 870,
        height: 300,
        show: false,
        maximizable: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.setWindowButtonVisibility(true);

    mainWindow.loadFile('index.html');

    mainWindow.on("ready-to-show", () => {
        mainWindow.show();
    })
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });

    ipcMain.handle('dialog:openFile', handleFileOpen);
    ipcMain.handle('fs:traverse', (event, args) => {
        traverseDirectory(args.dir);
        return dirs;
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
