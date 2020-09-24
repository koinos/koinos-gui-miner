const { ipcRenderer } = require('electron');
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

function generateKeys() {
  if (generated) return;
  let pass = document.getElementById(Koinos.Field.Password).value;
  ipcRenderer.invoke(Koinos.StateKey.GenerateKeys, pass);
}

ipcRenderer.on(Koinos.StateKey.SeedPhrase, (event, arg) => {
  document.getElementById(Koinos.Field.GenerateButton).className += " grayed";
  let words = arg.split(" ");

  document.getElementById(Koinos.Field.Word1).innerHTML = "1. " + words[0];
  document.getElementById(Koinos.Field.Word2).innerHTML = "2. " + words[1];
  document.getElementById(Koinos.Field.Word3).innerHTML = "3. " + words[2];
  document.getElementById(Koinos.Field.Word4).innerHTML = "4. " + words[3];
  document.getElementById(Koinos.Field.Word5).innerHTML = "5. " + words[4];
  document.getElementById(Koinos.Field.Word6).innerHTML = "6. " + words[5];
  document.getElementById(Koinos.Field.Word7).innerHTML = "7. " + words[6];
  document.getElementById(Koinos.Field.Word8).innerHTML = "8. " + words[7];
  document.getElementById(Koinos.Field.Word9).innerHTML = "9. " + words[8];
  document.getElementById(Koinos.Field.Word10).innerHTML = "10. " + words[9];
  document.getElementById(Koinos.Field.Word11).innerHTML = "11. " + words[10];
  document.getElementById(Koinos.Field.Word12).innerHTML = "12. " + words[11];

  document.getElementById(Koinos.Field.TwelveWords).style.visibility = "visible";
  generated = true;
});

function recoverKeys() {
   ipcRenderer.invoke(Koinos.StateKey.RecoverKeyWindow);
   this.close();
}
