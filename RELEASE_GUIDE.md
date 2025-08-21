# FlowLock TUI Release Guide

## Next Steps for Publishing

### 1. Push to Remote Repository
```bash
git push origin main
```

### 2. Version Management
The TUI package is currently at v1.0.0. For initial release:
- Keep as 1.0.0 for first npm publish
- Or align with CLI version (0.10.0) for consistency

To update version:
```bash
cd packages/cli-tui
npm version 0.10.0  # or keep 1.0.0
```

### 3. Build All Packages
```bash
# Build dependencies first
pnpm build:deps

# Build TUI package
pnpm --filter @flowlock/cli-tui build

# Or build everything
pnpm build
```

### 4. Publishing Options

#### Option A: Publish TUI as Standalone Package
```bash
cd packages/cli-tui
npm publish --access public
```

Users install with:
```bash
npm install -g @flowlock/cli-tui
flowlock  # launches TUI
```

#### Option B: Publish as Main FlowLock CLI
1. Update package name in `packages/cli-tui/package.json`:
   ```json
   "name": "@flowlock/cli"
   ```

2. Publish:
   ```bash
   cd packages/cli-tui
   npm publish --access public
   ```

Users install with:
```bash
npm install -g @flowlock/cli
flowlock  # launches TUI
```

### 5. Post-Publish Steps

1. **Update main README.md** with installation instructions:
   ```markdown
   ## Installation
   npm install -g @flowlock/cli-tui
   # or
   npm install -g @flowlock/cli
   ```

2. **Create GitHub Release**:
   ```bash
   gh release create v0.10.0 --title "FlowLock v0.10.0 - Interactive TUI" --notes "..."
   ```

3. **Update documentation site** (if applicable)

### 6. Testing Before Publishing

```bash
# Test local installation
cd packages/cli-tui
npm pack
npm install -g flowlock-cli-tui-1.0.0.tgz

# Test the binary
flowlock --help
flowlock  # should launch TUI if TTY available
```

### 7. CI/CD Compatibility Check

Ensure backward compatibility:
```bash
# Test headless mode
CI=true flowlock audit --level strict
flowlock --no-ui inventory
```

## Publishing Checklist

- [ ] All tests passing
- [ ] Build successful
- [ ] Version number updated appropriately
- [ ] README updated with installation instructions
- [ ] Tested local installation
- [ ] Verified TTY detection works
- [ ] Verified headless fallback works
- [ ] Pushed to remote repository
- [ ] NPM authentication configured (`npm login`)
- [ ] Published to npm registry
- [ ] Created GitHub release
- [ ] Announced in relevant channels

## Rollback Plan

If issues arise after publishing:
```bash
# Unpublish (within 72 hours)
npm unpublish @flowlock/cli-tui@1.0.0

# Or deprecate
npm deprecate @flowlock/cli-tui@1.0.0 "Use @flowlock/cli instead"
```

## Notes

- The TUI package wraps the existing CLI (`uxcg`) via child processes
- Full backward compatibility maintained
- TTY detection ensures CI/CD pipelines continue working
- Settings persist to `~/.flowlock/state.json`
- The `flowlock` binary is the new entry point