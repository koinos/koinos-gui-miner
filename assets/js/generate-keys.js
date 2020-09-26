const { ipcRenderer } = require('electron');
const Koinos = require('../assets/js/constants.js');
const Qr = require('ethereum-qr-code');
let generated = false;

function closeWindow() {
  if (generated) {
    ipcRenderer.invoke(Koinos.StateKey.CancelConfirmSeed);
  }
  this.close();
}

function passwordsMatch(a, b) {
  if (a.length == b.length && a === b) {
    return true;
  }

  return false;
}

function passwordIsRequiredLength(a) {
  return a.length >= 8;
}

function passwordIsValid() {
  let pass = document.getElementById(Koinos.Field.GenerateKey.Password).value;
  let passConfirm = document.getElementById(Koinos.Field.GenerateKey.PasswordConfirm).value;

  if (passwordsMatch(pass, passConfirm) && passwordIsRequiredLength(pass)) {
    return true;
  }

  return false;
}

function onPasswordKeyUp() {
  let pass = document.getElementById(Koinos.Field.GenerateKey.Password).value;
  let passConfirm = document.getElementById(Koinos.Field.GenerateKey.PasswordConfirm).value;
  let message = document.getElementById(Koinos.Field.GenerateKey.PasswordFeedback);
  if (!passwordIsRequiredLength(pass)) {
    message.innerHTML = "Password must be atleast 8 characters"
    message.style.visibility = "visible";
    message.style.color = "#c65656"
  }
  else if (!passwordsMatch(pass, passConfirm)) {
    message.innerHTML = "Passwords do not match"
    message.style.visibility = "visible";
    message.style.color = "#c65656"
  }
  else {
    message.innerHTML = "Password accepted"
    message.style.visibility = "visible";
    message.style.color = "#5fb56b";
  }
}

function generateKeys() {
  if (generated) {
   document.getElementById(Koinos.Field.GenerateKeyPage).classList.add("fade-out");
   setTimeout(() => {
     document.getElementById(Koinos.Field.GenerateKeyPage).style.display = "none";
   }, 1000);
   setTimeout(() => {
     document.getElementById(Koinos.Field.ConfirmRecoveryPage).style.display = "inline";
     document.getElementById(Koinos.Field.ConfirmRecoveryPage).classList.add("fade-in");
   }, 1000);
   return;
  };

  if (!passwordIsValid()) return;

  let pass = document.getElementById(Koinos.Field.GenerateKey.Password).value;
  ipcRenderer.invoke(Koinos.StateKey.GenerateKeys, pass);
}

ipcRenderer.on(Koinos.StateKey.SeedPhrase, (event, arg) => {
  document.getElementById(Koinos.Field.GenerateKey.RecoverButton).className += " grayed";
  let words = arg.split(" ");

  document.getElementById(Koinos.Field.GenerateKey.Word1).innerHTML = "1. " + words[0];
  document.getElementById(Koinos.Field.GenerateKey.Word2).innerHTML = "2. " + words[1];
  document.getElementById(Koinos.Field.GenerateKey.Word3).innerHTML = "3. " + words[2];
  document.getElementById(Koinos.Field.GenerateKey.Word4).innerHTML = "4. " + words[3];
  document.getElementById(Koinos.Field.GenerateKey.Word5).innerHTML = "5. " + words[4];
  document.getElementById(Koinos.Field.GenerateKey.Word6).innerHTML = "6. " + words[5];
  document.getElementById(Koinos.Field.GenerateKey.Word7).innerHTML = "7. " + words[6];
  document.getElementById(Koinos.Field.GenerateKey.Word8).innerHTML = "8. " + words[7];
  document.getElementById(Koinos.Field.GenerateKey.Word9).innerHTML = "9. " + words[8];
  document.getElementById(Koinos.Field.GenerateKey.Word10).innerHTML = "10. " + words[9];
  document.getElementById(Koinos.Field.GenerateKey.Word11).innerHTML = "11. " + words[10];
  document.getElementById(Koinos.Field.GenerateKey.Word12).innerHTML = "12. " + words[11];


  document.getElementById(Koinos.Field.GenerateKey.Warning).classList.add("fade-out");
  setTimeout(() => {
    document.getElementById(Koinos.Field.GenerateKey.Warning).remove();
  }, 1000);
  setTimeout(() => {
    document.getElementById(Koinos.Field.GenerateKey.RecoveryPhrase).style.visibility = "visible";
    document.getElementById(Koinos.Field.GenerateKey.RecoveryPhrase).classList.add("fade-in");
  }, 1000);

  generated = true;
});

function confirmSeed() {
   let pass = document.getElementById(Koinos.Field.ConfirmRecovery.Password).value;
   let seedPhrase = "";
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word1).value.trim()  + ' ';
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word2).value.trim()  + ' ';
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word3).value.trim()  + ' ';
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word4).value.trim()  + ' ';
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word5).value.trim()  + ' ';
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word6).value.trim()  + ' ';
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word7).value.trim()  + ' ';
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word8).value.trim()  + ' ';
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word9).value.trim()  + ' ';
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word10).value.trim() + ' ';
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word11).value.trim() + ' ';
   seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word12).value.trim();
   ipcRenderer.invoke(Koinos.StateKey.ConfirmSeed, [pass, seedPhrase]);

   generated = false;
}

ipcRenderer.on(Koinos.StateKey.TransitionToKeyManagement, (event, arg) => {
  document.getElementById(Koinos.Field.ConfirmRecoveryPage).classList.add("fade-out");
  setTimeout(() => {
    document.getElementById(Koinos.Field.ConfirmRecoveryPage).style.display = "none";
  }, 1000);
  setTimeout(() => {
    document.getElementById(Koinos.Field.ManageKeyPage).style.display = "inline";
    document.getElementById(Koinos.Field.ManageKeyPage).classList.add("fade-in");
  }, 1000);
})

function recoverKeys() {
  if (generated) return;
  ipcRenderer.invoke(Koinos.StateKey.RecoverKeyWindow);
  this.close();
}

ipcRenderer.on(Koinos.StateKey.SigningAddress, (event, arg) => {
  document.getElementById(Koinos.Field.ManageKey.SigningAddress).innerHTML = arg;

  const qr = new Qr();
  const codeDetails = {
    to: arg
  };

  const configDetails = {
    size: 180,
    selector: '#' + Koinos.Field.ManageKey.QRCode,
    options: {
      margin: 2,
    }
  };

  qr.toCanvas(codeDetails, configDetails);
});

function exportKey() {
  ipcRenderer.invoke(Koinos.StateKey.ExportConfirmationModal);
}

ipcRenderer.on(Koinos.StateKey.PrivateKey, (event, arg) => {
  document.getElementById(Koinos.Field.ManageKey.PrivateKey).innerHTML = arg;
});

ipcRenderer.on(Koinos.StateKey.ConfirmExportKey, (event, ...args) => {
  let pass = document.getElementById(Koinos.Field.ManageKey.Password).value;
  ipcRenderer.invoke(Koinos.StateKey.ExportKey, pass);
});
