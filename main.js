const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process'); 
require('./menu');

let mainWindow;
let collabServerProcess;
let currentFilename = "Untitled Document.html";

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startCollabServer() {
    collabServerProcess = spawn('node', ['collab-server.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    collabServerProcess.on('exit', () => {});
    collabServerProcess.on('error', () => {});
}

function stopCollabServer() {
    if (collabServerProcess) {
        collabServerProcess.kill();
        if (process.platform === 'win32') {
            exec("taskkill /F /IM node.exe", () => {});
        }
        collabServerProcess = null;
    }
}

app.whenReady().then(() => {
    startCollabServer();
    createWindow();
});

app.on('window-all-closed', () => {
    stopCollabServer();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('quit', () => {
    stopCollabServer();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ✅ Load saved document
ipcMain.handle('load-document', async () => {
    try {
        if (fs.existsSync(path.join(__dirname, currentFilename))) {
            return fs.readFileSync(path.join(__dirname, currentFilename), 'utf8');
        }
    } catch (err) {}
    return "";
});

// ✅ Autosave document with title renaming
ipcMain.on('autosave-document', (event, content, title) => {
    const sanitizedTitle = title.trim() || "Untitled Document";
    const newFilename = sanitizedTitle + ".html";
    const newPath = path.join(__dirname, newFilename);
    const oldPath = path.join(__dirname, currentFilename);

    // If the filename changed, rename the existing file
    if (currentFilename !== newFilename && fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
    }

    // Save under the new filename
    fs.writeFileSync(newPath, content);
    currentFilename = newFilename;
});
