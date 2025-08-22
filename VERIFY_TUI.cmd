@echo off
echo ========================================
echo   FlowLock TUI Verification
echo ========================================
echo.

cd /d C:\dev\flowlock-open\packages\cli-tui

echo [1/3] Checking TypeScript compilation...
call pnpm tsc --noEmit
if %errorlevel% neq 0 (
    echo ERROR: TypeScript compilation failed!
    pause
    exit /b 1
)
echo SUCCESS: TypeScript compilation passed!
echo.

echo [2/3] Building TUI package...
call pnpm build > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo SUCCESS: Build completed!
echo.

echo [3/3] Verifying build output...
if not exist dist\index.js (
    echo ERROR: dist\index.js not found!
    pause
    exit /b 1
)
if not exist dist\bin\flowlock.js (
    echo ERROR: dist\bin\flowlock.js not found!
    pause
    exit /b 1
)
echo SUCCESS: All build outputs present!
echo.

echo ========================================
echo   ALL CHECKS PASSED!
echo ========================================
echo.
echo The TUI is ready to run. To test it:
echo   1. Open a new terminal window
echo   2. Run: TEST_TUI_REAL.cmd
echo.
pause