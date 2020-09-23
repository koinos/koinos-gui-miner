call electron-packager . --out dist/
call cp KnsToken.json "dist/Koinos Miner-win32-x64/"

FOR /F "tokens=*" %%V in ('python ci/get_version.py package.json') DO ( SET VERSION=%%V )
call iscc /DMyAppVersion=%VERSION% win32.iss
