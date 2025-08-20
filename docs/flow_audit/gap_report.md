# Gap Report

Total issues: 10

| ID | Severity | Location | Symptom | Proposed fix |
|---|---|---|---|---|
| relation_invalid_target_user_orders | error | entity:user,relation:orders | Entity 'User' has relation 'orders' to non-existent entity 'order' | Align spec (roles/uiStates/state machine) and update components to match. |
| relation_invalid_target_user_profile | error | entity:user,relation:profile | Entity 'User' has relation 'profile' to non-existent entity 'profile' | Align spec (roles/uiStates/state machine) and update components to match. |
| relation_invalid_target_product_category | error | entity:product,relation:category | Entity 'Product' has relation 'category' to non-existent entity 'category' | Align spec (roles/uiStates/state machine) and update components to match. |
| relation_invalid_target_product_reviews | error | entity:product,relation:reviews | Entity 'Product' has relation 'reviews' to non-existent entity 'review' | Align spec (roles/uiStates/state machine) and update components to match. |
| cta_invalid_target_user_detail_edit_user | error | screen:user_detail,cta:edit_user | Screen 'User Detail' has CTA 'Edit' pointing to non-existent screen 'user_edit' | Align spec (roles/uiStates/state machine) and update components to match. |
| cta_invalid_target_product_detail_add_to_cart | error | screen:product_detail,cta:add_to_cart | Screen 'Product Detail' has CTA 'Add to Cart' pointing to non-existent screen 'cart' | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.file.missing | error | - | Missing artifacts/runtime_inventory.json. Run `uxcg inventory` before auditing. | Align spec (roles/uiStates/state machine) and update components to match. |
| database_no_relationships | info | - | Multiple entities defined but no relationships detected | Align spec (roles/uiStates/state machine) and update components to match. |
| database_no_audit_fields_user | info | entity:user | Entity 'User' missing audit fields (created_at/updated_at) | Align spec (roles/uiStates/state machine) and update components to match. |
| database_no_audit_fields_product | info | entity:product | Entity 'Product' missing audit fields (created_at/updated_at) | Align spec (roles/uiStates/state machine) and update components to match. |