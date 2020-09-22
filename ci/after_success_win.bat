call electron-packager . --out dist/
call cp KnsToken.json "dist/Koinos Miner-win32-x64/"
call electron-installer-windows --src "dist/Koinos Miner-win32-x64/" --dest dist/installer/ --options.exe "Koinos Miner.exe"
