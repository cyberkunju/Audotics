@echo off
:: Audotics Test Runner Script for Windows
:: This script helps run the various tests for the Audotics application

title AUDOTICS TEST RUNNER v1.0
color 0B

echo ====================================
echo     AUDOTICS TEST RUNNER v1.0      
echo ====================================
echo.

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo Error: npm is not installed. Please install Node.js and npm before running this script.
    pause
    exit /b 1
)

:: Change to the testing directory
cd /d "%~dp0"

:: Check if dependencies are installed
if not exist "node_modules" (
    color 0E
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo Failed to install dependencies. Please check the error message above.
        pause
        exit /b 1
    )
    color 0A
    echo Dependencies installed successfully.
    color 0B
)

:: Print available options
echo Available options:
echo 1. Run all tests
echo 2. Run WebSocket tests
echo 3. Run ML Recommendation tests
echo 4. Run Performance tests
echo 5. Update test utilities
echo q. Quit
echo.

:: Ask for user input
set /p choice=Enter your choice: 

if "%choice%"=="1" (
    echo Running all tests...
    node run-all-tests.js
) else if "%choice%"=="2" (
    echo Running WebSocket tests...
    call npm run test:websocket
    if %ERRORLEVEL% EQU 0 (
        color 0A
        echo WebSocket tests completed successfully.
    ) else (
        color 0C
        echo WebSocket tests failed. Please check the logs above.
    )
    color 0B
) else if "%choice%"=="3" (
    echo Running ML Recommendation tests...
    call npm run test:ml
    if %ERRORLEVEL% EQU 0 (
        color 0A
        echo ML Recommendation tests completed successfully.
    ) else (
        color 0C
        echo ML Recommendation tests failed. Please check the logs above.
    )
    color 0B
) else if "%choice%"=="4" (
    echo Running Performance tests...
    call npm run test:performance
    if %ERRORLEVEL% EQU 0 (
        color 0A
        echo Performance tests completed successfully.
    ) else (
        color 0C
        echo Performance tests failed. Please check the logs above.
    )
    color 0B
) else if "%choice%"=="5" (
    echo Updating test utilities...
    call npm run update-utils
    if %ERRORLEVEL% EQU 0 (
        color 0A
        echo Test utilities updated successfully.
    ) else (
        color 0C
        echo Failed to update test utilities. Please check the logs above.
    )
    color 0B
) else if "%choice%"=="q" (
    echo Exiting...
    exit /b 0
) else if "%choice%"=="Q" (
    echo Exiting...
    exit /b 0
) else (
    color 0C
    echo Invalid choice. Please run the script again and select a valid option.
    pause
    exit /b 1
)

echo ====================================
color 0A
echo Test execution completed.
color 0B
echo Check the 'reports' directory for test results.
echo ====================================

pause 