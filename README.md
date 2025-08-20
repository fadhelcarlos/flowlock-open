# FlowLock

**Agent-native UX contract and guardrails system** for consistent, auditable delivery without hallucinations.

[![npm version](https://img.shields.io/npm/v/flowlock-uxcg.svg)](https://www.npmjs.com/package/flowlock-uxcg)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🛵 Stop AI agents from hallucinating your UI

FlowLock ensures AI coding assistants follow your exact UX requirements through deterministic validation and runtime inventory extraction.

## 🚀 Quick Start

```bash
# No installation required - use npx
npx flowlock-uxcg@latest init
npx flowlock-uxcg@latest audit

# Or install globally for convenience
npm install -g flowlock-uxcg@latest
uxcg init
uxcg audit --fix

# For existing projects
npx flowlock-uxcg@latest init-existing
npx flowlock-uxcg@latest inventory
npx flowlock-uxcg@latest audit --inventory

# Debug check failures
npx flowlock-uxcg@latest debug <check> --verbose
```

## 🔒 Security & Trust

FlowLock mitigates AI hallucinations through deterministic validation:

### Example: HONEST Check Prevents Phantom Fields
**Without FlowLock:** AI might generate UI that reads `user.lastLogin` when that field doesn't exist in your database.
**With FlowLock:** The HONEST check fails immediately, blocking deployment of broken code.

```json
// ❌ AI tries to read undeclared field
"reads": ["user.lastLogin"]  

// ✅ FlowLock blocks it: "HONEST_READS failed: user.lastLogin not in entity"
```

Each of the 15 checks prevents specific failure modes, creating a safety net for AI-generated code.

## 🎯 FlowLock vs Schema-First Tools

| Feature | FlowLock | OpenAPI | JSON Schema | Storybook |
|---------|----------|---------|-------------|----------|
| **Jobs To Be Done (JTBD)** | ✅ Native support | ❌ | ❌ | ❌ |
| **Screen Routes** | ✅ With params | ⚖️ API only | ❌ | ❌ |
| **Role-Based Access** | ✅ Per screen | ⚖️ Global | ❌ | ❌ |
| **UI State Management** | ✅ Required | ❌ | ❌ | ⚖️ Manual |
| **Contract Validation** | ✅ 15 checks | ⚖️ Schema only | ⚖️ Schema only | ❌ |
| **Agent Safety** | ✅ Hallucination prevention | ❌ | ❌ | ❌ |
| **Runtime Inventory** | ✅ DB/API/UI extraction | ❌ | ❌ | ❌ |
| **Deterministic Audits** | ✅ SHA-256 hashing | ❌ | ❌ | ❌ |

## 📦 Latest Versions

| Package | Version | NPM | Install |
|---------|---------|-----|---------|
| **flowlock-uxcg** (CLI) | 0.9.0 | [🔗 npm](https://www.npmjs.com/package/flowlock-uxcg) | `npm i -g flowlock-uxcg` |
| **flowlock-uxspec** | 0.6.0 | [🔗 npm](https://www.npmjs.com/package/flowlock-uxspec) | `npm i flowlock-uxspec` |
| **flowlock-runner** | 0.6.0 | [🔗 npm](https://www.npmjs.com/package/flowlock-runner) | `npm i flowlock-runner` |
| **flowlock-checks-core** | 0.6.0 | [🔗 npm](https://www.npmjs.com/package/flowlock-checks-core) | `npm i flowlock-checks-core` |
| **flowlock-plugin-sdk** | 0.6.0 | [🔗 npm](https://www.npmjs.com/package/flowlock-plugin-sdk) | `npm i flowlock-plugin-sdk` |
| **flowlock-mcp** | 0.5.0 | [🔗 npm](https://www.npmjs.com/package/flowlock-mcp) | `npm i flowlock-mcp` |
| **flowlock-inventory** | 0.3.0 | [🔗 npm](https://www.npmjs.com/package/flowlock-inventory) | `npm i flowlock-inventory` |
| **flowlock-shared** | 0.3.0 | [🔗 npm](https://www.npmjs.com/package/flowlock-shared) | `npm i flowlock-shared` |

## 📚 Documentation

- **[Comprehensive Guide](docs/FLOWLOCK_COMPREHENSIVE_GUIDE.md)** - Complete documentation of all features
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Quick lookup for commands and syntax
- **[API Reference](docs/API_REFERENCE.md)** - Programmatic usage and custom checks
- **[Claude Commands](docs/CLAUDE_COMMANDS.md)** - AI assistant integration guide
- **[Architecture](docs/flowlock-architecture.md)** - System design and components
- **[Debug Guide](docs/debug-command.md)** - Troubleshooting check failures
- **[Debug Examples](examples/debug-usage.md)** - Real-world debugging scenarios

## ✨ Core Features

### 🎯 Comprehensive Schema

- **JTBD (Jobs To Be Done)** - Track user goals and link flows to specific outcomes
- **Entity Relations** - Define 1:1, 1:many, many:1, many:many relationships
- **Screen Routes** - URL patterns with dynamic parameters (`/users/:id`)
- **Enhanced Components**:
  - **Cards** - Display components with specific reads
  - **Lists** - Tables with sorting, filtering, pagination
  - **CTAs** - Navigation buttons with types (primary/secondary/link)
- **State Machines** - Entity state transitions with triggers
- **Glossary** - Document derived fields and external sources

### ✅ 15 Validation Checks

**Data Integrity:**
1. **HONEST** - Screens only read properly captured/derived/external fields
2. **CREATABLE** - Create forms have detail screens with discoverable paths
3. **REACHABILITY** - Success screens reachable within 3 steps
4. **UI** - All screens declare empty/loading/error states
5. **STATE** - Valid state machine transitions
6. **SCREEN** - All screens declare allowed roles
7. **SPEC** - Coverage metrics and completeness

**Business Logic:**
8. **JTBD** - Validates all Jobs To Be Done are addressed by flows
9. **RELATIONS** - Validates entity relationships and detects circular references
10. **ROUTES** - Ensures unique routes with proper formatting
11. **CTAS** - Validates navigation targets and detects orphaned screens

**Runtime Validation:**
12. **RUNTIME_DETERMINISM** - Guarantees reproducible audit results
13. **INVENTORY** - Validates DB/API/UI extraction against spec
14. **DATABASE_VALIDATION** - Validates transactions, indexes, and pooling
15. **MIGRATION_VALIDATION** - Ensures safe, reversible database changes

### 🔧 Enhanced Auto-Healing

The `--fix` flag now handles:
- Missing roles and UI states
- Screen type inference
- JTBD to flow linking
- Route generation
- CTA target validation
- State machine fixes
- Glossary generation

### 🤖 AI Agent Integration

- **5 Claude/Cursor commands**
  - `/ux-contract-init` - Create/refine spec with comprehensive validation
  - `/ux-guardrails-validate` - Fix all 15 checks
  - `/ux-generate-ui` - Scaffold complete UI components
  - `/flow-audit-fix` - Close audit gaps automatically
  - `/ux-enhance-spec` - Add missing features to existing specs
- **MCP server** - Native integration with Cursor/Claude Desktop
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

## 🎯 Jobs To Be Done (JTBD) Examples

JTBD captures what users need to accomplish, not just features:

```json
"jtbd": [
  {
    "role": "admin",
    "tasks": [
      "onboard new employees",
      "review team performance", 
      "manage access permissions"
    ],
    "description": "Manage team operations and ensure security compliance"
  },
  {
    "role": "customer",
    "tasks": [
      "find products within budget",
      "compare similar items",
      "complete purchase quickly"
    ],
    "description": "Make informed purchasing decisions efficiently"
  }
]
```

These aren't just labels - FlowLock validates that every JTBD task has a corresponding flow implementation.

## 🎯 Example `uxspec.json`

```json
{
  "version": "1.0.0",
  "project": "user-mgmt",
  "name": "User Management System",
  "description": "Complete user management with all features",
  
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

FlowLock is **fully backward compatible**. Existing specs continue to work!

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
│   ├── uxspec/         # Schema definitions (Zod) - enhanced
│   ├── plugin-sdk/     # Plugin interface
│   ├── checks-core/    # 15 validation checks (8 new)
│   ├── runner/         # Orchestration with enhanced generators
│   ├── cli/            # CLI with 5 Claude commands
│   └── mcp/            # MCP server
├── apps/
│   └── site/           # Documentation site (Next.js)
└── docs/               # Comprehensive documentation
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
- **[Check Reference](docs/FLOWLOCK_COMPREHENSIVE_GUIDE.md#built-in-checks)** - Understand all 15 checks
- **[Schema Reference](docs/API_REFERENCE.md)** - Complete schema documentation
- **[Examples](example/)** - Sample projects with enhanced features

## 📈 Roadmap

- [x] Complete UXCG feature parity
- [x] Enhanced Claude/Cursor commands
- [x] 15 validation checks
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

FlowLock achieves full feature parity with the original UX Contract Guardrails (UXCG) implementation, while adding:
- Modular architecture
- Better AI integration
- Cloud capabilities
- Enhanced validation
- Richer artifacts

---

**Built with ❤️ for AI-assisted development** | **100% UXCG Feature Complete**