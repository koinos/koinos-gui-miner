const { ipcRenderer } = require("electron");
const Koinos = require('../assets/js/constants.js');

// Get the input field
var input = document.getElementById(Koinos.Field.Password);

// Execute a function when the user releases a key on the keyboard
input.addEventListener("keyup", function(event) {
  if (event.key == 'Enter') {
    document.getElementById(Koinos.Field.EnterButton).click();
  }
});

function closeButton() {
  ipcRenderer.send(Koinos.StateKey.ClosePasswordPrompt, "")
  this.close();
}

function enterButton() {
  ipcRenderer.send(Koinos.StateKey.ClosePasswordPrompt, document.getElementById(Koinos.Field.Password).value);
  this.close();
}
