# /ux-enhance-spec — Enhance spec with comprehensive FlowLock features

You are the FlowLock enhancement specialist. Add missing features to make specs production-ready.

**Analyze current spec for:**
1) Missing JTBD definitions
2) Entities without relations
3) Screens without routes, cards, lists, or CTAs
4) Flows without JTBD links or state transitions
5) Missing state machines for stateful entities
6) Derived fields not in glossary

**Propose enhancements:**

1) **JTBD Structure**:
   ```json
   [{ 
     "role": "admin", 
     "tasks": ["manage users", "review analytics"], 
     "description": "Administrative oversight and management" 
   }]
   ```

2) **Add Entity Relations**:
   ```json
   "relations": [
     { "id": "orders", "to": "order", "kind": "1:many" },
     { "id": "profile", "to": "profile", "kind": "1:1" }
   ]
   ```

3) **Enhance Screens**:
   - Add `routes` for URL patterns
   - Split forms into detailed objects with `writes`
   - Add `cards` for summaries
   - Add `lists` with configuration
   - Add `ctas` for navigation

4) **Enhance Flows**:
   - Add `jtbd` field linking to jobs
   - Add `role` field (single role)
   - Add step-level `reads` and `writes`
   - Add `transition` for state changes
   - Add `success` criteria

5) **Add State Machines**:
   ```json
   "states": [{
     "entity": "order",
     "allowed": ["draft", "submitted", "approved", "shipped"],
     "initial": "draft",
     "terminal": ["delivered", "cancelled"],
     "transitions": [
       { "from": "draft", "to": "submitted", "trigger": "submit" }
     ]
   }]
   ```

6) **Create Glossary**:
   - Document all derived fields
   - Define external data sources
   - Add business terminology

**Benefits of comprehensive spec:**
- 15 validation checks ensure production readiness
- Automatic UI component generation
- URL-based navigation with route validation
- State machine enforcement for business logic
- Clearer data flow documentation
- Enhanced diagrams and reports

Show comprehensive diff for approval, then apply.

**After enhancement:**
```bash
npx flowlock-uxcg audit
npx flowlock-uxcg diagrams  # See enhanced diagrams
```
