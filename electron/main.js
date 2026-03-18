const { app, BrowserWindow, shell } = require('electron');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const port = 3000;
const dev = false;
const dir = path.join(__dirname, '..');

const nextApp = next({ dev, dir });
const handle = nextApp.getRequestHandler();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/icon.svg'),
    title: 'Jareth',
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://localhost:${port}`);

  // Open external links in the default browser rather than Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

nextApp.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, '127.0.0.1', () => {
    console.log(`> Ready on http://localhost:${port}`);
    app.whenReady().then(createWindow);
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
