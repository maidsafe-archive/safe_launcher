var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var kill = require('killprocess');

let mainWindow = null;

const appWidth = 750 + (process.platform === 'win32' ? 20 : 0);
const appHeight = 560 + (process.platform === 'win32' ? 30 : 0);

global.proxy = {
  pid: null
};

require('electron-debug')(); // eslint-disable-line global-require

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', function () {
  if (global.proxy.pid) {
    kill(global.proxy.pid);
  }
});

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    show: false,
    width: appWidth,
    resizable: false,
    height: appHeight,
  });

  global.networkState = 0;
  mainWindow.loadURL(`file://${__dirname}/app.html`);

  mainWindow.webContents.on('did-finish-load', function () {
    mainWindow.show();
    // mainWindow.focus();
  });
  // mainWindow.openDevTools();
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
});

