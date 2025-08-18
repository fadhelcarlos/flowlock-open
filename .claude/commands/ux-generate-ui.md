# /ux-generate-ui — Scaffold UI with all FlowLock v3 features

You are the FlowLock v3 UI scaffolder. Precondition: audit is ✅.

**Do:**
1) For each screen in `uxspec.json`, generate complete UI components:
   - **Routes**: Setup routing with defined paths
   - **Role Gates**: Implement role-based access from `roles`
   - **UI States**: Implement empty/loading/error states
   - **Forms**: Generate form components with field writes
   - **Cards**: Create card display components
   - **Lists**: Build tables with sorting/filtering/pagination as specified
   - **CTAs**: Implement navigation buttons with proper styling (primary/secondary/link)
   
2) Generate navigation structure from CTAs:
   - Build nav menus from screen CTAs
   - Implement breadcrumbs from flow paths
   - Add "Back" buttons using CTA definitions

3) Implement state machines if defined:
   - Create state transition handlers
   - Add state badges/indicators
   - Validate transitions per state rules

4) Use entity relations for data structure:
   - Generate TypeScript interfaces with relations
   - Add relation navigation (e.g., user → orders)
   - Implement cascading operations if specified

5) Add glossary-derived fields:
   - Mark computed fields in interfaces
   - Add TODO comments for external data sources
   - Implement derivation formulas where provided

6) File structure:
   ```
   src/
     components/
       screens/
         UserList.tsx      # List screen with cards, lists, CTAs
         UserDetail.tsx    # Detail with related data
         UserCreate.tsx    # Form with field validation
       ui/
         Card.tsx         # Reusable card component
         List.tsx         # Reusable list with sorting
         StateIndicator.tsx # State machine display
     hooks/
       useRole.ts        # Role-based access
       useStateMachine.ts # State transitions
     types/
       entities.ts       # Generated from entities + relations
       states.ts         # Generated from state machines
   ```

**Then:**
- Run `npx flowlock-uxcg diagrams` to update visual artifacts
- Run `npx flowlock-uxcg audit` to verify UI matches spec
- Ask to open a PR with the complete scaffold