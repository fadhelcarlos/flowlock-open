# Gap Report

Total issues: 16

| ID | Severity | Location | Symptom | Proposed fix |
|---|---|---|---|---|
| inventory.db.entity.missing | error | - | DB model missing for spec entity 'user' | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | DB model missing for spec entity 'order' | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | DB model missing for spec entity 'profile' | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | DB model missing for spec entity 'category' | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | DB model missing for spec entity 'review' | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | DB model missing for spec entity 'cart' | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | DB model missing for spec entity 'cart_item' | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | DB model missing for spec entity 'order_item' | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI read 'user.id' has no provenance in spec (not captured, derived, external, or declared field). | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI read 'user.created_at' has no provenance in spec (not captured, derived, external, or declared field). | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI read 'cart.id' has no provenance in spec (not captured, derived, external, or declared field). | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI read 'order.id' has no provenance in spec (not captured, derived, external, or declared field). | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI read 'order.order_number' has no provenance in spec (not captured, derived, external, or declared field). | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI read 'order.created_at' has no provenance in spec (not captured, derived, external, or declared field). | Align spec (roles/uiStates/state machine) and update components to match. |
| runtime_determinism.mismatch | error | - | Determinism mismatch. previous=b7dcd5b15dc9c4ee1848ce3ae2d726e65af2d9b58415a6035af5dfe2226c04e9 current=82637dafa59229431d7da6b349bd1e8f41d85de07cb2873b812cb8e05b4b0cbb. Changes in spec/inventory produce different results. | Align spec (roles/uiStates/state machine) and update components to match. |
| database_no_relationships | info | - | Multiple entities defined but no relationships detected | Align spec (roles/uiStates/state machine) and update components to match. |