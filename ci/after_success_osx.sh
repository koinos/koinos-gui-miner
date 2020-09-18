#!/bin/bash

electron-packager . --out dist/
cp KnsToken.json dist/koinos-gui-miner-darwin-x64/
electron-installer-dmg dist/koinos-gui-miner-darwin-x64/ koinos-gui-miner --out dist/installer/ --title "Koinos GUI Miner"

