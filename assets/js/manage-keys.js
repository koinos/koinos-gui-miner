const { ipcRenderer } = require('electron');
const Koinos = require('../assets/js/constants.js');
let generated = false;

ipcRenderer.on(Koinos.StateKey.SigningAddress, (event, arg) => {
  document.getElementById(Koinos.Field.SigningAddress).innerHTML = arg;
});

function closeWindow() {
  this.close();
}

function exportKey() {
  let pass = document.getElementById(Koinos.Field.Password).value;
  ipcRenderer.invoke(Koinos.StateKey.ExportKey, pass);
}

ipcRenderer.on(Koinos.StateKey.PrivateKey, (event, arg) => {
   document.getElementById(Koinos.Field.PrivateKey).innerHTML = arg;
});
