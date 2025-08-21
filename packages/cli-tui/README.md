# @flowlock/cli-tui — FlowLock Persistent TUI

A persistent terminal UI for FlowLock with an Ink-based interface. Launch with `flowlock`.

## Features

- **Slash commands**: `/inventory`, `/audit --level enhanced`, `/export --format svg`
- **Command palette**: `Ctrl+K` for fuzzy command search
- **Artifacts viewer**: List and open generated files from `./artifacts`
- **Settings persistence**: Stored in `~/.flowlock/state.json` and `./.flowlock/state.json`
- **Real-time logs**: Timestamped command output streaming
- **Multiple views**: Home, Inventory, Audit, Diagrams, Export, Agent, Artifacts, Settings

## Backward Compatibility

- Non-TTY or `CI=true` → forwards to headless `uxcg`
- `--no-ui` forces headless path
- Seamless integration with existing scripts and CI/CD pipelines

## Installation

```bash
npm install -g @flowlock/cli-tui
```

## Usage

```bash
# Launch TUI interface (if TTY available)
flowlock

# Force headless mode
flowlock --no-ui

# Run specific command directly
flowlock audit --level strict
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Development mode with watch
pnpm --filter @flowlock/cli-tui dev

# Run tests
pnpm --filter @flowlock/cli-tui test
```

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/help` | List available commands | `/help` |
| `/inventory` | Scan project for DB/API/UI inventory | `/inventory --scope api` |
| `/audit` | Run UX specification checks | `/audit --level strict` |
| `/export` | Export artifacts in various formats | `/export --format svg,csv` |
| `/diagrams` | Generate Mermaid diagrams | `/diagrams --types er,flow` |
| `/init` | Initialize new FlowLock project | `/init` |
| `/init-existing` | Wire FlowLock into existing project | `/init-existing` |
| `/watch` | Watch mode with auto-run | `/watch --cloud` |
| `/agent` | Connect to FlowLock cloud | `/agent` |
| `/settings` | Open settings view | `/settings` |

## Keyboard Shortcuts

- `Ctrl+K` - Open command palette
- `Tab` - Cycle focus between panels
- `Enter` - Execute command or open file
- `Escape` - Close palette/cancel
- `Arrow Keys` - Navigate lists

## Architecture

The TUI package wraps the existing FlowLock CLI commands, providing a rich interactive interface while maintaining full backward compatibility. Commands are executed via child processes to the headless CLI, ensuring consistent behavior across both interfaces.