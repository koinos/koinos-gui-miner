#!/bin/bash

electron-packager . --out dist/
cp KnsToken.json "dist/Koinos Miner-darwin-x64/"
electron-installer-dmg "dist/Koinos Miner-darwin-x64/" "Koinos Miner" --out dist/installer/ --title "Koinos GUI Miner"

