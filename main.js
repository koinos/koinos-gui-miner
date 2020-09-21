const electron = require('electron');
const { app, ipcMain, BrowserWindow } = require("electron");
const { keystore, signing } = require('eth-lightwallet');
const fs = require('fs');
const KnsToken = JSON.parse(fs.readFileSync('./KnsToken.json', 'utf8'));
const path = require('path');
const Koinos = require('./assets/js/constants.js');
let Web3 = require('web3');
let Tx = require('ethereumjs-tx').Transaction;
let KoinosMiner = require('koinos-miner');
const { assert } = require("console");
let miner = null;
let ks = null;
let derivedKey = null;
let win = null;
let contract = null;
let web3 = null;

const configFile = path.join((electron.app || electron.remote.app).getPath('userData'), 'config.json');

let state = new Map([
  [Koinos.StateKey.MinerActivated, false],
  [Koinos.StateKey.KoinBalanceUpdate, 0],
  [Koinos.StateKey.EthBalanceUpdate, [0, 0]]
]);

let config = {
  ethAddress: "",
  developerTip: true,
  endpoint: "http://localhost:8545",
  proofFrequency: 60,
  proofPer: "day"
};

const KnsTokenAddress = '0x874de5a98b25093Be96BeD361232e6E326C9751C';
const OpenOrchardAddress = '0x672c3D283aEc2104918aC541a2b279c291CbD51f';
const KnsTokenMiningAddress = '0x536D49f3a0498A9E38FA3D90Df828Dc5BFc7c7F4';

function notify(event, args) {
  state.set(event, args);
  if (win !== null) {
    win.send(event, args);
  }
}

function readConfiguration() {
  if (fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  }

  openKeystore();

  return config;
}

function writeConfiguration() {
  fs.writeFileSync(configFile, JSON.stringify(config));
  saveKeystore();
}

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1200,
    height: 660,
    icon: path.join(__dirname, 'assets/icons/png/koinos-icon_512.png'),
    titleBarStyle: "hidden",
    resizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false
  });

  state.set(Koinos.StateKey.Configuration, readConfiguration());

  // and load the index.html of the app.
  win.loadFile("index.html");


  win.webContents.on('did-finish-load', function () {
    win.send(Koinos.StateKey.RestoreState, state);
  });

  win.once('ready-to-show', () => {
    win.show()
  });

  // Open the DevTools.
  //win.webContents.openDevTools();
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
  login = null;
})

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
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
  notify(Koinos.StateKey.HashrateReport, hashrate);
  notify(Koinos.StateKey.HashrateReportString, KoinosMiner.formatHashrate(hashrate));
}

function proofCallback(submission) {
  if (web3 !== null && contract !== null) {
    contract.methods.balanceOf(config.ethAddress).call({ from: config.ethAddress }, function (error, result) {
      notify(Koinos.StateKey.KoinBalanceUpdate, result);
    });

    web3.eth.getBalance(getAddresses()[0], function (err, result) {
      if (err) {
        notify(Koinos.StateKey.ErrorReport, err);
      } else {
        let lastEthBalance = state.get(Koinos.StateKey.EthBalanceUpdate)[0];
        let lastProofCost = state.get(Koinos.StateKey.EthBalanceUpdate)[1];
        if (lastEthBalance > 0 && lastEthBalance != result) {
          lastProofCost = lastEthBalance - result;
        }
        notify(Koinos.StateKey.EthBalanceUpdate, [result, lastProofCost]);
      }
    });
  }
}

function createPassword() {
  return 'password';
}

function enterPassword() {
  return 'password';
}

// Generate a new keystore
// seedPhrase is optional, but allows for recovery of private key
function openKeystore() {
  const keystorePath = path.join((electron.app || electron.remote.app).getPath('userData'), 'keystore.json');
  if (fs.existsSync(keystorePath)) {
    try {
      ks = keystore.deserialize(fs.readFileSync(keystorePath));
    } catch (error) { }
  }

  if (ks === null) {
    createKeystore();
  }
}

function createKeystore(seedPhrase) {
  let password = createPassword();

  if (!seedPhrase) {
    seedPhrase = keystore.generateRandomSeed();
    console.log(seedPhrase);
  }

  keystore.createVault({
    password: password,
    seedPhrase: seedPhrase,
    hdPathString: "m/44'/60'/0'/0"
  }, function (err, vault) {
    if (err) throw err;
    ks = vault;

    ks.keyFromPassword(password, function (err, pwDerivedKey) {
      if (err) throw err;
      ks.generateNewAddress(pwDerivedKey, 1);
      console.log(getAddresses()[0]);
    });
  });

  //return ks.getSeed(derivedKey);
}

function saveKeystore() {
  assert(ks !== null)
  const keystorePath = path.join((electron.app || electron.remote.app).getPath('userData'), 'keystore.json');
  fs.writeFileSync(keystorePath, ks.serialize());
}

function getAddresses() {
  assert(ks !== null)
  return ks.getAddresses();
}

async function signCallback(web3, txData) {
  assert(ks !== null && derivedKey !== null)
  txData.nonce = await web3.eth.getTransactionCount(
    txData.from
  );

  let rawTx = new Tx(txData);
  return signing.signTx(ks, derivedKey, rawTx.serialize(), txData.from);
}

async function exportKey() {
  assert(ks !== null)

  let privKey;
  ks.keyFromPassword(enterPassword(), function (err, pwDerivedKey) {
    if (err) throw err;
    privKey = ks.exportPrivateKey(ks.getAddresses()[0], pwDerivedKey);
  });

  return privKey;
}

function stopMiner() {
  if (miner !== null) {
    miner.stop();
  }

  web3 = null;
  miner = null;
  contract = null;
  derivedKey = null;
  state.set(Koinos.StateKey.MinerActivated, false);
}

ipcMain.handle(Koinos.StateKey.ToggleMiner, (event, ...args) => {
  try {
    if (ks === null) {
      openKeystore();
    }

    assert(ks !== null);

    if (!state.get(Koinos.StateKey.MinerActivated)) {
      config.ethAddress = args[0];
      config.endpoint = args[1];
      config.developerTip = args[2];
      config.proofFrequency = args[3];
      config.proofPer = args[4];

      ks.keyFromPassword(enterPassword(), function (err, pwDerivedKey) {
        if (err) throw err;
        assert(ks.isDerivedKeyCorrect(pwDerivedKey));
        derivedKey = pwDerivedKey;
      });
      console.log(getAddresses()[0]);
      web3 = new Web3(config.endpoint);
      contract = new web3.eth.Contract(KnsToken.abi, KnsTokenAddress, { from: config.ethAddress, gasPrice: '20000000000', gas: 6721975 });
      contract.methods.balanceOf(config.ethAddress).call({ from: config.ethAddress }, function (err, result) {
        if (err) {
          notify(Koinos.StateKey.ErrorReport, err);
        }
        else {
          notify(Koinos.StateKey.KoinBalanceUpdate, result);
        }
      });
      web3.eth.getBalance(getAddresses()[0], function (err, result) {
        if (err) {
          notify(Koinos.StateKey.ErrorReport, err);
        } else {
          notify(Koinos.StateKey.EthBalanceUpdate, [result, 0]);
        }
      });

      let proofPeriod = config.proofPer === "day" ? Koinos.TimeSpan.SecondsPerDay : Koinos.TimeSpan.SecondsPerWeek;
      proofPeriod /= config.proofFrequency;

      miner = new KoinosMiner(
        config.ethAddress,
        OpenOrchardAddress,
        getAddresses()[0],
        KnsTokenMiningAddress,
        config.endpoint,
        config.developerTip ? 5 : 0,
        proofPeriod,
        signCallback,
        hashrateCallback,
        proofCallback);
      miner.start();
      state.set(Koinos.StateKey.MinerActivated, true);
      writeConfiguration();
    }
    else {
      stopMiner();
    }

    notify(Koinos.StateKey.MinerActivated, state.get(Koinos.StateKey.MinerActivated));
  }
  catch (err) {
    stopMiner();
    notify(Koinos.StateKey.ErrorReport, err);
  }
});

ipcMain.handle(Koinos.StateKey.ManageKeys, (event, ...args) => {
  // create new window
  let keysWindow = new BrowserWindow({
    width: 900,
    height: 600,
    titleBarStyle: "hidden",
    resizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false
  })

  keysWindow.loadFile("components/manage-keys.html");
  keysWindow.once('ready-to-show', () => {
    keysWindow.show();
  });
})


