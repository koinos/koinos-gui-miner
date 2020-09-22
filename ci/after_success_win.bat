call electron-packager . --out dist/
call cp KnsToken.json "dist/Koinos Miner-win32-x64/"
iscc win32.iss
