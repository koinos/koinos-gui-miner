const { ipcRenderer } = require('electron');

const ooAddress = '0x86c081b9f59c06547a7c0418Aec12a8F46064767';
const contract = '0x3De8FFbAee570641f0645eA39C7F8DFf91A2f5F5';
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

  ipcRenderer.invoke('toggle-miner', ethAddress, ooAddress, contract, endpoint, tip, 60, null);


}

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
  }
  else {
    document.getElementById("tip").removeAttribute("disabled");
  }
});