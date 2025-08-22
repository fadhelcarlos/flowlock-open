@echo off
echo FlowLock TUI Test
echo =================
echo.
echo Testing TUI launch...
echo.

cd C:\dev\flowlock-open

REM Test direct node execution
echo Testing direct execution:
node packages\cli-tui\dist\bin\flowlock.js

echo.
echo If you see the TUI interface, it's working!
echo Press Ctrl+C to exit.
pause