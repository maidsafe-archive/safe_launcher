// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import { app, BrowserWindow } from 'electron';
import devHelper from './vendor/electron_boilerplate/dev_helper';
// import windowStateKeeper from './vendor/electron_boilerplate/window_state';

import env from './env';

var mainWindow;

// Preserver of the window size and position between app launches.
// var mainWindowState = windowStateKeeper('main', {
//   width: 1000,
//   height: 600
// });

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    'width': 360,
    'height': 500,
    'resizable': false,
    'frame': false
  });
  mainWindow.loadURL('file://' + __dirname + '/app.html');

  if (env.name !== 'production') {
    devHelper.setDevMenu();
    mainWindow.openDevTools();
  }

  mainWindow.on('blur', function(d) {
    if (env.name !== 'production') {
      return;
    }
    mainWindow.minimize();
  });

  // mainWindow.on('close', function() {
  //   // mainWindowState.saveState(mainWindow);
  // });
});

app.on('window-all-closed', function() {
  app.quit();
});
