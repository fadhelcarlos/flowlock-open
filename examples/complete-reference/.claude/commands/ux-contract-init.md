# /ux-contract-init — Seed or refine the UX contract (uxspec.json)

You are the FlowLock contract editor. Use the README/PRD and code to create or refine `uxspec.json` with comprehensive validation coverage.

**Do:**
1) Read repo docs (README, /docs/**, /product/**). Infer:
   - **project** & **name**: Application identifier and display name
   - **roles**: Array of role objects with permissions
     ```json
     { "id": "admin", "name": "Administrator", "permissions": ["create", "read", "update", "delete"] }
     ```
   - **jtbd**: Jobs To Be Done (supports both formats for compatibility)
     - New format: `[{ "role": "admin", "tasks": ["manage users"], "description": "..." }]`
     - Old format: `{ "admin": ["manage users"] }` (auto-converted)
   - **entities**: With fields AND relations
     ```json
     {
       "id": "user",
       "name": "User",
       "fields": [...],
       "relations": [
         { "id": "orders", "to": "order", "kind": "1:many" }
       ]
     }
     ```
   - **screens**: Enhanced with routes, cards, lists, CTAs
     ```json
     {
       "id": "user-list",
       "name": "User List",
       "type": "list",
       "routes": ["/users", "/admin/users"],
       "roles": ["admin"],
       "forms": [{ "id": "filter", "writes": ["filter.*"] }],
       "cards": [{ "id": "stats", "reads": ["user.count"] }],
       "lists": [{ "id": "users", "reads": ["user.*"], "sortable": true }],
       "ctas": [
         { "id": "create", "label": "Add User", "to": "user-create", "type": "primary" }
       ],
       "uiStates": ["empty", "loading", "error"]
     }
     ```
   - **flows**: With JTBD links and state transitions
     ```json
     {
       "id": "create-user",
       "name": "Create User Flow",
       "jtbd": "admin",
       "role": "admin",
       "steps": [
         {
           "id": "s1",
           "screen": "user-create",
           "writes": ["user.email", "user.name"],
           "transition": { "entity": "user", "from": "pending", "to": "active" }
         }
       ],
       "success": { "screen": "user-detail", "message": "User created" }
     }
     ```
   - **states**: Entity state machines
     ```json
     {
       "entity": "user",
       "allowed": ["pending", "active", "suspended"],
       "initial": "pending",
       "transitions": [
         { "from": "pending", "to": "active", "trigger": "verify" }
       ]
     }
     ```
   - **glossary**: Document derived/external fields
     ```json
     {
       "term": "createdAt",
       "definition": "Timestamp when created",
       "formula": "new Date().toISOString()"
     }
     ```

2) Create `uxspec.json` if missing; otherwise merge changes conservatively.
3) Keep IDs stable and kebab-case; names are human-readable.
4) If creating glossary entries, also update `uxspec/glossary.yml`.
5) Save a unified diff for `uxspec.json`. Do not invent UI code here.

**Then run (locally):**
```bash
# First, extract runtime inventory if you have an existing codebase:
npx flowlock-uxcg inventory
# Or for existing projects:
npx flowlock-uxcg init-existing

# Then run audit:
npx flowlock-uxcg audit --inventory  # Enforces inventory requirement
# Or if installed globally:
uxcg audit
```
If audit fails, call **/ux-guardrails-validate** next.
