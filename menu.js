const { Menu, BrowserWindow } = require('electron');

function createNewWindow() {
    let newWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    newWindow.loadFile('index.html');

    newWindow.on('closed', () => {
        newWindow = null;
    });
}

const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'New Window',
                accelerator: 'CmdOrCtrl+N',
                click() {
                    createNewWindow();
                }
            },
            { role: 'quit' }
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
