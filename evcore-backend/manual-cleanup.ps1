# EVCORE Backend - Manual Script Cleanup Commands
# Execute these commands in PowerShell from the evcore-backend directory

# ============================================
# REMOVE DEVELOPMENT SCRIPTS (29 files)
# ============================================

# Testing Scripts
Remove-Item "scripts\analyze-scripts.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\check-harsha-account.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\check-pilot-account.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\cleanup-scripts.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\comprehensive-login-test.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\create-harsha-user.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\create-pilot-prasadh.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\create-test-users.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\diagnose-auth.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\final-atlas-test.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\production-audit.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\test-api-context.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\test-api-workflows.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\test-db-connection.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\test-default-credentials.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\test-harsha-login.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\test-live-auth.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\test-login-server.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\test-my-account-feature.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\test-user-creation-workflow.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\update-to-atlas.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\verify-atlas-connections.js" -Force -ErrorAction SilentlyContinue

# Debugging Scripts
Remove-Item "scripts\check-all-collections.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\check-all-users.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\check-harsha-pilot.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\check-user-permissions.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\debug-login.js" -Force -ErrorAction SilentlyContinue

# Development Scripts
Remove-Item "scripts\create-users-atlas.js" -Force -ErrorAction SilentlyContinue
Remove-Item "scripts\create-your-account.js" -Force -ErrorAction SilentlyContinue

# Verification Scripts (these too)
Remove-Item "scripts\verify-production.js" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Script cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Remaining scripts should be only:" -ForegroundColor Yellow
Get-ChildItem "scripts\*.js" | Select-Object Name
Write-Host ""
Write-Host "🎯 Expected: 3 production scripts only" -ForegroundColor Yellow
Write-Host "   • database-helper.js"
Write-Host "   • initialize-rbac.js" 
Write-Host "   • seed.js"
