const electron = require('electron');
const { app, BrowserWindow, ipcMain } = require("electron")
//const { ipcMain } = require('electron');
const { keystore, signing } = require('eth-lightwallet');
const fs = require('fs');
const KnsToken = JSON.parse(fs.readFileSync('./KnsToken.json', 'utf8'));
const path = require('path');
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

const KnsTokenAddress = '0xb09672ad9faAD450D7A50ABEF772F8B8EA38f8d4';
const OpenOrchardAddress = '0xCd06f2eb4E5424f9681bA07CB3C7487FEc0341EC';
const KnsTokenMiningAddress = '0xc4e86fB87ddBC4e397cE6B066e16640F433d3592';

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
  //win.webContents.openDevTools()
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

function proofCallback(submission) {
  if (web3 !== null && address !== null && contract !== null) {
    contract.methods.balanceOf(address).call({from: address}, function(error, result) {
      win.send('koin-balance-update', result);
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
function openKeystore(seedPhrase) {
   const keystorePath = path.join((electron.app || electron.remote.app).getPath('userData'), 'keystore.json');
   if (fs.existsSync(keystorePath)) {
      try {
         ks = keystore.deserialize(fs.readFileSync(keystorePath));
      } catch (error) {}
   }

   if (ks === null) {
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
         });
      });

      //return ks.getSeed(derivedKey);
   }
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
   let rawTx = new Tx(txData);
   console.log(txData);
   console.log(rawTx.serialize());
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
   win.send('miner-activated', false);
}

ipcMain.handle('toggle-miner', (event, ...args) => {
  try {
    if (ks === null ) {
       openKeystore();
    }

    assert (ks !== null);

    if (miner === null) {
      var ethAddress = args[0];
      var endpoint = args[1];
      var tip = args[2];
      var proofPeriod = args[3];
      ks.keyFromPassword(enterPassword(), function (err, pwDerivedKey) {
         if (err) throw err;
         assert (ks.isDerivedKeyCorrect(pwDerivedKey));
         derivedKey = pwDerivedKey;
      });

      address = ethAddress;
      web3 = new Web3(endpoint);
      contract = new web3.eth.Contract(KnsToken.abi, KnsTokenAddress, {from: ethAddress, gasPrice:'20000000000', gas: 6721975});
      contract.methods.balanceOf(address).call({from: address}, function(error, result) {
        win.send('koin-balance-update', result);
      });
      miner = new KoinosMiner(
        ethAddress,
        OpenOrchardAddress,
        getAddresses()[0],
        KnsTokenMiningAddress,
        endpoint,
        tip,
        proofPeriod,
        signCallback,
        hashrateCallback,
        proofCallback);
      miner.start();
      win.send('miner-activated', true);
    }
    else {
      stopMiner();
    }
  }
  catch (err) {
    stopMiner();
    console.log(err.message);
  }
});
