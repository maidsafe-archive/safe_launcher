// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import env from './env';
import kill from 'killprocess';
import { app, BrowserWindow, remote } from 'electron';
import { setAppMenu } from './vendor/electron_boilerplate/menu_helper';

const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

var mainWindow;

global.cleanUp = {
  proxy: null
};

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    'width': 750  + (process.platform === 'win32' ? 20 : 0),
    'height': 550 + (process.platform === 'win32' ? 30 : 0),
    'resizable': false,
    'icon': __dirname + '/images/app_icon.png',
    'show': false
  });
  mainWindow.loadURL('file://' + __dirname + '/app.html');
  mainWindow.webContents.on('did-finish-load', function() {
    setTimeout(function() {
      mainWindow.show();
    }, 40);
  });

  if (env.name !== 'production') {
    setAppMenu(false);
    mainWindow.openDevTools();
  } else {
    setAppMenu(false);
  }

  mainWindow.setMenuBarVisibility(false);
});

app.on('window-all-closed', function() {
  app.quit();
});

app.on('before-quit', function() {
  if (global.cleanUp.proxy) {
    kill(global.cleanUp.proxy);
  }
});

let shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
  return true;
});

if (shouldQuit) {
  app.quit();
}

process.on('uncaughtException', function(e) {
  console.log(e);
});

for (var i in process.argv) {
  console.log(process.argv[i]);
  if (process.argv[i] === '--proxy_unsafe_mode') {
    global.proxyUnsafeMode = true;
    break;
  }
}
