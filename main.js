const electron = require('electron');
const { app, ipcMain, BrowserWindow } = require("electron");
const { keystore, signing } = require('eth-lightwallet');
const fs = require('fs');
const KnsToken = JSON.parse(fs.readFileSync('./KnsToken.json', 'utf8'));
const path = require('path');
const KoinosNotifications = require('./assets/js/notifications.js');
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
let address = null;

const configFile = './config.json';

let state = new Map([
  [KoinosNotifications.MinerActivated, false],
  [KoinosNotifications.KoinBalanceUpdate, 0]
]);

let config = {
  ethAddress: "",
  developerTip: true,
  endpoint: "http://localhost:8545",
  proofPeriod: 60
};

const KnsTokenAddress = '0xb09672ad9faAD450D7A50ABEF772F8B8EA38f8d4';
const OpenOrchardAddress = '0xCd06f2eb4E5424f9681bA07CB3C7487FEc0341EC';
const KnsTokenMiningAddress = '0xc4e86fB87ddBC4e397cE6B066e16640F433d3592';

function notify(event, args) {
  state.set(event, args);
  if (win !== null)
  {
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
    height: 600,
    icon: path.join(__dirname, 'assets/icons/png/koinos-icon_512.png'),
    titleBarStyle: "hidden",
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false
  });

  state.set('koinos-config', readConfiguration());

  // and load the index.html of the app.
  win.loadFile("index.html");

  win.webContents.on('did-finish-load', function() {
    win.send(KoinosNotifications.RestoreState, state);
    win.show();
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
  notify(KoinosNotifications.HashrateReport, hashrate);
  notify(KoinosNotifications.HashrateReportString, KoinosMiner.formatHashrate(hashrate));
}

function proofCallback(submission) {
  if (web3 !== null && address !== null && contract !== null) {
    contract.methods.balanceOf(address).call({from: address}, function(error, result) {
      notify(KoinosNotifications.KoinBalanceUpdate, result);
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
      } catch (error) {}
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
   assert (ks !== null)
   const keystorePath = path.join((electron.app || electron.remote.app).getPath('userData'), 'keystore.json');
   fs.writeFileSync(keystorePath, ks.serialize());
}

function getAddresses() {
   assert (ks !== null)
   return ks.getAddresses();
}

async function signCallback(web3, txData) {
   assert (ks !== null && derivedKey !== null)
   txData.nonce = await web3.eth.getTransactionCount(
      txData.from
   );

   let rawTx = new Tx(txData);
   return signing.signTx(ks, derivedKey, rawTx.serialize(), txData.from);
}

async function exportKey() {
   assert (ks !== null)

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

   address = null;
   web3 = null;
   miner = null;
   contract = null;
   derivedKey = null;
   state.set(KoinosNotifications.MinerActivated, false);
}

ipcMain.handle('toggle-miner', (event, ...args) => {
  try {
    if (ks === null ) {
       openKeystore();
    }

    assert (ks !== null);

    if (!state.get(KoinosNotifications.MinerActivated)) {
      config.ethAddress = args[0];
      config.endpoint = args[1];
      config.developerTip = args[2];
      config.proofPeriod = args[3];

      ks.keyFromPassword(enterPassword(), function (err, pwDerivedKey) {
         if (err) throw err;
         assert (ks.isDerivedKeyCorrect(pwDerivedKey));
         derivedKey = pwDerivedKey;
      });

      address = config.ethAddress;
      web3 = new Web3(config.endpoint);
      contract = new web3.eth.Contract(KnsToken.abi, KnsTokenAddress, {from: config.ethAddress, gasPrice:'20000000000', gas: 6721975});
      contract.methods.balanceOf(address).call({from: address}, function(error, result) {
        notify(KoinosNotifications.KoinBalanceUpdate, result);
      });
      miner = new KoinosMiner(
        config.ethAddress,
        OpenOrchardAddress,
        getAddresses()[0],
        KnsTokenMiningAddress,
        config.endpoint,
        config.developerTip,
        config.proofPeriod,
        signCallback,
        hashrateCallback,
        proofCallback);
      miner.start();
      state.set(KoinosNotifications.MinerActivated, true);
      writeConfiguration();
    }
    else {
      stopMiner();
    }

    notify(KoinosNotifications.MinerActivated, state.get(KoinosNotifications.MinerActivated));
  }
  catch (err) {
    stopMiner();
    console.log(err.message);
  }
});
