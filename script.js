const { ipcRenderer } = require('electron');

const endpoint = 'http://localhost:8545';

function toggleColor() {
  let btn = document.getElementById("svg-button").classList;
  let btnOn = document.getElementById("power-button").classList;
  if (btn.contains('red')) {
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
  toggleColor();
  var ethAddress = document.getElementById("ethAddress").value;
  var enableTip = document.getElementById("tip").checked;
  var tip = 0;
  if (enableTip) {
    tip = 5;
  }

  ipcRenderer.invoke('toggle-miner', ethAddress, endpoint, tip, 60);
}

ipcRenderer.on('koin-balance-update', (event, arg) => {
  let result = (arg / 1000000).toFixed(6).toString();
  if (arg > 1000000) {
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

ipcRenderer.on('miner-activated', (event, arg) => {
  console.log("miner activated:" + arg);

  if (arg) {
    document.getElementById("tip").setAttribute("disabled", "true");
    document.getElementById("check-toggle").className += " grayed";
  }
  else {
    document.getElementById("tip").removeAttribute("disabled");
    document.getElementById("check-toggle").classList.remove("grayed");
  }
});

