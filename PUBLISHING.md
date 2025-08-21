# FlowLock Publishing Guide

## 🚀 Complete Publishing Process

### Prerequisites
1. **NPM Account**: Ensure you have an npm account with publishing rights
2. **Authentication**: Run `npm login` and authenticate
3. **Clean Working Directory**: Commit all changes
4. **Updated Versions**: All packages are at v0.10.0

### Package Structure
All FlowLock packages are now at **v0.10.0** with the following publishing order:

| Level | Package | Description | Dependencies |
|-------|---------|-------------|--------------|
| 1 | `flowlock-shared` | Core utilities | None |
| 1 | `flowlock-uxspec` | UX specifications | None |
| 2 | `flowlock-plugin-sdk` | Plugin SDK | uxspec |
| 2 | `flowlock-inventory` | Inventory extraction | shared |
| 3 | `flowlock-checks-core` | Core validation | shared, uxspec, plugin-sdk |
| 3 | `flowlock-runner` | Test runner | checks-core, plugin-sdk, shared, uxspec |
| 4 | `flowlock-uxcg` | CLI tool | All above |
| 5 | `@flowlock/cli-tui` | Interactive TUI | uxcg, shared |

## 📝 Step-by-Step Publishing

### 1. Final Checks
```bash
# Verify all builds pass
pnpm build

# Run tests
pnpm test

# Check versions
node -e "require('./packages/cli/package.json').version === '0.10.0' && console.log('✅ Versions aligned')"
```

### 2. Dry Run (Recommended First)
```bash
# Test the publishing process without actually publishing
node scripts/publish-all.js --dry-run
```

### 3. Actual Publishing

#### Option A: Automated Publishing (Recommended)
```bash
# This will publish all packages in the correct order
node scripts/publish-all.js
```

#### Option B: Manual Publishing
```bash
# If automated fails, publish manually in this exact order:

# Level 1: Foundation
cd packages/shared && npm publish --access public && cd ../..
cd packages/uxspec && npm publish --access public && cd ../..

# Level 2: Mid-tier
cd packages/plugin-sdk && npm publish --access public && cd ../..
cd packages/inventory && npm publish --access public && cd ../..

# Level 3: Core
cd packages/checks-core && npm publish --access public && cd ../..
cd packages/runner && npm publish --access public && cd ../..

# Level 4: CLI
cd packages/cli && npm publish --access public && cd ../..

# Level 5: TUI
cd packages/cli-tui && npm publish --access public && cd ../..
```

### 4. Post-Publishing Verification
```bash
# Verify all packages are published
npm view flowlock-shared@0.10.0
npm view flowlock-uxspec@0.10.0
npm view flowlock-plugin-sdk@0.10.0
npm view flowlock-inventory@0.10.0
npm view flowlock-checks-core@0.10.0
npm view flowlock-runner@0.10.0
npm view flowlock-uxcg@0.10.0
npm view @flowlock/cli-tui@0.10.0
```

### 5. Test Global Installation
```bash
# Test the TUI package
npm install -g @flowlock/cli-tui
flowlock --help
flowlock  # Should launch TUI if TTY available

# Test the CLI package
npm install -g flowlock-uxcg
uxcg --help
```

## 🏷️ Creating a GitHub Release

### 1. Push All Changes
```bash
git push origin main
```

### 2. Create Release Tag
```bash
git tag v0.10.0 -m "Release v0.10.0 - Interactive TUI and unified versioning"
git push origin v0.10.0
```

### 3. Create GitHub Release
```bash
gh release create v0.10.0 \
  --title "FlowLock v0.10.0 - Interactive TUI Release" \
  --notes "## 🎉 Major Release: v0.10.0

### ✨ New Features
- **Interactive TUI**: Brand new terminal UI with Ink
- **Command Palette**: Fuzzy search commands with Ctrl+K
- **Unified Versioning**: All packages now at v0.10.0
- **Improved DX**: Rich interactive experience for development

### 📦 Published Packages
- flowlock-shared@0.10.0
- flowlock-uxspec@0.10.0
- flowlock-plugin-sdk@0.10.0
- flowlock-inventory@0.10.0
- flowlock-checks-core@0.10.0
- flowlock-runner@0.10.0
- flowlock-uxcg@0.10.0
- @flowlock/cli-tui@0.10.0

### 🚀 Installation
\`\`\`bash
# Interactive TUI
npm install -g @flowlock/cli-tui
flowlock

# Traditional CLI
npm install -g flowlock-uxcg
uxcg --help
\`\`\`

### 🔄 Breaking Changes
None - Full backward compatibility maintained

### 📚 Documentation
See README.md for updated installation and usage instructions."
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Package already exists" Error
If a package was partially published:
```bash
# Increment version and republish
cd packages/[package-name]
npm version patch
npm publish --access public
```

#### 2. Authentication Issues
```bash
npm logout
npm login
# Follow prompts
```

#### 3. Build Failures
```bash
# Clean and rebuild
rm -rf packages/*/dist
pnpm build
```

#### 4. Dependency Resolution Issues
```bash
# Reset workspace dependencies
node scripts/fix-workspace-deps.js
pnpm install
pnpm build
```

## 📊 Publishing Checklist

- [ ] All tests passing (`pnpm test`)
- [ ] All builds successful (`pnpm build`)
- [ ] Versions updated to 0.10.0
- [ ] Workspace dependencies using `workspace:*`
- [ ] NPM authentication (`npm whoami`)
- [ ] Dry run successful (`node scripts/publish-all.js --dry-run`)
- [ ] All packages published
- [ ] Global installation tested
- [ ] Git changes pushed
- [ ] GitHub release created
- [ ] Documentation updated

## 🔄 Rollback Procedure

If issues arise after publishing:

### Within 72 hours:
```bash
# Unpublish specific version
npm unpublish flowlock-[package]@0.10.0
```

### After 72 hours:
```bash
# Deprecate with message
npm deprecate flowlock-[package]@0.10.0 "Critical issue found, use 0.9.x"
```

## 📝 Notes

- The TUI package (`@flowlock/cli-tui`) provides the best developer experience
- The CLI package (`flowlock-uxcg`) maintains backward compatibility
- All packages use workspace protocol for local development
- Publishing order is critical due to dependencies
- Always test with dry-run first

## 🎯 Success Criteria

Publishing is successful when:
1. All 8 public packages are on npm at v0.10.0
2. Global installation works for both TUI and CLI
3. TTY detection properly switches between TUI and headless
4. All commands function correctly
5. CI/CD pipelines continue to work