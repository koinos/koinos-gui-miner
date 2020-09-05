const { app, BrowserWindow } = require("electron")
const { ipcMain } = require('electron');
let KoinosMiner = require('koinos-miner');
const path = require('path');
let miner = null;
let win = null;


function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1200,
    height: 600,
    icon: path.join(__dirname, 'assets/icons/png/koinos-icon_512.png'),
    titleBarStyle: "hidden",
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
  })

  // and load the index.html of the app.
  win.loadFile("index.html")

  // Open the DevTools.
  win.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
  win = null;
})

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  if (miner !== null) {
    miner.stop();
    miner = null;
  }
  process.kill(0);
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function hashrateCallback(hashrate) {
  win.send('hashrate-report', hashrate);
  win.send('hashrate-report-string', KoinosMiner.formatHashrate(hashrate));
}

ipcMain.handle('toggle-miner', (event, ...args) => {
  try {
    if (miner === null) {
      var ethAddress = args[0];
      var ooAddress = args[1];
      var contract = args[2];
      var endpoint = args[3];
      var tip = args[4];
      var proofPeriod = args[5];
      miner = new KoinosMiner(ethAddress, ooAddress, contract, endpoint, tip, proofPeriod, hashrateCallback);
      miner.start();
      win.send('miner-activated', true);
    }
    else {
      miner.stop();
      miner = null;
      win.send('miner-activated', false);
    }
  }
  catch (err) {
    console.log(err.message);
  }
});

