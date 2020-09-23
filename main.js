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
var keyManagementWindow = null;

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
  proofPer: "day",
  gasMultiplier: 1,
  gasPriceLimit: 1000000000000
};

const KnsTokenAddress = '0x50294550A127570587a2d4871874E69D7F8115D5';
const OpenOrchardAddress = '0xC07d28f95FC1486088590a0667257b14d695a93b';
const KnsTokenMiningAddress = '0xD5dD4afc0f9611FBC86f710943a503c374567d00';

function notify(event, args) {
  state.set(event, args);
  if (win !== null) {
    win.send(event, args);
  }
}

function readConfiguration() {
  if (fs.existsSync(configFile)) {
    let userConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    let keys = Object.keys(userConfig);
    for (let i = 0; i < keys.length; i++) {
      config[keys[i]] = userConfig[keys[i]];
    }
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

function updateTokenBalance() {
   if (web3 === null || contract === null)
      return;

   contract.methods.balanceOf(config.ethAddress).call({}, function(err, result) {
      if (err) {
         let error = {
            kMessage: "There was a problem retrieving the KOIN balance.",
            error: err
         };
         console.log(err);
         notify(Koinos.StateKey.ErrorReport, error);
      }
      else {
         notify(Koinos.StateKey.KoinBalanceUpdate, result);
      }
   });
}

function proofCallback(submission) {
  if (web3 !== null && contract !== null) {
    updateTokenBalance();

    web3.eth.getBalance(getAddresses()[0], function (err, result) {
      if (err) {
        let error = {
          kMessage: "Could not retrieve remaining Ether balance from the sender address.",
          exception: err
        }
        notify(Koinos.StateKey.ErrorReport, error);
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

function errorCallback(error) {
  notify(Koinos.StateKey.ErrorReport, error);
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
      } catch (err) {
        let error = {
          kMessage: "There was a problem deserializing the keystore.",
          error: err
        };
        notify(Koinos.StateKey.ErrorReport, error);
      }
   }
}

function createKeystore(password, seedPhrase) {
   if (!seedPhrase) {
      seedPhrase = keystore.generateRandomSeed();
   }

   keystore.createVault({
      password: password,
      seedPhrase: seedPhrase,
      hdPathString: "m/44'/60'/0'/0"
   }, function (err, vault) {
      if (err) {
        let error = {
          kMessage: "There was a problem creating the keystore.",
          error: err
        };
        notify(Koinos.StateKey.ErrorReport, error);
      }
      else {
         ks = vault;

         ks.keyFromPassword(password, function (err, pwDerivedKey) {
            if (err) {
             let error = {
               kMessage: "There was a problem unlocking the keystore.",
               error: err
             };
             notify(Koinos.StateKey.ErrorReport, error);
            }
            else {
               ks.generateNewAddress(pwDerivedKey, 1);
               console.log(getAddresses()[0]);
               saveKeystore();
            }
      });
      }
   });

  return seedPhrase;
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
   return '0x' + signing.signTx(ks, derivedKey, rawTx.serialize(), txData.from);
}

function exportKey(password, callback) {
  assert(ks !== null)

  let privKey;
  ks.keyFromPassword(password, callback);
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
   notify(Koinos.StateKey.MinerActivated, state.get(Koinos.StateKey.MinerActivated));
}

ipcMain.handle(Koinos.StateKey.StopMiner, (event, ...args) => {
  stopMiner();
});

ipcMain.handle(Koinos.StateKey.ToggleMiner, async (event, ...args) => {
  try {
    if (ks === null) {
      errorCallback({kMessage: "No signing key detected. Please open Key Management"});
      return;
      //openKeystore();
    }

    if (!state.get(Koinos.StateKey.MinerActivated)) {
      config.ethAddress = args[0];
      config.endpoint = args[1];
      config.developerTip = args[2];
      config.proofFrequency = args[3];
      config.proofPer = args[4];

      ks.keyFromPassword(enterPassword(), function (err, pwDerivedKey) {
         if (err) {
          let error = {
            kMessage: "There was a problem unlocking the keystore.",
            error: err
          };
          notify(Koinos.StateKey.ErrorReport, error);
         }
         assert (ks.isDerivedKeyCorrect(pwDerivedKey));
         derivedKey = pwDerivedKey;
      });
      web3 = new Web3(config.endpoint);

      try {
        await web3.eth.net.isListening();
      }
      catch(e) {
        notify(Koinos.StateKey.ErrorReport, {
          kMessage: "The provided Ethereum endpoint is not valid.",
          exception: e
        });
        return;
      }

      contract = new web3.eth.Contract(KnsToken.abi, KnsTokenAddress);
      updateTokenBalance();
      web3.eth.getBalance(getAddresses()[0], function(err, result) {
        if (err) {
          let error = {
            kMessage: "There was a problem retrieving the Ether balance.",
            error: err
          };
          notify(Koinos.StateKey.ErrorReport, error);
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
        config.gasMultiplier,
        config.gasPriceLimit,
        signCallback,
        hashrateCallback,
        proofCallback,
        errorCallback);
      miner.start();
      state.set(Koinos.StateKey.MinerActivated, true);
      writeConfiguration();
      notify(Koinos.StateKey.MinerActivated, state.get(Koinos.StateKey.MinerActivated));
    }
    else {
      stopMiner();
    }
  }
  catch (err) {
    stopMiner();
    notify(Koinos.StateKey.ErrorReport, err);
  }
});

ipcMain.handle(Koinos.StateKey.GenerateKeys, (event, args) => {
  if (keyManagementWindow !== null) {
    let seedPhrase = createKeystore(args, null);
    keyManagementWindow.send(Koinos.StateKey.SeedPhrase, seedPhrase);
  }
});

ipcMain.handle(Koinos.StateKey.ManageKeys, (event, ...args) => {
  if (keyManagementWindow !== null) {
    keyManagementWindow.close();
    keyManagementWindow = null;
  }
  else {
    keyManagementWindow = new BrowserWindow({
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

    keyManagementWindow.on('close', function() {
      keyManagementWindow = null;
    });

    if (ks !== null) {
      keyManagementWindow.loadFile("components/manage-keys.html");
    }
    else {
      keyManagementWindow.loadFile("components/generate-keys.html");
    }

    keyManagementWindow.once('ready-to-show', () => {
      if (ks !== null ) {
        keyManagementWindow.send(Koinos.StateKey.SigningAddress, getAddresses()[0]);
      }
      keyManagementWindow.show();
    });
  }
});

ipcMain.handle(Koinos.StateKey.PasswordModal, (event, ...args) => {
  // create new window
  let passwordModalWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    titleBarStyle: "hidden",
    resizable: false,
    maximizable: false,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false
  })

  passwordModalWindow.loadFile("components/password-modal.html");
  passwordModalWindow.once('ready-to-show', () => {
    passwordModalWindow.show();
  });
});

ipcMain.handle(Koinos.StateKey.ExportKey, (event, arg) => {
  exportKey(arg, function (err, pwDerivedKey) {
    if (err) {
      let error = {
        kMessage: "There was a problem unlocking the keystore.",
        error: err
      };

      if (keyManagementWindow !== null) {
        keyManagementWindow.close();
        keyManagementWindow = null;
      }

      console.log(err);
      notify(Koinos.StateKey.ErrorReport, error);
    }
    else {
      if (ks.isDerivedKeyCorrect(pwDerivedKey)) {
        let key = ks.exportPrivateKey(ks.getAddresses()[0], pwDerivedKey);
        keyManagementWindow.send(Koinos.StateKey.PrivateKey, ks.exportPrivateKey(ks.getAddresses()[0], pwDerivedKey));
      }
      else {
         keyManagementWindow.send(Koinos.StateKey.ExportKeyError, "Password is incorrect.");
      }
    }
  });
});
