const { app, BrowserWindow } = require("electron")
const { ipcMain } = require('electron');
const fs = require('fs');
const KnsToken = JSON.parse(fs.readFileSync('./KnsToken.json', 'utf8'));
const path = require('path');
const KoinosState = require('./assets/js/notifications.js');
let Web3 = require('web3');
let KoinosMiner = require('koinos-miner');
let miner = null;
let win = null;
let contract = null;
let web3 = null;
let address = null;
let state = new Map([
  [KoinosState.MinerActivated, false],
  [KoinosState.KoinBalanceUpdate, 0]
]);

const KnsTokenAddress = '0x874de5a98b25093Be96BeD361232e6E326C9751C';
const OpenOrchardAddress = '0xCd06f2eb4E5424f9681bA07CB3C7487FEc0341EC';
const KnsTokenMiningAddress = '0x536D49f3a0498A9E38FA3D90Df828Dc5BFc7c7F4';

function notify(event, args) {
  state.set(event, args);
  if (win !== null)
  {
    win.send(event, args);
  }
}

function readConfiguration() {
  const filename = "./config.json";
  let config = {
    ethAddress: "",
    developerTip: true
  };
  if (fs.existsSync(filename)) {
    config = JSON.parse(fs.readFileSync(filename, 'utf8'));
  }
  return config;
}

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
    show: false
  });

  // and load the index.html of the app.
  win.loadFile("index.html");

  win.webContents.on('did-finish-load', function() {
    console.log(state);
    win.send(KoinosState.RestoreState, state);
    win.show();
  });

  // Open the DevTools.
  win.webContents.openDevTools();
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
  notify(KoinosState.HashrateReport, hashrate);
  notify(KoinosState.HashrateReportString, KoinosMiner.formatHashrate(hashrate));
}

function proofCallback(submission) {
  if (web3 !== null && address !== null && contract !== null) {
    contract.methods.balanceOf(address).call({from: address}, function(error, result) {
      notify(KoinosState.KoinBalanceUpdate, result);
    });
  }
}

ipcMain.handle('toggle-miner', (event, ...args) => {
  try {
    if (!state.get(KoinosState.MinerActivated)) {
      var ethAddress = args[0];
      var endpoint = args[1];
      var tip = args[2];
      var proofPeriod = args[3];
      address = ethAddress;
      web3 = new Web3(endpoint);
      contract = new web3.eth.Contract(KnsToken.abi, KnsTokenAddress, {from: ethAddress, gasPrice:'20000000000', gas: 6721975});
      contract.methods.balanceOf(address).call({from: address}, function(error, result) {
        console.log(result);
        notify(KoinosState.KoinBalanceUpdate, result);
      });
      miner = new KoinosMiner(
        ethAddress,
        OpenOrchardAddress,
        KnsTokenMiningAddress,
        endpoint,
        tip,
        proofPeriod,
        hashrateCallback,
        proofCallback);
      miner.start();
      state.set(KoinosState.MinerActivated, true);
    }
    else {
      miner.stop();
      address = null;
      web3 = null;
      miner = null;
      contract = null;
      state.set(KoinosState.MinerActivated, false);
    }

    notify(KoinosState.MinerActivated, state.get(KoinosState.MinerActivated));
  }
  catch (err) {
    console.log(err.message);
  }
});

