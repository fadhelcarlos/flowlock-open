# FlowLock v3 Release Notes

**Release Date:** January 18, 2025  
**Version:** CLI 0.5.0 | Core Packages 0.4.1 | MCP 0.3.0

## 🎉 Headline

**FlowLock v3 achieves 100% feature parity with the original UX Contract Guardrails (UXCG) implementation**, plus significant enhancements for modern AI-assisted development workflows.

## 📦 Published Packages

```bash
npm install -g flowlock-uxcg@latest  # CLI v0.5.0
```

| Package | Version | Changes |
|---------|---------|---------|
| flowlock-uxcg | 0.5.0 | Enhanced CLI with v3 features |
| flowlock-uxspec | 0.4.1 | Schema enhancements, backward compatible |
| flowlock-checks-core | 0.4.1 | 11 checks (4 new) |
| flowlock-runner | 0.4.1 | Enhanced generators |
| flowlock-plugin-sdk | 0.4.1 | Support for new checks |
| flowlock-mcp | 0.3.0 | Fixed CommonJS issues |

## ✨ Major Features

### 1. Enhanced Schema (100% UXCG Compatible)

- **JTBD (Jobs To Be Done)** - Track user goals and outcomes
- **Entity Relations** - 1:1, 1:many, many:1, many:many
- **Screen Routes** - URL patterns with parameters
- **Components**:
  - Cards with display reads
  - Lists with sorting/filtering/pagination
  - CTAs for navigation
- **State Machines** - Entity state transitions
- **Glossary** - Derived field documentation

### 2. New Validation Checks (11 total, up from 7)

**New Checks:**
- **JTBD** - Jobs to flows mapping
- **RELATIONS** - Entity relationship validation
- **ROUTES** - Unique URL validation
- **CTAS** - Navigation validation

### 3. Enhanced Claude/Cursor Commands (5 total)

- `/ux-contract-init` - Create specs with v3 features
- `/ux-guardrails-validate` - Fix all 11 checks
- `/ux-generate-ui` - Complete UI scaffolding
- `/flow-audit-fix` - Close audit gaps
- `/ux-enhance-spec` ✨ **NEW** - Upgrade v2 to v3

### 4. Better Tooling

- **Husky Integration** - Git hooks for validation
- **Glossary Generation** - Auto-create glossary files
- **Enhanced Diagrams** - Relations, CTAs, state transitions
- **More CSV Reports** - Entities, Flows, JTBD

## 🔄 Migration

### Backward Compatibility

✅ **All v2 specs work without changes!**

The system automatically handles both old and new formats:

```json
// Old JTBD format (still works)
"jtbd": { "admin": ["task1", "task2"] }

// New JTBD format (recommended)
"jtbd": [{ "role": "admin", "tasks": ["task1", "task2"] }]
```

### Upgrade Path

1. **Automatic** (Recommended):
   ```bash
   # In Claude/Cursor
   /ux-enhance-spec
   ```

2. **Manual**:
   - Add relations to entities
   - Add routes to screens
   - Convert JTBD to array format
   - Add CTAs for navigation

## 📊 By the Numbers

- **11** validation checks (up from 7)
- **5** Claude commands (up from 4)
- **100%** UXCG feature parity
- **100%** backward compatible
- **4** new check types
- **6** packages updated

## 🚀 Getting Started

```bash
# Install latest CLI
npm install -g flowlock-uxcg@latest

# Initialize project with v3 features
uxcg init

# Run enhanced audit
uxcg audit

# Auto-fix issues
uxcg audit --fix
```

## 🔌 MCP Server Setup

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

## 📝 Example v3 Spec

```json
{
  "version": "1.0.0",
  "project": "my-app",
  "name": "My Application",
  
  "jtbd": [{
    "role": "admin",
    "tasks": ["Manage users"],
    "description": "Admin tasks"
  }],
  
  "entities": [{
    "id": "user",
    "fields": [...],
    "relations": [
      { "id": "orders", "to": "order", "kind": "1:many" }
    ]
  }],
  
  "screens": [{
    "id": "user-list",
    "routes": ["/users"],
    "lists": [{
      "id": "users",
      "reads": ["user.*"],
      "sortable": true
    }],
    "ctas": [{
      "label": "Add User",
      "to": "user-create",
      "type": "primary"
    }]
  }],
  
  "states": [{
    "entity": "user",
    "allowed": ["pending", "active"],
    "transitions": [
      { "from": "pending", "to": "active", "trigger": "verify" }
    ]
  }]
}
```

## 🐛 Bug Fixes

- Fixed MCP server ES module/CommonJS conflict
- Resolved TypeScript errors with MCP SDK v0.4.0
- Fixed CLI build warnings about require.resolve
- JTBD validation now handles both formats

## 📚 Documentation Updates

- [README.md](README.md) - Complete v3 overview
- [CHANGELOG.md](CHANGELOG.md) - Detailed version history
- [FLOWLOCK_COMPREHENSIVE_GUIDE.md](docs/FLOWLOCK_COMPREHENSIVE_GUIDE.md) - Full feature documentation
- [CLAUDE_COMMANDS_V3.md](docs/CLAUDE_COMMANDS_V3.md) - AI integration guide

## 🙏 Acknowledgments

FlowLock v3 represents a major milestone in achieving complete feature parity with the original UXCG implementation while adding modern enhancements for AI-assisted development.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/flowlock-open/issues)
- **Documentation**: [Comprehensive Guide](docs/FLOWLOCK_COMPREHENSIVE_GUIDE.md)
- **npm**: [@flowlock packages](https://www.npmjs.com/search?q=flowlock)

---

**Thank you for using FlowLock!** 🚀
