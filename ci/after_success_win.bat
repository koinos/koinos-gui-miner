call electron-packager . --out dist/
call cp KnsToken.json "dist/Koinos Miner-win32-x64/"
iscc //DMyAppVersion=$(python ci/get_version.py package.json) win32.iss
