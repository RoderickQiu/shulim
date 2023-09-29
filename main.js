const {app, BrowserWindow, dialog, ipcMain} = require('electron')
const path = require('node:path')
const fs = require("fs");
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminMozJpeg = require('imagemin-mozjpeg');
const log = require('electron-log');

async function handleFileOpen() {
    const {canceled, filePaths} = await dialog.showOpenDialog({
        filters: [
            {name: 'Images', extensions: ['jpg', 'png', 'jpeg']}
        ],
        properties: ['openDirectory', 'openFile']
    })
    if (!canceled) {
        return filePaths[0]
    }
}

function traverseDirectory(directory) {
    const queue = [directory]; // 使用队列存储待遍历的目录
    const dirs = []; // 存储文件路径

    while (queue.length > 0) {
        const currentDir = queue.shift(); // 从队列中取出当前目录

        const files = fs.readdirSync(currentDir); // 读取当前目录中的所有文件和子目录

        files.forEach(file => {
            const filePath = path.join(currentDir, file);
            const fileStat = fs.statSync(filePath);

            if (fileStat.isFile()) {
                // 检查文件扩展名是否为jpg、jpeg或png
                const ext = path.extname(filePath).toLowerCase();
                if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
                    print(filePath); // 在这里可以处理文件路径
                    dirs.push(filePath);
                }
            } else if (fileStat.isDirectory()) {
                // 将子目录加入队列，以便后续遍历
                queue.push(filePath);
            }
        });
    }

    return dirs; // 返回文件路径数组
}

async function compress(filePath, maxSize) {
    if (maxSize.length === 0 || isNaN(Number(maxSize))) return null;
    try {
        let curBuffer, cnt = 0;
        const oriBuffer = await fs.promises.readFile(filePath);
        print("Ori-Buffer " + oriBuffer.byteLength);
        curBuffer = await oriBuffer;
        while (curBuffer.byteLength > maxSize * 1024 * 1024) {
            curBuffer = await imagemin.buffer(oriBuffer, {
                plugins: [
                    imageminMozJpeg({
                        quality: 80 - cnt * 5
                    }),
                    imageminPngquant({
                        quality: [0.64 - cnt * 0.05, 0.84 - cnt * 0.05]
                    })
                ]
            })
            cnt++;
        }
        return curBuffer;
    } catch (error) {
        err('Error compressing images outside:', error);
        return null;
    }
}

let mainWindow = null;
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 870,
        height: 300,
        show: false,
        maximizable: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    if (process.platform === "darwin")
        mainWindow.setWindowButtonVisibility(true);

    mainWindow.loadFile('index.html');

    mainWindow.on("ready-to-show", () => {
        mainWindow.show();
    })
}

function getTimeMark() {
    let date = new Date();
    return date.getDate() + '-' + date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });

    ipcMain.handle('dialog:openFile', handleFileOpen);
    ipcMain.handle('fs:traverse', async (event, args) => {
        let lowered = args.dir.toLowerCase();
        let timestamp = getTimeMark();
        if (lowered.indexOf(".jpg") === -1 && lowered.indexOf(".jpeg") === -1 && lowered.indexOf(".png") === -1) {
            let arr = traverseDirectory(args.dir);
            if (mainWindow != null)
                mainWindow.webContents.send("upd:updateProgress", {cur: 0, all: arr.length});
            for (let i = 0; i < arr.length; i++) {
                let compressed = await compress(arr[i], args.maxSize);
                if (compressed != null) {
                    const directory = path.dirname(arr[i].replace(args.dir, args.dir + "-" + timestamp));
                    if (!fs.existsSync(directory)) {
                        fs.mkdirSync(directory, {recursive: true});
                    }
                    fs.writeFile(arr[i].replace(args.dir, args.dir + "-" + timestamp), compressed, (error) => {
                        if (error) {
                            err('Error exporting buffer to file:', error);
                        }
                    });
                }
                if (mainWindow != null)
                    mainWindow.webContents.send("upd:updateProgress", {cur: i + 1, all: arr.length});
            }
            return args.dir.replaceAll(args.dir, args.dir + "-" + timestamp);
        } else {
            let compressed = await compress(args.dir, args.maxSize);
            if (compressed == null) return null;
            else {
                const directory = path.dirname(args.dir);
                const extName = path.extname(args.dir);
                const fileName = path.basename(args.dir).replace(extName, "");
                if (!fs.existsSync(directory)) {
                    fs.mkdirSync(directory, {recursive: true});
                }
                fs.writeFile(directory + '/' + fileName + '-' + timestamp + extName,
                    compressed, (error) => {
                        if (error) {
                            err('Error exporting buffer to file:', error);
                        }
                    });
                if (mainWindow != null)
                    mainWindow.webContents.send("upd:updateProgress", {cur: 1, all: 1});
                return directory + '/' + fileName + '-' + timestamp + extName;
            }
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

function print(obj) {
    log.log(obj);
}

function err(obj) {
    log.error(obj);
}