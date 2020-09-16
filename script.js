const { ipcRenderer } = require('electron');
const Koinos = require('./assets/js/constants.js');
var currentHashrate = null;

function onStateRestoration(s) {
  onMinerActivated(s.get(Koinos.StateKey.MinerActivated));
  onKoinBalanceUpdate(s.get(Koinos.StateKey.KoinBalanceUpdate));

  let config = s.get(Koinos.StateKey.Configuration);
  document.getElementById("ethAddress").value = config.ethAddress;
  document.getElementById("tip").checked = config.developerTip;
  document.getElementById("eth-endpoint").value = config.endpoint;
  document.getElementById("proof-period").value = config.proofPeriod;
}

function toggleProofPeriod(which) {
  var day = document.getElementById("checkDay");
  var week = document.getElementById("checkWeek");
  if (which === 'day') {
    week.classList.remove("checked");
    day.classList.add("checked");
  } else {
    day.classList.remove("checked");
    week.classList.add("checked");
  }
}

function onErrorReport(e) {
  console.log("Error: " + e);
}

function onEthBalanceUpdate(b) {
  document.getElementById("eth-balance").innerHTML = b + " ETH";
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
  let developerTip = document.getElementById("tip").checked;
  let endpoint = document.getElementById("eth-endpoint").value;
  let proofPeriod = 60;
  let tip = 0;

  if (developerTip) {
    tip = 5;
  }

  ipcRenderer.invoke(Koinos.Notifications.ToggleMiner, ethAddress, endpoint, tip, proofPeriod);
}

ipcRenderer.on(Koinos.Notifications.RestoreState, (event, arg) => {
  onStateRestoration(arg);
});

ipcRenderer.on(Koinos.Notifications.KoinBalanceUpdate, (event, arg) => {
  onKoinBalanceUpdate(arg);
});

ipcRenderer.on(Koinos.Notifications.HashrateReportString, (event, arg) => {
  onHashrateReportString(arg);
});

ipcRenderer.on(Koinos.Notifications.HashrateReport, (event, arg) => {
  onHashrateReport(arg);
});

ipcRenderer.on(Koinos.Notifications.MinerActivated, (event, state) => {
  onMinerActivated(state);
});

ipcRenderer.on(Koinos.Notifications.EthBalanceUpdate, (event, arg) => {
  onEthBalanceUpdate(arg);
});

ipcRenderer.on(Koinos.Notifications.ErrorReport, (event, arg) => {
  onErrorReport(arg);
});
