const { ipcRenderer, clipboard } = require('electron');
const Koinos = require('../assets/js/constants.js');
const Qr = require('ethereum-qr-code');
let generated = false;
let recoveryDisabled = false;
let state = Koinos.StateKey.ManageKeyWindow.GenerateKey;
let stateIDMap = new Map([
  [Koinos.StateKey.ManageKeyWindow.GenerateKey, Koinos.Field.GenerateKeyPage],
  [Koinos.StateKey.ManageKeyWindow.ConfirmRecovery, Koinos.Field.ConfirmRecoveryPage],
  [Koinos.StateKey.ManageKeyWindow.ManageKey, Koinos.Field.ManageKeyPage],
  [Koinos.StateKey.ManageKeyWindow.RecoverKey, Koinos.Field.RecoverKeyPage]
]);

function animateStateTransition(nextState, timeout = 1000) {
  let previousStateID = stateIDMap.get(state);
  let nextStateID = stateIDMap.get(nextState);

  if (previousStateID === null || nextStateID === null) return;

  document.getElementById(previousStateID).classList.add("fade-out");
  setTimeout(() => {
    document.getElementById(previousStateID).style.display = "none";
  }, timeout);
  setTimeout(() => {
    document.getElementById(nextStateID).style.display = "inherit";
    document.getElementById(nextStateID).classList.add("fade-in");
  }, timeout);

  state = nextState;
}

ipcRenderer.on(Koinos.StateKey.SetKeyManageWindowState, (event, [newState, timeout]) => {
  if (newState != state) {
    animateStateTransition(newState, timeout);
  }
})

ipcRenderer.on(Koinos.StateKey.DisableKeyRecovery, (event, args) => {
  document.getElementById(Koinos.Field.ManageKey.RecoverButton).className += " grayed";
  recoveryDisabled = true;
});

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
  let page = null;
  if (state == Koinos.StateKey.ManageKeyWindow.GenerateKey) {
    page = Koinos.Field.GenerateKey;
  }
  else if (state == Koinos.StateKey.ManageKeyWindow.RecoverKey) {
    page = Koinos.Field.RecoverKey;
  }
  else {
    return;
  }

  let pass = document.getElementById(page.Password).value;
  let passConfirm = document.getElementById(page.PasswordConfirm).value;

  if (passwordsMatch(pass, passConfirm) && passwordIsRequiredLength(pass)) {
    return true;
  }

  return false;
}

function onPasswordKeyUp() {
  let page = null;
  if (state == Koinos.StateKey.ManageKeyWindow.GenerateKey) {
    page = Koinos.Field.GenerateKey;
  }
  else if (state == Koinos.StateKey.ManageKeyWindow.RecoverKey) {
    page = Koinos.Field.RecoverKey;
  }
  else {
    return;
  }

  let pass = document.getElementById(page.Password).value;
  let passConfirm = document.getElementById(page.PasswordConfirm).value;
  let message = document.getElementById(page.PasswordFeedback);
  if (!passwordIsRequiredLength(pass)) {
    message.innerHTML = "Password must be at least 8 characters"
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
    animateStateTransition(Koinos.StateKey.ManageKeyWindow.ConfirmRecovery);
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


  document.getElementById(Koinos.Field.GenerateKey.Frame1).classList.add("fade-out");
  setTimeout(() => {
    document.getElementById(Koinos.Field.GenerateKey.Frame1).style.display = "none";
  }, 1000);
  setTimeout(() => {
    document.getElementById(Koinos.Field.GenerateKey.RecoveryPhrase).style.visibility = "visible";
    document.getElementById(Koinos.Field.GenerateKey.RecoveryPhrase).classList.add("fade-in");
  }, 1000);

  generated = true;
  document.getElementById(Koinos.Field.ManageKey.GenerateConfirm).style.visibility = "visible";
});

function confirmSeed() {
  let pass = document.getElementById(Koinos.Field.GenerateKey.Password).value;
  let seedPhrase = "";
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word1).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word2).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word3).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word4).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word5).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word6).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word7).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word8).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word9).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word10).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word11).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.ConfirmRecovery.Word12).value.trim();
  ipcRenderer.invoke(Koinos.StateKey.ConfirmSeed, [pass, seedPhrase]);

  generated = false;
}

ipcRenderer.on(Koinos.StateKey.IncorrectSeed, (event, arg) => {
  document.getElementById(Koinos.Field.ConfirmRecovery.SeedFeedback).style.visibility = "visible";

  generated = true;
});

function openRecoverKeys() {
  if (generated) return;
  if (recoveryDisabled) return;
  animateStateTransition(Koinos.StateKey.ManageKeyWindow.RecoverKey);
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

function copyAddress() {
  clipboard.writeText(document.getElementById(Koinos.Field.ManageKey.SigningAddress).innerHTML);
  document.getElementById(Koinos.Field.ManageKey.CopyConfirm).style.visibility = "visible";
  setTimeout(() => {
    document.getElementById(Koinos.Field.ManageKey.CopyConfirm).classList.add("copy-confirm-fade-out");
  }, 2000);
  setTimeout(() => {
    document.getElementById(Koinos.Field.ManageKey.CopyConfirm).style.visibility = "hidden";
    document.getElementById(Koinos.Field.ManageKey.CopyConfirm).classList.remove("copy-confirm-fade-out");
  }, 5000);
}

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

function recoverKeys() {
  let pass = document.getElementById(Koinos.Field.RecoverKey.Password).value;
  let seedPhrase = "";
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word1).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word2).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word3).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word4).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word5).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word6).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word7).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word8).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word9).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word10).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word11).value.trim() + ' ';
  seedPhrase += document.getElementById(Koinos.Field.RecoverKey.Word12).value.trim();
  ipcRenderer.invoke(Koinos.StateKey.RecoverKey, [pass, seedPhrase]);
}
