#!/bin/bash

electron-packager . --out dist/
electron-installer-dmg "dist/Koinos Miner-darwin-x64/Koinos Miner.app" "Koinos Miner" --out dist/installer/ --title "Koinos GUI Miner"
mv "dist/installer/$(ls dist/installer/)" "dist/installer/KoinosMiner$(python ci/get_version.py package.json).dmg"
