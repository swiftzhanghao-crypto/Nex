@echo off
REM 复制到部署目录并重命名为 start.bat，例如 C:\Users\mac\Desktop\nex\start.bat
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
node .\node_modules\tsx\dist\cli.mjs server\production.ts >> server.log 2>&1
