@echo off
echo 🔄 Déploiement de l'application Cloud HA...

set SERVERS=192.168.56.20
set APP_DIR="~/cloud-app"
set USER="vboxuser"

echo 📦 Copie des fichiers vers Web1...
scp -r app.js package.json %USER%@%SERVERS%:%APP_DIR%/

echo 🚀 Démarrage de l'application...
ssh %USER%@%SERVERS% "cd %APP_DIR% && npm install && SERVER_NAME=Web1 npm start"

echo ✅ Déploiement terminé!
pause