const { ipcRenderer } = require('electron');
const KoinosNotifications = require('./assets/js/notifications.js');
const endpoint = 'http://localhost:8545';
var currentHashrate = null;

function onStateRestoration(s) {
  onMinerActivated(s.get(KoinosNotifications.MinerActivated));
  onKoinBalanceUpdate(s.get(KoinosNotifications.KoinBalanceUpdate));
}

function onHashrateReportString(s) {
  let stuff = s.split(" ");
  let rate = parseFloat(stuff[0]).toFixed(2);
  document.getElementById("hashrate-current").innerHTML = rate.toString();
  document.getElementById("hashrate-suffix").innerHTML = stuff[1];
}

function onHashrateReport(s) {
  hashrateSpinner(false);
  currentHashrate = s;
}

function onMinerActivated(state) {
  if (state) {
    document.getElementById("tip").setAttribute("disabled", "true");
    document.getElementById("check-toggle").className += " grayed";
    document.getElementById("ethAddress").setAttribute("disabled", "true");
    document.getElementById("ethAddress").className += " grayed";
  }
  else {
    document.getElementById("tip").removeAttribute("disabled");
    document.getElementById("check-toggle").classList.remove("grayed");
    document.getElementById("ethAddress").removeAttribute("disabled");
    document.getElementById("ethAddress").classList.remove("grayed");

    document.getElementById("hashrate-current").innerHTML = "0.0";
    document.getElementById("hashrate-suffix").innerHTML = "";
    currentHashrate = 0;
  }

  hashrateSpinner(state);
  powerButton(state);
}

function onKoinBalanceUpdate(balance) {
  let result = "0.0";
  console.log(balance);
  if (balance != 0) {
    const decimalPlaces = 8;
    result = (balance / (10 ** decimalPlaces)).toString();
    if (balance > (10 ** decimalPlaces)) {
      let parts = result.split(".");
      result = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + parts[1].substr(0, 3);
    }
  }
  document.getElementById("koin-balance").innerHTML = result;
}

function powerButton(state) {
  let btn = document.getElementById("svg-button").classList;
  let btnOn = document.getElementById("power-button").classList;
  if (state) {
    btn.remove('red');
    btn.add('green');
    btnOn.remove('redBorder');
    btnOn.add('greenBorder');
  } else {
    btn.remove('green');
    btn.add('red');
    btnOn.remove('greenBorder');
    btnOn.add('redBorder');
  }
}

function hashrateSpinner(state) {
  if (state) {
    document.getElementById("hashrate-spinner").style.display = "";
    document.getElementById("hashrate-current").innerHTML = "";
    document.getElementById("hashrate-suffix").innerHTML = "";
  }
  else {
    document.getElementById("hashrate-spinner").style.display = "none";
  }
}

function toggleMiner() {
  let ethAddress = document.getElementById("ethAddress").value;
  let enableTip = document.getElementById("tip").checked;
  let tip = 0;

  if (enableTip) {
    tip = 5;
  }

  ipcRenderer.invoke(KoinosNotifications.ToggleMiner, ethAddress, endpoint, tip, 60);
}

ipcRenderer.on(KoinosNotifications.RestoreState, (event, arg) => {
  onStateRestoration(arg);
});

ipcRenderer.on(KoinosNotifications.KoinBalanceUpdate, (event, arg) => {
  onKoinBalanceUpdate(arg);
});

ipcRenderer.on(KoinosNotifications.HashrateReportString, (event, arg) => {
  onHashrateReportString(arg);
});

ipcRenderer.on(KoinosNotifications.HashrateReport, (event, arg) => {
  onHashrateReport(arg);
});

ipcRenderer.on(KoinosNotifications.MinerActivated, (event, state) => {
  onMinerActivated(state);
});
