# Running the FlowLock TUI

The TUI requires a real terminal (TTY) to run. The issue you encountered is that:
1. The TUI only launches when no arguments are provided AND you're in a TTY
2. Ink 5 requires ESM modules (we've fixed this)

## To Run the TUI

### Option 1: Direct Node Execution (Recommended for Testing)
Open a **real terminal** (PowerShell, CMD, or Windows Terminal) and run:

```powershell
cd C:\dev\flowlock-open\packages\cli-tui
npm link
flowlock
```

**Important**: Run just `flowlock` with NO arguments. Don't use `--help` or any other flags.

### Option 2: Force TUI Mode
If the TTY detection is still not working, create this test file:

**test-tui.cmd:**
```batch
@echo off
cd C:\dev\flowlock-open\packages\cli-tui
set CI=
node dist/bin/flowlock.js
```

Then run `test-tui.cmd` in a terminal.

### Option 3: Use npx (After Publishing)
Once npm CDN syncs (usually 15 minutes):
```bash
npx @flowlock/cli-tui
```

## What You Should See

When the TUI launches successfully, you'll see:
- A sidebar with navigation options (Home, Inventory, Audit, etc.)
- A main content area
- An input bar at the bottom
- "Press Ctrl+K for palette • Type /help for commands" at the bottom

## Troubleshooting

### If you see the regular CLI help
- You're passing arguments (don't use --help)
- TTY is not detected (use a real terminal, not a pipe or redirect)
- The binary is falling back to uxcg

### If you get module errors
- The package is now built as ESM
- Make sure you've run `pnpm build` in the cli-tui directory
- Check that package.json has `"type": "module"`

### To verify TTY detection
In your terminal, run:
```powershell
node -e "console.log('TTY:', process.stdout.isTTY, process.stdin.isTTY)"
```
Should output: `TTY: true true`

## The TUI Features

Once running, you can:
- Navigate with arrow keys in the sidebar
- Press `Ctrl+K` to open command palette
- Type `/inventory`, `/audit`, etc. in the input bar
- Press Tab to cycle focus between panels
- View artifacts and open them with Enter

## Note on CI/CD

The TUI automatically falls back to headless mode when:
- `CI=true` environment variable is set
- No TTY is available (pipes, redirects)
- Arguments are passed (like --help, audit, etc.)

This ensures your CI/CD pipelines continue to work without modification.