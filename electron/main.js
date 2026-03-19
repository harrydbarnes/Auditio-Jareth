const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const serve = require('electron-serve');

const port = 3000;
const dev = false;
const dir = path.join(__dirname, '..');

const nextApp = next({ dev, dir });
const handle = nextApp.getRequestHandler();

const loadURL = serve({ directory: path.join(__dirname, '../out') });

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
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.svg'),
    title: 'Jareth',
    autoHideMenuBar: true,
  });

  if (app.isPackaged) {
    loadURL(mainWindow);
  } else {
    mainWindow.loadURL(`http://localhost:${port}`);
  }

  // Open external links in the default browser rather than Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  ipcMain.handle('llm-request', async (event, args) => {
    try {
      const { provider, model, prompt, apiKey } = args;

      if (!apiKey) {
        return { error: `API key for ${provider} is missing.` };
      }

      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return { text: data.choices[0].message.content };
      } else if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return { text: data.content[0].text };
      }

      return { error: 'Invalid provider' };
    } catch (error) {
      return { error: error.message || 'An error occurred' };
    }
  });

  if (app.isPackaged) {
    createWindow();
  } else {
    nextApp.prepare().then(() => {
      createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      }).listen(port, '127.0.0.1', () => {
        console.log(`> Ready on http://localhost:${port}`);
        createWindow();
      });
    });
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
