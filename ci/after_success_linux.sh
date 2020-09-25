\65;5402;1c#!/bin/bash

electron-packager . --out dist/
electron-installer-debian --src "dist/Koinos Miner-linux-x64/" --dest dist/installer/ --arch amd64 --options.bin "Koinos Miner"
mv dist/installer/$(ls dist/installer/) dist/installer/KoinosMiner$(python ci/get_version.py package.json).deb
