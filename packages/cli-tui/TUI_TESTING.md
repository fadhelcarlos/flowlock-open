# TUI Testing Instructions

## The TUI is built and ready for testing

The TUI has been successfully:
- Built with proper ESM configuration
- Fixed all TypeScript module resolution errors  
- Configured with all required dependencies

## How to Test

### Windows - Use Command Prompt or PowerShell

1. Open a **real terminal** (Command Prompt or PowerShell)
2. Navigate to: `C:\dev\flowlock-open`
3. Run: `TEST_TUI_REAL.cmd`

Or manually:
```cmd
cd C:\dev\flowlock-open\packages\cli-tui
node dist\bin\flowlock.js
```

### Important: TTY Requirements

The TUI **requires** a real terminal with TTY support. It will NOT work in:
- This development environment
- CI/CD pipelines  
- Non-interactive shells
- Programmatic test scripts

This is because Ink (the TUI framework) needs direct access to stdin/stdout TTY features for keyboard input handling.

## What You Should See

When running in a proper terminal:
1. The TUI should launch with a sidebar menu
2. Navigation with arrow keys
3. Command palette with Ctrl+K
4. Input bar at the bottom for slash commands

## Controls

- **Arrow Keys**: Navigate menu
- **Enter**: Select item
- **Ctrl+K**: Open command palette
- **Ctrl+C**: Exit
- **/**: Type slash commands
- **Escape**: Close dialogs

## Troubleshooting

If you see errors about `stdin.ref is not a function`, you're not in a real TTY environment.

The TUI must be tested in an actual terminal window, not through any automated or programmatic execution.