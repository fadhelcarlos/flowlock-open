# FlowLock Open

UX specification validation and code generation framework.

## Quick Start

```bash
# Option 1: Full install (may be slow on Windows)
pnpm install --no-frozen-lockfile

# Option 2: Quick install for core functionality only
./quick-install.sh

# Option 3: Build core packages manually
./build-core.sh

# Then use the CLI:
node packages/cli/dist/index.js init    # Initialize a UX spec
node packages/cli/dist/index.js audit   # Run audit checks

# Or if pnpm install completed:
pnpm -w uxcg init
pnpm -w uxcg audit
```

## Fixed Issues
- ✅ Removed duplicate `/app` folder (was incorrectly at root)
- ✅ Fixed Tailwind CSS imports in site (`@tailwind` directives)
- ✅ Downgraded chalk to v4 for CommonJS compatibility
- ✅ All core packages have correct dependencies

## Project Structure

```
flowlock-open/
├── packages/
│   ├── uxspec         # Schema and parser with Zod validation
│   ├── plugin-sdk     # FlowlockCheck interface and result shapes
│   ├── checks-core    # 3 core validation checks
│   ├── runner         # Orchestrates checks and generates artifacts
│   └── cli            # CLI with uxcg commands
├── apps/
│   └── site           # Next.js landing page
├── action/
│   └── uxcg-action    # GitHub composite action
└── app/screens/       # Sample React components
```

## Core Checks

1. **honest_reads** - Screens may only read fields that are captured by a form in the same flow, or marked derived (with provenance) or external (declared source)
2. **creatable_needs_detail** - Every entity with a create form must have a details screen and a discoverable path
3. **reachability** - Each flow's success screen is reachable from an entry in ≤3 steps (configurable)

## CLI Commands

- `uxcg init` - Initialize FlowLock project with starter spec
- `uxcg audit` - Run checks and generate artifacts
- `uxcg diagrams` - Generate only diagram artifacts
- `uxcg export <format>` - Export artifacts (junit|csv|svg)
- `uxcg watch --cloud` - Watch mode with optional cloud sync

## Generated Artifacts

After running `uxcg audit`, find these in `artifacts/`:
- `er.svg` - Entity relationship diagram
- `flow.svg` - Flow diagram
- `screens.csv` - Screen inventory
- `results.junit.xml` - Test results for CI

## Known Issues

- The site package requires `pnpm install` to complete for tailwindcss
- On Windows, use PowerShell or Git Bash for best results
- The audit command exits with error code when checks fail (by design)

## Development

```bash
# Build only core packages (skip site if needed)
cd packages/uxspec && pnpm build
cd ../plugin-sdk && pnpm build
cd ../checks-core && pnpm build
cd ../runner && pnpm build
cd ../cli && pnpm build

# Then from monorepo root:
node packages/cli/dist/index.js audit
```