@echo off
title Khai Food - Запуск сервера
echo.
echo  ==========================================
echo   Khai Food - Веб-застосунок замовлень їжі
echo  ==========================================
echo.
echo  Запускаємо сервери...
echo.

cd /d %~dp0

:: Install dependencies if needed
if not exist "node_modules" (
    echo  [1/3] Встановлення залежностей кореневого пакету...
    npm install
)
if not exist "server\node_modules" (
    echo  [2/3] Встановлення залежностей серверу...
    cd server && npm install && cd ..
)
if not exist "client\node_modules" (
    echo  [3/3] Встановлення залежностей клієнту...
    cd client && npm install && cd ..
)

echo  Запускаємо бекенд (порт 3002)...
start "Khai Food Backend" cmd /k "cd /d %~dp0server && node index.js"

timeout /t 2 /nobreak >nul

echo  Запускаємо фронтенд (порт 5173)...
start "Khai Food Frontend" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo  ==========================================
echo   Сайт доступний: http://localhost:5173
echo  ==========================================
echo.
echo  Демо-акаунт:
echo    Email:    demo@fastfood.ua
echo    Пароль:   demo1234
echo.
echo  Промокоди:
echo    WELCOME10 - знижка 10%%
echo    FAST50    - знижка 50 грн
echo    COMBO20   - знижка 20%% на комбо
echo.
start "" "http://localhost:5173"

pause
