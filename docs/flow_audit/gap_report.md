# Gap Report

Total issues: 6

| ID | Severity | Location | Symptom | Proposed fix |
|---|---|---|---|---|
| relation_invalid_target_user_orders | error | entity:user,relation:orders | Entity 'User' has relation 'orders' to non-existent entity 'order' | Align spec (roles/uiStates/state machine) and update components to match. |
| relation_invalid_target_user_profile | error | entity:user,relation:profile | Entity 'User' has relation 'profile' to non-existent entity 'profile' | Align spec (roles/uiStates/state machine) and update components to match. |
| relation_invalid_target_product_category | error | entity:product,relation:category | Entity 'Product' has relation 'category' to non-existent entity 'category' | Align spec (roles/uiStates/state machine) and update components to match. |
| relation_invalid_target_product_reviews | error | entity:product,relation:reviews | Entity 'Product' has relation 'reviews' to non-existent entity 'review' | Align spec (roles/uiStates/state machine) and update components to match. |
| cta_invalid_target_user_detail_edit_user | error | screen:user_detail,cta:edit_user | Screen 'User Detail' has CTA 'Edit' pointing to non-existent screen 'user_edit' | Align spec (roles/uiStates/state machine) and update components to match. |
| cta_invalid_target_product_detail_add_to_cart | error | screen:product_detail,cta:add_to_cart | Screen 'Product Detail' has CTA 'Add to Cart' pointing to non-existent screen 'cart' | Align spec (roles/uiStates/state machine) and update components to match. |