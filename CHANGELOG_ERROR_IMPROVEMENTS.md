# FlowLock Error Message Improvements

## Summary
Improved all error messages throughout FlowLock to be specific, actionable, and user-friendly. Replaced generic messages with detailed guidance including exact fixes, code examples, and documentation links.

## Changes Made

### 1. Enhanced Error System (`packages/shared/src/errors.ts`)
- Added specific error codes (INV_xxx, VAL_xxx, FLW_xxx, SCR_xxx, CFG_xxx, DET_xxx)
- Created `ErrorDetails` interface with:
  - `expected` vs `actual` values
  - `location` for precise error placement
  - `suggestion` with actionable fixes
  - `documentation` links
  - `context` for additional debugging info
- Added `createActionableError()` helper function
- Enhanced `formatError()` with visual formatting

### 2. Updated Check Implementations

#### Reachability Check (`packages/checks-core/src/reachability.ts`)
- Added path analysis to show why screens are unreachable
- Provides specific steps to connect unreachable screens
- Shows shortest path for depth-exceeded warnings
- Suggests flow simplification strategies

#### Honest Reads Check (`packages/checks-core/src/honest-reads.ts`)
- Identifies which screens capture missing fields
- Provides copy-paste JSON snippets for fixes
- Explains field provenance options (captured/derived/external)
- Shows field usage context across flows

#### Inventory Check (`packages/checks-core/src/checks/inventory.ts`)
- Enhanced missing entity/field detection with similarity matching
- Provides SQL ALTER statements for database fixes
- Shows available entities/fields for quick reference
- Includes configuration troubleshooting steps

#### Screen Check (`packages/checks-core/src/checks/screen.ts`)
- Suggests roles based on similar screens
- Validates role definitions exist in spec
- Provides role configuration examples

#### State Machine Check (`packages/checks-core/src/checks/stateMachine.ts`)
- Generates complete state machine templates
- Identifies island states with connection suggestions
- Validates transitions reference valid states
- Detects initial/terminal states intelligently

#### Relations Check (`packages/checks-core/src/checks/relations.ts`)
- Entity similarity matching for typos
- Circular dependency visualization
- Valid relation kind examples
- Junction table suggestions for many-to-many

### 3. Error Formatting Utilities (`packages/runner/src/utils/format.ts`)
- `formatCheckResult()` - Console-friendly error display
- `formatCheckSummary()` - Grouped error summary with statistics
- `exportResultsJSON()` - Machine-readable results export
- Color-coded output with emoji indicators
- Error grouping by code for pattern identification

### 4. Documentation (`docs/TROUBLESHOOTING.md`)
- Comprehensive troubleshooting guide
- Error code reference table
- Specific solutions for each error type
- Code examples and configuration snippets
- Best practices section
- Common patterns library

## Error Message Improvements

### Before
```
Screen 'ProfileView' reads field 'User.lastLogin' which is not captured in the same flow
```

### After
```
[SCR_001] Screen 'ProfileView' reads uncaptured field 'User.lastLogin'
  📍 Location: Screen: ProfileView (profile-view)
  ❌ Expected: Field should be captured before reading
  ⚠️  Actual: Field 'User.lastLogin' is being read without proper provenance
  💡 Fix: Field is captured in: LoginFlow. Ensure this screen comes after capture.
  📚 Docs: https://flowlock.dev/docs/screens#field-provenance
  🔍 Context: {
    "fieldPath": "User.lastLogin",
    "screenFlows": ["profile-flow"],
    "capturingFlows": ["login-flow"]
  }
```

## Benefits

1. **Faster Debugging** - Developers immediately see what's wrong and how to fix it
2. **Reduced Support Burden** - Self-service troubleshooting with comprehensive guidance
3. **Better DX** - Copy-paste solutions and code examples
4. **Learning Tool** - Documentation links help developers understand the system
5. **Pattern Recognition** - Error grouping helps identify systemic issues

## Usage

### Running Checks with Enhanced Errors
```bash
npx flowlock check
```

### Viewing Formatted Results
```bash
# Console output with colors and formatting
npx flowlock check --verbose

# JSON export with full details
npx flowlock check --output artifacts/check-results.json

# Summary report
cat artifacts/check-summary.txt
```

### Accessing Documentation
- In-error documentation links
- Comprehensive guide at `/docs/TROUBLESHOOTING.md`
- Error code reference for quick lookup

## Next Steps

1. Add error telemetry to identify most common issues
2. Create interactive error resolution wizard
3. Add auto-fix capabilities for common problems
4. Integrate with IDE extensions for inline fixes
5. Add error severity customization in config