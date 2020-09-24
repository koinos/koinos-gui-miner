const { ipcRenderer } = require('electron');
const Koinos = require('../assets/js/constants.js');

ipcRenderer.on(Koinos.StateKey.SigningAddress, (event, arg) => {
  document.getElementById(Koinos.Field.SigningAddress).innerHTML = arg;
});

function closeWindow() {
  this.close();
}

function exportKey() {
  ipcRenderer.invoke(Koinos.StateKey.ExportConfirmationModal);
}

ipcRenderer.on(Koinos.StateKey.PrivateKey, (event, arg) => {
   document.getElementById(Koinos.Field.PrivateKey).innerHTML = arg;
});

ipcRenderer.on(Koinos.StateKey.ConfirmExportKey, (event, ...args) => {
   let pass = document.getElementById(Koinos.Field.Password).value;
   ipcRenderer.invoke(Koinos.StateKey.ExportKey, pass);
});
