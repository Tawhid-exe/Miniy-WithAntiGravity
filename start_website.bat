@echo off
echo ===================================================
echo Starting Business Management System...
echo ===================================================

start cmd /k "cd server && npm run dev"
echo Server started...

echo Starting Client...
cd client
cmd /c "npm run dev"
pause
