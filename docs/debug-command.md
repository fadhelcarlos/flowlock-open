# FlowLock Debug Command

The debug command provides detailed analysis and troubleshooting capabilities for FlowLock check failures.

## Overview

When FlowLock audit checks fail, it can be difficult to understand exactly why. The debug command provides deep insights into:
- What patterns checks are looking for
- What was found vs. expected
- Path analysis for reachability issues
- Entity relationship visualization
- Suggestions for fixing issues

## Usage

```bash
npx flowlock-uxcg debug <check> [options]
```

### Arguments

- `<check>` - The name or ID of the check to debug (e.g., `creatable`, `reachability`, `relations`)

### Options

- `--entity=<name>` - Focus analysis on a specific entity
- `--screen=<id>` - Focus analysis on a specific screen  
- `--flow=<id>` - Focus analysis on a specific flow
- `--verbose` - Show detailed debug output including intermediate calculations
- `--show-paths` - Display flow path analysis and screen reachability
- `--show-patterns` - Detect and display common issue patterns
- `--show-relations` - Visualize entity relationship graph
- `--all` - Enable all debug output options

## Examples

### Debug CREATABLE Check

```bash
npx flowlock-uxcg debug creatable --entity=user
```

Output shows:
- Which entities have create forms
- Which detail screens exist and how they're matched
- Missing detail screen patterns
- Flow paths to detail screens

### Debug REACHABILITY Check

```bash
npx flowlock-uxcg debug reachability --flow=checkout --show-paths
```

Output shows:
- Success screens in each flow
- Minimum steps to reach each screen
- Unreachable screens and steps
- Visual flow graph (with --verbose)
- Actual paths through the flow

### Debug RELATIONS Check

```bash
npx flowlock-uxcg debug relations --show-relations
```

Output shows:
- Entity relationships and their validity
- Missing target entities
- Circular dependencies
- Invalid relation kinds
- Full relationship graph visualization

### Debug HONEST_READS Check

```bash
npx flowlock-uxcg debug honest_reads --screen=product-list
```

Output shows:
- What data each screen displays
- Declared reads vs actual usage
- Undeclared data access
- Unused read declarations
- Data flow analysis (with --verbose)

### Debug UI_STATES Check

```bash
npx flowlock-uxcg debug ui_states --show-patterns
```

Output shows:
- Required states based on screen content
- Missing loading/empty/error states
- Common patterns across screens
- Reasoning for why states are needed

### Debug STATE_MACHINES Check

```bash
npx flowlock-uxcg debug state_machines --verbose
```

Output shows:
- State definitions and transitions
- Unreachable states
- Invalid state references
- State machine visualization
- Terminal state validation

## Verbose Mode

Adding `--verbose` to any debug command enables:
- Step-by-step analysis traces
- Intermediate calculation results
- Extended error context
- Detailed path analysis
- Full graph visualizations

## Pattern Detection

The `--show-patterns` flag helps identify systemic issues:
- Multiple entities missing detail screens
- Consistently unreachable screens
- Common state machine problems
- Repeated UI state omissions

## Tips for Effective Debugging

1. **Start Specific**: Focus on one entity/screen/flow at a time
2. **Use Verbose for Deep Dives**: Add --verbose when you need to understand the exact logic
3. **Check Patterns First**: Use --show-patterns to identify systemic issues
4. **Visualize Relationships**: Use --show-relations for complex entity structures
5. **Combine with Audit**: Run audit first to get an overview, then debug specific failures

## Integration with CI/CD

The debug command can be used in CI pipelines for automatic issue diagnosis:

```yaml
# GitHub Actions example
- name: Debug failed checks
  if: failure()
  run: |
    npx flowlock-uxcg debug creatable --verbose > debug-creatable.log
    npx flowlock-uxcg debug reachability --show-paths > debug-reachability.log
```

## Environment Variables

Debug output can also be controlled via environment variables:

- `FLOWLOCK_DEBUG=true` - Enable debug output across all checks
- `FLOWLOCK_VERBOSE=true` - Enable verbose output across all checks

## Interpreting Debug Output

### Icons and Colors

- ✅ Pass - Check passed for this item
- ❌ Fail - Check failed for this item  
- ⚠️ Warning - Non-critical issue detected
- 🔍 Analysis - Detailed analysis information
- 💡 Tip - Suggestion for fixing the issue

### Debug Sections

Each debug output includes:
1. **What this check validates** - High-level explanation
2. **Entity/Screen/Flow Analysis** - Detailed breakdown
3. **Issues Found** - Specific problems identified
4. **Suggestions** - How to fix the issues
5. **Summary** - Overall statistics

## Advanced Usage

### Debugging Multiple Checks

```bash
# Debug all failing checks
for check in creatable reachability relations; do
  npx flowlock-uxcg debug $check --verbose > debug-$check.log
done
```

### Focus on Changed Entities

```bash
# Debug only entities that were recently modified
npx flowlock-uxcg debug creatable --entity=new_feature
npx flowlock-uxcg debug relations --entity=new_feature
```

### Generate Debug Report

```bash
# Create comprehensive debug report
npx flowlock-uxcg debug creatable --all > debug-report.txt
npx flowlock-uxcg debug reachability --all >> debug-report.txt
npx flowlock-uxcg debug relations --all >> debug-report.txt
```

## Troubleshooting Common Issues

### "Check not found"

If you get a "Check not found" error, use the check ID exactly as shown in the audit output:
- Use `creatable_needs_detail` or just `creatable`
- Use `reachability` not `reach`
- Use `honest_reads` not `honest`

### No Debug Output

If debug shows no output:
1. Ensure ux.json exists in the current directory
2. Check that the spec is valid JSON
3. Try running audit first to verify the spec loads

### Too Much Output

If debug output is overwhelming:
1. Remove --verbose flag
2. Focus on specific entity/screen/flow
3. Redirect output to a file for analysis