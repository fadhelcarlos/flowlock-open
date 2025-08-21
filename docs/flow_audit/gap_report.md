# Gap Report

Total issues: 16

| ID | Severity | Location | Symptom | Proposed fix |
|---|---|---|---|---|
| inventory.db.entity.missing | error | - | Database entity 'user' not found in inventory | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | Database entity 'order' not found in inventory | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | Database entity 'profile' not found in inventory | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | Database entity 'category' not found in inventory | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | Database entity 'review' not found in inventory | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | Database entity 'cart' not found in inventory | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | Database entity 'cart_item' not found in inventory | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | Database entity 'order_item' not found in inventory | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI reads field 'user.id' without valid provenance | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI reads field 'user.created_at' without valid provenance | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI reads field 'cart.id' without valid provenance | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI reads field 'order.id' without valid provenance | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI reads field 'order.order_number' without valid provenance | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI reads field 'order.created_at' without valid provenance | Align spec (roles/uiStates/state machine) and update components to match. |
| runtime_determinism.mismatch | error | - | Determinism mismatch. previous=b7dcd5b15dc9c4ee1848ce3ae2d726e65af2d9b58415a6035af5dfe2226c04e9 current=e7b7126d1fbf8a74c6ab680e279661b2e28d221808242d04e64492522ab00610. Changes in spec/inventory produce different results. | Align spec (roles/uiStates/state machine) and update components to match. |
| database_no_relationships | info | - | Multiple entities defined but no relationships detected | Align spec (roles/uiStates/state machine) and update components to match. |