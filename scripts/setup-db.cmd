@echo off
REM Database Setup Script for Local Development (Windows)
REM Creates and initializes the local D1 database

echo Setting up local D1 database...

REM Check if wrangler is installed
where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: wrangler CLI not found
    echo Install with: npm install -g wrangler
    exit /b 1
)

REM Create local D1 database
echo Creating local D1 database...
wrangler d1 create claudemix-dev 2>nul || echo Database already exists (ok)

REM Apply migrations
echo Applying database migrations...
if exist "migrations\0001_initial_schema.sql" (
    wrangler d1 execute claudemix-dev --local --file=migrations/0001_initial_schema.sql
    echo Migration 0001_initial_schema.sql applied
) else (
    echo No migrations found
)

echo Database setup complete!
echo.
echo Next steps:
echo    1. Start dev server: npm run dev:wrangler
echo    2. Run E2E tests: npx playwright test tests/e2e/account
