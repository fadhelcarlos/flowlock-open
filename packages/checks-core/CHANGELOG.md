# flowlock-checks-core

## 0.4.0

### Minor Changes

- 29114aa: ## FlowLock v3.0 - Complete Feature Parity with Original UXCG

  This major update brings FlowLock to feature parity with the original UX Contract Guardrails (UXCG) implementation, adding all missing features and enhancements.

  ### 🎯 New Features

  #### Schema Enhancements (`flowlock-uxspec`)
  - **JTBD (Jobs To Be Done)**: Track user goals and link flows to specific job outcomes
  - **Entity Relations**: Define relationships between entities (1:1, 1:many, many:1, many:many)
  - **Enhanced Screen Components**:
    - **Forms**: Track explicit writes to fields
    - **Cards**: Display components with specific reads and titles
    - **Lists**: Configurable tables with sorting, filtering, pagination
    - **CTAs**: Navigation buttons with types (primary, secondary, link)
  - **Routes**: Define URL patterns with dynamic parameters
  - **State Machines**: Enhanced state transitions with triggers
  - **Glossary**: Document derived fields with formulas and external sources

  #### New Validation Checks (`flowlock-checks-core`)
  - **JTBD Check**: Validates all Jobs To Be Done are addressed by flows
  - **Relations Check**: Validates entity relationships and detects circular references
  - **Routes Check**: Ensures unique routes with proper formatting
  - **CTAs Check**: Validates navigation and detects orphaned screens

  #### CLI Enhancements (`flowlock-uxcg`)
  - **Husky Integration**: Optional git hooks for pre-commit validation
  - **Glossary Templates**: Auto-generate glossary.yml and glossary.md
  - **Enhanced Starter Spec**: Comprehensive template with all new features
  - **Multiple npm scripts**: audit, fix, and watch commands

  #### Generator Updates (`flowlock-runner`)
  - **Enhanced ER Diagrams**: Show entity relations with proper notation
  - **Flow Diagrams**: Include JTBD links, state transitions, and CTA navigation
  - **CSV Reports**: Export entities, flows, JTBD, and enhanced screen data
  - **Better Mermaid**: Support for subgraphs and navigation diagrams

  ### 🐛 Bug Fixes
  - Fixed MCP server ES module/CommonJS conflict
  - Resolved TypeScript errors in MCP server implementation
  - Fixed CLI build warnings about require.resolve

  ### 📚 Documentation
  - Comprehensive guide updated with all new features
  - API reference includes new schema fields
  - Migration guide for v2 to v3
  - Examples updated with enhanced features

  ### 💔 Breaking Changes

  None - All changes are backward compatible. Existing specs will continue to work.

  ### 🚀 Migration

  To use the new features, update your `uxspec.json`:
  1. Add `jtbd` array for Jobs To Be Done
  2. Add `relations` to entities
  3. Replace simple `forms` with detailed form objects
  4. Add `cards`, `lists`, and `ctas` to screens
  5. Add `routes` to screens
  6. Define `states` for state machines
  7. Add `glossary` for derived fields

### Patch Changes

- Fix: Add backward compatibility for JTBD field

  The JTBD field now supports both formats:
  - **Old format**: Object with role keys mapping to task arrays (e.g., `{ "admin": ["task1"], "user": ["task2"] }`)
  - **New format**: Array of JTBD objects with role, tasks, and description

  This ensures existing specs continue to work while allowing new specs to use the enhanced format.

- Updated dependencies
- Updated dependencies [29114aa]
  - flowlock-uxspec@0.4.0
  - flowlock-plugin-sdk@0.4.0

## 0.3.0

### Minor Changes

- ## FlowLock v3.0 - Complete Feature Parity with Original UXCG

  This major update brings FlowLock to feature parity with the original UX Contract Guardrails (UXCG) implementation, adding all missing features and enhancements.

  ### 🎯 New Features

  #### Schema Enhancements (`flowlock-uxspec`)
  - **JTBD (Jobs To Be Done)**: Track user goals and link flows to specific job outcomes
  - **Entity Relations**: Define relationships between entities (1:1, 1:many, many:1, many:many)
  - **Enhanced Screen Components**:
    - **Forms**: Track explicit writes to fields
    - **Cards**: Display components with specific reads and titles
    - **Lists**: Configurable tables with sorting, filtering, pagination
    - **CTAs**: Navigation buttons with types (primary, secondary, link)
  - **Routes**: Define URL patterns with dynamic parameters
  - **State Machines**: Enhanced state transitions with triggers
  - **Glossary**: Document derived fields with formulas and external sources

  #### New Validation Checks (`flowlock-checks-core`)
  - **JTBD Check**: Validates all Jobs To Be Done are addressed by flows
  - **Relations Check**: Validates entity relationships and detects circular references
  - **Routes Check**: Ensures unique routes with proper formatting
  - **CTAs Check**: Validates navigation and detects orphaned screens

  #### CLI Enhancements (`flowlock-uxcg`)
  - **Husky Integration**: Optional git hooks for pre-commit validation
  - **Glossary Templates**: Auto-generate glossary.yml and glossary.md
  - **Enhanced Starter Spec**: Comprehensive template with all new features
  - **Multiple npm scripts**: audit, fix, and watch commands

  #### Generator Updates (`flowlock-runner`)
  - **Enhanced ER Diagrams**: Show entity relations with proper notation
  - **Flow Diagrams**: Include JTBD links, state transitions, and CTA navigation
  - **CSV Reports**: Export entities, flows, JTBD, and enhanced screen data
  - **Better Mermaid**: Support for subgraphs and navigation diagrams

  ### 🐛 Bug Fixes
  - Fixed MCP server ES module/CommonJS conflict
  - Resolved TypeScript errors in MCP server implementation
  - Fixed CLI build warnings about require.resolve

  ### 📚 Documentation
  - Comprehensive guide updated with all new features
  - API reference includes new schema fields
  - Migration guide for v2 to v3
  - Examples updated with enhanced features

  ### 💔 Breaking Changes

  None - All changes are backward compatible. Existing specs will continue to work.

  ### 🚀 Migration

  To use the new features, update your `uxspec.json`:
  1. Add `jtbd` array for Jobs To Be Done
  2. Add `relations` to entities
  3. Replace simple `forms` with detailed form objects
  4. Add `cards`, `lists`, and `ctas` to screens
  5. Add `routes` to screens
  6. Define `states` for state machines
  7. Add `glossary` for derived fields

### Patch Changes

- Fixed MCP server TypeScript errors and CLI build warnings
  - Updated MCP server to use correct MCP SDK v0.4.0 API with setRequestHandler
  - Fixed CLI build warning about external require.resolve path
  - All packages now build cleanly without errors or warnings
- Updated dependencies
- Updated dependencies
  - flowlock-uxspec@0.3.0
  - flowlock-plugin-sdk@0.3.0

## 0.2.1

### Patch Changes

- Fixed MCP server TypeScript errors and CLI build warnings
  - Updated MCP server to use correct MCP SDK v0.4.0 API with setRequestHandler
  - Fixed CLI build warning about external require.resolve path
  - All packages now build cleanly without errors or warnings
- Updated dependencies
  - flowlock-uxspec@0.2.1
  - flowlock-plugin-sdk@0.2.1
