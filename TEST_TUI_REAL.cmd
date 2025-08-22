@echo off
echo FlowLock TUI Real Terminal Test
echo ================================
echo.
echo This test will launch the TUI in a real terminal window.
echo.
echo Controls:
echo   Arrow Keys - Navigate menu
echo   Tab        - Cycle focus between panels  
echo   Ctrl+K     - Open command palette
echo   /          - Enter slash command
echo   Escape     - Close dialogs
echo   Ctrl+C     - Exit TUI
echo.

cd /d C:\dev\flowlock-open\packages\cli-tui

echo Building TUI...
call pnpm build

echo.
echo Launching TUI...
node dist\bin\flowlock.js

echo.
echo TUI exited.
pause