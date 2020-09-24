const { ipcRenderer, ipcMain } = require('electron');
const Koinos = require('../assets/js/constants.js');

function closeWindow() {
  ipcRenderer.invoke(Koinos.StateKey.CancelConfirmSeed);
  this.close();
}

function confirmSeed() {
  let pass = document.getElementById(Koinos.Field.Password).value;
  let seedPhrase = "";
  seedPhrase += document.getElementById(Koinos.Field.Word1).value.trim()  + ' ';
  seedPhrase += document.getElementById(Koinos.Field.Word2).value.trim()  + ' ';
  seedPhrase += document.getElementById(Koinos.Field.Word3).value.trim()  + ' ';
  seedPhrase += document.getElementById(Koinos.Field.Word4).value.trim()  + ' ';
  seedPhrase += document.getElementById(Koinos.Field.Word5).value.trim()  + ' ';
  seedPhrase += document.getElementById(Koinos.Field.Word6).value.trim()  + ' ';
  seedPhrase += document.getElementById(Koinos.Field.Word7).value.trim()  + ' ';
  seedPhrase += document.getElementById(Koinos.Field.Word8).value.trim()  + ' ';
  seedPhrase += document.getElementById(Koinos.Field.Word9).value.trim()  + ' ';
  seedPhrase += document.getElementById(Koinos.Field.Word10).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.Word11).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.Word12).value.trim();
  ipcRenderer.invoke(Koinos.StateKey.ConfirmSeed, [pass, seedPhrase]);
  this.close();
}
