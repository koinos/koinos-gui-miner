const { ipcRenderer } = require('electron');
const { shell } = require('electron');
const Koinos = require('./assets/js/constants.js');
let minerIsRunning = false;
var currentHashrate = null;

function onStateRestoration(s) {
  // Restore state
  onMinerActivated(s.get(Koinos.StateKey.MinerActivated));
  onKoinBalanceUpdate(s.get(Koinos.StateKey.KoinBalanceUpdate));
  onEthBalanceUpdate(s.get(Koinos.StateKey.EthBalanceUpdate));

  // Restore configuration
  let config = s.get(Koinos.StateKey.Configuration);
  document.getElementById(Koinos.Field.EthAddress).value = config.ethAddress;
  document.getElementById(Koinos.Field.Tip).checked = config.developerTip;
  document.getElementById(Koinos.Field.EthEndpoint).value = config.endpoint;
  document.getElementById(Koinos.Field.ProofFrequency).value = config.proofFrequency;
  toggleProofPeriod(config.proofPer);

  // Attach callbacks
  const errorMessage = document.getElementById(Koinos.Field.Errors);
  const documentation = document.getElementById(Koinos.Field.DocumentationLink);
  const openGithub = document.getElementById(Koinos.Field.GitHubIcon);
  const close = document.getElementById(Koinos.Field.ErrorClose);

  documentation.addEventListener('click', e => {
    shell.openExternal('https://koinos.io');
  });

  openGithub.addEventListener('click', e => {
    shell.openExternal('https://github.com/open-orchard/koinos-gui-miner');
  });

  close.addEventListener('click', e => {
    errorMessage.style.display = "none";
  });
}

function toggleProofPeriod(which) {
  // Do not change toggle when mining
  if (minerIsRunning) {
    return;
  }

  var day = document.getElementById(Koinos.Field.CheckDay);
  var week = document.getElementById(Koinos.Field.CheckWeek);
  if (which === 'day') {
    week.classList.remove("checked");
    day.classList.add("checked");
  } else {
    day.classList.remove("checked");
    week.classList.add("checked");
  }
}

function getProofPer() {
  var day = document.getElementById(Koinos.Field.CheckDay);
  if (day.classList.contains("checked")) {
    return "day";
  }
  else {
    return "week";
  }
}

function onErrorReport(e) {
  if (e.kMessage !== undefined) {
    const errors = document.getElementById(Koinos.Field.Errors);
    const errorMessage = document.getElementById(Koinos.Field.ErrorMessage);
    errorMessage.innerHTML = e.kMessage;
    errors.style.display = "flex";
    ipcRenderer.invoke(Koinos.StateKey.StopMiner);
  }
}

function onEthBalanceUpdate(b) {
  let wei = b[0];
  let cost = b[1];

  if (cost > 0) {
    let numProofs = Math.floor(wei/cost);
    document.getElementById(Koinos.Field.EthBalanceSub).innerHTML = "Approx. <br/>" + numProofs + " Proofs Left";
  }
  else {
    document.getElementById(Koinos.Field.EthBalanceSub).innerHTML = "";
  }

  document.getElementById(Koinos.Field.EthBalance).innerHTML = (wei/Koinos.Ether.WeiPerEth).toFixed(4) + " ETH";
}

function onHashrateReportString(s) {
  let stuff = s.split(" ");
  let rate = parseFloat(stuff[0]).toFixed(2);
  document.getElementById(Koinos.Field.HashrateCurrent).innerHTML = rate.toString();
  document.getElementById(Koinos.Field.HashrateSuffix).innerHTML = stuff[1];
}

function onHashrateReport(s) {
  hashrateSpinner(false);
  currentHashrate = s;
}

function onMinerActivated(state) {
  if (state) {
    document.getElementById(Koinos.Field.Tip).setAttribute("disabled", "true");
    document.getElementById(Koinos.Field.CheckToggle).className += " grayed";
    document.getElementById(Koinos.Field.EthAddress).setAttribute("disabled", "true");
    document.getElementById(Koinos.Field.EthAddress).className += " grayed";
    document.getElementById(Koinos.Field.EthEndpoint).setAttribute("disabled", "true");
    document.getElementById(Koinos.Field.EthEndpoint).className += " grayed";
    document.getElementById(Koinos.Field.ProofFrequency).setAttribute("disabled", "true");
    document.getElementById(Koinos.Field.ProofFrequency).className += " grayed";
    document.getElementById(Koinos.Field.CheckDay).className += " grayed";
    document.getElementById(Koinos.Field.CheckWeek).className += " grayed";
  }
  else {
    document.getElementById(Koinos.Field.Tip).removeAttribute("disabled");
    document.getElementById(Koinos.Field.CheckToggle).classList.remove("grayed");
    document.getElementById(Koinos.Field.EthAddress).removeAttribute("disabled");
    document.getElementById(Koinos.Field.EthAddress).classList.remove("grayed");
    document.getElementById(Koinos.Field.EthEndpoint).removeAttribute("disabled");
    document.getElementById(Koinos.Field.EthEndpoint).classList.remove("grayed");
    document.getElementById(Koinos.Field.ProofFrequency).removeAttribute("disabled");
    document.getElementById(Koinos.Field.ProofFrequency).classList.remove("grayed");
    document.getElementById(Koinos.Field.CheckDay).classList.remove("grayed");
    document.getElementById(Koinos.Field.CheckWeek).classList.remove("grayed");

    document.getElementById(Koinos.Field.HashrateCurrent).innerHTML = "0.0";
    document.getElementById(Koinos.Field.HashrateSuffix).innerHTML = "";
    currentHashrate = 0;
  }

  hashrateSpinner(state);
  powerButton(state);
  minerIsRunning = state;
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
  document.getElementById(Koinos.Field.KoinBalance).innerHTML = result;
}

function powerButton(state) {
  let btn = document.getElementById(Koinos.Field.SvgButton).classList;
  let btnOn = document.getElementById(Koinos.Field.PowerButton).classList;
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
    document.getElementById(Koinos.Field.HashrateSpinner).style.display = "";
    document.getElementById(Koinos.Field.HashrateCurrent).innerHTML = "";
    document.getElementById(Koinos.Field.HashrateSuffix).innerHTML = "";
  }
  else {
    document.getElementById(Koinos.Field.HashrateSpinner).style.display = "none";
  }
}

function isValidEndpoint(endpoint) {
  return (/^(http|https|ws):\/\/[-a-zA-Z0-9.:]+$/i.test(endpoint));
}

function isEthereumAddress(address) {
  return (/^(0x){1}[0-9a-fA-F]{40}$/i.test(address));
};

function toggleMiner() {
  let ethAddress = document.getElementById(Koinos.Field.EthAddress).value;
  let developerTip = document.getElementById(Koinos.Field.Tip).checked;
  let endpoint = document.getElementById(Koinos.Field.EthEndpoint).value;
  let proofPeriod = document.getElementById(Koinos.Field.ProofFrequency).value;
  let proofPer = getProofPer();

  if (!isEthereumAddress(ethAddress)) {
    onErrorReport({kMessage: "Please provide a valid Ethereum recipient address."});
    return;
  }

  if (!isValidEndpoint(endpoint)) {
    onErrorReport({kMessage: "Please provide a valid endpoint."});
    return;
  }

  if (proofPeriod <= 0) {
    onErrorReport({kMessage: "Please provide a valid proof frequency."});
    return;
  }

  ipcRenderer.invoke(Koinos.StateKey.ToggleMiner, ethAddress, endpoint, developerTip, proofPeriod, proofPer);
}

ipcRenderer.on(Koinos.StateKey.RestoreState, (event, arg) => {
  onStateRestoration(arg);
});

ipcRenderer.on(Koinos.StateKey.KoinBalanceUpdate, (event, arg) => {
  onKoinBalanceUpdate(arg);
});

ipcRenderer.on(Koinos.StateKey.HashrateReportString, (event, arg) => {
  onHashrateReportString(arg);
});

ipcRenderer.on(Koinos.StateKey.HashrateReport, (event, arg) => {
  onHashrateReport(arg);
});

ipcRenderer.on(Koinos.StateKey.MinerActivated, (event, state) => {
  onMinerActivated(state);
});

ipcRenderer.on(Koinos.StateKey.EthBalanceUpdate, (event, arg) => {
  onEthBalanceUpdate(arg);
});

ipcRenderer.on(Koinos.StateKey.ErrorReport, (event, arg) => {
  onErrorReport(arg);
});
