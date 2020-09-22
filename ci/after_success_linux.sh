#!/bin/bash

electron-packager . --out dist/
cp KnsToken.json "dist/Koinos Miner-linux-x64/"
electron-installer-debian --src "dist/Koinos Miner-linux-x64/" --dest dist/installer/ --arch amd64
