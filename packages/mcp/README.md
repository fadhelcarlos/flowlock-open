# flowlock-mcp

Model Context Protocol (MCP) server for FlowLock integration with AI assistants.

## Overview

The MCP server enables AI assistants like Claude to directly interact with FlowLock, providing intelligent UX specification validation, auto-fixing, and artifact generation through a standardized protocol.

## Features

- **Direct AI Integration**: Seamless integration with Claude Desktop and other MCP-compatible clients
- **Intelligent Validation**: AI-powered analysis of UX specifications
- **Auto-Fix Suggestions**: Smart recommendations for fixing validation issues
- **Real-time Feedback**: Instant validation as you work with specs
- **Context-Aware**: Understands your project structure and requirements

## Installation

### For Claude Desktop

1. Install the MCP server globally:
```bash
npm install -g flowlock-mcp
```

2. Add to Claude Desktop configuration (`~/AppData/Roaming/Claude/claude_desktop_config.json` on Windows or `~/.config/claude/claude_desktop_config.json` on Mac/Linux):

```json
{
  "mcpServers": {
    "flowlock": {
      "command": "flowlock-mcp",
      "args": [],
      "cwd": null
    }
  }
}
```

3. Restart Claude Desktop

### For Development

```bash
npm install flowlock-mcp
```

## MCP Tools Available

The server provides the following tools to AI assistants:

### `validate_spec`
Validates a UX specification against all FlowLock checks.

```typescript
{
  tool: "validate_spec",
  input: {
    spec: UXSpec,           // The specification to validate
    level?: "basic" | "enhanced" | "strict",
    fix?: boolean          // Auto-fix issues
  }
}
```

### `generate_artifacts`
Generates diagrams and reports from a specification.

```typescript
{
  tool: "generate_artifacts",
  input: {
    spec: UXSpec,
    outputDir?: string     // Default: "./artifacts"
  }
}
```

### `analyze_gap`
Performs deep analysis of validation issues with recommendations.

```typescript
{
  tool: "analyze_gap",
  input: {
    spec: UXSpec,
    issues: Issue[]        // From validation
  }
}
```

### `suggest_fixes`
Provides intelligent fix suggestions for validation issues.

```typescript
{
  tool: "suggest_fixes",
  input: {
    spec: UXSpec,
    issue: Issue
  }
}
```

### `check_inventory`
Validates spec against runtime inventory.

```typescript
{
  tool: "check_inventory",
  input: {
    spec: UXSpec,
    inventoryPath: string
  }
}
```

## Usage with Claude

Once configured, you can use natural language with Claude:

### Basic Validation
```
"Validate my UX spec file at ./uxspec.json"
```

### With Auto-Fix
```
"Fix all validation issues in my spec"
```

### Generate Artifacts
```
"Create ER and flow diagrams from my spec"
```

### Analyze Issues
```
"Why is my spec failing the HONEST check?"
```

### Inventory Validation
```
"Check if my spec matches the database schema"
```

## Configuration

### Environment Variables

```bash
# Set validation level
FLOWLOCK_VALIDATION_LEVEL=enhanced

# Enable debug output
DEBUG=flowlock:mcp

# Custom artifact directory
FLOWLOCK_OUTPUT_DIR=./my-artifacts
```

### Project Configuration

Create a `.flowlock-mcp.json` in your project root:

```json
{
  "defaultLevel": "enhanced",
  "autoFix": true,
  "outputDir": "./artifacts",
  "inventory": {
    "enabled": true,
    "path": "./runtime_inventory.json"
  }
}
```

## Server Protocol

The MCP server implements the Model Context Protocol v0.4.0:

### Initialization
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "capabilities": {
      "tools": true,
      "prompts": false,
      "resources": false
    }
  }
}
```

### Tool Execution
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "validate_spec",
    "arguments": {
      "spec": { /* UX Spec */ },
      "level": "enhanced",
      "fix": true
    }
  }
}
```

### Response Format
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Validation Results:\n- 12/15 checks passed\n- 3 issues found"
      }
    ]
  }
}
```

## Development

### Running Locally

```bash
# Clone the repository
git clone https://github.com/flowlock/flowlock.git

# Install dependencies
cd packages/mcp
npm install

# Build the server
npm run build

# Run in development mode
npm run dev
```

### Testing with Claude Desktop

1. Build the package:
```bash
npm run build
```

2. Link globally:
```bash
npm link
```

3. Update Claude config to use local version:
```json
{
  "mcpServers": {
    "flowlock-dev": {
      "command": "node",
      "args": ["/path/to/flowlock/packages/mcp/dist/index.js"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### Creating Custom Tools

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';

const server = new McpServer({
  name: 'flowlock-custom',
  version: '1.0.0'
});

// Add custom tool
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'custom_check') {
    // Custom validation logic
    return {
      content: [{
        type: 'text',
        text: 'Custom check results'
      }]
    };
  }
});
```

## Troubleshooting

### Server Not Connecting

1. Check Claude Desktop logs:
   - Windows: `%APPDATA%\Claude\logs`
   - Mac/Linux: `~/.config/claude/logs`

2. Verify installation:
```bash
flowlock-mcp --version
```

3. Test server directly:
```bash
echo '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}' | flowlock-mcp
```

### Validation Not Working

1. Ensure spec file is valid JSON
2. Check current working directory
3. Verify all dependencies installed:
```bash
npm list flowlock-checks-core
```

### Performance Issues

1. Use appropriate validation level
2. Disable unused checks
3. Increase Node memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" flowlock-mcp
```

## API Reference

### MCP Server Class

```typescript
class FlowLockMcpServer {
  constructor(options?: {
    defaultLevel?: 'basic' | 'enhanced' | 'strict';
    autoFix?: boolean;
    outputDir?: string;
  });
  
  // Start the server
  async start(): Promise<void>;
  
  // Handle tool requests
  async handleToolCall(name: string, args: any): Promise<any>;
  
  // Shutdown gracefully
  async shutdown(): Promise<void>;
}
```

## Contributing

See the main repository for contribution guidelines.

## License

MIT