const { app, BrowserWindow, ipcMain, Menu } = require('electron')

const path = require('path')
const isDev = require('electron-is-dev')
const process = require('process')
const fs = require('fs')

const protocolRegex = /^(https?|mailto):/i;
function openExternalLink(link) {
  let u;
  
  try {
      u = url.parse(link);
  } catch (e) {
      return;
  }

  if (protocolRegex.test(u.protocol)) {
      shell.openExternal(link);
  }
}

require('@electron/remote/main').initialize()
const { 
  initPopupsConfigurationMain,
  getPopupTarget,
  RemoteControlMain,
  setupAlwaysOnTopMain,
  setupPowerMonitorMain,
  setupScreenSharingMain 
} = require("@jitsi/electron-sdk");

const windowStateKeeper = require('electron-window-state');
const URL = require('url');
const { url } = require('inspector')

let config = {
  appName: 'Jitsi Meet',
  appProtocolPrefix: 'jitsi-meet',
  defaultServerURL: 'https://meet.jit.si'
}

let mainWindow = null;

let webrtcInternalsWindow = null;

const appProtocolSurplus = `${config.appProtocolPrefix}://`;
let rendererReady = false;
let protocolDataForFrontApp = null;

function createJitsiMeetWindow() {
  const windowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600,
  })

  const basePath = isDev ? __dirname : app.getAppPath();

  const indexURL = URL.format({
    pathname: path.resolve(basePath, './build/index.html'),
    protocol: 'file:',
    slashes: true
  })
  
  const options = {
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    icon: path.resolve('./public/favicon.ico'),
    minWidth: 800,
    minHeight: 600,

    show: false,
    webPreferences: {
        enableBlinkFeatures: 'WebAssemblyCSP',
        nodeIntegration: false,
        preload: path.resolve('./preload.js')
    }
  };

  mainWindow = new BrowserWindow(options);
  windowState.manage(mainWindow);
  mainWindow.loadURL(indexURL);

  initPopupsConfigurationMain(mainWindow);
    setupAlwaysOnTopMain(mainWindow);
    setupPowerMonitorMain(mainWindow);
    setupScreenSharingMain(mainWindow, config.appName, "org.jitsi.jitsi-meet");

  mainWindow.webContents.on('new-window', (event, url, frameName) => {
    const target = getPopupTarget(url, frameName)

    if(!target || target === 'browser') {
      event.preventDefault();
      openExternalLink(url);
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.once('ready-to-show', () => {
      mainWindow.show();
  });

  handleProtocolCall(process.argv.pop());
}

function createWebRTCInternalsWindow() {
  const options = {
      minWidth: 800,
      minHeight: 600,
      show: true
  };

  webrtcInternalsWindow = new BrowserWindow(options);
  webrtcInternalsWindow.loadURL('chrome://webrtc-internals');
}

function handleProtocolCall(fullProtocolCall) {
  // don't touch when something is bad
  if (
      !fullProtocolCall
      || fullProtocolCall.trim() === ''
      || fullProtocolCall.indexOf(appProtocolSurplus) !== 0
  ) {
      return;
  }

  const inputURL = fullProtocolCall.replace(appProtocolSurplus, '');

  if (app.isReady() && mainWindow === null) {
      createJitsiMeetWindow();
  }

  protocolDataForFrontApp = inputURL;

  if (rendererReady) {
      mainWindow
          .webContents
          .send('protocol-data-msg', inputURL);
  }
}

const gotInstanceLock = process.platform === 'darwin' ? true : app.requestSingleInstanceLock();

if (!gotInstanceLock) {
  app.quit();
  process.exit(0);
}

app.on('activate', () => {
  if (mainWindow === null) {
      createJitsiMeetWindow();
  }
});

app.on('certificate-error',
  // eslint-disable-next-line max-params
  (event, webContents, url, error, certificate, callback) => {
      if (isDev) {
          event.preventDefault();
          callback(true);
      } else {
          callback(false);
      }
  }
);

app.on('ready', createJitsiMeetWindow);

if (isDev) {
  app.on('ready', createWebRTCInternalsWindow);
}

app.on('second-instance', (event, commandLine) => {
  /**
   * If someone creates second instance of the application, set focus on
   * existing window.
   */
  if (mainWindow) {
      mainWindow.isMinimized() && mainWindow.restore();
      mainWindow.focus();

      /**
       * This is for windows [win32]
       * so when someone tries to enter something like jitsi-meet://test
       * while app is opened it will trigger protocol handler.
       */
      handleProtocolCall(commandLine.pop());
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

// remove so we can register each time as we run the app.
app.removeAsDefaultProtocolClient(config.appProtocolPrefix);

// If we are running a non-packaged version of the app && on windows
if (isDev && process.platform === 'win32') {
  // Set the path of electron.exe and your app.
  // These two additional parameters are only available on windows.
  app.setAsDefaultProtocolClient(
      config.appProtocolPrefix,
      process.execPath,
      [ path.resolve(process.argv[1]) ]
  );
} else {
  app.setAsDefaultProtocolClient(config.appProtocolPrefix);
}

/**
* This is for mac [darwin]
* so when someone tries to enter something like jitsi-meet://test
* it will trigger this event below
*/
app.on('open-url', (event, data) => {
  event.preventDefault();
  handleProtocolCall(data);
});

/**
* This is to notify main.js [this] that front app is ready to receive messages.
*/
ipcMain.on('renderer-ready', () => {
  rendererReady = true;
  if (protocolDataForFrontApp) {
      mainWindow
          .webContents
          .send('protocol-data-msg', protocolDataForFrontApp);
  }
});