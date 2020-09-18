#!/bin/bash

electron-packager . --out dist/
cp KnsToken.json dist/koinos-gui-miner-linux-x64/
electron-installer-debian --src dist/koinos-gui-miner-linux-x64/ --dest dist/installer/ --arch amd64

