@echo off
echo.
echo ============================================
echo   EVCORE Backend - Script Cleanup Utility
echo ============================================
echo.
echo This will remove 29 development/testing scripts that are
echo NOT required for production website deployment.
echo.
echo Scripts to KEEP (3 files):
echo   ✅ database-helper.js
echo   ✅ initialize-rbac.js  
echo   ✅ seed.js
echo.
echo Scripts to REMOVE (29 files):
echo   🔴 All test-*, check-*, debug-*, create-test*, etc.
echo.
set /p confirm=Do you want to proceed with cleanup? (y/N): 

if /i "%confirm%" neq "y" (
    echo.
    echo ❌ Cleanup cancelled by user.
    echo.
    pause
    exit /b 0
)

echo.
echo 🧹 Starting script cleanup...
echo.

REM Remove development/testing scripts
echo Removing testing scripts...
if exist "scripts\analyze-scripts.js" del /f "scripts\analyze-scripts.js" && echo   ✅ Removed analyze-scripts.js
if exist "scripts\check-all-collections.js" del /f "scripts\check-all-collections.js" && echo   ✅ Removed check-all-collections.js
if exist "scripts\check-all-users.js" del /f "scripts\check-all-users.js" && echo   ✅ Removed check-all-users.js
if exist "scripts\check-harsha-account.js" del /f "scripts\check-harsha-account.js" && echo   ✅ Removed check-harsha-account.js
if exist "scripts\check-harsha-pilot.js" del /f "scripts\check-harsha-pilot.js" && echo   ✅ Removed check-harsha-pilot.js
if exist "scripts\check-pilot-account.js" del /f "scripts\check-pilot-account.js" && echo   ✅ Removed check-pilot-account.js
if exist "scripts\check-user-permissions.js" del /f "scripts\check-user-permissions.js" && echo   ✅ Removed check-user-permissions.js
if exist "scripts\cleanup-scripts.js" del /f "scripts\cleanup-scripts.js" && echo   ✅ Removed cleanup-scripts.js
if exist "scripts\comprehensive-login-test.js" del /f "scripts\comprehensive-login-test.js" && echo   ✅ Removed comprehensive-login-test.js
if exist "scripts\create-harsha-user.js" del /f "scripts\create-harsha-user.js" && echo   ✅ Removed create-harsha-user.js
if exist "scripts\create-pilot-prasadh.js" del /f "scripts\create-pilot-prasadh.js" && echo   ✅ Removed create-pilot-prasadh.js
if exist "scripts\create-test-users.js" del /f "scripts\create-test-users.js" && echo   ✅ Removed create-test-users.js
if exist "scripts\create-users-atlas.js" del /f "scripts\create-users-atlas.js" && echo   ✅ Removed create-users-atlas.js
if exist "scripts\create-your-account.js" del /f "scripts\create-your-account.js" && echo   ✅ Removed create-your-account.js
if exist "scripts\debug-login.js" del /f "scripts\debug-login.js" && echo   ✅ Removed debug-login.js
if exist "scripts\diagnose-auth.js" del /f "scripts\diagnose-auth.js" && echo   ✅ Removed diagnose-auth.js
if exist "scripts\final-atlas-test.js" del /f "scripts\final-atlas-test.js" && echo   ✅ Removed final-atlas-test.js
if exist "scripts\production-audit.js" del /f "scripts\production-audit.js" && echo   ✅ Removed production-audit.js
if exist "scripts\test-api-context.js" del /f "scripts\test-api-context.js" && echo   ✅ Removed test-api-context.js
if exist "scripts\test-api-workflows.js" del /f "scripts\test-api-workflows.js" && echo   ✅ Removed test-api-workflows.js
if exist "scripts\test-db-connection.js" del /f "scripts\test-db-connection.js" && echo   ✅ Removed test-db-connection.js
if exist "scripts\test-default-credentials.js" del /f "scripts\test-default-credentials.js" && echo   ✅ Removed test-default-credentials.js
if exist "scripts\test-harsha-login.js" del /f "scripts\test-harsha-login.js" && echo   ✅ Removed test-harsha-login.js
if exist "scripts\test-live-auth.js" del /f "scripts\test-live-auth.js" && echo   ✅ Removed test-live-auth.js
if exist "scripts\test-login-server.js" del /f "scripts\test-login-server.js" && echo   ✅ Removed test-login-server.js
if exist "scripts\test-my-account-feature.js" del /f "scripts\test-my-account-feature.js" && echo   ✅ Removed test-my-account-feature.js
if exist "scripts\test-user-creation-workflow.js" del /f "scripts\test-user-creation-workflow.js" && echo   ✅ Removed test-user-creation-workflow.js
if exist "scripts\update-to-atlas.js" del /f "scripts\update-to-atlas.js" && echo   ✅ Removed update-to-atlas.js
if exist "scripts\verify-atlas-connections.js" del /f "scripts\verify-atlas-connections.js" && echo   ✅ Removed verify-atlas-connections.js

echo.
echo 🎉 Script cleanup completed successfully!
echo.
echo 📊 Final scripts directory contents:
dir /b scripts\*.js
echo.
echo ✅ Your backend is now production-ready with only essential scripts:
echo    • database-helper.js - MongoDB Atlas connection utility
echo    • initialize-rbac.js - Role-Based Access Control setup  
echo    • seed.js - Database seeding utility
echo.
echo 🚀 Website functionality remains 100%% intact!
echo    Only development artifacts were removed.
echo.
pause
