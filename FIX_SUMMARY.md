# Fix for CREATABLE Validation False Positives

## Problem
The `creatable_needs_detail` check was incorrectly reporting that entities with create forms lacked detail screens, even when those screens clearly existed (e.g., segment-detail, playbook-detail, alert-detail).

## Root Cause
The validation logic was only looking for screens with an `entityId` field, but the actual UX spec uses an `entity` field for detail screens.

## Changes Made

### 1. Updated Detail Screen Detection Logic (`/packages/checks-core/src/creatable-needs-detail.ts`)
- Now checks for both `entity` and `entityId` fields on screens
- Added support for screen ID patterns like `{entity}-detail` or `{entity}Detail`
- Improved error messages to show what patterns the validator is looking for
- Added debug output when `FLOWLOCK_VERBOSE=true` or `DEBUG=true` environment variable is set

### 2. Updated Schema Definition (`/packages/uxspec/src/schema.ts`)
- Added `entity` as an optional field to `ScreenSchema` to support both naming conventions
- This ensures the TypeScript types properly reflect the actual spec structure

## Key Improvements

1. **Flexible Detection**: The validator now accepts multiple patterns:
   - Screens with `entity` field matching the entity ID
   - Screens with `entityId` field matching the entity ID  
   - Screens with ID patterns like `segment-detail` or `segmentDetail`

2. **Better Error Messages**: When a detail screen is missing, the error now shows:
   ```
   Entity 'Segment' (segment) has a create form but no detail screen. 
   Expected a screen with type='detail' and entity='segment' or entityId='segment', 
   or a screen with ID like 'segment-detail'
   ```

3. **Debug Support**: Run with `FLOWLOCK_VERBOSE=true` to see detailed debug output:
   ```bash
   FLOWLOCK_VERBOSE=true flowlock check uxspec.json
   ```

4. **Backward Compatibility**: The fix maintains backward compatibility by supporting both `entity` and `entityId` fields.

## Testing
A test script (`test-creatable-check.js`) was created to verify the fix works correctly with specs using the `entity` field convention.

## Usage
The validator will now correctly detect detail screens regardless of whether they use:
- `entity: "segment"` (new/common pattern)
- `entityId: "segment"` (old pattern)
- Screen ID like `"segment-detail"` (fallback pattern)