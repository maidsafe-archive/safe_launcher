// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import env from './env';
import { app, BrowserWindow } from 'electron';
import devHelper from './vendor/electron_boilerplate/dev_helper';

var mainWindow;

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    'width': 390,
    'height': 446,
    'resizable': false
  });
  mainWindow.loadURL('file://' + __dirname + '/app.html');

  if (env.name !== 'production') {
    devHelper.setDevMenu();
    mainWindow.openDevTools();
  }
  //
  // mainWindow.on('blur', function(d) {
  //   if (env.name !== 'production') {
  //     return;
  //   }
  //   mainWindow.minimize();
  // });
});

app.on('window-all-closed', function() {
  app.quit();
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
