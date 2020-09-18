#!/bin/bash

electron-packager . KoinosGUIMiner --out dist/
electron-installer-debian --src dist/KoinosGUIMiner/ --dest dist/installer/ --arch amd64
ls dist/installer
