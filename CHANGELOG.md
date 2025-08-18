# Changelog

All notable changes to FlowLock packages will be documented in this file.

## [0.2.1] - 2025-08-18

### Fixed
- **flowlock-mcp**: Fixed TypeScript errors with MCP SDK v0.4.0 API
  - Updated to use correct `setRequestHandler` pattern
  - Fixed import paths for `StdioServerTransport`
  - Properly typed request handlers
- **flowlock-uxcg**: Fixed CLI build warning about external require.resolve
  - Added external configuration to tsup.config.ts

### Changed
- All packages updated to version 0.2.1
- flowlock-mcp updated to version 0.1.1

### Published
- All packages published to npm registry with public access
- Added proper git tags for version tracking

## [0.2.0] - 2025-08-17

### Added
- **flowlock-mcp**: New Model Context Protocol server package
  - Provides FlowLock tools for Claude Desktop
  - Supports audit, diagrams, init, and command generation
  - Compatible with MCP SDK v0.4.0

### Changed
- **flowlock-uxcg**: Enhanced CLI with new features
  - Added `agent` command for cloud connectivity
  - Improved `audit --fix` auto-healing capabilities
  - Better error messages and debug output

### Fixed
- **flowlock-checks-core**: Improved check normalization
  - Better handling of non-canonical fields
  - Preserves custom properties like roles and uiStates

## [0.1.0] - 2025-08-15

### Initial Release

#### Packages
- **flowlock-uxspec** (0.1.0): Core schema and validation
- **flowlock-plugin-sdk** (0.1.0): Plugin interface
- **flowlock-checks-core** (0.1.0): 7 built-in validation checks
- **flowlock-runner** (0.1.0): Check orchestration and artifacts
- **flowlock-uxcg** (0.1.0): Command-line interface

#### Features
- UX specification validation with Zod schemas
- 7 core validation checks:
  - HONEST_READS - Field read validation
  - CREATABLE_NEEDS_DETAIL - Create/detail screen validation
  - REACHABILITY - Flow reachability validation
  - UI_STATES - UI state completeness
  - STATE_MACHINES - State transition validation
  - SCREEN - Role-based access control
  - SPEC_COVERAGE - Coverage metrics
- Artifact generation:
  - Mermaid ER diagrams
  - Mermaid flow diagrams
  - Screen inventory CSV
  - JUnit XML results
  - Gap reports
  - Gherkin acceptance criteria
- CLI commands:
  - `init` - Project initialization
  - `audit` - Validation with optional auto-fix
  - `diagrams` - Diagram generation
  - `export` - Format-specific exports
  - `watch` - Development mode
- Claude/Cursor integration via command cards
- GitHub Actions support

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 0.2.1 | 2025-08-18 | Current |
| 0.2.0 | 2025-08-17 | |
| 0.1.0 | 2025-08-15 | Initial |

## Upgrading

### From 0.1.x to 0.2.x
1. Update all FlowLock packages to 0.2.1
2. Run `uxcg audit --fix` to update spec structure
3. Review new `.claude/commands/` files
4. Update CI/CD configurations if using cloud features

### From 0.2.0 to 0.2.1
- No breaking changes
- Simply update packages: `npm update`

## Compatibility Matrix

| Package | Node.js | TypeScript | Zod |
|---------|---------|------------|-----|
| 0.2.1 | >=18.0.0 | >=5.0.0 | ^3.22.0 |
| 0.2.0 | >=18.0.0 | >=5.0.0 | ^3.22.0 |
| 0.1.0 | >=16.0.0 | >=4.5.0 | ^3.20.0 |
