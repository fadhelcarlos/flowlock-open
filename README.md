# FlowLock Open

**Agent-native UX contract and guardrails system** for consistent, auditable delivery without hallucinations.

[![npm version](https://img.shields.io/npm/v/flowlock-uxcg.svg)](https://www.npmjs.com/package/flowlock-uxcg)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# Install CLI globally
npm install -g flowlock-uxcg

# Initialize a new project
uxcg init

# Run validation
uxcg audit

# Auto-fix issues
uxcg audit --fix
```

## 📦 Latest Versions

| Package | Version | Install |
|---------|---------|---------|
| [flowlock-uxcg](https://www.npmjs.com/package/flowlock-uxcg) (CLI) | 0.2.1 | `npm i -g flowlock-uxcg` |
| [flowlock-uxspec](https://www.npmjs.com/package/flowlock-uxspec) | 0.2.1 | `npm i flowlock-uxspec` |
| [flowlock-runner](https://www.npmjs.com/package/flowlock-runner) | 0.2.1 | `npm i flowlock-runner` |
| [flowlock-checks-core](https://www.npmjs.com/package/flowlock-checks-core) | 0.2.1 | `npm i flowlock-checks-core` |
| [flowlock-plugin-sdk](https://www.npmjs.com/package/flowlock-plugin-sdk) | 0.2.1 | `npm i flowlock-plugin-sdk` |
| [flowlock-mcp](https://www.npmjs.com/package/flowlock-mcp) | 0.1.1 | `npm i flowlock-mcp` |

## 📚 Documentation

- **[Comprehensive Guide](docs/FLOWLOCK_COMPREHENSIVE_GUIDE.md)** - Complete documentation of all features
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Quick lookup for commands and syntax
- **[API Reference](docs/API_REFERENCE.md)** - Programmatic usage and custom checks
- **[Architecture](docs/flowlock-architecture.md)** - System design and components

## ✨ Key Features

### 🎯 Specification-Driven Development
Define your entire UX in a single `uxspec.json` file:
- Roles & permissions
- Data entities & fields  
- Screens & UI states
- User flows
- Business policies

### ✅ 7 Core Validation Checks
1. **HONEST** - Screens only read properly captured/derived/external fields
2. **CREATABLE** - Create forms have detail screens with discoverable paths
3. **REACHABILITY** - Success screens reachable within 3 steps
4. **UI** - All screens declare empty/loading/error states
5. **STATE** - Valid state machine transitions
6. **SCREEN** - All screens declare allowed roles
7. **SPEC** - Coverage metrics and completeness

### 🔧 Auto-Healing
The `--fix` flag automatically:
- Adds missing roles and UI states
- Infers screen types from names
- Fixes structural issues
- Generates missing IDs
- Ensures consistency

### 🤖 AI Agent Integration
- Claude Desktop MCP server
- Auto-generated command cards
- Agent-friendly error messages
- Git-trackable specifications

### 📊 Generated Artifacts
Every audit produces:
- Entity relationship diagrams (Mermaid)
- User flow diagrams
- Screen inventory (CSV)
- Test results (JUnit XML)
- Gap reports (Markdown)
- Acceptance criteria (Gherkin)

## 🏗️ Project Structure

```
flowlock-open/
├── packages/
│   ├── uxspec/         # Schema definitions (Zod)
│   ├── plugin-sdk/     # Plugin interface
│   ├── checks-core/    # Built-in validation checks
│   ├── runner/         # Orchestration engine
│   ├── cli/            # Command-line interface
│   └── mcp/            # Model Context Protocol server
├── apps/
│   └── site/           # Documentation site (Next.js)
└── docs/               # Documentation
```

## 🎯 Example `uxspec.json`

```json
{
  "version": "1.0.0",
  "name": "User Management",
  "roles": [
    { "id": "admin", "name": "Administrator" }
  ],
  "entities": [{
    "id": "user",
    "name": "User",
    "fields": [
      { "id": "email", "name": "Email", "type": "email", "required": true },
      { "id": "created", "name": "Created", "type": "date", 
        "derived": true, "provenance": "System timestamp" }
    ]
  }],
  "screens": [{
    "id": "user-list",
    "name": "User List",
    "type": "list",
    "reads": ["user.email"],
    "roles": ["admin"],
    "uiStates": ["empty", "loading", "error"]
  }],
  "flows": [{
    "id": "main",
    "name": "Main Flow",
    "entryStepId": "s1",
    "steps": [{
      "id": "s1",
      "screenId": "user-list"
    }]
  }]
}
```

## 🔌 Claude Desktop Integration

Add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "flowlock": {
      "command": "npx",
      "args": ["flowlock-mcp"]
    }
  }
}
```

## 🚢 CI/CD Integration

### GitHub Actions
```yaml
- name: FlowLock Audit
  uses: ./action/uxcg-action
  with:
    cloud-url: ${{ secrets.FLOWLOCK_CLOUD_URL }}
    project-id: ${{ github.repository }}
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
```

## 📈 Roadmap

- [ ] Visual spec editor
- [ ] More built-in checks
- [ ] Framework integrations (React, Vue, Angular)
- [ ] Cloud dashboard improvements
- [ ] VSCode extension
- [ ] More language SDKs

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/flowlock-open/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/flowlock-open/discussions)

---

**Built with ❤️ for AI-assisted development**