---
"flowlock-uxspec": patch
"flowlock-checks-core": patch
"flowlock-runner": patch
---

Fix: Add backward compatibility for JTBD field

The JTBD field now supports both formats:
- **Old format**: Object with role keys mapping to task arrays (e.g., `{ "admin": ["task1"], "user": ["task2"] }`)
- **New format**: Array of JTBD objects with role, tasks, and description

This ensures existing specs continue to work while allowing new specs to use the enhanced format.
