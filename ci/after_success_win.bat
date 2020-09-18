call electron-packager . --out dist/
call cp KnsToken.json dist/koinos-gui-miner-win32-x64/
call electron-installer-windows --src dist/koinos-gui-miner-win32-x64/ --dest dist/installer/
