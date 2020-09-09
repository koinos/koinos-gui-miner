const { ipcRenderer } = require('electron');

const endpoint = 'http://localhost:8545';

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

function toggleMiner() {
  let ethAddress = document.getElementById("ethAddress").value;
  let enableTip = document.getElementById("tip").checked;
  let tip = 0;

  if (enableTip) {
    tip = 5;
  }

  ipcRenderer.invoke('toggle-miner', ethAddress, endpoint, tip, 60);
}

ipcRenderer.on('koin-balance-update', (event, arg) => {
  const decimalPlaces = 8;
  let result = (arg / (10 ** decimalPlaces)).toString();
  if (arg > (10 ** decimalPlaces)) {
    let parts = result.split(".");
    result = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + parts[1];
  }
  document.getElementById("koin-balance").innerHTML = result;
});

ipcRenderer.on('hashrate-report-string', (event, arg) => {
  let stuff = arg.split(" ");
  document.getElementById("hashrate-current").innerHTML = stuff[0];
  document.getElementById("hashrate-suffix").innerHTML = stuff[1];
});

ipcRenderer.on('hashrate-report', (event, arg) => {
  console.log("data:");
  data.push({ time: Math.round((new Date()).getTime() / 1000), rate: arg });
  console.log(data);
});

ipcRenderer.on('miner-activated', (event, state) => {
  console.log("miner activated:" + state);

  if (state) {
    document.getElementById("tip").setAttribute("disabled", "true");
    document.getElementById("check-toggle").className += " grayed";

    document.getElementById("hashrate-current").innerHTML = "...";
    document.getElementById("hashrate-suffix").innerHTML = "";
  }
  else {
    document.getElementById("tip").removeAttribute("disabled");
    document.getElementById("check-toggle").classList.remove("grayed");

    document.getElementById("hashrate-current").innerHTML = "0.0";
    document.getElementById("hashrate-suffix").innerHTML = "";
  }

  powerButton(state);
});

