const electron = require('electron');
const { app, ipcMain, BrowserWindow } = require("electron");
const { keystore, signing } = require('eth-lightwallet');
const fs = require('fs');
const path = require('path');
const KnsToken = JSON.parse(fs.readFileSync(path.join(__dirname, 'KnsToken.json'), 'utf8'));
const Koinos = require('./assets/js/constants.js');
let Web3 = require('web3');
let Tx = require('ethereumjs-tx').Transaction;
let KoinosMiner = require('koinos-miner');
let { Looper } = require("koinos-miner/looper.js");
const { assert } = require("console");
const { create } = require('domain');
let miner = null;
let userKeystore = null;
let derivedKey = null;
let mainWindow = null;
let tokenContract = null;
let web3 = null;
var keyManagementWindow = null;
let guiUpdateBlockchainMs = 30*1000;
let lastGasCost = 0;

const configFile = path.join((electron.app || electron.remote.app).getPath('userData'), 'config.json');
const keystoreFile = path.join((electron.app || electron.remote.app).getPath('userData'), 'keystore.json');

let state = new Map([
  [Koinos.StateKey.MinerActivated, false],
  [Koinos.StateKey.KoinBalanceUpdate, 0],
  [Koinos.StateKey.EthBalanceUpdate, [0, 0]],
  [Koinos.StateKey.HasKeystore, false],
  [Koinos.StateKey.Version, app.getVersion()]
]);

let config = {
  ethAddress: "",
  developerTip: true,
  endpoint: "http://localhost:8545",
  proofFrequency: 60,
  proofPer: "day",
  gasMultiplier: 1,
  gasPriceLimit: 1000000000000,
  tipPercent: 5,
  endpointTimeout: 3000
};

const KnsTokenAddress = '0xeD7904C3Df0b8c835A1700fb36663Bc877F0faF9';
const KnsTokenMiningAddress = '0xB49E92f04141546A5670538Be83235679C3C77aB';

const TipAddresses = [
  "0xC07d28f95FC1486088590a0667257b14d695a93b",
  "0x2C16aa54c987EE67F37CC3AFD017a5482eeDd158",
  "0xa15323D19F0d939cbC7D8B4f63D712102dd8E547",
  "0x30eB878c8B6D24dd2F0E548627605Bc8EeeEF4c8",
  "0x8e34e90eF9944392a784CFAe2FBA1cf2001383e0",
  "0x9bf587A46ab5F7c3CAc9Bb3DeE2137461Be6313C",
  "0x8F60700324F2d670B32b1bc441EF06a2B2955345",
  "0x26dbbb94C28A6F98FAE6f7c6317C871c06222cD6",
  "0x7B292D5bc1c5dA1eE4Fb58419294c34Acd7a3F12",
  "0x04eE64081676AE5cb8d0D30a3aBB3bc64d19DbD9",
  "0x2f5e17000E8b449BABE2E95127C996440360a10b",
  "0xDe807C12bd63696a1cdAd999066dC16E1d7a67Cb",
  "0x7859f4C9559BE6F8b26F51116c4eD7185B4634F0",
  "0xeF68ab59D293e843020F6275b142a6C7a2bc81dE",
  "0x6D179d47eAAD63cb75374C10b6390160A0b4db53",
  "0x9D8f0ed45dd05fFafA0607F2424B9163E37e9998",
  "0xAe871f0a0AC4595487E403308cE202f4B87aED30",
  "0xE4E041eb19191C6754E8F80c8C66b1C078058176",
  "0x7816F8c83aAed6dF618960B3954c62179C85549D",
  "0xB32613375c6Fc0be07433B751B75cd5B9FF04Db3"
];

function notify(event, args) {
  state.set(event, args);
  if (mainWindow !== null) {
    mainWindow.send(event, args);
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

  web3 = new Web3(config.endpoint);

  return config;
}

function writeConfiguration() {
  fs.writeFileSync(configFile, JSON.stringify(config));
  saveKeystore();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 660,
    icon: path.join(__dirname, process.platform === "win32" ? 'assets/icons/win/icon.ico' : 'assets/icons/png/64x64.png'),
    titleBarStyle: "hidden",
    resizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false
  });

  state.set(Koinos.StateKey.Configuration, readConfiguration());

  if (fs.existsSync(keystoreFile)) {
    state.set(Koinos.StateKey.HasKeystore, true);
  }

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  mainWindow.webContents.on('did-finish-load', function () {
    if (miner !== null) {
      state.set(Koinos.StateKey.ActivateCountdown, miner.getMiningStartTime());
    }
    else {
      state.set(Koinos.StateKey.ActivateCountdown, 0);
    }
    mainWindow.send(Koinos.StateKey.RestoreState, state);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
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
  mainWindow = null;
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
  // Should this call stopMiner() ?
  if (miner !== null) {
    miner.stop();
    miner = null;
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function hashrateCallback(hashrate) {
  notify(Koinos.StateKey.HashrateReport, hashrate);
  notify(Koinos.StateKey.HashrateReportString, KoinosMiner.formatHashrate(hashrate));
}

async function updateTokenBalance() {
   if (tokenContract === null)
      return;

   try {
      let result = await tokenContract.methods.balanceOf(config.ethAddress).call({});
      notify(Koinos.StateKey.KoinBalanceUpdate, result);
   }
   catch(err) {
      let error = {
         kMessage: "There was a problem retrieving the KOIN balance.",
         error: err
      };
      notify(Koinos.StateKey.ErrorReport, error);
   }
}

async function updateEtherBalance() {
   if (getAddresses()[0] === null)
      return;

   try {
      let result = await web3.eth.getBalance(getAddresses()[0]);
      notify(Koinos.StateKey.EthBalanceUpdate, [result, lastGasCost]);
   }
   catch(err) {
      let error = {
        kMessage: "There was a problem retrieving the Ether balance.",
        error: err
      };
      notify(Koinos.StateKey.ErrorReport, error);
   }
}

async function guiUpdateBlockchain() {
   await updateTokenBalance();
   await updateEtherBalance();
}

function guiUpdateBlockchainError(e) {
   let error = {
      kMessage: "Could not update the blockchain.",
      exception: e
      };
   console.log( "[JS] Exception in guiUpdateBlockchainLoop():", e);
   notify(Koinos.StateKey.ErrorReport, error);
}

function proofCallback(receipt, gasPrice) {
  if (tokenContract !== null) {
    updateTokenBalance();

    web3.eth.getBalance(getAddresses()[0], function (err, result) {
      if (err) {
        let error = {
          kMessage: "Could not retrieve remaining Ether balance from the sender address.",
          exception: err
        };
        notify(Koinos.StateKey.ErrorReport, error);
      } else {
        lastGasCost = receipt.gasUsed * gasPrice;
        notify(Koinos.StateKey.EthBalanceUpdate, [result, lastGasCost]);
      }
    });
  }
}

function errorCallback(error) {
  notify(Koinos.StateKey.ErrorReport, error);
}

function warningCallback(warning) {
  notify(Koinos.StateKey.WarningReport, warning);
}

// Generate a new keystore
// seedPhrase is optional, but allows for recovery of private key
function openKeystore() {
  const keystorePath = path.join((electron.app || electron.remote.app).getPath('userData'), 'keystore.json');
  if (fs.existsSync(keystorePath)) {
    try {
      userKeystore = keystore.deserialize(fs.readFileSync(keystorePath));
      state.set(Koinos.StateKey.HasKeystore, true);
    } catch (err) {
      let error = {
        kMessage: "There was a problem deserializing the keystore.",
        error: err
      };
      notify(Koinos.StateKey.ErrorReport, error);
    }
  }
}

function createKeystore(password, seedPhrase, cb) {
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
      vault.keyFromPassword(password, function (err, pwDerivedKey) {
        if (err) {
          let error = {
            kMessage: "There was a problem unlocking the keystore.",
            error: err
          };
          notify(Koinos.StateKey.ErrorReport, error);
        }
        else {
          vault.generateNewAddress(pwDerivedKey, 1);
          if (cb) {
            cb(vault);
          }
        }
      });
    }
  });

  return seedPhrase;
}

function saveKeystore() {
  assert(userKeystore !== null);
  fs.writeFileSync(keystoreFile, userKeystore.serialize());
}

function getAddresses() {
  assert(userKeystore !== null);
  return userKeystore.getAddresses();
}

async function signCallback(web3, txData) {
  assert(userKeystore !== null && derivedKey !== null);
  txData.nonce = await web3.eth.getTransactionCount(
    txData.from
  );

  let rawTx = new Tx(txData);
  return '0x' + signing.signTx(userKeystore, derivedKey, rawTx.serialize(), txData.from);
}

function exportKey(password, callback) {
  assert(userKeystore !== null);

  let privKey;
  userKeystore.keyFromPassword(password, callback);
}

function stopMiner() {
   if (miner !== null) {
      miner.stop();
   }
   guiBlockchainUpdateLoop.try_stop();    // async fire-and-forget

   miner = null;
   tokenContract = null;
   derivedKey = null;
   state.set(Koinos.StateKey.MinerActivated, false);
   notify(Koinos.StateKey.MinerActivated, state.get(Koinos.StateKey.MinerActivated));
}

ipcMain.handle(Koinos.StateKey.StopMiner, (event, ...args) => {
  console.log("Koinos.StateKey.StopMiner")
  stopMiner();
});

ipcMain.handle(Koinos.StateKey.ToggleMiner, async (event, ...args) => {
  try {
    if (!state.get(Koinos.StateKey.MinerActivated)) {

      if (!state.get(Koinos.StateKey.HasKeystore)) {
        let error = {
          kMessage: "No signing key detected. Please open the key management window."
        };
        notify(Koinos.StateKey.ErrorReport, error);
        return;
      }

      config.ethAddress = args[0];
      config.endpoint = args[1];
      config.developerTip = args[2];
      config.proofFrequency = args[3];
      config.proofPer = args[4];

      promptPassword();
    }
    else {
      console.log("Koinos.StateKey.ToggleMiner");
      stopMiner();
    }
  }
  catch (err) {
    console.log(err);
    console.log("Koinos.StateKey.ToggleMiner Error");
    stopMiner();
    notify(Koinos.StateKey.ErrorReport, err);
  }
});

ipcMain.handle(Koinos.StateKey.GenerateKeys, (event, args) => {
  if (keyManagementWindow !== null) {
    let seedPhrase = createKeystore(args, null, (vault) => {
      userKeystore = vault;
      keyManagementWindow.send(Koinos.StateKey.SeedPhrase, seedPhrase);
    });
  }
});

ipcMain.handle(Koinos.StateKey.ManageKeys, (event, ...args) => {
  keyManagementWindow = new BrowserWindow({
    width: 900,
    height: 600,
    titleBarStyle: "hidden",
    resizable: false,
    maximizable: false,
    modal: true,
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false
  });

  keyManagementWindow.on('close', function () {
    if (!state.has(Koinos.StateKey.HasKeystore)) {
      keystore = null;
    }

    keyManagementWindow = null;
  });

  keyManagementWindow.loadFile("components/key-management.html");

  keyManagementWindow.once('ready-to-show', () => {
    if (state.get(Koinos.StateKey.HasKeystore)) {
      keyManagementWindow.send(Koinos.StateKey.SigningAddress, web3.utils.toChecksumAddress(getAddresses()[0]));
      keyManagementWindow.send(Koinos.StateKey.SetKeyManageWindowState, [Koinos.StateKey.ManageKeyWindow.ManageKey, 0]);
    }
    if (state.get(Koinos.StateKey.MinerActivated)) {
      keyManagementWindow.send(Koinos.StateKey.DisableKeyRecovery);
    }

    keyManagementWindow.show();
  });
});

ipcMain.on(Koinos.StateKey.ClosePasswordPrompt, async (event, password) => {
  if (password.length === 0) {
    let error = {
      kMessage: "Please provide the password to unlock your keystore."
    };
    notify(Koinos.StateKey.ErrorReport, error);
    return;
  }

  userKeystore.keyFromPassword(password, async function (err, pwDerivedKey) {
    if (err) {
      let error = {
        kMessage: "There was a problem unlocking the keystore.",
        error: err
      };
      notify(Koinos.StateKey.ErrorReport, error);
      return;
    }
    if (!userKeystore.isDerivedKeyCorrect(pwDerivedKey)) {
      let error = {
        kMessage: "The password is incorrect."
      };
      notify(Koinos.StateKey.ErrorReport, error);
      return;
    }

    derivedKey = pwDerivedKey;

    web3 = new Web3(config.endpoint);

    try {
      await Promise.race([
        web3.eth.getNodeInfo(),
        new Promise(function (resolve, reject) {
          setTimeout(function () {
            reject("Timed out while attempting to connect to Ethereum Endpoint.");
          }, config.endpointTimeout);
        })
      ]);
    }
    catch (e) {
      if (typeof e === 'string' || e instanceof String) {
        notify(Koinos.StateKey.ErrorReport, {
          kMessage: e
        });
      }
      else {
        notify(Koinos.StateKey.ErrorReport, {
          kMessage: "The provided Ethereum Endpoint is not valid.",
          exception: e
        });
      }
      return;
    }

    tokenContract = new web3.eth.Contract(KnsToken.abi, KnsTokenAddress);
    await guiUpdateBlockchain();

    let proofPeriod = config.proofPer === "day" ? Koinos.TimeSpan.SecondsPerDay : Koinos.TimeSpan.SecondsPerWeek;
    proofPeriod /= config.proofFrequency;

    miner = new KoinosMiner(
      config.ethAddress,
      TipAddresses,
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
      errorCallback,
      warningCallback);
    await miner.awaitInitialization();
    miner.start();
    guiBlockchainUpdateLoop.start();
    state.set(Koinos.StateKey.MinerActivated, true);
    writeConfiguration();
    notify(Koinos.StateKey.MinerActivated, state.get(Koinos.StateKey.MinerActivated));
    notify(Koinos.StateKey.ActivateCountdown, miner.getMiningStartTime());
  });
});

function promptPassword() {
  // create new window
  let passwordModalWindow = new BrowserWindow({
    parent: mainWindow,
    width: 500,
    height: 200,
    frame: false,
    titleBarStyle: "hidden",
    resizable: false,
    maximizable: false,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false
  });

  passwordModalWindow.loadFile("components/password-modal.html");
  passwordModalWindow.once('ready-to-show', () => {
    passwordModalWindow.show();
  });
}

ipcMain.handle(Koinos.StateKey.ExportKey, (event, arg) => {
  exportKey(arg, function (err, pwDerivedKey) {
    if (err) {
      let error = {
        kMessage: "There was a problem unlocking the keystore.",
        error: err
      };

      if (keyManagementWindow !== null) {
        keyManagementWindow.close();
      }

      console.log(err);
      notify(Koinos.StateKey.ErrorReport, error);
    }
    else {
      if (userKeystore.isDerivedKeyCorrect(pwDerivedKey)) {
        keyManagementWindow.send(Koinos.StateKey.PrivateKey, userKeystore.exportPrivateKey(userKeystore.getAddresses()[0], pwDerivedKey));
      }
      else {
        if (keyManagementWindow !== null) {
          keyManagementWindow.close();
        }

        notify(Koinos.StateKey.ErrorReport, { kMessage: "Password is incorrect" });
      }
    }
  });
});

ipcMain.handle(Koinos.StateKey.ExportConfirmationModal, (event, ...args) => {
  let exportKeyConfirmationModal = new BrowserWindow({
    parent: keyManagementWindow,
    width: 300,
    height: 200,
    frame: false,
    titleBarStyle: "hidden",
    resizable: false,
    maximizable: false,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false
  });

  exportKeyConfirmationModal.loadFile("components/export-confirmation.html");
  exportKeyConfirmationModal.once('ready-to-show', () => {
    exportKeyConfirmationModal.show();
  });
});

ipcMain.handle(Koinos.StateKey.ConfirmExportKey, (event, ...args) => {
  keyManagementWindow.send(Koinos.StateKey.ConfirmExportKey);
});


ipcMain.handle(Koinos.StateKey.RecoverKey, (event, args) => {
  if (!keystore.isSeedValid(args[1])) {
    notify(Koinos.StateKey.ErrorReport, { kMessage: "Recovery phrase is not valid." });
  }
  else {
    createKeystore(args[0], args[1], (vault) => {
      userKeystore = vault;
      state.set(Koinos.StateKey.HasKeystore, true);
      saveKeystore();
      keyManagementWindow.send(Koinos.StateKey.SigningAddress, web3.utils.toChecksumAddress(getAddresses()[0]));
      keyManagementWindow.send(Koinos.StateKey.SetKeyManageWindowState, [Koinos.StateKey.ManageKeyWindow.ManageKey, 1000]);
    });
  }
});

ipcMain.handle(Koinos.StateKey.ConfirmSeed, (event, args) => {
  userKeystore.keyFromPassword(args[0], function (err, pwDerivedKey) {
    if (err) {
      let error = {
        kMessage: "There was a problem unlocking the keystore.",
        error: err
      };
      notify("Koinos.StateKey.ErrorReport, error");
    }
    else {
      if (userKeystore.getSeed(pwDerivedKey) != args[1]) {
        keyManagementWindow.send(Koinos.StateKey.IncorrectSeed);
      }
      else {
        saveKeystore();
        state.set(Koinos.StateKey.HasKeystore, true);
        keyManagementWindow.send(Koinos.StateKey.SigningAddress, web3.utils.toChecksumAddress(getAddresses()[0]));
        keyManagementWindow.send(Koinos.StateKey.SetKeyManageWindowState, [Koinos.StateKey.ManageKeyWindow.ManageKey, 1000]);
      }
    }
  });
});

let guiBlockchainUpdateLoop = new Looper( guiUpdateBlockchain, guiUpdateBlockchainMs = 30*1000, guiUpdateBlockchainError );
