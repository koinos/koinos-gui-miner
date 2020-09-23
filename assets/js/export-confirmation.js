const { ipcRenderer } = require('electron');
const Koinos = require('../assets/js/constants.js');

function confirm() {
  ipcRenderer.invoke(Koinos.StateKey.ConfirmExportKey);
  this.close();
}

function closeWindow() {
  this.close();
}
