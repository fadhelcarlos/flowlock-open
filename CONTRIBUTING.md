# Contributing to FlowLock

Welcome! We're excited you want to contribute to FlowLock. This guide will help you get started with development setup, understanding the codebase, and making your first contribution.

## 🚀 Quick Development Setup

### Prerequisites

- **Node.js 18+** - We recommend using [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm)
- **pnpm 8+** - Fast, disk space efficient package manager
- **Git** - Version control

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/flowlock-open.git
cd flowlock-open

# Install dependencies for all packages
pnpm install

# Build all packages (this may take a few minutes)
pnpm build
```

### 2. Verify Installation

```bash
# Test the CLI works
pnpm uxcg --version

# Run tests across all packages
pnpm test

# Run a full audit on the example project
cd examples/complete-reference
pnpm uxcg audit
```

### 3. Start Development

```bash
# Build packages in watch mode
pnpm build --watch

# In another terminal, test your changes
cd examples/complete-reference
pnpm uxcg audit --verbose
```

## 📁 Project Structure

FlowLock uses a monorepo architecture with pnpm workspaces:

```
flowlock-open/
├── packages/                    # Core packages
│   ├── cli/                    # Command-line interface
│   ├── uxspec/                 # Schema definitions (Zod)
│   ├── checks-core/            # 15 validation checks
│   ├── runner/                 # Orchestration engine
│   ├── inventory/              # Runtime extraction
│   ├── plugin-sdk/             # Plugin development kit
│   ├── shared/                 # Shared utilities
│   └── mcp/                    # MCP server for AI assistants
├── apps/
│   └── site/                   # Documentation website (Next.js)
├── examples/
│   └── complete-reference/     # Full example implementation
├── docs/                       # Comprehensive documentation
└── artifacts/                  # Generated outputs (diagrams, reports)
```

### Key Packages Explained

#### `packages/cli/` - The Main Interface
- Entry point for all user interactions
- Commands: `init`, `audit`, `inventory`, `debug`, `export`
- Templates and project scaffolding
- **Start here** for CLI-related contributions

#### `packages/checks-core/` - Validation Engine
- 15 validation checks that prevent AI hallucinations
- Each check is in `src/checks/` or root-level files
- **Start here** for adding new validation logic

#### `packages/uxspec/` - Schema Definitions
- Zod schemas that define the UXSpec format
- Parser and validation logic
- **Start here** for schema changes

#### `packages/runner/` - Orchestration
- Coordinates check execution
- Generates artifacts (diagrams, reports, CSVs)
- **Start here** for output/artifact improvements

#### `packages/inventory/` - Runtime Extraction
- Scans codebases to extract actual state
- Database introspection, API discovery, UI component detection
- **Start here** for improving codebase analysis

## 🛠️ Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the relevant package

3. **Build and test:**
   ```bash
   # Build your changes
   pnpm build

   # Run tests
   pnpm test

   # Test against example project
   cd examples/complete-reference
   pnpm uxcg audit --verbose
   ```

4. **Commit with conventional commits:**
   ```bash
   git add .
   git commit -m "feat(cli): add new init template for SaaS apps"
   ```

### Testing Your Changes

#### Unit Testing
```bash
# Run tests for a specific package
cd packages/checks-core
pnpm test

# Run all tests
pnpm -r test
```

#### Integration Testing
```bash
# Test CLI commands work end-to-end
cd examples/complete-reference

# Test various workflows
pnpm uxcg init-existing
pnpm uxcg inventory
pnpm uxcg audit
pnpm uxcg export svg
```

#### Manual Testing
```bash
# Create a test project
mkdir test-flowlock && cd test-flowlock
npx flowlock-uxcg@latest init

# Or test existing project integration
cd /path/to/your/nextjs-app
npx flowlock-uxcg@latest init-existing
npx flowlock-uxcg@latest inventory
npx flowlock-uxcg@latest audit --inventory
```

### Publishing Changes

We use [Changesets](https://github.com/changesets/changesets) for version management:

```bash
# Add a changeset describing your changes
pnpm changeset

# This will prompt you to:
# 1. Select which packages changed
# 2. Choose version bump type (patch/minor/major)
# 3. Write a summary of changes

# Commit the changeset
git add .changeset/
git commit -m "docs: add changeset for new feature"
```

## 🎯 Contribution Areas

### High-Impact Areas

#### 1. **New Validation Checks**
Location: `packages/checks-core/src/checks/`

Add new checks to catch specific AI hallucination patterns:

```typescript
// Example: packages/checks-core/src/checks/accessibility.ts
import { CheckResult, FlowLockCheck } from '../types';

export const accessibilityCheck: FlowLockCheck = {
  id: 'ACCESSIBILITY',
  name: 'Accessibility Validation',
  description: 'Ensures screens meet accessibility requirements',
  
  run(spec): CheckResult[] {
    // Your validation logic here
    return [];
  }
};
```

#### 2. **Framework Integrations**
Location: `packages/inventory/src/`

Add support for new frameworks:

```typescript
// Example: Support for Vue, Angular, Svelte
// packages/inventory/src/frameworks/vue-introspector.ts
export class VueIntrospector {
  async extractComponents(projectPath: string) {
    // Scan .vue files and extract component structure
  }
}
```

#### 3. **CLI Commands**
Location: `packages/cli/src/commands/`

Add new commands to improve developer experience:

```typescript
// Example: packages/cli/src/commands/migrate.ts
export async function migrateCommand(options: MigrateOptions) {
  // Help users migrate from v2 to v3 specs
}
```

#### 4. **Artifact Generators**
Location: `packages/runner/src/generators/`

Create new output formats:

```typescript
// Example: packages/runner/src/generators/openapi.ts
export function generateOpenAPI(spec: UXSpec): string {
  // Convert UXSpec to OpenAPI schema
}
```

### Good First Issues

Look for issues labeled `good first issue` in our GitHub repository:

- **Documentation improvements** - Fix typos, add examples
- **Error message enhancements** - Make validation errors more helpful
- **Test coverage** - Add tests for existing functionality
- **CLI UX improvements** - Better progress indicators, help text

## 🐛 Debugging and Troubleshooting

### Common Development Issues

#### "Module not found" errors
```bash
# Clean and rebuild everything
pnpm clean
pnpm install
pnpm build
```

#### Tests failing
```bash
# Run tests with verbose output
pnpm test --verbose

# Run a specific test file
cd packages/checks-core
pnpm test honest-reads.test.ts
```

#### CLI not reflecting changes
```bash
# Make sure you've built the packages
pnpm build

# Use local CLI directly
node packages/cli/dist/index.js audit --verbose
```

### Debug Environment

```bash
# Enable verbose logging
export FLOWLOCK_VERBOSE=true

# Enable debug mode
export FLOWLOCK_DEBUG=true

# Run with detailed output
pnpm uxcg audit --verbose
```

### VS Code Setup

Recommended extensions:
- **TypeScript Importer** - Auto import management
- **Prettier** - Code formatting
- **ESLint** - Linting
- **Thunder Client** - API testing

Add to `.vscode/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 📋 Code Guidelines

### TypeScript Standards

- **Strict mode enabled** - All packages use strict TypeScript
- **Explicit return types** - Always specify function return types
- **No `any` types** - Use proper typing or `unknown`
- **Zod for validation** - Use Zod schemas for all data validation

### Code Style

```typescript
// ✅ Good
export interface CheckResult {
  status: 'pass' | 'fail';
  level: 'error' | 'warning' | 'info';
  message: string;
  entity?: string;
  screen?: string;
}

export function validateEntity(entity: Entity): CheckResult[] {
  const results: CheckResult[] = [];
  
  if (!entity.id) {
    results.push({
      status: 'fail',
      level: 'error',
      message: `Entity missing required 'id' field`,
      entity: entity.name || 'unknown'
    });
  }
  
  return results;
}

// ❌ Avoid
function validateEntity(entity: any): any {
  let results = [];
  if (!entity.id) {
    results.push({
      status: 'fail',
      message: 'Entity missing id'
    });
  }
  return results;
}
```

### Error Handling

- **Meaningful error messages** - Include context and suggested fixes
- **Graceful degradation** - Don't crash on partial failures
- **Structured logging** - Use consistent log levels and formats

```typescript
// ✅ Good error handling
try {
  const inventory = await extractInventory(projectPath);
} catch (error) {
  logger.error('Failed to extract inventory', {
    projectPath,
    error: error.message,
    suggestion: 'Ensure the project has a valid package.json and database configuration'
  });
  throw new FlowLockError(
    'INVENTORY_EXTRACTION_FAILED',
    `Could not extract inventory from ${projectPath}. ${error.message}`,
    { projectPath, originalError: error }
  );
}
```

### Testing Guidelines

- **Test the happy path** - Ensure normal usage works
- **Test error conditions** - Verify proper error handling
- **Test edge cases** - Empty inputs, malformed data, etc.
- **Integration tests** - Test full workflows end-to-end

```typescript
// Example test structure
describe('HONEST Check', () => {
  describe('when all fields exist', () => {
    it('should pass validation', () => {
      // Test implementation
    });
  });

  describe('when fields are missing', () => {
    it('should fail with specific error message', () => {
      // Test implementation
    });
  });

  describe('when using derived fields', () => {
    it('should validate against glossary', () => {
      // Test implementation
    });
  });
});
```

## 📝 Documentation Standards

### Code Comments

```typescript
/**
 * Validates that all screen reads reference actual entity fields
 * 
 * This check prevents AI hallucinations where screens try to read
 * fields that don't exist in the database or API responses.
 * 
 * @param spec - The UXSpec to validate
 * @returns Array of validation results, errors for missing fields
 */
export function honestReadsCheck(spec: UXSpec): CheckResult[] {
  // Implementation details...
}
```

### README Updates

When adding new features:
1. **Update relevant package README** - Document new APIs
2. **Update main README** - Add to feature lists if user-facing
3. **Update examples** - Show the feature in action
4. **Update API docs** - Keep docs/API_REFERENCE.md current

## 🚢 Release Process

We follow semantic versioning and use automated releases:

### Version Bumps
- **Patch (0.0.x)** - Bug fixes, documentation updates
- **Minor (0.x.0)** - New features, backward compatible changes
- **Major (x.0.0)** - Breaking changes

### Release Checklist
1. All tests pass: `pnpm test`
2. Build succeeds: `pnpm build`
3. Examples work: Test against `examples/complete-reference`
4. Changeset added: `pnpm changeset`
5. Documentation updated
6. PR approved and merged

## 🤝 Community Guidelines

### Communication

- **Be respectful** - We welcome contributors of all skill levels
- **Be specific** - Include error messages, code samples, environment details
- **Be patient** - Maintainers volunteer their time

### Getting Help

1. **Check documentation** - Start with docs/ folder
2. **Search existing issues** - Your question might be answered
3. **Create detailed issues** - Include reproduction steps
4. **Join discussions** - GitHub Discussions for questions

### Code Reviews

When reviewing PRs:
- **Focus on code quality** - Readability, maintainability, performance
- **Check test coverage** - New features should have tests
- **Verify documentation** - User-facing changes need docs
- **Test manually** - Run the code locally

## 🎯 Roadmap and Vision

### Short Term (Next Quarter)
- Complete 15 validation checks
- Improve error messages and debugging
- Add more framework integrations
- Enhanced CI/CD artifacts

### Medium Term (Next 6 Months)
- Visual spec editor
- VSCode extension
- More language SDKs (Python, Go, Rust)
- Cloud dashboard v2

### Long Term (Next Year)
- Real-time validation
- AI-powered spec generation
- Plugin marketplace
- Enterprise features

## 📄 License

FlowLock is MIT licensed. By contributing, you agree that your contributions will be licensed under the same MIT License.

## 🙏 Recognition

Contributors are recognized in:
- **CHANGELOG.md** - For each release
- **README.md** - Hall of fame section
- **Package attribution** - In relevant package.json files

Thank you for contributing to FlowLock! 🚀