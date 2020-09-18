#!/bin/bash

electron-packager . --out dist/
electron-installer-debian --src dist/KoinosGUIMiner-linux-x64/ --dest dist/installer/ --arch amd64
ls dist/installer
