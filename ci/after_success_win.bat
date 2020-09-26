call electron-packager . --out dist/ --icon="./assets/icons/win/256x256.png"

FOR /F "tokens=*" %%V in ('python ci/get_version.py package.json') DO ( SET VERSION=%%V )
call iscc /DMyAppVersion=%VERSION% win32.iss
