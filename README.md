# FlowLock Open v3

**Agent-native UX contract and guardrails system** for consistent, auditable delivery without hallucinations.

[![npm version](https://img.shields.io/npm/v/flowlock-uxcg.svg)](https://www.npmjs.com/package/flowlock-uxcg)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🎉 FlowLock v3 - Complete Feature Parity with Original UXCG

FlowLock v3 brings 100% feature parity with the original UX Contract Guardrails (UXCG) implementation, plus significant enhancements for modern development workflows.

## 🚀 Quick Start

```bash
# Install CLI globally
npm install -g flowlock-uxcg@latest

# Initialize a new project
uxcg init

# Run validation (11 checks)
uxcg audit

# Auto-fix issues
uxcg audit --fix

# Generate diagrams only
uxcg diagrams
```

## 📦 Latest Versions

| Package | Version | Install |
|---------|---------|---------|
| [flowlock-uxcg](https://www.npmjs.com/package/flowlock-uxcg) (CLI) | 0.5.0 | `npm i -g flowlock-uxcg` |
| [flowlock-uxspec](https://www.npmjs.com/package/flowlock-uxspec) | 0.4.1 | `npm i flowlock-uxspec` |
| [flowlock-runner](https://www.npmjs.com/package/flowlock-runner) | 0.4.1 | `npm i flowlock-runner` |
| [flowlock-checks-core](https://www.npmjs.com/package/flowlock-checks-core) | 0.4.1 | `npm i flowlock-checks-core` |
| [flowlock-plugin-sdk](https://www.npmjs.com/package/flowlock-plugin-sdk) | 0.4.1 | `npm i flowlock-plugin-sdk` |
| [flowlock-mcp](https://www.npmjs.com/package/flowlock-mcp) | 0.3.0 | `npm i flowlock-mcp` |

## 📚 Documentation

- **[Comprehensive Guide](docs/FLOWLOCK_COMPREHENSIVE_GUIDE.md)** - Complete documentation of all features
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Quick lookup for commands and syntax
- **[API Reference](docs/API_REFERENCE.md)** - Programmatic usage and custom checks
- **[Claude Commands v3](docs/CLAUDE_COMMANDS_V3.md)** - AI assistant integration guide
- **[Architecture](docs/flowlock-architecture.md)** - System design and components

## ✨ What's New in v3

### 🎯 Enhanced Schema Features

- **JTBD (Jobs To Be Done)** - Track user goals and link flows to specific outcomes
- **Entity Relations** - Define 1:1, 1:many, many:1, many:many relationships
- **Screen Routes** - URL patterns with dynamic parameters (`/users/:id`)
- **Enhanced Components**:
  - **Cards** - Display components with specific reads
  - **Lists** - Tables with sorting, filtering, pagination
  - **CTAs** - Navigation buttons with types (primary/secondary/link)
- **State Machines** - Entity state transitions with triggers
- **Glossary** - Document derived fields and external sources

### ✅ 11 Validation Checks (up from 7)

**Core Checks:**
1. **HONEST** - Screens only read properly captured/derived/external fields
2. **CREATABLE** - Create forms have detail screens with discoverable paths
3. **REACHABILITY** - Success screens reachable within 3 steps
4. **UI** - All screens declare empty/loading/error states
5. **STATE** - Valid state machine transitions
6. **SCREEN** - All screens declare allowed roles
7. **SPEC** - Coverage metrics and completeness

**New Checks in v3:**
8. **JTBD** - Validates all Jobs To Be Done are addressed by flows
9. **RELATIONS** - Validates entity relationships and detects circular references
10. **ROUTES** - Ensures unique routes with proper formatting
11. **CTAS** - Validates navigation targets and detects orphaned screens

### 🔧 Enhanced Auto-Healing

The `--fix` flag now handles:
- Missing roles and UI states
- Screen type inference
- JTBD to flow linking
- Route generation
- CTA target validation
- State machine fixes
- Glossary generation

### 🤖 Enhanced AI Agent Integration

- **5 Claude/Cursor commands** (up from 4)
  - `/ux-contract-init` - Create/refine spec with v3 features
  - `/ux-guardrails-validate` - Fix all 11 checks
  - `/ux-generate-ui` - Scaffold complete UI
  - `/flow-audit-fix` - Close audit gaps
  - `/ux-enhance-spec` ✨ NEW - Upgrade v2 specs to v3
- **MCP server** - Fixed and working with Cursor/Claude Desktop
- **Better error messages** - Agent-friendly with actionable fixes

### 📊 Enhanced Artifacts

Every audit generates:
- **Entity relationship diagrams** - With relations notation
- **Flow diagrams** - With JTBD links and state transitions
- **Screen inventory CSV** - With routes, CTAs, components
- **Entities CSV** - With relations and field constraints
- **Flows CSV** - With JTBD and success criteria
- **JTBD CSV** - Task to flow mapping
- **Test results** (JUnit XML)
- **Gap reports** (Markdown)
- **Acceptance criteria** (Gherkin)

## 🎯 Example `uxspec.json` (v3)

```json
{
  "version": "1.0.0",
  "project": "user-mgmt",
  "name": "User Management System",
  "description": "Complete user management with all v3 features",
  
  "roles": [
    { 
      "id": "admin", 
      "name": "Administrator", 
      "permissions": ["create", "read", "update", "delete"] 
    }
  ],
  
  "jtbd": [
    {
      "role": "admin",
      "tasks": ["Manage users", "View reports"],
      "description": "Administrative tasks"
    }
  ],
  
  "entities": [{
    "id": "user",
    "name": "User",
    "fields": [
      { "id": "email", "name": "Email", "type": "email", "required": true },
      { "id": "created", "name": "Created", "type": "date", 
        "derived": true, "provenance": "system.timestamp" }
    ],
    "relations": [
      { "id": "orders", "to": "order", "kind": "1:many" }
    ]
  }],
  
  "screens": [{
    "id": "user-list",
    "name": "User List",
    "type": "list",
    "routes": ["/users", "/admin/users"],
    "roles": ["admin"],
    "lists": [{
      "id": "users",
      "reads": ["user.email", "user.created"],
      "sortable": true,
      "filterable": true,
      "paginated": true
    }],
    "ctas": [{
      "id": "create",
      "label": "Add User",
      "to": "user-create",
      "type": "primary"
    }],
    "uiStates": ["empty", "loading", "error"]
  }],
  
  "flows": [{
    "id": "create-user",
    "name": "Create User Flow",
    "jtbd": "admin",
    "role": "admin",
    "entryStepId": "s1",
    "steps": [{
      "id": "s1",
      "screen": "user-list",
      "writes": ["user.email"],
      "transition": {
        "entity": "user",
        "from": "pending",
        "to": "active"
      }
    }],
    "success": {
      "screen": "user-detail",
      "message": "User created successfully"
    }
  }],
  
  "states": [{
    "entity": "user",
    "allowed": ["pending", "active", "suspended"],
    "initial": "pending",
    "transitions": [
      { "from": "pending", "to": "active", "trigger": "verify" }
    ]
  }],
  
  "glossary": [{
    "term": "system.timestamp",
    "definition": "Server-generated timestamp",
    "formula": "new Date().toISOString()"
  }]
}
```

## 🔄 Migration from v2

FlowLock v3 is **fully backward compatible**. Existing specs continue to work!

### Automatic Migration

Use the new Claude/Cursor command:
```
/ux-enhance-spec
```

### Manual Migration

1. **JTBD** - Convert object format to array:
   ```json
   // Old: { "admin": ["task1"] }
   // New: [{ "role": "admin", "tasks": ["task1"] }]
   ```

2. **Add Relations** to entities:
   ```json
   "relations": [
     { "id": "orders", "to": "order", "kind": "1:many" }
   ]
   ```

3. **Enhance Screens** with routes and CTAs:
   ```json
   "routes": ["/users"],
   "ctas": [{ "label": "Add", "to": "create", "type": "primary" }]
   ```

## 🔌 Claude Desktop / Cursor Integration

Add to your config:
```json
{
  "mcpServers": {
    "flowlock": {
      "command": "npx",
      "args": ["flowlock-mcp@latest"]
    }
  }
}
```

## 🚢 CI/CD Integration

### GitHub Actions
```yaml
- name: FlowLock Audit
  run: npx flowlock-uxcg@latest audit
  
- name: Upload Artifacts
  uses: actions/upload-artifact@v4
  with:
    name: flowlock-artifacts
    path: artifacts/
```

### Pre-commit Hook (via Husky)
```bash
# Set up during init
npx flowlock-uxcg init
# Choose "Yes" for Husky integration
```

## 🏗️ Project Structure

```
flowlock-open/
├── packages/
│   ├── uxspec/         # Schema definitions (Zod) - v3 enhanced
│   ├── plugin-sdk/     # Plugin interface
│   ├── checks-core/    # 11 validation checks (4 new)
│   ├── runner/         # Orchestration with enhanced generators
│   ├── cli/            # CLI with 5 Claude commands
│   └── mcp/            # MCP server (fixed for v3)
├── apps/
│   └── site/           # Documentation site (Next.js)
└── docs/               # Comprehensive v3 documentation
```

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/yourusername/flowlock-open.git
cd flowlock-open

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Publish packages
pnpm changeset
pnpm changeset version
pnpm -r publish --access public
```

## 🎓 Learning Resources

- **[Quick Start Tutorial](docs/QUICK_REFERENCE.md)** - Get started in 5 minutes
- **[Check Reference](docs/FLOWLOCK_COMPREHENSIVE_GUIDE.md#built-in-checks)** - Understand all 11 checks
- **[Schema Reference](docs/API_REFERENCE.md)** - Complete schema documentation
- **[Examples](example/)** - Sample projects with v3 features

## 📈 Roadmap

- [x] Complete UXCG feature parity (v3.0)
- [x] Enhanced Claude/Cursor commands
- [x] 11 validation checks
- [x] JTBD, relations, routes, CTAs
- [ ] Visual spec editor
- [ ] VSCode extension
- [ ] Framework adapters (React, Vue, Angular)
- [ ] More language SDKs
- [ ] Cloud dashboard v2

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Key Areas for Contribution
- Additional validation checks
- Framework integrations
- Language SDKs
- Documentation improvements
- Bug fixes

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Comprehensive Guide](docs/FLOWLOCK_COMPREHENSIVE_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/flowlock-open/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/flowlock-open/discussions)
- **npm**: [@flowlock packages](https://www.npmjs.com/search?q=%40flowlock)

## 🏆 Acknowledgments

FlowLock v3 achieves full feature parity with the original UX Contract Guardrails (UXCG) implementation, while adding:
- Modular architecture
- Better AI integration
- Cloud capabilities
- Enhanced validation
- Richer artifacts

---

**Built with ❤️ for AI-assisted development** | **100% UXCG Feature Complete**