# Changelog

All notable changes to FlowLock will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2025-01-18 (CLI) / [0.4.1] - 2025-01-18 (Core Packages)

### 🎉 Major Release: FlowLock v3 - Complete UXCG Feature Parity

This release brings FlowLock to 100% feature parity with the original UX Contract Guardrails (UXCG) implementation, plus significant enhancements.

### Added

#### New Schema Features
- **JTBD (Jobs To Be Done)** - Track user goals and link flows to specific outcomes
- **Entity Relations** - Define 1:1, 1:many, many:1, many:many relationships
- **Screen Routes** - URL patterns with dynamic parameters (e.g., `/users/:id`)
- **Enhanced Screen Components**:
  - **Cards** - Display components with specific reads and titles
  - **Lists** - Configurable tables with sorting, filtering, pagination flags
  - **CTAs** - Navigation buttons with types (primary, secondary, link)
- **State Machines** - Enhanced state transitions with triggers and terminal states
- **Glossary** - Document derived fields with formulas and external sources

#### New Validation Checks (4 new, 11 total)
- **JTBD Check** - Validates all Jobs To Be Done are addressed by flows
- **Relations Check** - Validates entity relationships and detects circular references
- **Routes Check** - Ensures unique routes with proper formatting
- **CTAs Check** - Validates navigation targets and detects orphaned screens

#### CLI Enhancements (`flowlock-uxcg` 0.5.0)
- **Husky Integration** - Optional git hooks for pre-commit validation
- **Glossary Templates** - Auto-generates `glossary.yml` and `glossary.md`
- **Enhanced Starter Spec** - Comprehensive template with all v3 features
- **New Claude Command** - `/ux-enhance-spec` for upgrading v2 specs to v3
- **Updated Claude Commands** - All 5 commands now support v3 features

#### Generator Updates
- **Enhanced ER Diagrams** - Show entity relations with proper Mermaid notation
- **Flow Diagrams** - Include JTBD links, state transitions, and CTA navigation
- **New CSV Reports** - Entities CSV, Flows CSV, and JTBD CSV
- **Enhanced Screen CSV** - Includes routes, roles, UI states, all components

### Changed

#### Backward Compatible Changes
- **JTBD Format** - Now supports both array format (new) and object format (legacy)
- **Screen Structure** - Enhanced but maintains backward compatibility
- **Flow Structure** - Added optional fields while keeping existing ones

#### Package Updates
- `flowlock-uxspec` 0.4.1 - Enhanced schema with backward compatibility
- `flowlock-checks-core` 0.4.1 - 11 checks (up from 7)
- `flowlock-runner` 0.4.1 - Enhanced generators and JTBD support
- `flowlock-plugin-sdk` 0.4.1 - Support for new check types
- `flowlock-mcp` 0.3.0 - Fixed ES module/CommonJS issues

### Fixed
- **MCP Server** - Resolved ES module/CommonJS conflict for npx execution
- **TypeScript Errors** - Fixed MCP SDK v0.4.0 compatibility issues
- **CLI Build Warnings** - Resolved require.resolve external module warnings
- **JTBD Validation** - Handles both old and new formats without errors

### Documentation
- **Comprehensive Guide** - Updated with all v3 features
- **API Reference** - Complete schema documentation
- **Claude Commands Guide** - New documentation for AI integration
- **Quick Reference** - Updated with new commands and features
- **Migration Guide** - Instructions for upgrading from v2 to v3

## [0.2.1] - 2025-01-10

### Fixed
- MCP server TypeScript compatibility with SDK v0.4.0
- Import paths for StdioServerTransport
- Tool registration using setRequestHandler pattern

## [0.2.0] - 2025-01-08

### Added
- Model Context Protocol (MCP) server package
- Cloud integration with dashboard
- Agent mode for continuous monitoring
- Watch mode for development
- Export command for various formats

### Changed
- Improved auto-fix capabilities
- Enhanced error messages
- Better artifact generation

## [0.1.0] - 2025-01-01

### Initial Release
- Core validation framework with 7 checks
- CLI with init, audit, and diagrams commands
- Zod-based schema validation
- Mermaid diagram generation
- CSV and JUnit reporting
- Claude command cards integration
- GitHub Actions support

---

## Migration Guides

### From v0.2.x to v0.4.x/v0.5.x

#### For Existing Projects

1. **Update packages**:
   ```bash
   npm install -g flowlock-uxcg@latest
   ```

2. **Update Claude commands**:
   ```bash
   npx flowlock-uxcg init
   # Choose to update Claude commands
   ```

3. **Enhance your spec** (optional):
   - Use `/ux-enhance-spec` command in Claude/Cursor
   - Or manually add new features to your `uxspec.json`

#### JTBD Format Migration

Old format (still supported):
```json
"jtbd": {
  "admin": ["Manage users", "View reports"]
}
```

New format (recommended):
```json
"jtbd": [
  {
    "role": "admin",
    "tasks": ["Manage users", "View reports"],
    "description": "Administrative tasks"
  }
]
```

### From v0.1.x to v0.2.x

1. Update CLI: `npm install -g flowlock-uxcg@0.2.1`
2. Run `uxcg init` to get new features
3. Use `uxcg audit --fix` for auto-healing

## Compatibility Matrix

| FlowLock Version | Node.js | npm | Features |
|-----------------|---------|-----|----------|
| 0.5.0 (CLI)     | ≥18     | ≥9  | Full v3 features, 11 checks |
| 0.4.1 (Core)    | ≥18     | ≥9  | Enhanced schema, backward compatible |
| 0.2.x           | ≥16     | ≥8  | 7 checks, MCP server |
| 0.1.x           | ≥16     | ≥8  | Initial release |

## Breaking Changes

### v0.5.0/v0.4.1
None - Fully backward compatible!

### v0.2.0
- Changed from CommonJS to ESM modules (reverted in v0.2.1)

### v0.1.0
- Initial release, no breaking changes