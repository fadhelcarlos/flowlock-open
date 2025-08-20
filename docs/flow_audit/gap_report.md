# Gap Report

Total issues: 13

| ID | Severity | Location | Symptom | Proposed fix |
|---|---|---|---|---|
| relation_invalid_target_user_orders | error | entity:user,relation:orders | Entity 'User' has relation 'orders' to non-existent entity 'order' | Align spec (roles/uiStates/state machine) and update components to match. |
| relation_invalid_target_user_profile | error | entity:user,relation:profile | Entity 'User' has relation 'profile' to non-existent entity 'profile' | Align spec (roles/uiStates/state machine) and update components to match. |
| relation_invalid_target_product_category | error | entity:product,relation:category | Entity 'Product' has relation 'category' to non-existent entity 'category' | Align spec (roles/uiStates/state machine) and update components to match. |
| relation_invalid_target_product_reviews | error | entity:product,relation:reviews | Entity 'Product' has relation 'reviews' to non-existent entity 'review' | Align spec (roles/uiStates/state machine) and update components to match. |
| cta_invalid_target_user_detail_edit_user | error | screen:user_detail,cta:edit_user | Screen 'User Detail' has CTA 'Edit' pointing to non-existent screen 'user_edit' | Align spec (roles/uiStates/state machine) and update components to match. |
| cta_invalid_target_product_detail_add_to_cart | error | screen:product_detail,cta:add_to_cart | Screen 'Product Detail' has CTA 'Add to Cart' pointing to non-existent screen 'cart' | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.db.entity.missing | error | - | DB model missing for spec entity 'user' | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI read 'user.id' has no provenance in spec (not captured, derived, external, or declared field). | Align spec (roles/uiStates/state machine) and update components to match. |
| inventory.ui.read.unproven | error | - | UI read 'user.createdAt' has no provenance in spec (not captured, derived, external, or declared field). | Align spec (roles/uiStates/state machine) and update components to match. |
| runtime_determinism.mismatch | error | - | Determinism mismatch. previous=e32f7c7f864eb2be5607e0f978fed62242938baaa8c3146ca73952280c04ee74 current=4f567e6ad2ae7210026f4c7c25a53f9fb18068b9af8b529c3f8af5f226bf0900. Changes in spec/inventory produce different results. | Align spec (roles/uiStates/state machine) and update components to match. |
| database_no_relationships | info | - | Multiple entities defined but no relationships detected | Align spec (roles/uiStates/state machine) and update components to match. |
| database_no_audit_fields_user | info | entity:user | Entity 'User' missing audit fields (created_at/updated_at) | Align spec (roles/uiStates/state machine) and update components to match. |
| database_no_audit_fields_product | info | entity:product | Entity 'Product' missing audit fields (created_at/updated_at) | Align spec (roles/uiStates/state machine) and update components to match. |