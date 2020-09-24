const { ipcRenderer, ipcMain } = require('electron');
const Koinos = require('../assets/js/constants.js');
let generated = false;

function closeWindow() {
  this.close();
}

function passwordsMatch(a,b) {
  if (a.length == b.length && a === b) {
    return true;
  }

  return false;
}

function passwordIsRequiredLength(a) {
  return a.length >= 8;
}

function passwordIsValid() {
  let pass = document.getElementById(Koinos.Field.Password).value;
  let passConfirm = document.getElementById(Koinos.Field.PasswordConfirm).value;

  if (passwordsMatch(pass, passConfirm) && passwordIsRequiredLength(pass)) {
    return true;
  }

  return false;
}

function onPasswordKeyUp() {
  let pass = document.getElementById(Koinos.Field.Password).value;
  let passConfirm = document.getElementById(Koinos.Field.PasswordConfirm).value;
  let message = document.getElementById(Koinos.Field.PasswordFeedback);
  if (!passwordIsRequiredLength(pass)) {
    message.innerHTML = "Password must be atleast 8 characters"
    message.style.visibility = "visible";
    message.style.background = "#c65656"
  }
  else if (!passwordsMatch(pass, passConfirm)) {
    message.innerHTML = "Passwords do not match"
    message.style.visibility = "visible";
    message.style.background = "#c65656"
  }
  else {
    message.innerHTML = "Password accepted"
    message.style.visibility = "visible";
    message.style.background = "#5fb56b";
  }
}

function recoverKeys() {
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
  ipcRenderer.invoke(Koinos.StateKey.RecoverKey, [pass, seedPhrase]);
  this.close();
}
