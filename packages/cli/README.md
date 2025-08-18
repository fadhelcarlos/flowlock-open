# flowlock-uxcg (CLI)

Command-line interface for FlowLock UX validation and code generation.

## Installation

```bash
# Global installation (recommended)
npm install -g flowlock-uxcg

# Local installation
npm install --save-dev flowlock-uxcg
```

## Commands

### `uxcg init`
Initialize a new FlowLock project with interactive prompts.

**Options:**
- Use current folder or scaffold new project
- Choose template (Blank or Next.js + Tailwind)
- Add Claude/Cursor command cards
- Setup GitHub Actions workflow
- Add npm scripts

**Example:**
```bash
uxcg init
# Follow interactive prompts
```

### `uxcg audit [--fix]`
Run validation checks on your UX specification.

**Options:**
- `--fix` - Enable auto-healing for common issues
- `--spec <file>` - Specify spec file (default: uxspec.json)
- `--outDir <dir>` - Output directory (default: artifacts)

**Auto-fix capabilities:**
- Adds missing top-level roles
- Converts string roles to objects
- Infers screen types from names
- Ensures UI states (empty/loading/error)
- Generates missing IDs from names
- Assigns roles to screens

**Example:**
```bash
# Basic audit
uxcg audit

# With auto-fix
uxcg audit --fix

# Custom paths
uxcg audit --spec my-spec.json --outDir my-artifacts
```

### `uxcg diagrams`
Generate only diagram artifacts (ER and Flow diagrams).

**Generates:**
- `er.mmd` - Entity relationship Mermaid source
- `er.svg` - Entity relationship diagram
- `flow.mmd` - User flow Mermaid source
- `flow.svg` - User flow diagram

**Example:**
```bash
uxcg diagrams
```

### `uxcg export <format>`
Export artifacts in specific formats.

**Formats:**
- `junit` - JUnit XML test results
- `csv` - Screen inventory spreadsheet
- `svg` - Diagram images

**Example:**
```bash
uxcg export junit
uxcg export csv
uxcg export svg
```

### `uxcg watch [options]`
Watch mode for development with auto-refresh.

**Options:**
- `--cloud` - Enable cloud sync
- `--cloudUrl <url>` - Cloud endpoint URL
- `--projectId <id>` - Project identifier

**Example:**
```bash
# Basic watch mode
uxcg watch

# With cloud sync
uxcg watch --cloud --cloudUrl https://flowlock-cloud.onrender.com --projectId my-project
```

### `uxcg agent [options]`
Connect to FlowLock Cloud for remote command execution.

**Options:**
- `--cloud <url>` - Cloud base URL (required)
- `--project <id>` - Project ID (default: demo)
- `--token <token>` - Bearer token for authentication

**Features:**
- Polls for pending commands
- Executes audit/diagrams remotely
- Streams results to cloud dashboard
- Maintains persistent connection

**Example:**
```bash
uxcg agent --cloud https://flowlock-cloud.onrender.com --project my-app --token secret
```

## Generated Artifacts

After running `uxcg audit`, the following files are created in the `artifacts/` directory:

| File | Description |
|------|-------------|
| `er.mmd` | Entity relationship diagram (Mermaid source) |
| `er.svg` | Entity relationship diagram (rendered) |
| `flow.mmd` | User flow diagram (Mermaid source) |
| `flow.svg` | User flow diagram (rendered) |
| `screens.csv` | Screen inventory with types and roles |
| `results.junit.xml` | Test results for CI/CD |
| `gap_report.md` | Detailed issues and recommendations |
| `acceptance_criteria.feature` | Gherkin test scenarios |

## Exit Codes

- `0` - Success, all checks passed
- `1` - Validation errors found
- `2` - Invalid specification or parse error

## Environment Variables

- `DEBUG=*` - Enable verbose debug output
- `NO_COLOR` - Disable colored output

## Programmatic Usage

```javascript
const { spawn } = require('child_process');

// Run audit programmatically
const audit = spawn('uxcg', ['audit', '--fix']);

audit.stdout.on('data', (data) => {
  console.log(`Output: ${data}`);
});

audit.on('close', (code) => {
  if (code === 0) {
    console.log('Audit passed!');
  } else {
    console.error(`Audit failed with code ${code}`);
  }
});
```

## Configuration Files

### `.claude/commands/`
Auto-generated command cards for Claude/Cursor:
- `ux-contract-init.md` - Create/refine spec
- `ux-guardrails-validate.md` - Fix audit failures
- `ux-generate-ui.md` - Scaffold components
- `flow-audit-fix.md` - Close gaps

### `package.json` Scripts
Add to your project:
```json
{
  "scripts": {
    "flowlock:init": "uxcg init",
    "flowlock:audit": "uxcg audit",
    "flowlock:fix": "uxcg audit --fix",
    "flowlock:watch": "uxcg watch"
  }
}
```

## Troubleshooting

### Module not found
```bash
npm install -g flowlock-uxcg
```

### Permission denied
Run terminal as administrator or use:
```bash
sudo npm install -g flowlock-uxcg
```

### No diagrams generated
Install Mermaid CLI:
```bash
npm install -g @mermaid-js/mermaid-cli
```

## License

MIT